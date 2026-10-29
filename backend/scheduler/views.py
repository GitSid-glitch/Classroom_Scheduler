from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.viewsets import ReadOnlyModelViewSet
from rest_framework.permissions import AllowAny
from rest_framework.exceptions import ValidationError
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser
from django.http import HttpResponse
from django.contrib.auth import authenticate
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone

from .models import (
    AcademicTerm,
    AuditEvent,
    Room,
    Teacher,
    Section,
    UserProfile,
    ClassSession,
    Schedule,
    Assignment,
    get_current_academic_term,
)
from .permissions import HasSchedulerServiceToken
from .serializers import (
    AcademicTermSerializer,
    AuditEventSerializer,
    RoomSerializer,
    TeacherSerializer,
    SectionSerializer,
    UserProfileSerializer,
    ClassSessionSerializer,
    ScheduleSerializer,
    ScheduleAssignmentMoveSerializer,
    AssignmentSerializer,
)
from scheduler.services.assistant_service import (
    build_assistant_payload,
    explain_unscheduled_session,
    suggest_conflict_resolution,
)
from scheduler.services.analytics_service import build_analytics_snapshot
from scheduler.services.conflict_service import analyze_conflicts
from scheduler.services.scheduler_service import (
    build_schedule_explanations,
    run_heap_scheduler,
    run_dp_scheduler,
    run_optimized_scheduler,
)
import csv
import json
import re
from datetime import time
from io import TextIOWrapper
from django.db import transaction


def _get_uploaded_rows(request, required_headers):
    file = request.FILES.get("file")

    if not file:
        return None, Response({"error": "No file uploaded"}, status=400)
    if file.size > 10 * 1024 * 1024:
        return None, Response({"error": "CSV files must be 10 MB or smaller."}, status=400)

    try:
        decoded_file = TextIOWrapper(file.file, encoding="utf-8-sig", newline="")
        reader = csv.DictReader(decoded_file, skipinitialspace=True)
        if not reader.fieldnames:
            return None, Response({"error": "The CSV file is empty or has no header row."}, status=400)

        normalized_headers = [re.sub(r"[\s-]+", "_", header.strip().lower()) for header in reader.fieldnames]
        if len(set(normalized_headers)) != len(normalized_headers):
            return None, Response({"error": "The CSV header row contains duplicate columns."}, status=400)

        raw_mapping = request.data.get("header_mapping")
        if raw_mapping:
            try:
                supplied_mapping = json.loads(raw_mapping)
            except (TypeError, json.JSONDecodeError):
                return None, Response({"error": "The column mapping is invalid. Review the mapping and try again."}, status=400)
            if not isinstance(supplied_mapping, dict):
                return None, Response({"error": "The column mapping must be an object."}, status=400)
            field_mapping = {
                str(target).strip(): re.sub(r"[\s-]+", "_", str(source).strip().lower())
                for target, source in supplied_mapping.items()
                if str(source).strip()
            }
            used_sources = list(field_mapping.values())
            if len(used_sources) != len(set(used_sources)):
                return None, Response({"error": "Map each source column to only one field."}, status=400)
            missing_sources = sorted(set(used_sources) - set(normalized_headers))
            if missing_sources:
                return None, Response({"error": f"Mapped columns were not found in the file: {', '.join(missing_sources)}."}, status=400)
        else:
            field_mapping = {header: header for header in normalized_headers}

        missing_headers = sorted(set(required_headers) - set(field_mapping))
        if missing_headers:
            return None, Response(
                {"error": f"Map the required fields: {', '.join(missing_headers)}."},
                status=400,
            )

        reader.fieldnames = normalized_headers
        rows = []
        for row in reader:
            line_number = reader.line_num
            if None in row:
                return None, Response(
                    {"error": f"Row {line_number} has more values than the header row."},
                    status=400,
                )
            source_row = {key: (value or "").strip() for key, value in row.items()}
            cleaned = {target: source_row[source] for target, source in field_mapping.items()}
            if any(cleaned.values()):
                rows.append((line_number, cleaned))
    except (UnicodeDecodeError, csv.Error):
        return None, Response({"error": "The CSV could not be read. Save it as UTF-8 and try again."}, status=400)
    finally:
        try:
            decoded_file.detach()
        except (UnboundLocalError, ValueError):
            pass

    if not rows:
        return None, Response({"error": "The CSV contains a header but no data rows."}, status=400)
    return rows, None


def _import_csv_rows(
    request,
    *,
    required_headers,
    serializer_class,
    transform_row,
    find_instance,
    identity_for,
    entity_type,
    entity_name,
):
    rows, error_response = _get_uploaded_rows(request, required_headers)
    if error_response:
        return error_response

    prepared = []
    row_errors = []
    seen_identities = set()

    for line_number, row in rows:
        try:
            payload = transform_row(row)
            identity = identity_for(payload)
            if identity in seen_identities:
                row_errors.append({"row": line_number, "errors": {"row": ["Duplicate record in this file."]}})
                continue
            seen_identities.add(identity)
            serializer = serializer_class(instance=find_instance(payload), data=payload)
            if serializer.is_valid():
                prepared.append((serializer, entity_name(payload)))
            else:
                row_errors.append({"row": line_number, "errors": serializer.errors})
        except (TypeError, ValueError, KeyError) as exc:
            row_errors.append({"row": line_number, "errors": {"row": [str(exc)]}})

    if row_errors:
        row_summary = "; ".join(
            f"row {item['row']}: "
            + ", ".join(
                f"{field} {', '.join(str(message) for message in messages)}"
                for field, messages in item["errors"].items()
            )
            for item in row_errors[:8]
        )
        if len(row_errors) > 8:
            row_summary += f"; and {len(row_errors) - 8} more invalid rows"
        return Response(
            {
                "error": f"No changes were saved. Fix the invalid CSV rows: {row_summary}",
                "rows": row_errors,
            },
            status=400,
        )

    dry_run = str(request.data.get("dry_run", "false")).strip().lower() in {"1", "true", "yes"}
    created = sum(serializer.instance is None for serializer, _ in prepared)
    updated = len(prepared) - created
    if dry_run:
        return Response({
            "dry_run": True,
            "created": created,
            "updated": updated,
            "failed": 0,
            "rows": len(prepared),
        })

    with transaction.atomic():
        for serializer, record_name in prepared:
            was_created = serializer.instance is None
            instance = serializer.save()
            _log_audit_event(
                action="IMPORTED_CREATED" if was_created else "IMPORTED_UPDATED",
                entity_type=entity_type,
                entity_id=instance.id,
                summary=f"Imported {record_name} from CSV.",
            )

    return Response({"dry_run": False, "created": created, "updated": updated, "failed": 0, "rows": len(prepared)})


def _normalize_day_list(value, field_name):
    valid_days = {"MON", "TUE", "WED", "THU", "FRI", "SAT"}
    days = [part.strip().upper() for part in value.split(",") if part.strip()]
    invalid_days = sorted(set(days) - valid_days)
    if invalid_days:
        raise ValueError(f"{field_name} contains unsupported day codes: {', '.join(invalid_days)}.")
    return ",".join(days)


def _validate_time_range(start_value, end_value):
    try:
        start = time.fromisoformat(start_value)
        end = time.fromisoformat(end_value)
    except ValueError as exc:
        raise ValueError("start_time and end_time must use HH:MM format.") from exc
    if end <= start:
        raise ValueError("end_time must be later than start_time.")
    return start.strftime("%H:%M:%S"), end.strftime("%H:%M:%S")


def _parse_int(value, *, default=0):
    if value in (None, ""):
        return default
    return int(value)


def _log_audit_event(*, action, entity_type, entity_id, summary, metadata=None):
    AuditEvent.objects.create(
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        summary=summary,
        metadata=metadata or {},
    )


class AuthLoginView(APIView):
    permission_classes = [HasSchedulerServiceToken]

    def post(self, request):
        username = request.data.get("username", "").strip()
        password = request.data.get("password", "")

        if not username or not password:
            return Response(
                {"error": "Username and password are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = authenticate(request, username=username, password=password)
        if not user:
            return Response(
                {"error": "Invalid username or password."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        profile, _ = UserProfile.objects.get_or_create(
            user=user,
            defaults={
                "role": UserProfile.ROLE_ADMIN if user.is_staff or user.is_superuser else UserProfile.ROLE_COORDINATOR,
                "display_name": user.get_full_name() or user.username,
            },
        )
        payload = UserProfileSerializer(profile).data
        return Response(payload, status=status.HTTP_200_OK)


class HealthCheckView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response(
            {
                "status": "ok",
                "service": "smart-academic-scheduler-api",
            },
            status=status.HTTP_200_OK,
        )


class AcademicTermViewSet(viewsets.ModelViewSet):
    queryset = AcademicTerm.objects.all()
    serializer_class = AcademicTermSerializer

    def perform_create(self, serializer):
        term = serializer.save()
        _log_audit_event(
            action="CREATED",
            entity_type="ACADEMIC_TERM",
            entity_id=term.id,
            summary=f"Created academic term {term.name}.",
        )

    def perform_update(self, serializer):
        term = serializer.save()
        _log_audit_event(
            action="UPDATED",
            entity_type="ACADEMIC_TERM",
            entity_id=term.id,
            summary=f"Updated academic term {term.name}.",
        )

    def perform_destroy(self, instance):
        if instance.is_current:
            raise ValidationError({"error": "Set another term as current before deleting this term."})
        if instance.class_sessions.exists() or instance.schedules.exists():
            raise ValidationError({"error": "This term has course sessions or saved schedules and cannot be deleted."})
        term_id = instance.id
        term_name = instance.name
        super().perform_destroy(instance)
        _log_audit_event(
            action="DELETED",
            entity_type="ACADEMIC_TERM",
            entity_id=term_id,
            summary=f"Deleted academic term {term_name}.",
        )

    @action(detail=True, methods=["post"])
    def activate(self, request, pk=None):
        term = self.get_object()
        term.is_current = True
        term.save(update_fields=["is_current"])
        _log_audit_event(
            action="ACTIVATED",
            entity_type="ACADEMIC_TERM",
            entity_id=term.id,
            summary=f"Made {term.name} the current academic term.",
        )
        return Response(self.get_serializer(term).data)

    @action(detail=True, methods=["post"], url_path="copy-courses")
    def copy_courses(self, request, pk=None):
        destination = self.get_object()
        if not destination.is_current:
            return Response({"error": "Activate the destination term before copying course sessions."}, status=400)
        try:
            source_id = int(request.data.get("source_term_id"))
        except (TypeError, ValueError):
            return Response({"error": "Choose a valid source term."}, status=400)
        if source_id == destination.id:
            return Response({"error": "Choose a different source term."}, status=400)
        source = AcademicTerm.objects.filter(pk=source_id).first()
        if source is None:
            return Response({"error": "The source term was not found."}, status=404)

        source_sessions = ClassSession.objects.filter(term=source).order_by("id")
        created = 0
        skipped = 0
        with transaction.atomic():
            for session in source_sessions:
                identity = {
                    "term": destination,
                    "subject": session.subject,
                    "teacher": session.teacher,
                    "batch": session.batch,
                    "day_of_week": session.day_of_week,
                    "start_time": session.start_time,
                    "end_time": session.end_time,
                }
                if ClassSession.objects.filter(**identity).exists():
                    skipped += 1
                    continue
                ClassSession.objects.create(
                    **identity,
                    fixed_room=session.fixed_room,
                    teacher_record=session.teacher_record,
                    section_record=session.section_record,
                    required_capacity=session.required_capacity,
                    required_type=session.required_type,
                    value=session.value,
                    teacher_unavailable_days=session.teacher_unavailable_days,
                    is_locked=session.is_locked,
                    required_features=session.required_features,
                )
                created += 1
            _log_audit_event(
                action="COPIED_COURSES",
                entity_type="ACADEMIC_TERM",
                entity_id=destination.id,
                summary=f"Copied {created} course sessions from {source.name} to {destination.name}.",
                metadata={"source_term_id": source.id, "created": created, "skipped": skipped},
            )
        return Response({"created": created, "skipped": skipped, "source": source.name, "destination": destination.name})


class RoomViewSet(viewsets.ModelViewSet):
    queryset = Room.objects.all()
    serializer_class = RoomSerializer

    def perform_create(self, serializer):
        room = serializer.save()
        _log_audit_event(
            action="CREATED",
            entity_type="ROOM",
            entity_id=room.id,
            summary=f"Created room {room.name}.",
            metadata={"room_type": room.room_type, "capacity": room.capacity},
        )

    def perform_update(self, serializer):
        room = serializer.save()
        _log_audit_event(
            action="UPDATED",
            entity_type="ROOM",
            entity_id=room.id,
            summary=f"Updated room {room.name}.",
            metadata={"room_type": room.room_type, "capacity": room.capacity},
        )

    def perform_destroy(self, instance):
        if instance.assignments.exists():
            raise ValidationError({"error": "This room is referenced by saved schedules. Remove or replace those schedules before deleting it."})
        room_id = instance.id
        room_name = instance.name
        super().perform_destroy(instance)
        _log_audit_event(
            action="DELETED",
            entity_type="ROOM",
            entity_id=room_id,
            summary=f"Deleted room {room_name}.",
        )

    @action(detail=False, methods=["post"], parser_classes=[MultiPartParser])
    def upload(self, request):
        return _import_csv_rows(
            request,
            required_headers=["name", "capacity"],
            serializer_class=RoomSerializer,
            transform_row=lambda row: {
                "name": row.get("name", ""),
                "capacity": row.get("capacity", ""),
                "room_type": row.get("room_type", "THEORY").upper() or "THEORY",
                "features": row.get("features", ""),
            },
            find_instance=lambda data: Room.objects.filter(name=data["name"]).first(),
            identity_for=lambda data: data["name"].casefold(),
            entity_type="ROOM",
            entity_name=lambda data: data["name"],
        )


class TeacherViewSet(viewsets.ModelViewSet):
    queryset = Teacher.objects.all().order_by("name")
    serializer_class = TeacherSerializer

    def perform_create(self, serializer):
        teacher = serializer.save()
        _log_audit_event(
            action="CREATED",
            entity_type="TEACHER",
            entity_id=teacher.id,
            summary=f"Created teacher {teacher.name}.",
            metadata={"department": teacher.department},
        )

    def perform_update(self, serializer):
        teacher = serializer.save()
        _log_audit_event(
            action="UPDATED",
            entity_type="TEACHER",
            entity_id=teacher.id,
            summary=f"Updated teacher {teacher.name}.",
            metadata={"department": teacher.department},
        )

    def perform_destroy(self, instance):
        teacher_id = instance.id
        teacher_name = instance.name
        super().perform_destroy(instance)
        _log_audit_event(
            action="DELETED",
            entity_type="TEACHER",
            entity_id=teacher_id,
            summary=f"Deleted teacher {teacher_name}.",
        )

    @action(detail=False, methods=["post"], parser_classes=[MultiPartParser])
    def upload(self, request):
        return _import_csv_rows(
            request,
            required_headers=["name"],
            serializer_class=TeacherSerializer,
            transform_row=lambda row: {
                "name": row.get("name", ""),
                "department": row.get("department", ""),
                "max_daily_load": row.get("max_daily_load") or 4,
                "unavailable_days": _normalize_day_list(row.get("unavailable_days", ""), "unavailable_days"),
            },
            find_instance=lambda data: Teacher.objects.filter(name=data["name"]).first(),
            identity_for=lambda data: data["name"].casefold(),
            entity_type="TEACHER",
            entity_name=lambda data: data["name"],
        )


class SectionViewSet(viewsets.ModelViewSet):
    queryset = Section.objects.all().order_by("name")
    serializer_class = SectionSerializer

    def perform_create(self, serializer):
        section = serializer.save()
        _log_audit_event(
            action="CREATED",
            entity_type="SECTION",
            entity_id=section.id,
            summary=f"Created section {section.name}.",
            metadata={"program": section.program, "semester": section.semester},
        )

    def perform_update(self, serializer):
        section = serializer.save()
        _log_audit_event(
            action="UPDATED",
            entity_type="SECTION",
            entity_id=section.id,
            summary=f"Updated section {section.name}.",
            metadata={"program": section.program, "semester": section.semester},
        )

    def perform_destroy(self, instance):
        section_id = instance.id
        section_name = instance.name
        super().perform_destroy(instance)
        _log_audit_event(
            action="DELETED",
            entity_type="SECTION",
            entity_id=section_id,
            summary=f"Deleted section {section_name}.",
        )

    @action(detail=False, methods=["post"], parser_classes=[MultiPartParser])
    def upload(self, request):
        return _import_csv_rows(
            request,
            required_headers=["name"],
            serializer_class=SectionSerializer,
            transform_row=lambda row: {
                "name": row.get("name", ""),
                "program": row.get("program", ""),
                "semester": row.get("semester") or 1,
                "size": row.get("size") or 0,
            },
            find_instance=lambda data: Section.objects.filter(name=data["name"]).first(),
            identity_for=lambda data: data["name"].casefold(),
            entity_type="SECTION",
            entity_name=lambda data: data["name"],
        )


class ClassSessionViewSet(viewsets.ModelViewSet):
    queryset = ClassSession.objects.all()
    serializer_class = ClassSessionSerializer

    def get_queryset(self):
        return ClassSession.objects.filter(term=get_current_academic_term()).order_by("day_of_week", "start_time")

    def perform_create(self, serializer):
        session = serializer.save(term=get_current_academic_term())
        _log_audit_event(
            action="CREATED",
            entity_type="CLASS_SESSION",
            entity_id=session.id,
            summary=f"Created class session {session.subject} for {session.batch}.",
            metadata={"day_of_week": session.day_of_week, "teacher": session.teacher},
        )

    def perform_update(self, serializer):
        session = serializer.save()
        _log_audit_event(
            action="UPDATED",
            entity_type="CLASS_SESSION",
            entity_id=session.id,
            summary=f"Updated class session {session.subject} for {session.batch}.",
            metadata={"day_of_week": session.day_of_week, "teacher": session.teacher},
        )

    def perform_destroy(self, instance):
        if instance.assignments.exists():
            raise ValidationError({"error": "This class session is referenced by saved schedules. Keep it for history or remove those schedules before deleting it."})
        session_id = instance.id
        subject = instance.subject
        batch = instance.batch
        super().perform_destroy(instance)
        _log_audit_event(
            action="DELETED",
            entity_type="CLASS_SESSION",
            entity_id=session_id,
            summary=f"Deleted class session {subject} for {batch}.",
        )

    @action(detail=False, methods=["post"], parser_classes=[MultiPartParser])
    def upload(self, request):
        def transform(row):
            day = row.get("day_of_week", "").upper()
            start_time, end_time = _validate_time_range(
                row.get("start_time", ""), row.get("end_time", "")
            )
            unavailable_days = _normalize_day_list(row.get("teacher_unavailable_days", ""), "teacher_unavailable_days")
            locked_value = row.get("is_locked", "").strip().lower()
            if locked_value not in {"", "true", "1", "yes", "false", "0", "no"}:
                raise ValueError("is_locked must be true, false, 1, or 0.")

            return {
                "subject": row.get("subject", ""),
                "teacher": row.get("teacher", ""),
                "batch": row.get("batch", ""),
                "teacher_record": Teacher.objects.filter(name=row.get("teacher", "")).values_list("id", flat=True).first(),
                "section_record": Section.objects.filter(name=row.get("batch", "")).values_list("id", flat=True).first(),
                "fixed_room": None,
                "day_of_week": day,
                "start_time": start_time,
                "end_time": end_time,
                "required_capacity": row.get("required_capacity") or 0,
                "required_type": row.get("required_type", "ANY").upper() or "ANY",
                "value": row.get("value") or 1,
                "teacher_unavailable_days": unavailable_days,
                "is_locked": locked_value in {"true", "1", "yes"},
                "required_features": row.get("required_features", ""),
            }

        def find_existing(data):
            return ClassSession.objects.filter(
                term=get_current_academic_term(),
                subject=data["subject"],
                teacher=data["teacher"],
                batch=data["batch"],
                day_of_week=data["day_of_week"],
                start_time=data["start_time"],
                end_time=data["end_time"],
            ).first()

        return _import_csv_rows(
            request,
            required_headers=["subject", "teacher", "batch", "day_of_week", "start_time", "end_time"],
            serializer_class=ClassSessionSerializer,
            transform_row=transform,
            find_instance=find_existing,
            identity_for=lambda data: (
                data["subject"].casefold(), data["teacher"].casefold(), data["batch"].casefold(),
                data["day_of_week"], data["start_time"], data["end_time"],
            ),
            entity_type="CLASS_SESSION",
            entity_name=lambda data: f"{data['subject']} for {data['batch']}",
        )

class AssignmentViewSet(viewsets.ModelViewSet):
    queryset = Assignment.objects.all()
    serializer_class = AssignmentSerializer


class AuditEventViewSet(ReadOnlyModelViewSet):
    queryset = AuditEvent.objects.all()
    serializer_class = AuditEventSerializer


class ScheduleViewSet(viewsets.ModelViewSet):
    queryset = Schedule.objects.all().order_by("-created_at", "-id")
    serializer_class = ScheduleSerializer

    def get_queryset(self):
        return Schedule.objects.filter(term=get_current_academic_term()).order_by("-created_at", "-id")

    def _load_classes_and_rooms(self):
        classes = list(ClassSession.objects.filter(term=get_current_academic_term()))
        rooms = list(Room.objects.prefetch_related("unavailable_windows").all())
        return classes, rooms

    def _build_live_schedule_result(self, classes, rooms):
        schedule_result = run_optimized_scheduler(classes, rooms)
        schedule_result["conflicts"] = analyze_conflicts(
            classes,
            rooms,
            schedule_result["unscheduled"],
        )
        schedule_result["explanations"] = build_schedule_explanations(
            schedule_result["assignments"],
            schedule_result["unscheduled"],
            schedule_result["conflicts"],
        )
        return schedule_result

    def _serialize_schedule(self, schedule, unscheduled=None, conflicts=None, explanations=None):
        serializer = ScheduleSerializer(
            schedule,
            context={
                "unscheduled": unscheduled or [],
                "conflicts": conflicts or [],
                "explanations": explanations or [],
            },
        )
        return serializer.data

    def _schedule_actor(self, request):
        return request.headers.get("X-Scheduler-Actor", "")[:150]

    def _locked_schedule(self, pk):
        return get_object_or_404(self.get_queryset().select_for_update(), pk=pk)

    def _transition_error(self, message):
        return Response({"error": message}, status=status.HTTP_409_CONFLICT)

    @action(detail=True, methods=["post"])
    def move_assignment(self, request, pk=None):
        with transaction.atomic():
            schedule = self._locked_schedule(pk)
            if schedule.status != "DRAFT":
                return self._transition_error("Only draft schedules can be manually adjusted.")

            try:
                assignment_id = int(request.data.get("assignment_id", ""))
            except (TypeError, ValueError):
                return Response({"assignment_id": "Provide a valid assignment id."}, status=400)
            assignment = get_object_or_404(
                Assignment.objects.select_for_update().select_related("class_session", "room"),
                pk=assignment_id,
                schedule=schedule,
            )
            session = ClassSession.objects.select_for_update().get(pk=assignment.class_session_id)
            if session.term_id != schedule.term_id:
                return self._transition_error("This class session does not belong to the schedule term.")
            if session.is_locked:
                return self._transition_error("This class session is locked. Unlock it in course setup before moving it.")

            move = ScheduleAssignmentMoveSerializer(data=request.data)
            if not move.is_valid():
                return Response(move.errors, status=400)
            day = move.validated_data["day_of_week"]
            start_time = move.validated_data["start_time"]
            end_time = move.validated_data["end_time"]
            room = move.validated_data["room"]

            if session.fixed_room_id and room.id != session.fixed_room_id:
                return Response({"room": "This class session has a required room. Choose that room to continue."}, status=400)
            if room.capacity < session.required_capacity:
                return Response({"room": f"{room.name} does not meet the required capacity of {session.required_capacity}."}, status=400)
            if session.required_type != "ANY" and room.room_type != session.required_type:
                return Response({"room": f"{room.name} is not a {session.required_type.lower()} room."}, status=400)
            required_features = {feature.strip().casefold() for feature in session.required_features.split(",") if feature.strip()}
            available_features = {feature.strip().casefold() for feature in room.features.split(",") if feature.strip()}
            missing_features = required_features - available_features
            if missing_features:
                return Response({"room": f"{room.name} is missing required features: {', '.join(sorted(missing_features))}."}, status=400)
            unavailable_days = {value.strip().upper() for value in session.teacher_unavailable_days.split(",") if value.strip()}
            if day in unavailable_days:
                return Response({"day_of_week": f"The teacher is unavailable on {day}."}, status=400)
            teacher = Teacher.objects.filter(name=assignment.teacher_snapshot).first()
            if teacher:
                daily_assignments = schedule.assignments.filter(
                    teacher_snapshot__iexact=assignment.teacher_snapshot,
                    day_of_week_snapshot=day,
                ).exclude(pk=assignment.pk).count()
                if daily_assignments >= teacher.max_daily_load:
                    return Response({"day_of_week": f"{assignment.teacher_snapshot} has reached the daily limit of {teacher.max_daily_load} classes."}, status=409)

            overlaps = schedule.assignments.select_related("class_session", "room").exclude(pk=assignment.pk)
            for other in overlaps:
                other_start = other.start_time_snapshot
                other_end = other.end_time_snapshot
                if other.day_of_week_snapshot != day or not other_start or not other_end:
                    continue
                if start_time >= other_end or other_start >= end_time:
                    continue
                if other.room_id == room.id:
                    return Response({"room": f"{room.name} is already assigned to {other.subject_snapshot} during that time."}, status=409)
                if assignment.teacher_snapshot and other.teacher_snapshot.casefold() == assignment.teacher_snapshot.casefold():
                    return Response({"day_of_week": f"{assignment.teacher_snapshot} already has an overlapping class during that time."}, status=409)
                if assignment.batch_snapshot and other.batch_snapshot.casefold() == assignment.batch_snapshot.casefold():
                    return Response({"day_of_week": f"{assignment.batch_snapshot} already has an overlapping class during that time."}, status=409)

            blackout = room.unavailable_windows.filter(
                day_of_week=day,
                start_time__lt=end_time,
                end_time__gt=start_time,
            ).first()
            if blackout:
                reason = f" ({blackout.reason})" if blackout.reason else ""
                return Response({"room": f"{room.name} is unavailable during that time{reason}."}, status=409)

            previous = {
                "day_of_week": assignment.day_of_week_snapshot,
                "start_time": assignment.start_time_snapshot.isoformat() if assignment.start_time_snapshot else None,
                "end_time": assignment.end_time_snapshot.isoformat() if assignment.end_time_snapshot else None,
                "room": assignment.room_name_snapshot,
            }
            assignment.day_of_week_snapshot = day
            assignment.start_time_snapshot = start_time
            assignment.end_time_snapshot = end_time
            assignment.room = room
            assignment.room_name_snapshot = room.name
            assignment.save(update_fields=[
                "day_of_week_snapshot",
                "start_time_snapshot",
                "end_time_snapshot",
                "room",
                "room_name_snapshot",
            ])
            _log_audit_event(
                action="ASSIGNMENT_MOVED",
                entity_type="SCHEDULE",
                entity_id=schedule.id,
                summary=f"Adjusted {assignment.subject_snapshot} in {schedule.name}.",
                metadata={
                    "actor": self._schedule_actor(request),
                    "assignment_id": assignment.id,
                    "before": previous,
                    "after": {
                        "day_of_week": day,
                        "start_time": start_time.isoformat(),
                        "end_time": end_time.isoformat(),
                        "room": room.name,
                    },
                },
            )

        return Response(self._serialize_schedule(schedule), status=200)

    def _build_schedule_response(self, *, schedule_name, schedule_result):
        schedule = Schedule.objects.create(
            name=schedule_name,
            max_value=int(schedule_result["total_value"]),
            min_rooms=schedule_result["max_rooms"],
            status="DRAFT",
        )

        for assignment in schedule_result["assignments"]:
            Assignment.objects.create(
                schedule=schedule,
                class_session=assignment["class"],
                room_id=assignment["room"],
            )

        _log_audit_event(
            action="GENERATED",
            entity_type="SCHEDULE",
            entity_id=schedule.id,
            summary=f"Generated draft schedule {schedule.name}.",
            metadata={
                "scheduled_count": len(schedule_result["assignments"]),
                "unscheduled_count": len(schedule_result["unscheduled"]),
                "min_rooms": schedule.min_rooms,
                "max_value": schedule.max_value,
            },
        )

        return Response(
            self._serialize_schedule(
                schedule,
                schedule_result["unscheduled"],
                schedule_result.get("conflicts", []),
                schedule_result.get("explanations", []),
            ),
            status=201,
        )

    @action(detail=False, methods=["get"])
    def analyze(self, request):
        classes, rooms = self._load_classes_and_rooms()

        if not classes:
            return Response({"error": "No classes available"}, status=400)

        conflicts = analyze_conflicts(classes, rooms)
        return Response({"conflicts": conflicts}, status=200)

    @action(detail=False, methods=["get"])
    def assistant(self, request):
        classes, rooms = self._load_classes_and_rooms()

        if not classes:
            return Response({"error": "No classes available"}, status=400)

        schedule_result = self._build_live_schedule_result(classes, rooms)
        target_class_id = request.query_params.get("class_session")
        explanation = None

        if target_class_id:
            class_session = next(
                (cls for cls in classes if cls.id == int(target_class_id)),
                None,
            )
            if class_session:
                explanation = explain_unscheduled_session(
                    class_session,
                    schedule_result["unscheduled"],
                )

        payload = build_assistant_payload(
            schedule_result,
            explanation,
            schedule_result["explanations"],
        )

        if "suggestion" not in payload:
            payload["suggestion"] = suggest_conflict_resolution(schedule_result)

        return Response(payload, status=200)

    @action(detail=False, methods=["get"])
    def analytics(self, request):
        classes, rooms = self._load_classes_and_rooms()

        if not classes:
            return Response({"error": "No classes available"}, status=400)

        schedule_result = self._build_live_schedule_result(classes, rooms)
        analytics = build_analytics_snapshot(classes, rooms, schedule_result)
        return Response(analytics, status=200)

    @action(detail=True, methods=["post"])
    def submit_for_approval(self, request, pk=None):
        with transaction.atomic():
            schedule = self._locked_schedule(pk)
            if schedule.status not in {"DRAFT", "REJECTED"}:
                return self._transition_error("Only drafts or schedules with requested changes can be submitted.")
            schedule.status = "PENDING_APPROVAL"
            schedule.submitted_at = timezone.now()
            schedule.approval_note = ""
            schedule.save(update_fields=["status", "submitted_at", "approval_note"])
            _log_audit_event(
                action="SUBMITTED_FOR_APPROVAL",
                entity_type="SCHEDULE",
                entity_id=schedule.id,
                summary=f"Submitted {schedule.name} for approval.",
                metadata={"actor": self._schedule_actor(request)},
            )
        return Response(self._serialize_schedule(schedule), status=200)

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        with transaction.atomic():
            schedule = self._locked_schedule(pk)
            if schedule.status != "PENDING_APPROVAL":
                return self._transition_error("Only schedules pending approval can be approved.")
            schedule.status = "APPROVED"
            schedule.approved_at = timezone.now()
            schedule.reviewed_by = self._schedule_actor(request)
            schedule.approval_note = str(request.data.get("note", ""))[:2000]
            schedule.save(update_fields=["status", "approved_at", "reviewed_by", "approval_note"])
            _log_audit_event(
                action="APPROVED",
                entity_type="SCHEDULE",
                entity_id=schedule.id,
                summary=f"Approved {schedule.name} for publication.",
                metadata={"actor": schedule.reviewed_by, "note": schedule.approval_note},
            )
        return Response(self._serialize_schedule(schedule), status=200)

    @action(detail=True, methods=["post"])
    def request_changes(self, request, pk=None):
        note = str(request.data.get("note", "")).strip()[:2000]
        if not note:
            return Response({"error": "Add a note describing the requested changes."}, status=400)
        with transaction.atomic():
            schedule = self._locked_schedule(pk)
            if schedule.status != "PENDING_APPROVAL":
                return self._transition_error("Only schedules pending approval can be returned for changes.")
            schedule.status = "REJECTED"
            schedule.reviewed_by = self._schedule_actor(request)
            schedule.approval_note = note
            schedule.save(update_fields=["status", "reviewed_by", "approval_note"])
            _log_audit_event(
                action="CHANGES_REQUESTED",
                entity_type="SCHEDULE",
                entity_id=schedule.id,
                summary=f"Requested changes to {schedule.name}.",
                metadata={"actor": schedule.reviewed_by, "note": note},
            )
        return Response(self._serialize_schedule(schedule), status=200)

    @action(detail=True, methods=["post"])
    def revise(self, request, pk=None):
        with transaction.atomic():
            schedule = self._locked_schedule(pk)
            if schedule.status != "REJECTED":
                return self._transition_error("Only schedules with requested changes can return to draft.")
            schedule.status = "DRAFT"
            schedule.submitted_at = None
            schedule.approved_at = None
            schedule.reviewed_by = ""
            schedule.save(update_fields=["status", "submitted_at", "approved_at", "reviewed_by"])
            _log_audit_event(
                action="RETURNED_TO_DRAFT",
                entity_type="SCHEDULE",
                entity_id=schedule.id,
                summary=f"Returned {schedule.name} to draft for revision.",
                metadata={"actor": self._schedule_actor(request)},
            )
        return Response(self._serialize_schedule(schedule), status=200)

    @action(detail=True, methods=["post"])
    def publish(self, request, pk=None):
        with transaction.atomic():
            schedule = self._locked_schedule(pk)
            AcademicTerm.objects.select_for_update().get(pk=schedule.term_id)
            if schedule.status != "APPROVED":
                return self._transition_error("Approve this schedule before publishing it.")
            Schedule.objects.filter(term=schedule.term, status="PUBLISHED").exclude(pk=schedule.pk).update(
                status="SUPERSEDED",
            )
            schedule.status = "PUBLISHED"
            schedule.published_at = timezone.now()
            schedule.save(update_fields=["status", "published_at"])
            _log_audit_event(
                action="PUBLISHED",
                entity_type="SCHEDULE",
                entity_id=schedule.id,
                summary=f"Published schedule {schedule.name}.",
                metadata={"published_at": schedule.published_at.isoformat(), "actor": self._schedule_actor(request)},
            )
        return Response(self._serialize_schedule(schedule), status=200)

    @action(detail=True, methods=["post"])
    def restore(self, request, pk=None):
        with transaction.atomic():
            schedule = self._locked_schedule(pk)
            AcademicTerm.objects.select_for_update().get(pk=schedule.term_id)
            if schedule.status != "SUPERSEDED":
                return self._transition_error("Only an earlier superseded release can be restored.")
            Schedule.objects.filter(term=schedule.term, status="PUBLISHED").exclude(pk=schedule.pk).update(
                status="SUPERSEDED",
            )
            schedule.status = "PUBLISHED"
            schedule.published_at = timezone.now()
            schedule.save(update_fields=["status", "published_at"])
            _log_audit_event(
                action="RESTORED",
                entity_type="SCHEDULE",
                entity_id=schedule.id,
                summary=f"Restored schedule {schedule.name} as the published timetable.",
                metadata={"published_at": schedule.published_at.isoformat(), "actor": self._schedule_actor(request)},
            )
        return Response(self._serialize_schedule(schedule), status=200)

    @action(detail=True, methods=["get"])
    def export_csv(self, request, pk=None):
        schedule = self.get_object()
        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = f'attachment; filename="{schedule.name.lower().replace(" ", "-")}.csv"'

        writer = csv.writer(response)
        writer.writerow(
            [
                "subject",
                "teacher",
                "batch",
                "day_of_week",
                "start_time",
                "end_time",
                "room",
                "schedule_status",
            ]
        )

        assignments = schedule.assignments.order_by("day_of_week_snapshot", "start_time_snapshot")

        for assignment in assignments:
            writer.writerow(
                [
                    assignment.subject_snapshot,
                    assignment.teacher_snapshot,
                    assignment.batch_snapshot,
                    assignment.day_of_week_snapshot,
                    assignment.start_time_snapshot,
                    assignment.end_time_snapshot,
                    assignment.room_name_snapshot,
                    schedule.status,
                ]
            )

        return response

    @action(detail=True, methods=["post"])
    def unpublish(self, request, pk=None):
        with transaction.atomic():
            schedule = self._locked_schedule(pk)
            if schedule.status != "PUBLISHED":
                return self._transition_error("Only the currently published schedule can be unpublished.")
            schedule.status = "APPROVED"
            schedule.save(update_fields=["status"])
            _log_audit_event(
                action="UNPUBLISHED",
                entity_type="SCHEDULE",
                entity_id=schedule.id,
                summary=f"Unpublished schedule {schedule.name}.",
                metadata={"actor": self._schedule_actor(request)},
            )
        return Response(self._serialize_schedule(schedule), status=200)

    @action(detail=False, methods=["post"])
    def run_heap(self, request):
        try:
            classes, rooms = self._load_classes_and_rooms()

            if not classes:
                return Response({"error": "No classes available"}, status=400)

            if not rooms:
                return Response({"error": "No rooms available"}, status=400)

            schedule_result = run_heap_scheduler(classes, rooms)
            schedule_result["conflicts"] = analyze_conflicts(
                classes,
                rooms,
                schedule_result["unscheduled"],
            )
            schedule_result["explanations"] = build_schedule_explanations(
                schedule_result["assignments"],
                schedule_result["unscheduled"],
                schedule_result["conflicts"],
            )
            return self._build_schedule_response(
                schedule_name="Heap Schedule",
                schedule_result=schedule_result,
            )

        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({"error": str(e)}, status=500)

    @action(detail=False, methods=["post"])
    def run_dp(self, request):
        try:
            classes, rooms = self._load_classes_and_rooms()

            if not classes:
                return Response({"error": "No classes available"}, status=400)

            if not rooms:
                return Response({"error": "No rooms available"}, status=400)

            schedule_result = run_dp_scheduler(classes, rooms)
            schedule_result["conflicts"] = analyze_conflicts(
                classes,
                rooms,
                schedule_result["unscheduled"],
            )
            schedule_result["explanations"] = build_schedule_explanations(
                schedule_result["assignments"],
                schedule_result["unscheduled"],
                schedule_result["conflicts"],
            )
            return self._build_schedule_response(
                schedule_name="DP Schedule",
                schedule_result=schedule_result,
            )

        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({"error": str(e)}, status=500)

    @action(detail=False, methods=["post"])
    def run_optimized(self, request):
        try:
            classes, rooms = self._load_classes_and_rooms()

            if not classes:
                return Response({"error": "No classes available"}, status=400)

            if not rooms:
                return Response({"error": "No rooms available"}, status=400)

            schedule_result = self._build_live_schedule_result(classes, rooms)
            return self._build_schedule_response(
                schedule_name="Optimized Schedule (DP + Heap)",
                schedule_result=schedule_result,
            )

        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({"error": str(e)}, status=500)

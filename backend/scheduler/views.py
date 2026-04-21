from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.viewsets import ReadOnlyModelViewSet
from rest_framework.permissions import AllowAny
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser
from django.http import HttpResponse
from django.contrib.auth import authenticate
from django.utils import timezone

from .models import AuditEvent, Room, Teacher, Section, UserProfile, ClassSession, Schedule, Assignment
from .serializers import (
    AuditEventSerializer,
    RoomSerializer,
    TeacherSerializer,
    SectionSerializer,
    UserProfileSerializer,
    ClassSessionSerializer,
    ScheduleSerializer,
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
from io import TextIOWrapper


def _get_uploaded_rows(request):
    file = request.FILES.get("file")

    if not file:
        return None, Response({"error": "No file uploaded"}, status=400)

    decoded_file = TextIOWrapper(file.file, encoding="utf-8")
    return csv.DictReader(decoded_file), None


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
    permission_classes = [AllowAny]

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
        reader, error_response = _get_uploaded_rows(request)
        if error_response:
            return error_response

        created = 0
        updated = 0

        for row in reader:
            _, was_created = Room.objects.update_or_create(
                name=row["name"],
                defaults={
                    "capacity": _parse_int(row.get("capacity"), default=0),
                    "room_type": row.get("room_type", "THEORY"),
                    "features": row.get("features", ""),
                },
            )
            if was_created:
                created += 1
            else:
                updated += 1

        return Response({"created": created, "updated": updated, "failed": 0})


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
        reader, error_response = _get_uploaded_rows(request)
        if error_response:
            return error_response

        created = 0
        updated = 0

        for row in reader:
            _, was_created = Teacher.objects.update_or_create(
                name=row["name"],
                defaults={
                    "department": row.get("department", ""),
                    "max_daily_load": _parse_int(row.get("max_daily_load"), default=4),
                    "unavailable_days": row.get("unavailable_days", ""),
                },
            )
            if was_created:
                created += 1
            else:
                updated += 1

        return Response({"created": created, "updated": updated, "failed": 0})


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
        reader, error_response = _get_uploaded_rows(request)
        if error_response:
            return error_response

        created = 0
        updated = 0

        for row in reader:
            _, was_created = Section.objects.update_or_create(
                name=row["name"],
                defaults={
                    "program": row.get("program", ""),
                    "semester": _parse_int(row.get("semester"), default=1),
                    "size": _parse_int(row.get("size"), default=0),
                },
            )
            if was_created:
                created += 1
            else:
                updated += 1

        return Response({"created": created, "updated": updated, "failed": 0})


class ClassSessionViewSet(viewsets.ModelViewSet):
    queryset = ClassSession.objects.all()
    serializer_class = ClassSessionSerializer

    def perform_create(self, serializer):
        session = serializer.save()
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
        reader, error_response = _get_uploaded_rows(request)
        if error_response:
            return error_response

        created = 0
        updated = 0

        for row in reader:
            teacher_record = Teacher.objects.filter(name=row.get("teacher", "")).first()
            section_record = Section.objects.filter(name=row.get("batch", "")).first()

            _, was_created = ClassSession.objects.update_or_create(
                subject=row["subject"],
                teacher=row["teacher"],
                batch=row["batch"],
                day_of_week=row["day_of_week"],
                start_time=row["start_time"],
                end_time=row["end_time"],
                defaults={
                    "teacher_record": teacher_record,
                    "section_record": section_record,
                    "required_capacity": _parse_int(row.get("required_capacity"), default=0),
                    "required_type": row.get("required_type", "ANY"),
                    "value": _parse_int(row.get("value"), default=1),
                    "teacher_unavailable_days": row.get("teacher_unavailable_days", ""),
                    "is_locked": str(row.get("is_locked", "")).lower() in {"true", "1", "yes"},
                    "required_features": row.get("required_features", ""),
                },
            )
            if was_created:
                created += 1
            else:
                updated += 1

        return Response({"created": created, "updated": updated, "failed": 0})

class AssignmentViewSet(viewsets.ModelViewSet):
    queryset = Assignment.objects.all()
    serializer_class = AssignmentSerializer


class AuditEventViewSet(ReadOnlyModelViewSet):
    queryset = AuditEvent.objects.all()
    serializer_class = AuditEventSerializer


class ScheduleViewSet(viewsets.ModelViewSet):
    queryset = Schedule.objects.all()
    serializer_class = ScheduleSerializer

    def _load_classes_and_rooms(self):
        classes = list(ClassSession.objects.all())
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
    def publish(self, request, pk=None):
        schedule = self.get_object()
        schedule.status = "PUBLISHED"
        schedule.published_at = timezone.now()
        schedule.save(update_fields=["status", "published_at"])
        _log_audit_event(
            action="PUBLISHED",
            entity_type="SCHEDULE",
            entity_id=schedule.id,
            summary=f"Published schedule {schedule.name}.",
            metadata={"published_at": schedule.published_at.isoformat()},
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

        assignments = schedule.assignments.select_related("class_session", "room").order_by(
            "class_session__day_of_week",
            "class_session__start_time",
        )

        for assignment in assignments:
            class_session = assignment.class_session
            writer.writerow(
                [
                    class_session.subject,
                    class_session.teacher,
                    class_session.batch,
                    class_session.day_of_week,
                    class_session.start_time,
                    class_session.end_time,
                    assignment.room.name,
                    schedule.status,
                ]
            )

        return response

    @action(detail=True, methods=["post"])
    def unpublish(self, request, pk=None):
        schedule = self.get_object()
        schedule.status = "DRAFT"
        schedule.published_at = None
        schedule.save(update_fields=["status", "published_at"])
        _log_audit_event(
            action="UNPUBLISHED",
            entity_type="SCHEDULE",
            entity_id=schedule.id,
            summary=f"Moved schedule {schedule.name} back to draft.",
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

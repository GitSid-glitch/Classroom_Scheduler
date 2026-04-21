from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser
from django.utils import timezone

from .models import Room, Teacher, Section, ClassSession, Schedule, Assignment
from .serializers import (
    RoomSerializer,
    TeacherSerializer,
    SectionSerializer,
    ClassSessionSerializer,
    ScheduleSerializer,
    AssignmentSerializer,
)
from scheduler.services.assistant_service import (
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


class RoomViewSet(viewsets.ModelViewSet):
    queryset = Room.objects.all()
    serializer_class = RoomSerializer

    @action(detail=False, methods=["post"], parser_classes=[MultiPartParser])
    def upload(self, request):
        file = request.FILES.get("file")

        if not file:
            return Response({"error": "No file uploaded"}, status=400)

        decoded_file = TextIOWrapper(file.file, encoding="utf-8")
        reader = csv.DictReader(decoded_file)

        created = 0

        for row in reader:
            Room.objects.create(
                name=row["name"],
                capacity=int(row["capacity"]),
                room_type=row["room_type"],
            )
            created += 1

        return Response({"created": created, "updated": 0, "failed": 0})


class TeacherViewSet(viewsets.ModelViewSet):
    queryset = Teacher.objects.all().order_by("name")
    serializer_class = TeacherSerializer


class SectionViewSet(viewsets.ModelViewSet):
    queryset = Section.objects.all().order_by("name")
    serializer_class = SectionSerializer


class ClassSessionViewSet(viewsets.ModelViewSet):
    queryset = ClassSession.objects.all()
    serializer_class = ClassSessionSerializer

    @action(detail=False, methods=["post"], parser_classes=[MultiPartParser])
    def upload(self, request):
        file = request.FILES.get("file")

        if not file:
            return Response({"error": "No file uploaded"}, status=400)

        decoded_file = TextIOWrapper(file.file, encoding="utf-8")
        reader = csv.DictReader(decoded_file)

        created = 0

        for row in reader:
            ClassSession.objects.create(
                subject=row["subject"],
                teacher=row["teacher"],
                batch=row["batch"],
                day_of_week=row["day_of_week"],
                start_time=row["start_time"],
                end_time=row["end_time"],
                required_capacity=int(row["required_capacity"]),
                required_type=row["required_type"],
                value=int(row["value"]),
            )
            created += 1

        return Response({"created": created})

class AssignmentViewSet(viewsets.ModelViewSet):
    queryset = Assignment.objects.all()
    serializer_class = AssignmentSerializer


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

        suggestion = suggest_conflict_resolution(schedule_result)

        return Response(
            {
                "suggestion": suggestion,
                "explanation": explanation,
                "explanations": schedule_result["explanations"],
            },
            status=200,
        )

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

        return Response(self._serialize_schedule(schedule), status=200)

    @action(detail=True, methods=["post"])
    def unpublish(self, request, pk=None):
        schedule = self.get_object()
        schedule.status = "DRAFT"
        schedule.published_at = None
        schedule.save(update_fields=["status", "published_at"])

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

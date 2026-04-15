from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser

from .models import Room, ClassSession, Schedule, Assignment
from .serializers import (
    RoomSerializer,
    ClassSessionSerializer,
    ScheduleSerializer,
    AssignmentSerializer,
)
from scheduler.services.scheduler_service import (
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

    @action(detail=False, methods=["post"])
    def run_heap(self, request):
        try:
            classes = list(ClassSession.objects.all())
            rooms = list(Room.objects.all())

            if not classes:
                return Response({"error": "No classes available"}, status=400)

            if not rooms:
                return Response({"error": "No rooms available"}, status=400)

            assignments, max_rooms, total_value = run_heap_scheduler(classes, rooms)

            schedule = Schedule.objects.create(
                name="Heap Schedule",
                max_value=int(total_value),
                min_rooms=max_rooms,
            )

            for a in assignments:
                Assignment.objects.create(
                    schedule=schedule,
                    class_session=a["class"],
                    room_id=a["room"],
                )

            return Response(ScheduleSerializer(schedule).data, status=201)

        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({"error": str(e)}, status=500)

    @action(detail=False, methods=["post"])
    def run_dp(self, request):
        try:
            classes = list(ClassSession.objects.all())
            rooms = list(Room.objects.all())

            if not classes:
                return Response({"error": "No classes available"}, status=400)

            if not rooms:
                return Response({"error": "No rooms available"}, status=400)

            assignments, max_rooms, total_value = run_dp_scheduler(classes, rooms)

            schedule = Schedule.objects.create(
                name="DP Schedule",
                max_value=int(total_value),
                min_rooms=max_rooms,
            )

            for a in assignments:
                Assignment.objects.create(
                    schedule=schedule,
                    class_session=a["class"],
                    room_id=a["room"],
                )

            return Response(ScheduleSerializer(schedule).data, status=201)

        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({"error": str(e)}, status=500)

    @action(detail=False, methods=["post"])
    def run_optimized(self, request):
        try:
            classes = list(ClassSession.objects.all())
            rooms = list(Room.objects.all())

            if not classes:
                return Response({"error": "No classes available"}, status=400)

            if not rooms:
                return Response({"error": "No rooms available"}, status=400)

            assignments, max_rooms, total_value = run_optimized_scheduler(classes, rooms)

            schedule = Schedule.objects.create(
                name="Optimized Schedule (DP + Heap)",
                max_value=int(total_value),
                min_rooms=max_rooms,
            )

            for a in assignments:
                Assignment.objects.create(
                    schedule=schedule,
                    class_session=a["class"],
                    room_id=a["room"],
                )

            return Response(ScheduleSerializer(schedule).data, status=201)

        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({"error": str(e)}, status=500)
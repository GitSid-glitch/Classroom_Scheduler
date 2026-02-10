from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Room, ClassSession, Schedule, Assignment
from .serializers import RoomSerializer, ClassSessionSerializer, ScheduleSerializer
from .logic.heap_scheduler import schedule_classes_min_rooms
from .logic.dp_scheduler import weighted_interval_schedule


class RoomViewSet(viewsets.ModelViewSet):
    queryset = Room.objects.all()
    serializer_class = RoomSerializer


class ClassSessionViewSet(viewsets.ModelViewSet):
    queryset = ClassSession.objects.all()
    serializer_class = ClassSessionSerializer


class ScheduleViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Schedule.objects.all()
    serializer_class = ScheduleSerializer

    @action(detail=False, methods=["post"])
    def run_optimized(self, request):
        """
        Combined DP + heap:
        1. Use DP to choose best subset of classes (max value, no overlaps).
        2. Use heap to assign min number of rooms to those chosen classes.
        """
        teacher = request.data.get("teacher")
        batch = request.data.get("batch")

        qs = ClassSession.objects.all()
        if teacher:
            qs = qs.filter(teacher=teacher)
        if batch:
            qs = qs.filter(batch=batch)

        sessions = list(qs)
        data_for_dp = [
            {
                "id": s.id,
                "start": int(s.start_time.strftime("%H%M")),
                "end": int(s.end_time.strftime("%H%M")),
                "value": s.value,
            }
            for s in sessions
        ]
        print(f"DEBUG: Found {len(sessions)} sessions")
        print(f"DEBUG: data_for_dp = {data_for_dp}")

        dp_result = weighted_interval_schedule(data_for_dp)
        chosen_ids = set(dp_result["chosen_ids"])

        chosen_sessions = [s for s in sessions if s.id in chosen_ids]
        data_for_heap = [
            {
                "id": s.id,
                "start": int(s.start_time.strftime("%H%M")),
                "end": int(s.end_time.strftime("%H%M")),
            }
            for s in chosen_sessions
        ]

        heap_result = schedule_classes_min_rooms(data_for_heap)

        schedule = Schedule.objects.create(name="DP + Heap schedule")

        room_cache = {}
        for a in heap_result["assignments"]:
            class_session = ClassSession.objects.get(id=a["class_id"])
            idx = a["room_index"]
            room_name = f"Room {idx + 1}"
            if idx not in room_cache:
                room_obj, _ = Room.objects.get_or_create(
                    name=room_name,
                    defaults={"capacity": 0, "room_type": "THEORY"},
                )
                room_cache[idx] = room_obj
            room = room_cache[idx]

            Assignment.objects.create(
                schedule=schedule,
                class_session=class_session,
                room=room,
            )

        serializer = self.get_serializer(schedule)
        return Response(
            {
                "max_value": dp_result["max_value"],
                "min_rooms": heap_result["min_rooms"],
                "schedule": serializer.data,
            },
            status=status.HTTP_201_CREATED,
        )

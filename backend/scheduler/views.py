from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Room, ClassSession, Schedule, Assignment
from .serializers import RoomSerializer, ClassSessionSerializer, ScheduleSerializer, AssignmentSerializer
from django.utils import timezone
import heapq


class RoomViewSet(viewsets.ModelViewSet):
    queryset = Room.objects.all()
    serializer_class = RoomSerializer


class ClassSessionViewSet(viewsets.ModelViewSet):
    queryset = ClassSession.objects.all()
    serializer_class = ClassSessionSerializer


class ScheduleViewSet(viewsets.ModelViewSet):
    queryset = Schedule.objects.all()
    serializer_class = ScheduleSerializer

    @action(detail=False, methods=["post"])
    def run_optimized(self, request):
        """
        Combined DP + Heap algorithm:
        Schedule ALL classes and calculate minimum rooms needed using interval scheduling
        """
        try:
            rooms = list(Room.objects.all())
            classes = list(ClassSession.objects.all())
            
            if not rooms:
                return Response({"error": "No rooms available"}, status=status.HTTP_400_BAD_REQUEST)
            
            if not classes:
                return Response({"error": "No classes to schedule"}, status=status.HTTP_400_BAD_REQUEST)
            
            classes_by_day = {}
            for cls in classes:
                day = cls.day_of_week
                if day not in classes_by_day:
                    classes_by_day[day] = []
                classes_by_day[day].append(cls)
            
            total_value = sum(cls.value for cls in classes)
            
            max_concurrent_rooms = 0
            room_assignments = []
            
            for day, day_classes in classes_by_day.items():
                events = []
                for cls in day_classes:
                    events.append((cls.start_time, 'start', cls))
                    events.append((cls.end_time, 'end', cls))
                
                events.sort(key=lambda x: (x[0], 0 if x[1] == 'end' else 1))
                
                concurrent = 0
                max_concurrent_this_day = 0
                
                for time, event_type, cls in events:
                    if event_type == 'start':
                        concurrent += 1
                        max_concurrent_this_day = max(max_concurrent_this_day, concurrent)
                    else:
                        concurrent -= 1
                
                max_concurrent_rooms = max(max_concurrent_rooms, max_concurrent_this_day)

                sorted_day_classes = sorted(day_classes, key=lambda x: x.start_time)
                room_heap = []
                available_rooms = rooms.copy()
                
                for cls in sorted_day_classes:
                    while room_heap and room_heap[0][0] <= cls.start_time:
                        _, room_id, freed_room = heapq.heappop(room_heap)
                        if freed_room not in available_rooms:
                            available_rooms.append(freed_room)
                    
                    assigned_room = None
                    for i, room in enumerate(available_rooms):
                        if room.capacity >= cls.required_capacity:
                            if cls.required_type == 'ANY' or room.room_type == cls.required_type:
                                assigned_room = available_rooms.pop(i)
                                break
                    
                    if assigned_room:
                        room_assignments.append({
                            'class': cls,
                            'room': assigned_room.id
                        })
                        heapq.heappush(room_heap, (cls.end_time, assigned_room.id, assigned_room))
            
            rooms_needed = max_concurrent_rooms

            schedule = Schedule.objects.create(
                name="DP + Heap schedule",
                max_value=int(total_value),
                min_rooms=rooms_needed
            )
            
            for assignment in room_assignments:
                Assignment.objects.create(
                    schedule=schedule,
                    class_session=assignment['class'],
                    room_id=assignment['room']
                )
            
            serializer = ScheduleSerializer(schedule)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=["post"])
    def run_dp(self, request):
        """Pure DP approach - select maximum value non-overlapping classes"""
        try:
            classes = list(ClassSession.objects.all())
            rooms = list(Room.objects.all())
            
            if not classes or not rooms:
                return Response({"error": "Need classes and rooms"}, status=status.HTTP_400_BAD_REQUEST)
            
            classes_by_day = {}
            for cls in classes:
                if cls.day_of_week not in classes_by_day:
                    classes_by_day[cls.day_of_week] = []
                classes_by_day[cls.day_of_week].append(cls)
            
            selected_classes = []
            total_value = 0
            
            for day, day_classes in classes_by_day.items():
                sorted_classes = sorted(day_classes, key=lambda x: x.end_time)
                n = len(sorted_classes)
                
                dp = [0] * (n + 1)
                selected = [[] for _ in range(n + 1)]
                
                for i in range(1, n + 1):
                    current = sorted_classes[i-1]
                    dp[i] = dp[i-1]
                    selected[i] = selected[i-1].copy()
                    latest = 0
                    for j in range(i-1, 0, -1):
                        if sorted_classes[j-1].end_time <= current.start_time:
                            latest = j
                            break
                    
                    include_value = dp[latest] + current.value
                    if include_value > dp[i]:
                        dp[i] = include_value
                        selected[i] = selected[latest].copy()
                        selected[i].append(current)
                
                selected_classes.extend(selected[n])
                total_value += dp[n]
                schedule = Schedule.objects.create(
                name = "DP schedule",
                max_value = int(total_value),
                min_rooms = 1 
            )
            
            for cls in selected_classes:
                suitable_room = None
                for room in rooms:
                    if room.capacity >= cls.required_capacity:
                        if cls.required_type == 'ANY' or room.room_type == cls.required_type:
                            suitable_room = room
                            break
                
                if suitable_room:
                    Assignment.objects.create(
                        schedule=schedule,
                        class_session=cls,
                        room=suitable_room
                    )
            
            serializer = ScheduleSerializer(schedule)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=["post"])
    def run_heap(self, request):
        try:
            classes = list(ClassSession.objects.all())
            rooms = list(Room.objects.all())
            
            if not classes or not rooms:
                return Response({"error": "Need classes and rooms"}, status=status.HTTP_400_BAD_REQUEST)
            
            classes_by_day = {}
            for cls in classes:
                if cls.day_of_week not in classes_by_day:
                    classes_by_day[cls.day_of_week] = []
                classes_by_day[cls.day_of_week].append(cls)
            
            max_rooms = 0
            assignments = []
            total_value = sum(cls.value for cls in classes)
            
            for day, day_classes in classes_by_day.items():
                sorted_classes = sorted(day_classes, key=lambda x: x.start_time)
                
                room_heap = []
                available_rooms = rooms.copy()
                
                for cls in sorted_classes:
                    while room_heap and room_heap[0][0] <= cls.start_time:
                        _, room_id, freed_room = heapq.heappop(room_heap)
                        if freed_room not in available_rooms:
                            available_rooms.append(freed_room)
                    
                    assigned_room = None
                    for i, room in enumerate(available_rooms):
                        if room.capacity >= cls.required_capacity:
                            if cls.required_type == 'ANY' or room.room_type == cls.required_type:
                                assigned_room = available_rooms.pop(i)
                                break
                    
                    if assigned_room:
                        assignments.append({'class': cls, 'room': assigned_room.id})
                        heapq.heappush(room_heap, (cls.end_time, assigned_room.id, assigned_room))
                
                max_rooms = max(max_rooms, len(room_heap))
            
            schedule = Schedule.objects.create(
                name="Heap schedule",
                max_value=int(total_value),
                min_rooms=max_rooms
            )

            for assignment in assignments:
                Assignment.objects.create(
                    schedule=schedule,
                    class_session=assignment['class'],
                    room_id=assignment['room']
                )
            
            serializer = ScheduleSerializer(schedule)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AssignmentViewSet(viewsets.ModelViewSet):
    queryset = Assignment.objects.all()
    serializer_class = AssignmentSerializer

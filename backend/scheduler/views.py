from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Room, ClassSession, Schedule, Assignment
from .serializers import RoomSerializer, ClassSessionSerializer, ScheduleSerializer
from .logic.heap_scheduler import schedule_classes_min_rooms
from .logic.dp_scheduler import weighted_interval_schedule
import pandas as pd
from io import StringIO


class RoomViewSet(viewsets.ModelViewSet):
    queryset = Room.objects.all()
    serializer_class = RoomSerializer
    
    @action(detail=False, methods=["post"])
    def upload(self, request):
        """Upload rooms from CSV file"""
        if 'file' not in request.FILES:
            return Response({"detail": "No file provided"}, status=status.HTTP_400_BAD_REQUEST)
        
        file = request.FILES['file']
        
        try:
            decoded_file = file.read().decode('utf-8')
            csv_data = StringIO(decoded_file)
            df = pd.read_csv(csv_data)
            required_cols = ['name', 'capacity', 'room_type']
            if not all(col in df.columns for col in required_cols):
                return Response(
                    {"detail": f"CSV must have columns: {', '.join(required_cols)}"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            created = 0
            updated = 0
            failed = 0
            
            for _, row in df.iterrows():
                try:
                    room, created_flag = Room.objects.update_or_create(
                        name=str(row['name']),
                        defaults={
                            'capacity': int(row['capacity']),
                            'room_type': str(row['room_type']).upper()
                        }
                    )
                    if created_flag:
                        created += 1
                    else:
                        updated += 1
                except Exception as e:
                    print(f"Error processing row: {row}, Error: {e}")
                    failed += 1
            
            return Response({
                "created": created,
                "updated": updated,
                "failed": failed,
                "total": len(df)
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response(
                {"detail": f"Error processing CSV: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )


class ClassSessionViewSet(viewsets.ModelViewSet):
    queryset = ClassSession.objects.all()
    serializer_class = ClassSessionSerializer
    
    @action(detail=False, methods=["post"])
    def upload(self, request):
        """Upload class sessions from CSV file"""
        if 'file' not in request.FILES:
            return Response({"detail": "No file provided"}, status=status.HTTP_400_BAD_REQUEST)
        
        file = request.FILES['file']
        
        try:
            decoded_file = file.read().decode('utf-8')
            csv_data = StringIO(decoded_file)
            df = pd.read_csv(csv_data)
            
            required_cols = ['subject', 'teacher', 'batch', 'day_of_week', 
                           'start_time', 'end_time', 'required_capacity', 
                           'required_type', 'value']
            
            if not all(col in df.columns for col in required_cols):
                return Response(
                    {"detail": f"CSV must have columns: {', '.join(required_cols)}"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            created = 0
            updated = 0
            failed = 0
            
            for _, row in df.iterrows():
                try:
                    class_session, created_flag = ClassSession.objects.update_or_create(
                        subject=str(row['subject']),
                        teacher=str(row['teacher']),
                        batch=str(row['batch']),
                        day_of_week=str(row['day_of_week']).upper(),
                        start_time=str(row['start_time']),
                        defaults={
                            'end_time': str(row['end_time']),
                            'required_capacity': int(row['required_capacity']),
                            'required_type': str(row['required_type']).upper(),
                            'value': int(row['value'])
                        }
                    )
                    if created_flag:
                        created += 1
                    else:
                        updated += 1
                except Exception as e:
                    print(f"Error processing row: {row}, Error: {e}")
                    failed += 1
            
            return Response({
                "created": created,
                "updated": updated,
                "failed": failed,
                "total": len(df)
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response(
                {"detail": f"Error processing CSV: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )


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

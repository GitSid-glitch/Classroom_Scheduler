from django.core.management.base import BaseCommand
from django.utils import timezone

from scheduler.models import Assignment, ClassSession, Room, Schedule, Section, Teacher
from scheduler.services.conflict_service import analyze_conflicts
from scheduler.services.scheduler_service import (
    build_schedule_explanations,
    run_optimized_scheduler,
)


ROOMS = [
    {"name": "A-101", "capacity": 72, "room_type": "THEORY", "features": "projector,smart-board"},
    {"name": "A-102", "capacity": 64, "room_type": "THEORY", "features": "projector"},
    {"name": "Lab-201", "capacity": 42, "room_type": "LAB", "features": "projector,linux-lab"},
    {"name": "Lab-202", "capacity": 36, "room_type": "LAB", "features": "projector,data-analytics"},
]

TEACHERS = [
    {"name": "Dr. Meera Roy", "department": "Computer Science", "max_daily_load": 3, "unavailable_days": "FRI"},
    {"name": "Prof. Arjun Sen", "department": "Computer Science", "max_daily_load": 4, "unavailable_days": ""},
    {"name": "Dr. Kavya Iyer", "department": "Mathematics", "max_daily_load": 3, "unavailable_days": "WED"},
    {"name": "Prof. Rohan Das", "department": "Data Science", "max_daily_load": 3, "unavailable_days": "SAT"},
]

SECTIONS = [
    {"name": "B.Tech CSE 4A", "program": "B.Tech CSE", "semester": 4, "size": 60},
    {"name": "B.Tech CSE 4B", "program": "B.Tech CSE", "semester": 4, "size": 56},
    {"name": "B.Sc DS 2A", "program": "B.Sc Data Science", "semester": 2, "size": 34},
]

CLASS_SESSIONS = [
    {
        "subject": "Design and Analysis of Algorithms",
        "teacher": "Dr. Meera Roy",
        "batch": "B.Tech CSE 4A",
        "day_of_week": "MON",
        "start_time": "09:00",
        "end_time": "10:00",
        "required_capacity": 60,
        "required_type": "THEORY",
        "value": 9,
        "required_features": "projector",
        "is_locked": True,
        "fixed_room": "A-101",
    },
    {
        "subject": "Operating Systems",
        "teacher": "Prof. Arjun Sen",
        "batch": "B.Tech CSE 4A",
        "day_of_week": "MON",
        "start_time": "10:00",
        "end_time": "11:00",
        "required_capacity": 60,
        "required_type": "THEORY",
        "value": 8,
        "required_features": "projector",
    },
    {
        "subject": "Database Management Systems Lab",
        "teacher": "Prof. Arjun Sen",
        "batch": "B.Tech CSE 4A",
        "day_of_week": "TUE",
        "start_time": "11:00",
        "end_time": "13:00",
        "required_capacity": 35,
        "required_type": "LAB",
        "value": 10,
        "required_features": "linux-lab",
    },
    {
        "subject": "Discrete Mathematics",
        "teacher": "Dr. Kavya Iyer",
        "batch": "B.Tech CSE 4B",
        "day_of_week": "MON",
        "start_time": "09:00",
        "end_time": "10:00",
        "required_capacity": 56,
        "required_type": "THEORY",
        "value": 7,
        "required_features": "projector",
    },
    {
        "subject": "Computer Networks",
        "teacher": "Dr. Meera Roy",
        "batch": "B.Tech CSE 4B",
        "day_of_week": "THU",
        "start_time": "10:00",
        "end_time": "11:00",
        "required_capacity": 56,
        "required_type": "THEORY",
        "value": 8,
        "required_features": "projector,smart-board",
    },
    {
        "subject": "Data Analytics",
        "teacher": "Prof. Rohan Das",
        "batch": "B.Sc DS 2A",
        "day_of_week": "WED",
        "start_time": "09:00",
        "end_time": "10:00",
        "required_capacity": 34,
        "required_type": "THEORY",
        "value": 9,
        "required_features": "projector",
    },
    {
        "subject": "Statistics Lab",
        "teacher": "Prof. Rohan Das",
        "batch": "B.Sc DS 2A",
        "day_of_week": "WED",
        "start_time": "10:00",
        "end_time": "12:00",
        "required_capacity": 34,
        "required_type": "LAB",
        "value": 8,
        "required_features": "data-analytics",
    },
    {
        "subject": "Theory of Computation",
        "teacher": "Dr. Meera Roy",
        "batch": "B.Tech CSE 4A",
        "day_of_week": "FRI",
        "start_time": "09:00",
        "end_time": "10:00",
        "required_capacity": 60,
        "required_type": "THEORY",
        "value": 6,
        "required_features": "projector",
    },
]


class Command(BaseCommand):
    help = "Seed a demo academic workspace with rooms, teachers, sections, class sessions, and a published schedule."

    def handle(self, *args, **options):
        room_by_name = {}
        teacher_by_name = {}
        section_by_name = {}

        for payload in ROOMS:
            room, _ = Room.objects.update_or_create(
                name=payload["name"],
                defaults={
                    "capacity": payload["capacity"],
                    "room_type": payload["room_type"],
                    "features": payload["features"],
                },
            )
            room_by_name[room.name] = room

        for payload in TEACHERS:
            teacher, _ = Teacher.objects.update_or_create(
                name=payload["name"],
                defaults={
                    "department": payload["department"],
                    "max_daily_load": payload["max_daily_load"],
                    "unavailable_days": payload["unavailable_days"],
                },
            )
            teacher_by_name[teacher.name] = teacher

        for payload in SECTIONS:
            section, _ = Section.objects.update_or_create(
                name=payload["name"],
                defaults={
                    "program": payload["program"],
                    "semester": payload["semester"],
                    "size": payload["size"],
                },
            )
            section_by_name[section.name] = section

        for payload in CLASS_SESSIONS:
            teacher = teacher_by_name[payload["teacher"]]
            section = section_by_name[payload["batch"]]
            fixed_room_name = payload.get("fixed_room")
            fixed_room = room_by_name[fixed_room_name] if fixed_room_name else None

            ClassSession.objects.update_or_create(
                subject=payload["subject"],
                teacher=payload["teacher"],
                batch=payload["batch"],
                day_of_week=payload["day_of_week"],
                start_time=payload["start_time"],
                end_time=payload["end_time"],
                defaults={
                    "teacher_record": teacher,
                    "section_record": section,
                    "fixed_room": fixed_room,
                    "required_capacity": payload["required_capacity"],
                    "required_type": payload["required_type"],
                    "value": payload["value"],
                    "teacher_unavailable_days": teacher.unavailable_days,
                    "is_locked": payload.get("is_locked", False),
                    "required_features": payload["required_features"],
                },
            )

        classes = list(ClassSession.objects.all())
        rooms = list(Room.objects.prefetch_related("unavailable_windows").all())
        schedule_result = run_optimized_scheduler(classes, rooms)
        conflicts = analyze_conflicts(classes, rooms, schedule_result["unscheduled"])
        explanations = build_schedule_explanations(
            schedule_result["assignments"],
            schedule_result["unscheduled"],
            conflicts,
        )

        schedule, _ = Schedule.objects.update_or_create(
            name="Spring 2026 Demo Schedule",
            defaults={
                "max_value": int(schedule_result["total_value"]),
                "min_rooms": schedule_result["max_rooms"],
                "status": "PUBLISHED",
                "published_at": timezone.now(),
            },
        )
        schedule.assignments.all().delete()

        for assignment in schedule_result["assignments"]:
            Assignment.objects.create(
                schedule=schedule,
                class_session=assignment["class"],
                room_id=assignment["room"],
            )

        self.stdout.write(
            self.style.SUCCESS(
                "Prepared demo workspace with "
                f"{Room.objects.count()} rooms, "
                f"{Teacher.objects.count()} teachers, "
                f"{Section.objects.count()} sections, "
                f"{ClassSession.objects.count()} class sessions, and "
                f"{schedule.assignments.count()} published assignments."
            )
        )
        self.stdout.write(
            self.style.NOTICE(
                f"Latest published schedule: {schedule.name} | "
                f"value={schedule.max_value} | rooms={schedule.min_rooms} | "
                f"unscheduled={len(schedule_result['unscheduled'])} | conflicts={len(conflicts)} | "
                f"explanations={len(explanations)}"
            )
        )

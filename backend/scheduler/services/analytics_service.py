from collections import defaultdict


def build_analytics_snapshot(classes, rooms, schedule_result):
    scheduled_assignments = schedule_result.get("assignments", [])
    unscheduled = schedule_result.get("unscheduled", [])

    room_utilization = _build_room_utilization(rooms, scheduled_assignments)
    teacher_load = _build_teacher_load(classes, scheduled_assignments)
    quality = _build_quality_summary(classes, scheduled_assignments, unscheduled)

    return {
        "room_utilization": room_utilization,
        "teacher_load": teacher_load,
        "quality": quality,
    }


def _build_room_utilization(rooms, assignments):
    minutes_by_room = defaultdict(int)

    for assignment in assignments:
        cls = assignment["class"]
        minutes_by_room[assignment["room"]] += _session_minutes(cls)

    utilization = []

    for room in rooms:
        scheduled_minutes = minutes_by_room.get(room.id, 0)
        utilization.append(
            {
                "room_id": room.id,
                "room_name": room.name,
                "scheduled_minutes": scheduled_minutes,
                "utilization_score": min(100, round((scheduled_minutes / 480) * 100)),
            }
        )

    return sorted(utilization, key=lambda item: item["utilization_score"], reverse=True)


def _build_teacher_load(classes, assignments):
    scheduled_ids = {assignment["class"].id for assignment in assignments}
    load_by_teacher = defaultdict(lambda: {"scheduled_sessions": 0, "scheduled_minutes": 0})

    for cls in classes:
        if cls.id not in scheduled_ids:
            continue

        load_by_teacher[cls.teacher]["scheduled_sessions"] += 1
        load_by_teacher[cls.teacher]["scheduled_minutes"] += _session_minutes(cls)

    teacher_load = [
        {
            "teacher": teacher,
            "scheduled_sessions": payload["scheduled_sessions"],
            "scheduled_minutes": payload["scheduled_minutes"],
        }
        for teacher, payload in load_by_teacher.items()
    ]

    return sorted(teacher_load, key=lambda item: item["scheduled_minutes"], reverse=True)


def _build_quality_summary(classes, assignments, unscheduled):
    total_classes = len(classes)
    scheduled_count = len(assignments)
    unscheduled_count = len(unscheduled)
    scheduled_value = sum(assignment["class"].value for assignment in assignments)
    total_value = sum(cls.value for cls in classes)

    coverage_ratio = round((scheduled_count / total_classes) * 100) if total_classes else 0
    value_capture_ratio = round((scheduled_value / total_value) * 100) if total_value else 0

    return {
        "coverage_ratio": coverage_ratio,
        "value_capture_ratio": value_capture_ratio,
        "scheduled_count": scheduled_count,
        "unscheduled_count": unscheduled_count,
    }


def _session_minutes(class_session):
    return (
        class_session.end_time.hour * 60
        + class_session.end_time.minute
        - class_session.start_time.hour * 60
        - class_session.start_time.minute
    )

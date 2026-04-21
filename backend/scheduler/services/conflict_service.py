def _overlaps(session_a, session_b):
    return (
        session_a.day_of_week == session_b.day_of_week
        and session_a.start_time < session_b.end_time
        and session_b.start_time < session_a.end_time
    )


def analyze_conflicts(classes, rooms, unscheduled=None):
    conflicts = []
    unscheduled = unscheduled or []

    for i, current in enumerate(classes):
        for other in classes[i + 1 :]:
            if not _overlaps(current, other):
                continue

            if current.teacher == other.teacher:
                conflicts.append(
                    {
                        "type": "TEACHER_OVERLAP",
                        "severity": "high",
                        "title": f"Teacher conflict for {current.teacher}",
                        "description": (
                            f"{current.subject} and {other.subject} overlap on "
                            f"{current.day_of_week}."
                        ),
                    }
                )

            if current.batch == other.batch:
                conflicts.append(
                    {
                        "type": "BATCH_OVERLAP",
                        "severity": "high",
                        "title": f"Batch conflict for {current.batch}",
                        "description": (
                            f"{current.subject} and {other.subject} overlap for the same batch "
                            f"on {current.day_of_week}."
                        ),
                    }
                )

    for room in rooms:
        for window in room.unavailable_windows.all():
            conflicts.append(
                {
                    "type": "ROOM_BLACKOUT",
                    "severity": "medium",
                    "title": f"{room.name} blackout window",
                    "description": (
                        f"{room.name} is unavailable on {window.day_of_week} "
                        f"from {window.start_time} to {window.end_time}."
                    ),
                }
            )

    for item in unscheduled:
        cls = item["class"]
        conflicts.append(
            {
                "type": "UNSCHEDULED_SESSION",
                "severity": "high",
                "title": f"{cls.subject} could not be scheduled",
                "description": item["reason"],
            }
        )

    unique_conflicts = []
    seen = set()

    for conflict in conflicts:
        key = (conflict["type"], conflict["title"], conflict["description"])
        if key in seen:
            continue
        seen.add(key)
        unique_conflicts.append(conflict)

    return unique_conflicts

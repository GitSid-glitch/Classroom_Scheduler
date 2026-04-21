def explain_unscheduled_session(class_session, unscheduled_items):
    for item in unscheduled_items:
        if item["class"].id != class_session.id:
            continue

        return {
            "class_session": class_session.id,
            "subject": class_session.subject,
            "explanation": item["reason"],
            "action_hint": _build_action_hint(item["reason"]),
        }

    return {
        "class_session": class_session.id,
        "subject": class_session.subject,
        "explanation": "This session is currently scheduled, so no unscheduled explanation is needed.",
        "action_hint": "Inspect room fit, teacher load, or quality scoring if you still want to improve placement.",
    }


def suggest_conflict_resolution(schedule_result):
    unscheduled = schedule_result.get("unscheduled", [])
    conflicts = schedule_result.get("conflicts", [])

    if unscheduled:
        top_item = unscheduled[0]
        return {
            "title": f"Resolve {top_item['class'].subject} first",
            "suggestion": _build_action_hint(top_item["reason"]),
        }

    if conflicts:
        top_conflict = conflicts[0]
        return {
            "title": top_conflict["title"],
            "suggestion": "Review this conflict first and consider locking the higher-priority session before regenerating.",
        }

    return {
        "title": "Draft looks healthy",
        "suggestion": "No urgent issues were detected. The next useful step is publish review or timetable quality optimization.",
    }


def _build_action_hint(reason):
    if "Teacher is unavailable" in reason:
        return "Move the session to a day when the teacher is available or adjust faculty availability data."
    if "Teacher already has" in reason:
        return "Reslot one of the teacher's overlapping sessions or lock the more important one before rerunning."
    if "Batch already has" in reason:
        return "Move one of the overlapping batch sessions to reduce student timetable collisions."
    if "Locked session could not be scheduled" in reason:
        return "Check room capacity, room type, required features, or blackout windows for this fixed session."
    if "higher-value sessions" in reason:
        return "Increase this session's priority only if it is academically critical, otherwise keep the higher-value allocation."
    if "No compatible room" in reason:
        return "Add a compatible room, reduce constraints, or move the session to a lower-demand time window."
    return "Inspect the conflicting constraints and adjust room, time, or priority inputs before rerunning."

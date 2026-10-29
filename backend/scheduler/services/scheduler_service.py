from scheduler.algorithms.heap import assign_rooms
from scheduler.algorithms.dp import weighted_interval_scheduling


def _parse_day_codes(day_codes):
    if not day_codes:
        return set()
    return {item.strip() for item in day_codes.split(",") if item.strip()}


def _filter_teacher_available(classes):
    eligible = []
    rejected = []

    for cls in classes:
        unavailable_days = _parse_day_codes(getattr(cls, "teacher_unavailable_days", ""))
        if cls.day_of_week in unavailable_days:
            rejected.append(
                {
                    "class": cls,
                    "reason": "Teacher is unavailable for this day.",
                }
            )
            continue
        eligible.append(cls)

    return eligible, rejected


def _sessions_overlap(first, second):
    return (
        first.day_of_week == second.day_of_week
        and first.start_time < second.end_time
        and second.start_time < first.end_time
    )


def _build_locked_conflict_index(assignments):
    return [assignment["class"] for assignment in assignments]


def _filter_conflicting_optionals(classes, locked_classes):
    accepted = []
    rejected = []
    reserved = list(locked_classes)

    for cls in sorted(classes, key=lambda session: (session.start_time, -session.value)):
        conflict = None

        for reserved_class in reserved:
            if not _sessions_overlap(cls, reserved_class):
                continue

            if cls.teacher == reserved_class.teacher:
                conflict = "Teacher already has a locked or scheduled overlapping session."
                break

            if cls.batch == reserved_class.batch:
                conflict = "Batch already has a locked or scheduled overlapping session."
                break

        if conflict:
            rejected.append({"class": cls, "reason": conflict})
            continue

        accepted.append(cls)
        reserved.append(cls)

    return accepted, rejected


def build_schedule_explanations(assignments, unscheduled, conflicts):
    explanations = []

    if assignments:
        explanations.append(
            {
                "type": "SCHEDULING_SUMMARY",
                "message": f"{len(assignments)} sessions were scheduled successfully.",
            }
        )

    if unscheduled:
        explanations.append(
            {
                "type": "UNSCHEDULED_SUMMARY",
                "message": f"{len(unscheduled)} sessions remain unscheduled due to active constraints.",
            }
        )

    if conflicts:
        explanations.append(
            {
                "type": "CONFLICT_SUMMARY",
                "message": f"{len(conflicts)} operational conflicts were detected for review.",
            }
        )

    for item in unscheduled[:5]:
        explanations.append(
            {
                "type": "UNSCHEDULED_REASON",
                "class_session": item["class"].id,
                "message": item["reason"],
            }
        )

    return explanations


def _group_classes_by_day(classes):
    classes_by_day = {}
    for cls in classes:
        classes_by_day.setdefault(cls.day_of_week, []).append(cls)
    return classes_by_day


def _build_unscheduled_entries(candidate_classes, scheduled_assignments, reason):
    scheduled_ids = {assignment["class"].id for assignment in scheduled_assignments}
    unscheduled = []

    for cls in candidate_classes:
        if cls.id not in scheduled_ids:
            final_reason = reason
            if getattr(cls, "fixed_room_id", None):
                final_reason = "The coordinator-selected fixed room was unavailable or incompatible."
            unscheduled.append(
                {
                    "class": cls,
                    "reason": final_reason,
                }
            )

    return unscheduled


def _run_day_aware_assignment(classes_by_day, rooms, selector=None):
    all_assignments = []
    unscheduled = []
    max_rooms = 0

    for day, day_classes in classes_by_day.items():
        teacher_eligible_classes, teacher_rejected = _filter_teacher_available(day_classes)
        locked_classes = [cls for cls in teacher_eligible_classes if getattr(cls, "is_locked", False)]
        unlocked_classes = [
            cls for cls in teacher_eligible_classes if not getattr(cls, "is_locked", False)
        ]

        locked_assignments, locked_rooms_used = assign_rooms(locked_classes, rooms)
        locked_unscheduled = _build_unscheduled_entries(
            locked_classes,
            locked_assignments,
            "Locked session could not be scheduled because no compatible room was available.",
        )

        locked_conflicts = _build_locked_conflict_index(locked_assignments)
        conflict_safe_unlocked, conflict_rejected = _filter_conflicting_optionals(
            unlocked_classes,
            locked_conflicts,
        )

        occupied_room_ids = {assignment["room"] for assignment in locked_assignments}
        remaining_rooms = [room for room in rooms if room.id not in occupied_room_ids]

        candidate_classes = (
            selector(conflict_safe_unlocked) if selector else list(conflict_safe_unlocked)
        )
        optional_assignments, optional_rooms_used = assign_rooms(candidate_classes, remaining_rooms)

        assignments = locked_assignments + optional_assignments
        rooms_used = max(locked_rooms_used, len(occupied_room_ids) + optional_rooms_used)
        max_rooms = max(max_rooms, rooms_used)

        for assignment in assignments:
            assignment["day_of_week"] = day

        all_assignments.extend(assignments)
        unscheduled.extend(teacher_rejected)
        unscheduled.extend(locked_unscheduled)
        unscheduled.extend(conflict_rejected)
        unscheduled.extend(
            _build_unscheduled_entries(
                candidate_classes,
                optional_assignments,
                "No compatible room was available for this time slot.",
            )
        )

    total_value = sum(assignment["class"].value for assignment in all_assignments)

    return {
        "assignments": all_assignments,
        "max_rooms": max_rooms,
        "total_value": total_value,
        "unscheduled": unscheduled,
        "explanations": [],
    }


def run_heap_scheduler(classes, rooms):
    return _run_day_aware_assignment(_group_classes_by_day(classes), rooms)


def run_dp_scheduler(classes, rooms):
    return _run_day_aware_assignment(
        _group_classes_by_day(classes),
        rooms,
        selector=weighted_interval_scheduling,
    )


def run_optimized_scheduler(classes, rooms):
    classes_by_day = _group_classes_by_day(classes)
    assignments = []
    unscheduled = []
    max_rooms = 0

    for day_classes in classes_by_day.values():
        teacher_eligible, unavailable = _filter_teacher_available(day_classes)
        locked = [cls for cls in teacher_eligible if getattr(cls, "is_locked", False)]
        optional = [cls for cls in teacher_eligible if not getattr(cls, "is_locked", False)]

        # Locked classes are anchors. For optional classes, resolve only actual
        # teacher/section collisions; independent sections can run in parallel
        # when the room allocator has enough compatible rooms.
        accepted_locked, invalid_locked = _filter_conflicting_optionals(locked, [])
        accepted_optional = []
        rejected_optional = []
        accepted = list(accepted_locked)
        for cls in sorted(optional, key=lambda session: (-session.value, session.start_time, session.end_time)):
            conflict = None
            for reserved in accepted:
                if not _sessions_overlap(cls, reserved):
                    continue
                if cls.teacher == reserved.teacher:
                    conflict = "Teacher already has a locked or scheduled overlapping session."
                    break
                if cls.batch == reserved.batch:
                    conflict = "Batch already has a locked or scheduled overlapping session."
                    break
            if conflict:
                rejected_optional.append({"class": cls, "reason": conflict})
            else:
                accepted_optional.append(cls)
                accepted.append(cls)

        locked_assignments, _ = assign_rooms(accepted_locked, rooms)
        optional_assignments, _ = assign_rooms(
            accepted_optional,
            rooms,
            reservations=locked_assignments,
        )
        day_assignments = locked_assignments + optional_assignments
        scheduled_ids = {item["class"].id for item in day_assignments}
        room_rejections = [
            {"class": cls, "reason": "No compatible room was available for this time slot."}
            for cls in accepted_locked + accepted_optional
            if cls.id not in scheduled_ids
        ]

        for assignment in day_assignments:
            assignment["day_of_week"] = day_classes[0].day_of_week
        assignments.extend(day_assignments)
        unscheduled.extend(unavailable)
        unscheduled.extend(invalid_locked)
        unscheduled.extend(rejected_optional)
        unscheduled.extend(room_rejections)
        events = []
        for assignment in day_assignments:
            events.extend([
                (assignment["class"].start_time, 1),
                (assignment["class"].end_time, -1),
            ])
        active_rooms = peak_rooms = 0
        for _, delta in sorted(events, key=lambda event: (event[0], event[1])):
            active_rooms += delta
            peak_rooms = max(peak_rooms, active_rooms)
        max_rooms = max(max_rooms, peak_rooms)

    return {
        "assignments": assignments,
        "max_rooms": max_rooms,
        "total_value": sum(item["class"].value for item in assignments),
        "unscheduled": unscheduled,
        "explanations": [],
    }

import heapq


def _overlaps(start_a, end_a, start_b, end_b):
    return start_a < end_b and start_b < end_a


def _room_is_available(room, cls):
    for window in getattr(room, "unavailable_windows", []).all():
        if window.day_of_week != cls.day_of_week:
            continue
        if _overlaps(cls.start_time, cls.end_time, window.start_time, window.end_time):
            return False
    return True


def _parse_csv_values(value):
    if not value:
        return set()
    return {item.strip().lower() for item in value.split(",") if item.strip()}


def _room_matches_features(room, cls):
    required_features = _parse_csv_values(getattr(cls, "required_features", ""))
    if not required_features:
        return True

    room_features = _parse_csv_values(getattr(room, "features", ""))
    return required_features.issubset(room_features)


def assign_rooms(day_classes, rooms):
    sorted_classes = sorted(day_classes, key=lambda x: x.start_time)
    active_heap = []

    available_rooms = sorted(rooms, key=lambda r: r.capacity)

    assignments = []
    max_rooms_used = 0

    for cls in sorted_classes:
        while active_heap and active_heap[0][0] <= cls.start_time:
            _, _, freed_room = heapq.heappop(active_heap)
            available_rooms.append(freed_room)
            available_rooms.sort(key=lambda r: r.capacity)
        assigned_room = None
        for i, room in enumerate(available_rooms):
            if room.capacity >= cls.required_capacity and (
                cls.required_type == "ANY" or room.room_type == cls.required_type
            ) and _room_is_available(room, cls) and _room_matches_features(room, cls):
                assigned_room = available_rooms.pop(i)
                break

        if assigned_room:
            assignments.append({
                "class": cls,
                "room": assigned_room.id
            })
            heapq.heappush(active_heap, (cls.end_time, assigned_room.id, assigned_room))

            max_rooms_used = max(max_rooms_used, len(active_heap))

    return assignments, max_rooms_used

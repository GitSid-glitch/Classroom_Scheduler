import heapq

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
            ):
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
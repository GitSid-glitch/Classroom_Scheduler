import heapq
from typing import List, Dict, Any
def schedule_classes_min_rooms(class_sessions: List[Dict[str, Any]]) -> Dict[str, Any]:
    sessions = sorted(class_sessions, key=lambda x: x["start"])
    heap = []
    room_count = 0
    assignments = []

    for s in sessions:
        if heap and heap[0][0] <= s["start"]:
            _, room_index = heapq.heappop(heap)
        else:
            room_index = room_count
            room_count += 1

        heapq.heappush(heap, (s["end"], room_index))
        assignments.append(
            {
                "class_id": s["id"],
                "room_index": room_index,
            }
        )

    return {
        "min_rooms": room_count,
        "assignments": assignments,
    }

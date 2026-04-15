from scheduler.algorithms.heap import assign_rooms
from scheduler.algorithms.dp import weighted_interval_scheduling
def run_heap_scheduler(classes, rooms):
    classes_by_day = {}
    for cls in classes:
        classes_by_day.setdefault(cls.day_of_week, []).append(cls)

    all_assignments = []
    max_rooms = 0

    for day, day_classes in classes_by_day.items():
        assignments, rooms_used = assign_rooms(day_classes, rooms)
        all_assignments.extend(assignments)
        max_rooms = max(max_rooms, rooms_used)

    total_value = sum(a["class"].value for a in all_assignments)

    return all_assignments, max_rooms, total_value
def run_dp_scheduler(classes, rooms):
    classes_by_day = {}

    for cls in classes:
        classes_by_day.setdefault(cls.day_of_week, []).append(cls)

    selected_classes = []
    total_value = 0

    for day, day_classes in classes_by_day.items():
        chosen = weighted_interval_scheduling(day_classes)
        selected_classes.extend(chosen)
        total_value += sum(c.value for c in chosen)

    assignments, rooms_used = assign_rooms(selected_classes, rooms)

    return assignments, rooms_used, total_value

def run_optimized_scheduler(classes, rooms):
    classes_by_day = {}

    for cls in classes:
        classes_by_day.setdefault(cls.day_of_week, []).append(cls)

    selected_classes = []
    total_value = 0
    for day, day_classes in classes_by_day.items():
        chosen = weighted_interval_scheduling(day_classes)
        selected_classes.extend(chosen)
        total_value += sum(c.value for c in chosen)

    assignments, max_rooms = assign_rooms(selected_classes, rooms)
    return assignments, max_rooms, total_value
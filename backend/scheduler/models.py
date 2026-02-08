from django.db import models
class Room(models.Model):
    name = models.CharField(max_length=100, unique=True)
    capacity = models.PositiveIntegerField()
    room_type = models.CharField(
        max_length=50,
        choices=(
            ("THEORY", "Theory"),
            ("LAB", "Lab"),
        ),
        default="THEORY",
    )

    def __str__(self):
        return f"{self.name} ({self.capacity})"


class ClassSession(models.Model):
    subject = models.CharField(max_length=100)
    teacher = models.CharField(max_length=100)
    batch = models.CharField(max_length=50)

    day_of_week = models.CharField(
        max_length=10,
        choices=(
            ("MON", "Monday"),
            ("TUE", "Tuesday"),
            ("WED", "Wednesday"),
            ("THU", "Thursday"),
            ("FRI", "Friday"),
            ("SAT", "Saturday"),
        ),
    )
    start_time = models.TimeField()
    end_time = models.TimeField()

    required_capacity = models.PositiveIntegerField(default=0)
    required_type = models.CharField(
        max_length=50,
        choices=(
            ("ANY", "Any"),
            ("THEORY", "Theory"),
            ("LAB", "Lab"),
        ),
        default="ANY",
    )
    value = models.PositiveIntegerField(default=1)
    def __str__(self):
        return f"{self.subject} - {self.batch} ({self.day_of_week} {self.start_time}-{self.end_time})"
class Schedule(models.Model):
    name = models.CharField(max_length=100, default="Auto schedule")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} @ {self.created_at}"
class Assignment(models.Model):
    schedule = models.ForeignKey(Schedule, on_delete=models.CASCADE, related_name="assignments")
    class_session = models.ForeignKey(ClassSession, on_delete=models.CASCADE, related_name="assignments")
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name="assignments")

    class Meta:
        unique_together = ("schedule", "class_session", "room")

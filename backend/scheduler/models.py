from django.db import models
from django.core.exceptions import ValidationError
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver


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
    features = models.CharField(max_length=255, blank=True, default="")

    def __str__(self):
        return f"{self.name} ({self.capacity})"


class RoomUnavailableWindow(models.Model):
    room = models.ForeignKey(
        Room,
        on_delete=models.CASCADE,
        related_name="unavailable_windows",
    )
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
    reason = models.CharField(max_length=255, blank=True, default="")

    def clean(self):
        if self.end_time <= self.start_time:
            raise ValidationError({"end_time": "End time must be after start time."})

    def __str__(self):
        return f"{self.room.name} unavailable on {self.day_of_week} {self.start_time}-{self.end_time}"


class Teacher(models.Model):
    name = models.CharField(max_length=100, unique=True)
    department = models.CharField(max_length=100, blank=True, default="")
    max_daily_load = models.PositiveIntegerField(default=4)
    unavailable_days = models.CharField(max_length=100, blank=True, default="")

    def __str__(self):
        return self.name


class Section(models.Model):
    name = models.CharField(max_length=100, unique=True)
    program = models.CharField(max_length=100, blank=True, default="")
    semester = models.PositiveIntegerField(default=1)
    size = models.PositiveIntegerField(default=0)

    def __str__(self):
        return self.name


class ClassSession(models.Model):
    subject = models.CharField(max_length=100)
    teacher = models.CharField(max_length=100)
    batch = models.CharField(max_length=50)
    fixed_room = models.ForeignKey(
        Room,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="fixed_class_sessions",
    )
    teacher_record = models.ForeignKey(
        Teacher,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="class_sessions",
    )
    section_record = models.ForeignKey(
        Section,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="class_sessions",
    )

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
    teacher_unavailable_days = models.CharField(max_length=100, blank=True, default="")
    is_locked = models.BooleanField(default=False)
    required_features = models.CharField(max_length=255, blank=True, default="")

    def sync_linked_metadata(self):
        if self.teacher_record_id:
            self.teacher = self.teacher_record.name
            self.teacher_unavailable_days = self.teacher_record.unavailable_days

        if self.section_record_id:
            self.batch = self.section_record.name

    def clean(self):
        if self.end_time <= self.start_time:
            raise ValidationError({"end_time": "End time must be after start time."})
        self.sync_linked_metadata()

    def save(self, *args, **kwargs):
        self.sync_linked_metadata()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.subject} - {self.batch} ({self.day_of_week} {self.start_time}-{self.end_time})"


class Schedule(models.Model):
    name = models.CharField(max_length=100, default="Auto schedule")
    created_at = models.DateTimeField(auto_now_add=True)
    max_value = models.IntegerField(default=0) 
    min_rooms = models.IntegerField(default=0) 
    status = models.CharField(
        max_length=20,
        choices=(
            ("DRAFT", "Draft"),
            ("PUBLISHED", "Published"),
        ),
        default="DRAFT",
    )
    published_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.name} @ {self.created_at}"


class Assignment(models.Model):
    schedule = models.ForeignKey(Schedule, on_delete=models.CASCADE, related_name="assignments")
    class_session = models.ForeignKey(ClassSession, on_delete=models.CASCADE, related_name="assignments")
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name="assignments")

    class Meta:
        unique_together = ("schedule", "class_session", "room")


class AuditEvent(models.Model):
    entity_type = models.CharField(max_length=50)
    entity_id = models.PositiveIntegerField()
    action = models.CharField(max_length=50)
    summary = models.CharField(max_length=255)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-created_at", "-id")

    def __str__(self):
        return f"{self.action} {self.entity_type}#{self.entity_id}"


class UserProfile(models.Model):
    ROLE_ADMIN = "ADMIN"
    ROLE_COORDINATOR = "COORDINATOR"
    ROLE_FACULTY = "FACULTY"
    ROLE_STUDENT = "STUDENT"

    ROLE_CHOICES = (
        (ROLE_ADMIN, "Admin"),
        (ROLE_COORDINATOR, "Coordinator"),
        (ROLE_FACULTY, "Faculty"),
        (ROLE_STUDENT, "Student"),
    )

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="scheduler_profile")
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default=ROLE_COORDINATOR)
    display_name = models.CharField(max_length=120, blank=True, default="")

    def __str__(self):
        return self.display_name or self.user.get_full_name() or self.user.username


@receiver(post_save, sender=User)
def ensure_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(
            user=instance,
            role=UserProfile.ROLE_ADMIN if instance.is_staff or instance.is_superuser else UserProfile.ROLE_COORDINATOR,
            display_name=instance.get_full_name() or instance.username,
        )
        return

    profile, _ = UserProfile.objects.get_or_create(
        user=instance,
        defaults={
            "role": UserProfile.ROLE_ADMIN if instance.is_staff or instance.is_superuser else UserProfile.ROLE_COORDINATOR,
            "display_name": instance.get_full_name() or instance.username,
        },
    )

    updated_display_name = instance.get_full_name() or instance.username
    if profile.display_name != updated_display_name:
        profile.display_name = updated_display_name
        profile.save(update_fields=["display_name"])

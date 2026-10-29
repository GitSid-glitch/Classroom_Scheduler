from django.db import models, transaction
from django.core.exceptions import ValidationError
from django.contrib.auth.models import User
from django.db.models import Q
from django.db.models.signals import post_save
from django.dispatch import receiver


class AcademicTerm(models.Model):
    name = models.CharField(max_length=100, unique=True)
    starts_on = models.DateField(null=True, blank=True)
    ends_on = models.DateField(null=True, blank=True)
    is_current = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-is_current", "-starts_on", "name")
        constraints = [
            models.UniqueConstraint(
                fields=("is_current",),
                condition=Q(is_current=True),
                name="one_current_academic_term",
            ),
        ]

    def clean(self):
        if self.starts_on and self.ends_on and self.ends_on < self.starts_on:
            raise ValidationError({"ends_on": "End date must be on or after the start date."})

    def save(self, *args, **kwargs):
        if self.is_current:
            with transaction.atomic():
                type(self).objects.filter(is_current=True).exclude(pk=self.pk).update(is_current=False)
                super().save(*args, **kwargs)
            return
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


def get_current_academic_term():
    term = AcademicTerm.objects.filter(is_current=True).first()
    if term:
        return term
    return AcademicTerm.objects.create(name="Current term", is_current=True)


def get_current_academic_term_id():
    return get_current_academic_term().pk


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
    term = models.ForeignKey(
        AcademicTerm,
        on_delete=models.PROTECT,
        related_name="class_sessions",
        default=get_current_academic_term_id,
    )
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
    term = models.ForeignKey(
        AcademicTerm,
        on_delete=models.PROTECT,
        related_name="schedules",
        default=get_current_academic_term_id,
    )
    name = models.CharField(max_length=100, default="Auto schedule")
    created_at = models.DateTimeField(auto_now_add=True)
    max_value = models.IntegerField(default=0) 
    min_rooms = models.IntegerField(default=0) 
    status = models.CharField(
        max_length=20,
        choices=(
            ("DRAFT", "Draft"),
            ("PENDING_APPROVAL", "Pending approval"),
            ("APPROVED", "Approved"),
            ("REJECTED", "Changes requested"),
            ("PUBLISHED", "Published"),
            ("SUPERSEDED", "Superseded"),
        ),
        default="DRAFT",
    )
    published_at = models.DateTimeField(null=True, blank=True)
    submitted_at = models.DateTimeField(null=True, blank=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    reviewed_by = models.CharField(max_length=150, blank=True, default="")
    approval_note = models.TextField(blank=True, default="")

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=("term",),
                condition=Q(status="PUBLISHED"),
                name="one_published_schedule_per_term",
            ),
        ]

    def __str__(self):
        return f"{self.name} @ {self.created_at}"


class Assignment(models.Model):
    schedule = models.ForeignKey(Schedule, on_delete=models.CASCADE, related_name="assignments")
    class_session = models.ForeignKey(ClassSession, on_delete=models.PROTECT, related_name="assignments")
    room = models.ForeignKey(Room, on_delete=models.PROTECT, related_name="assignments")
    subject_snapshot = models.CharField(max_length=100, blank=True, default="")
    teacher_snapshot = models.CharField(max_length=100, blank=True, default="")
    batch_snapshot = models.CharField(max_length=50, blank=True, default="")
    day_of_week_snapshot = models.CharField(max_length=10, blank=True, default="")
    start_time_snapshot = models.TimeField(null=True, blank=True)
    end_time_snapshot = models.TimeField(null=True, blank=True)
    room_name_snapshot = models.CharField(max_length=100, blank=True, default="")

    class Meta:
        unique_together = ("schedule", "class_session", "room")

    def save(self, *args, **kwargs):
        if self.class_session_id:
            session = self.class_session
            self.subject_snapshot = self.subject_snapshot or session.subject
            self.teacher_snapshot = self.teacher_snapshot or session.teacher
            self.batch_snapshot = self.batch_snapshot or session.batch
            self.day_of_week_snapshot = self.day_of_week_snapshot or session.day_of_week
            self.start_time_snapshot = self.start_time_snapshot or session.start_time
            self.end_time_snapshot = self.end_time_snapshot or session.end_time
        if self.room_id:
            self.room_name_snapshot = self.room_name_snapshot or self.room.name
        super().save(*args, **kwargs)


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
    teacher = models.ForeignKey(Teacher, null=True, blank=True, on_delete=models.SET_NULL, related_name="user_profiles")
    section = models.ForeignKey(Section, null=True, blank=True, on_delete=models.SET_NULL, related_name="user_profiles")

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

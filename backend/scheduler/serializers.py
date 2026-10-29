from rest_framework import serializers
from .models import (
    AuditEvent,
    AcademicTerm,
    Room,
    RoomUnavailableWindow,
    Teacher,
    Section,
    UserProfile,
    ClassSession,
    Schedule,
    Assignment,
)


class RoomUnavailableWindowSerializer(serializers.ModelSerializer):
    class Meta:
        model = RoomUnavailableWindow
        fields = "__all__"


class AcademicTermSerializer(serializers.ModelSerializer):
    class Meta:
        model = AcademicTerm
        fields = ["id", "name", "starts_on", "ends_on", "is_current", "created_at"]
        read_only_fields = ["id", "is_current", "created_at"]

    def validate(self, attrs):
        starts_on = attrs.get("starts_on", getattr(self.instance, "starts_on", None))
        ends_on = attrs.get("ends_on", getattr(self.instance, "ends_on", None))
        if starts_on and ends_on and ends_on < starts_on:
            raise serializers.ValidationError({"ends_on": "End date must be on or after the start date."})
        return attrs


class RoomSerializer(serializers.ModelSerializer):
    unavailable_windows = RoomUnavailableWindowSerializer(many=True, read_only=True)

    class Meta:
        model = Room
        fields = "__all__"


class TeacherSerializer(serializers.ModelSerializer):
    class Meta:
        model = Teacher
        fields = "__all__"


class SectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Section
        fields = "__all__"


class UserProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = UserProfile
        fields = ["username", "display_name", "role"]


class ClassSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClassSession
        fields = "__all__"
        read_only_fields = ["term"]


class AssignmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Assignment
        fields = "__all__"


class ScheduleAssignmentMoveSerializer(serializers.Serializer):
    day_of_week = serializers.ChoiceField(choices=ClassSession._meta.get_field("day_of_week").choices)
    start_time = serializers.TimeField()
    end_time = serializers.TimeField()
    room = serializers.PrimaryKeyRelatedField(queryset=Room.objects.all())

    def validate(self, attrs):
        if attrs["end_time"] <= attrs["start_time"]:
            raise serializers.ValidationError({"end_time": "End time must be after start time."})
        return attrs


class AuditEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditEvent
        fields = "__all__"


class ScheduleSerializer(serializers.ModelSerializer):
    assignments = AssignmentSerializer(many=True, read_only=True)
    unscheduled = serializers.SerializerMethodField()
    scheduled_class_ids = serializers.SerializerMethodField()
    conflicts = serializers.SerializerMethodField()
    explanations = serializers.SerializerMethodField()

    class Meta:
        model = Schedule
        fields = [
            "id",
            "term",
            "name",
            "created_at",
            "max_value",
            "min_rooms",
            "status",
            "published_at",
            "submitted_at",
            "approved_at",
            "reviewed_by",
            "approval_note",
            "assignments",
            "scheduled_class_ids",
            "unscheduled",
            "conflicts",
            "explanations",
        ]
        read_only_fields = [
            "term",
            "status",
            "published_at",
            "submitted_at",
            "approved_at",
            "reviewed_by",
            "approval_note",
        ]

    def get_scheduled_class_ids(self, obj):
        return list(
            obj.assignments.order_by("class_session_id").values_list("class_session_id", flat=True)
        )

    def get_unscheduled(self, obj):
        unscheduled = self.context.get("unscheduled", [])
        return [
            {
                "class_session": item["class"].id,
                "subject": item["class"].subject,
                "teacher": item["class"].teacher,
                "batch": item["class"].batch,
                "day_of_week": item["class"].day_of_week,
                "start_time": item["class"].start_time,
                "end_time": item["class"].end_time,
                "reason": item["reason"],
            }
            for item in unscheduled
        ]

    def get_conflicts(self, obj):
        return self.context.get("conflicts", [])

    def get_explanations(self, obj):
        return self.context.get("explanations", [])

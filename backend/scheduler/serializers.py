from rest_framework import serializers
from .models import (
    Room,
    RoomUnavailableWindow,
    Teacher,
    Section,
    ClassSession,
    Schedule,
    Assignment,
)


class RoomUnavailableWindowSerializer(serializers.ModelSerializer):
    class Meta:
        model = RoomUnavailableWindow
        fields = "__all__"


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


class ClassSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClassSession
        fields = "__all__"


class AssignmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Assignment
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
            "name",
            "created_at",
            "max_value",
            "min_rooms",
            "status",
            "published_at",
            "assignments",
            "scheduled_class_ids",
            "unscheduled",
            "conflicts",
            "explanations",
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

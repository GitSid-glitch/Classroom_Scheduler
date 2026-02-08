from rest_framework import serializers
from .models import Room, ClassSession, Schedule, Assignment


class RoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = Room
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

    class Meta:
        model = Schedule
        fields = ["id", "name", "created_at", "assignments"]

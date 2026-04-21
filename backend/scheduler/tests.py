from datetime import time

from django.core.exceptions import ValidationError
from django.test import TestCase
from django.utils import timezone

from scheduler.models import ClassSession, Room, RoomUnavailableWindow, Schedule
from scheduler.services.assistant_service import (
    explain_unscheduled_session,
    suggest_conflict_resolution,
)
from scheduler.services.analytics_service import build_analytics_snapshot
from scheduler.services.conflict_service import analyze_conflicts
from scheduler.services.scheduler_service import (
    build_schedule_explanations,
    run_heap_scheduler,
    run_optimized_scheduler,
)


class ClassSessionModelTests(TestCase):
    def test_end_time_must_be_after_start_time(self):
        session = ClassSession(
            subject="Physics",
            teacher="Dr. Rao",
            batch="B1",
            day_of_week="MON",
            start_time=time(11, 0),
            end_time=time(10, 0),
            required_capacity=40,
            required_type="ANY",
            value=5,
        )

        with self.assertRaises(ValidationError):
            session.clean()


class SchedulerServiceTests(TestCase):
    def setUp(self):
        self.room = Room.objects.create(
            name="A-101",
            capacity=60,
            room_type="THEORY",
            features="projector,smart board",
        )

    def test_optimized_scheduler_is_day_aware(self):
        monday = ClassSession.objects.create(
            subject="Math",
            teacher="Teacher A",
            batch="B1",
            day_of_week="MON",
            start_time=time(10, 0),
            end_time=time(11, 0),
            required_capacity=30,
            required_type="ANY",
            value=5,
        )
        tuesday = ClassSession.objects.create(
            subject="Physics",
            teacher="Teacher B",
            batch="B2",
            day_of_week="TUE",
            start_time=time(10, 0),
            end_time=time(11, 0),
            required_capacity=30,
            required_type="ANY",
            value=6,
        )

        result = run_optimized_scheduler([monday, tuesday], [self.room])

        scheduled_ids = {assignment["class"].id for assignment in result["assignments"]}
        self.assertEqual(scheduled_ids, {monday.id, tuesday.id})
        self.assertEqual(result["total_value"], 11)
        self.assertEqual(result["unscheduled"], [])

    def test_heap_scheduler_reports_unscheduled_sessions(self):
        oversized = ClassSession.objects.create(
            subject="Robotics Lab",
            teacher="Teacher C",
            batch="B3",
            day_of_week="WED",
            start_time=time(9, 0),
            end_time=time(10, 0),
            required_capacity=100,
            required_type="LAB",
            value=9,
        )

        result = run_heap_scheduler([oversized], [self.room])

        self.assertEqual(result["assignments"], [])
        self.assertEqual(result["total_value"], 0)
        self.assertEqual(len(result["unscheduled"]), 1)
        self.assertEqual(result["unscheduled"][0]["class"].id, oversized.id)

    def test_room_blackout_window_blocks_assignment(self):
        RoomUnavailableWindow.objects.create(
            room=self.room,
            day_of_week="MON",
            start_time=time(9, 0),
            end_time=time(11, 0),
            reason="Maintenance",
        )
        blocked_session = ClassSession.objects.create(
            subject="Chemistry",
            teacher="Teacher D",
            batch="B4",
            day_of_week="MON",
            start_time=time(10, 0),
            end_time=time(10, 45),
            required_capacity=30,
            required_type="ANY",
            value=4,
        )

        result = run_heap_scheduler([blocked_session], [self.room])

        self.assertEqual(result["assignments"], [])
        self.assertEqual(len(result["unscheduled"]), 1)

    def test_teacher_unavailability_prevents_scheduling(self):
        unavailable_session = ClassSession.objects.create(
            subject="Compiler Design",
            teacher="Teacher E",
            batch="B6",
            day_of_week="FRI",
            start_time=time(9, 0),
            end_time=time(10, 0),
            required_capacity=30,
            required_type="ANY",
            value=6,
            teacher_unavailable_days="FRI",
        )

        result = run_heap_scheduler([unavailable_session], [self.room])

        self.assertEqual(result["assignments"], [])
        self.assertEqual(len(result["unscheduled"]), 1)
        self.assertEqual(
            result["unscheduled"][0]["reason"],
            "Teacher is unavailable for this day.",
        )

    def test_locked_session_is_preserved_even_if_dp_would_skip_it(self):
        locked_low_value = ClassSession.objects.create(
            subject="Mentorship",
            teacher="Teacher F",
            batch="B7",
            day_of_week="SAT",
            start_time=time(10, 0),
            end_time=time(11, 0),
            required_capacity=20,
            required_type="ANY",
            value=1,
            is_locked=True,
        )
        high_value_conflict = ClassSession.objects.create(
            subject="Algorithms",
            teacher="Teacher G",
            batch="B8",
            day_of_week="SAT",
            start_time=time(10, 0),
            end_time=time(11, 0),
            required_capacity=20,
            required_type="ANY",
            value=9,
        )

        result = run_optimized_scheduler([locked_low_value, high_value_conflict], [self.room])

        scheduled_ids = {assignment["class"].id for assignment in result["assignments"]}
        self.assertIn(locked_low_value.id, scheduled_ids)

    def test_optional_session_with_teacher_conflict_is_rejected(self):
        locked_session = ClassSession.objects.create(
            subject="Capstone Review",
            teacher="Teacher H",
            batch="B9",
            day_of_week="MON",
            start_time=time(9, 0),
            end_time=time(10, 0),
            required_capacity=20,
            required_type="ANY",
            value=2,
            is_locked=True,
        )
        conflicting_optional = ClassSession.objects.create(
            subject="Advanced DBMS",
            teacher="Teacher H",
            batch="B10",
            day_of_week="MON",
            start_time=time(9, 30),
            end_time=time(10, 30),
            required_capacity=20,
            required_type="ANY",
            value=10,
        )

        result = run_optimized_scheduler([locked_session, conflicting_optional], [self.room])

        scheduled_ids = {assignment["class"].id for assignment in result["assignments"]}
        self.assertIn(locked_session.id, scheduled_ids)
        self.assertNotIn(conflicting_optional.id, scheduled_ids)
        reasons = [item["reason"] for item in result["unscheduled"]]
        self.assertIn(
            "Teacher already has a locked or scheduled overlapping session.",
            reasons,
        )

    def test_optional_session_with_batch_conflict_is_rejected(self):
        locked_session = ClassSession.objects.create(
            subject="Signals",
            teacher="Teacher I",
            batch="B11",
            day_of_week="TUE",
            start_time=time(11, 0),
            end_time=time(12, 0),
            required_capacity=20,
            required_type="ANY",
            value=3,
            is_locked=True,
        )
        conflicting_optional = ClassSession.objects.create(
            subject="Embedded Systems",
            teacher="Teacher J",
            batch="B11",
            day_of_week="TUE",
            start_time=time(11, 30),
            end_time=time(12, 30),
            required_capacity=20,
            required_type="ANY",
            value=9,
        )

        result = run_heap_scheduler([locked_session, conflicting_optional], [self.room])

        scheduled_ids = {assignment["class"].id for assignment in result["assignments"]}
        self.assertIn(locked_session.id, scheduled_ids)
        self.assertNotIn(conflicting_optional.id, scheduled_ids)
        reasons = [item["reason"] for item in result["unscheduled"]]
        self.assertIn(
            "Batch already has a locked or scheduled overlapping session.",
            reasons,
        )

    def test_required_room_features_are_enforced(self):
        requires_lab_equipment = ClassSession.objects.create(
            subject="Vision Lab",
            teacher="Teacher K",
            batch="B12",
            day_of_week="WED",
            start_time=time(14, 0),
            end_time=time(15, 0),
            required_capacity=20,
            required_type="ANY",
            required_features="gpu workstations",
            value=8,
        )

        result = run_heap_scheduler([requires_lab_equipment], [self.room])

        self.assertEqual(result["assignments"], [])
        self.assertEqual(len(result["unscheduled"]), 1)


class ConflictServiceTests(TestCase):
    def test_analyze_conflicts_reports_teacher_and_batch_overlaps(self):
        room = Room.objects.create(name="A-102", capacity=50, room_type="THEORY")
        session_one = ClassSession.objects.create(
            subject="Operating Systems",
            teacher="Dr. Sen",
            batch="B5",
            day_of_week="THU",
            start_time=time(10, 0),
            end_time=time(11, 0),
            required_capacity=45,
            required_type="ANY",
            value=7,
        )
        session_two = ClassSession.objects.create(
            subject="Networks",
            teacher="Dr. Sen",
            batch="B5",
            day_of_week="THU",
            start_time=time(10, 30),
            end_time=time(11, 30),
            required_capacity=45,
            required_type="ANY",
            value=8,
        )

        conflicts = analyze_conflicts([session_one, session_two], [room])

        conflict_types = {conflict["type"] for conflict in conflicts}
        self.assertIn("TEACHER_OVERLAP", conflict_types)
        self.assertIn("BATCH_OVERLAP", conflict_types)


class AssistantServiceTests(TestCase):
    def test_explain_unscheduled_session_returns_reason_and_action_hint(self):
        session = ClassSession.objects.create(
            subject="Cloud Lab",
            teacher="Teacher L",
            batch="B13",
            day_of_week="FRI",
            start_time=time(15, 0),
            end_time=time(16, 0),
            required_capacity=30,
            required_type="ANY",
            value=5,
        )

        explanation = explain_unscheduled_session(
            session,
            [{"class": session, "reason": "No compatible room was available for this time slot."}],
        )

        self.assertEqual(explanation["class_session"], session.id)
        self.assertIn("No compatible room", explanation["explanation"])
        self.assertIn("Add a compatible room", explanation["action_hint"])

    def test_suggest_conflict_resolution_prioritizes_unscheduled_items(self):
        session = ClassSession.objects.create(
            subject="AI Elective",
            teacher="Teacher M",
            batch="B14",
            day_of_week="MON",
            start_time=time(8, 0),
            end_time=time(9, 0),
            required_capacity=30,
            required_type="ANY",
            value=7,
        )

        suggestion = suggest_conflict_resolution(
            {
                "unscheduled": [
                    {
                        "class": session,
                        "reason": "Teacher already has a locked or scheduled overlapping session.",
                    }
                ],
                "conflicts": [],
            }
        )

        self.assertIn("Resolve AI Elective first", suggestion["title"])
        self.assertIn("Reslot", suggestion["suggestion"])

    def test_build_schedule_explanations_creates_summary_items(self):
        session = ClassSession.objects.create(
            subject="Systems Design",
            teacher="Teacher N",
            batch="B15",
            day_of_week="TUE",
            start_time=time(13, 0),
            end_time=time(14, 0),
            required_capacity=20,
            required_type="ANY",
            value=6,
        )

        explanations = build_schedule_explanations(
            assignments=[{"class": session, "room": 1}],
            unscheduled=[],
            conflicts=[],
        )

        explanation_types = {item["type"] for item in explanations}
        self.assertIn("SCHEDULING_SUMMARY", explanation_types)


class AnalyticsServiceTests(TestCase):
    def test_build_analytics_snapshot_returns_quality_and_utilization(self):
        room = Room.objects.create(
            name="Lab-401",
            capacity=40,
            room_type="LAB",
            features="gpu workstations",
        )
        scheduled_session = ClassSession.objects.create(
            subject="Deep Learning Lab",
            teacher="Teacher O",
            batch="B16",
            day_of_week="WED",
            start_time=time(10, 0),
            end_time=time(12, 0),
            required_capacity=35,
            required_type="LAB",
            required_features="gpu workstations",
            value=10,
        )
        unscheduled_session = ClassSession.objects.create(
            subject="Graphics Lab",
            teacher="Teacher P",
            batch="B17",
            day_of_week="WED",
            start_time=time(10, 0),
            end_time=time(11, 0),
            required_capacity=45,
            required_type="LAB",
            value=7,
        )

        schedule_result = {
            "assignments": [{"class": scheduled_session, "room": room.id}],
            "unscheduled": [{"class": unscheduled_session, "reason": "No compatible room was available for this time slot."}],
        }

        analytics = build_analytics_snapshot(
            [scheduled_session, unscheduled_session],
            [room],
            schedule_result,
        )

        self.assertEqual(analytics["quality"]["scheduled_count"], 1)
        self.assertEqual(analytics["quality"]["unscheduled_count"], 1)
        self.assertEqual(analytics["room_utilization"][0]["room_name"], "Lab-401")
        self.assertEqual(analytics["teacher_load"][0]["teacher"], "Teacher O")


class ScheduleWorkflowTests(TestCase):
    def test_schedule_can_be_marked_published(self):
        schedule = Schedule.objects.create(
            name="Semester Draft",
            max_value=10,
            min_rooms=2,
        )

        schedule.status = "PUBLISHED"
        schedule.published_at = timezone.now()
        schedule.save()
        schedule.refresh_from_db()

        self.assertEqual(schedule.status, "PUBLISHED")
        self.assertIsNotNone(schedule.published_at)

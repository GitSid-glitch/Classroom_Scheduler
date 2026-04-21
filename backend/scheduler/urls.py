from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    AuthLoginView,
    HealthCheckView,
    RoomViewSet,
    TeacherViewSet,
    SectionViewSet,
    ClassSessionViewSet,
    ScheduleViewSet,
)

router = DefaultRouter()
router.register(r"rooms", RoomViewSet, basename="room")
router.register(r"teachers", TeacherViewSet, basename="teacher")
router.register(r"sections", SectionViewSet, basename="section")
router.register(r"classes", ClassSessionViewSet, basename="classsession")
router.register(r"schedules", ScheduleViewSet, basename="schedule")

urlpatterns = [
    path("health/", HealthCheckView.as_view(), name="health-check"),
    path("auth/login/", AuthLoginView.as_view(), name="auth-login"),
    path("", include(router.urls)),
]

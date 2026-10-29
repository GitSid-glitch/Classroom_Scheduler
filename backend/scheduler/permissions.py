import hmac

from django.conf import settings
from rest_framework.permissions import BasePermission


class HasSchedulerServiceToken(BasePermission):
    """Allow data APIs only to the trusted Next.js server layer."""

    def has_permission(self, request, view):
        expected = settings.BACKEND_SERVICE_TOKEN
        supplied = request.headers.get("X-Scheduler-Service-Token", "")
        return bool(expected and supplied and hmac.compare_digest(supplied, expected))

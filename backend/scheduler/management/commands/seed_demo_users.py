from django.contrib.auth.models import User
from django.core.management.base import BaseCommand

from scheduler.models import UserProfile


DEMO_USERS = [
    {
        "username": "admin",
        "password": "scheduler123",
        "first_name": "Aarav",
        "last_name": "Admin",
        "role": UserProfile.ROLE_ADMIN,
        "is_staff": True,
        "is_superuser": True,
    },
    {
        "username": "coordinator",
        "password": "scheduler123",
        "first_name": "Cora",
        "last_name": "Coordinator",
        "role": UserProfile.ROLE_COORDINATOR,
        "is_staff": False,
        "is_superuser": False,
    },
    {
        "username": "faculty",
        "password": "scheduler123",
        "first_name": "Farah",
        "last_name": "Faculty",
        "role": UserProfile.ROLE_FACULTY,
        "is_staff": False,
        "is_superuser": False,
    },
    {
        "username": "student",
        "password": "scheduler123",
        "first_name": "Sia",
        "last_name": "Student",
        "role": UserProfile.ROLE_STUDENT,
        "is_staff": False,
        "is_superuser": False,
    },
]


class Command(BaseCommand):
    help = "Create or update demo users for testing role-based access in the scheduler."

    def handle(self, *args, **options):
        for entry in DEMO_USERS:
            user, created = User.objects.get_or_create(
                username=entry["username"],
                defaults={
                    "first_name": entry["first_name"],
                    "last_name": entry["last_name"],
                    "is_staff": entry["is_staff"],
                    "is_superuser": entry["is_superuser"],
                },
            )

            if not created:
                user.first_name = entry["first_name"]
                user.last_name = entry["last_name"]
                user.is_staff = entry["is_staff"]
                user.is_superuser = entry["is_superuser"]

            user.set_password(entry["password"])
            user.save()

            profile = user.scheduler_profile
            profile.role = entry["role"]
            profile.display_name = f"{entry['first_name']} {entry['last_name']}"
            profile.save(update_fields=["role", "display_name"])

            self.stdout.write(
                self.style.SUCCESS(
                    f"Prepared {entry['username']} ({entry['role']}) with password {entry['password']}"
                )
            )

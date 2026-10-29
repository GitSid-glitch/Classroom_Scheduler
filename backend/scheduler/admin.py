from django.contrib import admin
from .models import Section, Teacher, UserProfile


@admin.register(Teacher)
class TeacherAdmin(admin.ModelAdmin):
    search_fields = ("name", "department")


@admin.register(Section)
class SectionAdmin(admin.ModelAdmin):
    search_fields = ("name", "program")


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ("display_name", "user", "role", "teacher", "section")
    list_filter = ("role",)
    search_fields = ("display_name", "user__username", "teacher__name", "section__name")
    autocomplete_fields = ("teacher", "section")

from django.contrib import admin
from .models import User, UniversityStudent


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ['username', 'full_name_ar', 'email', 'role', 'is_active']
    list_filter = ['role', 'is_active']
    search_fields = ['username', 'full_name_ar', 'email']
    ordering = ['username']


@admin.register(UniversityStudent)
class UniversityStudentAdmin(admin.ModelAdmin):
    list_display = ['university_number', 'full_name', 'department', 'year', 'is_registered']
    list_filter = ['department', 'year', 'is_registered']
    search_fields = ['university_number', 'full_name']
    ordering = ['university_number']

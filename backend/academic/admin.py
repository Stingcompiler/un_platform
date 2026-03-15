from django.contrib import admin
from .models import (
    Department, Course, CourseInstructor,
    Lecture, Assignment, Submission, CourseResult
)


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ['name_ar', 'name', 'department_manager', 'is_deleted']
    list_filter = ['is_deleted']
    search_fields = ['name', 'name_ar']


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ['code', 'name_ar', 'department', 'academic_year', 'semester', 'is_deleted']
    list_filter = ['department', 'academic_year', 'semester', 'is_deleted']
    search_fields = ['code', 'name', 'name_ar']


@admin.register(CourseInstructor)
class CourseInstructorAdmin(admin.ModelAdmin):
    list_display = ['user', 'course', 'role', 'assigned_at']
    list_filter = ['role', 'course__department']
    search_fields = ['user__username', 'user__full_name_ar', 'course__name']


@admin.register(Lecture)
class LectureAdmin(admin.ModelAdmin):
    list_display = ['title', 'course', 'lecture_type', 'order', 'created_by']
    list_filter = ['lecture_type', 'course__department']
    search_fields = ['title', 'title_ar', 'course__name']


@admin.register(Assignment)
class AssignmentAdmin(admin.ModelAdmin):
    list_display = ['title', 'course', 'assignment_type', 'due_date', 'max_grade']
    list_filter = ['assignment_type', 'course__department']
    search_fields = ['title', 'title_ar', 'course__name']


@admin.register(Submission)
class SubmissionAdmin(admin.ModelAdmin):
    list_display = ['student', 'assignment', 'submitted_at', 'grade', 'graded_by']
    list_filter = ['assignment__course__department', 'graded_by']
    search_fields = ['student__username', 'student__full_name_ar']


@admin.register(CourseResult)
class CourseResultAdmin(admin.ModelAdmin):
    list_display = ['student', 'course', 'total_grade', 'letter_grade', 'passed', 'is_published']
    list_filter = ['course__department', 'letter_grade', 'passed', 'is_published']
    search_fields = ['student__username', 'student__full_name_ar', 'course__name']

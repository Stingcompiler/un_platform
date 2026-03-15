from rest_framework import serializers
from .models import (
    Department, Course, CourseInstructor, 
    Lecture, Assignment, Submission, CourseResult
)
from django.contrib.auth import get_user_model

User = get_user_model()


class DepartmentManagerSerializer(serializers.ModelSerializer):
    """Minimal serializer for department manager info"""
    class Meta:
        model = User
        fields = ['id', 'username', 'full_name_ar', 'email']


class DepartmentSerializer(serializers.ModelSerializer):
    """Serializer for Department"""
    department_manager_name = serializers.CharField(source='department_manager.full_name_ar', read_only=True)
    department_manager_details = DepartmentManagerSerializer(source='department_manager', read_only=True)
    supervisor_details = DepartmentManagerSerializer(source='supervisor', read_only=True)
    course_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Department
        fields = ['id', 'name', 'name_ar', 'description', 'description_ar', 
                  'department_manager', 'department_manager_name', 'department_manager_details',
                  'supervisor', 'supervisor_details',
                  'course_count', 'created_at']
        read_only_fields = ['id', 'created_at']
    
    def get_course_count(self, obj):
        return obj.courses.filter(is_deleted=False).count()


class DepartmentListSerializer(serializers.ModelSerializer):
    """Simplified serializer for listing departments"""
    department_manager_details = DepartmentManagerSerializer(source='department_manager', read_only=True)
    supervisor_details = DepartmentManagerSerializer(source='supervisor', read_only=True)
    
    class Meta:
        model = Department
        fields = ['id', 'name', 'name_ar', 'description', 'description_ar',
                  'department_manager', 'department_manager_details',
                  'supervisor', 'supervisor_details']


class CourseSerializer(serializers.ModelSerializer):
    """Serializer for Course"""
    department_name = serializers.CharField(source='department.name_ar', read_only=True)
    instructors = serializers.SerializerMethodField()
    
    class Meta:
        model = Course
        fields = ['id', 'name', 'name_ar', 'code', 'description', 'description_ar',
                  'department', 'department_name', 'academic_year', 'semester',
                  'credit_hours', 'instructors', 'created_at']
        read_only_fields = ['id', 'created_at']
    
    def get_instructors(self, obj):
        instructors = obj.instructors.all()
        return [{
            'id': i.id,
            'user_id': i.user.id,
            'name': i.user.full_name_ar or i.user.username,
            'role': i.role,
            'role_display': i.get_role_display()
        } for i in instructors]


class CourseListSerializer(serializers.ModelSerializer):
    """Simplified serializer for listing courses"""
    class Meta:
        model = Course
        fields = ['id', 'name', 'name_ar', 'code', 'academic_year', 'semester']


class CourseInstructorSerializer(serializers.ModelSerializer):
    """Serializer for CourseInstructor"""
    user_name = serializers.CharField(source='user.full_name_ar', read_only=True)
    course_name = serializers.CharField(source='course.name_ar', read_only=True)
    
    class Meta:
        model = CourseInstructor
        fields = ['id', 'user', 'user_name', 'course', 'course_name', 'role', 'assigned_at']
        read_only_fields = ['id', 'assigned_at']
    
    def validate(self, data):
        user = data.get('user')
        course = data.get('course')
        
        # Check if user is a teacher or TA
        if user and user.role not in ['teacher', 'ta']:
            raise serializers.ValidationError({
                'user': 'يمكن تعيين المدرسين والمعيدين فقط'
            })
        
        # Check for duplicate assignment
        if user and course:
            existing = CourseInstructor.objects.filter(user=user, course=course)
            if self.instance:
                existing = existing.exclude(pk=self.instance.pk)
            if existing.exists():
                raise serializers.ValidationError({
                    'non_field_errors': ['هذا المدرس معين بالفعل لهذه المادة']
                })
        
        return data


class LectureSerializer(serializers.ModelSerializer):
    """Serializer for Lecture"""
    course_name = serializers.CharField(source='course.name_ar', read_only=True)
    created_by_name = serializers.CharField(source='created_by.full_name_ar', read_only=True)

    # Write-only field: accepts a video file; the view uploads it to Bunny Stream 
    # and stores the resulting video_id/url on the model.
    video_file = serializers.FileField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = Lecture
        fields = [
            'id', 'course', 'course_name', 'title', 'title_ar', 'content',
            'lecture_type', 'order',
            # File attachment (PDF/docs)
            'file',
            # Bunny Stream video (read-only output)
            'bunny_video_id', 'bunny_video_url',
            # Write-only video upload field
            'video_file',
            # External/legacy URL fields
            'video_url', 'reference_url',
            'created_by', 'created_by_name', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at', 'bunny_video_id', 'bunny_video_url']


class AssignmentSerializer(serializers.ModelSerializer):
    """Serializer for Assignment"""
    course_name = serializers.CharField(source='course.name_ar', read_only=True)
    created_by_name = serializers.CharField(source='created_by.full_name_ar', read_only=True)
    submission_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Assignment
        fields = ['id', 'course', 'course_name', 'title', 'title_ar', 'description',
                  'assignment_type', 'due_date', 'max_grade', 'file', 
                  'created_by', 'created_by_name', 'submission_count',
                  'created_at', 'updated_at']
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']
    
    def get_submission_count(self, obj):
        return obj.submissions.count()


class SubmissionSerializer(serializers.ModelSerializer):
    """Serializer for Submission"""
    student_name = serializers.CharField(source='student.full_name_ar', read_only=True)
    assignment_title = serializers.CharField(source='assignment.title_ar', read_only=True)
    graded_by_name = serializers.CharField(source='graded_by.full_name_ar', read_only=True)
    
    class Meta:
        model = Submission
        fields = ['id', 'assignment', 'assignment_title', 'student', 'student_name',
                  'content', 'file', 'submitted_at', 'grade', 'feedback',
                  'graded_by', 'graded_by_name', 'graded_at']
        read_only_fields = ['id', 'student', 'submitted_at', 'graded_by', 'graded_at']


class SubmissionGradeSerializer(serializers.ModelSerializer):
    """Serializer for grading a submission"""
    class Meta:
        model = Submission
        fields = ['grade', 'feedback']


class CourseResultSerializer(serializers.ModelSerializer):
    """Serializer for CourseResult"""
    student_name = serializers.CharField(source='student.full_name_ar', read_only=True)
    course_name = serializers.CharField(source='course.name_ar', read_only=True)
    published_by_name = serializers.CharField(source='published_by.full_name_ar', read_only=True)
    
    class Meta:
        model = CourseResult
        fields = ['id', 'student', 'student_name', 'course', 'course_name',
                  'total_grade', 'letter_grade', 'passed', 'is_published',
                  'published_by', 'published_by_name', 'published_at',
                  'created_at', 'updated_at']
        read_only_fields = ['id', 'published_by', 'published_at', 'created_at', 'updated_at']

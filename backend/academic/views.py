from rest_framework import viewsets, status, permissions
from accounts.utils import log_activity
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.utils import timezone
from django.db.models import Q
from bunny import stream as bunny_stream

from .models import (
    Department, Course, CourseInstructor,
    Lecture, Assignment, Submission, CourseResult
)
from .serializers import (
    DepartmentSerializer, DepartmentListSerializer,
    CourseSerializer, CourseListSerializer,
    CourseInstructorSerializer, LectureSerializer,
    AssignmentSerializer, SubmissionSerializer,
    SubmissionGradeSerializer, CourseResultSerializer
)


class IsSystemManager(permissions.BasePermission):
    """Permission for System Manager only"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'system_manager'


class IsDepartmentManager(permissions.BasePermission):
    """Permission for Department Manager (includes system_manager)"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['system_manager', 'department_manager']


class IsDepartmentLevel(permissions.BasePermission):
    """Permission for Department Manager and Supervisor (supervisor cannot delete)"""
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.user.role in ['system_manager', 'department_manager']:
            return True
        if request.user.role == 'supervisor':
            # Supervisors can do everything except delete
            return view.action != 'destroy'
        return False


class IsTeacherOrTA(permissions.BasePermission):
    """Permission for Teachers, TAs, and above (includes supervisor, dept manager, system manager)"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in [
            'system_manager', 'department_manager', 'supervisor', 'teacher', 'ta'
        ]


class IsTeacherOnly(permissions.BasePermission):
    """Permission for Teachers and above only (excludes Teaching Assistants)"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in [
            'system_manager', 'department_manager', 'supervisor', 'teacher'
        ]


class IsManagerOnly(permissions.BasePermission):
    """Delete-level permission: system_manager and department_manager only"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in [
            'system_manager', 'department_manager'
        ]

def get_user_department(user):
    """Get the department a user belongs to (as manager or supervisor)"""
    if user.role == 'department_manager':
        return getattr(user, 'managed_department', None)
    elif user.role == 'supervisor':
        return Department.objects.filter(supervisor=user, is_deleted=False).first()
    return None


class DepartmentViewSet(viewsets.ModelViewSet):
    """ViewSet for Department management"""
    queryset = Department.objects.filter(is_deleted=False)
    
    def get_serializer_class(self):
        if self.action == 'list':
            return DepartmentListSerializer
        return DepartmentSerializer
    
    def get_permissions(self):
        if self.action in ['create', 'destroy']:
            return [IsSystemManager()]
        if self.action in ['update', 'partial_update']:
            # System manager and department manager can update
            return [IsDepartmentManager()]
        return [permissions.AllowAny()]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        if user.is_authenticated:
            # Department manager can only see their own department
            if user.role == 'department_manager':
                queryset = queryset.filter(department_manager=user)
            # Supervisor can only see their department
            elif user.role == 'supervisor':
                queryset = queryset.filter(supervisor=user)
        return queryset
    
    def perform_update(self, serializer):
        user = self.request.user
        instance = self.get_object()
        # Department manager can only update their own department
        if user.role == 'department_manager':
            managed = getattr(user, 'managed_department', None)
            if not managed or managed.id != instance.id:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied('يمكنك تعديل قسمك فقط')
            # Dept manager cannot change department_manager field
            if 'department_manager' in serializer.validated_data:
                del serializer.validated_data['department_manager']
        serializer.save()
    
    def perform_destroy(self, instance):
        # Soft delete
        instance.is_deleted = True
        instance.save()


class CourseViewSet(viewsets.ModelViewSet):
    """ViewSet for Course management"""
    queryset = Course.objects.filter(is_deleted=False).prefetch_related('instructors__user')
    serializer_class = CourseSerializer
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsDepartmentLevel()]
        return [permissions.IsAuthenticated()]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        
        # Filter by department
        department = self.request.query_params.get('department')
        if department:
            queryset = queryset.filter(department_id=department)
        
        # Filter by year
        year = self.request.query_params.get('year')
        if year:
            queryset = queryset.filter(academic_year=year)
        
        # Department manager can only see their department's courses
        if user.role == 'department_manager':
            dept = get_user_department(user)
            if dept:
                queryset = queryset.filter(department=dept)
            else:
                queryset = queryset.none()
        # Supervisor can only see their department's courses
        elif user.role == 'supervisor':
            dept = get_user_department(user)
            if dept:
                queryset = queryset.filter(department=dept)
            else:
                queryset = queryset.none()
        # Teachers and TAs can only see courses they are assigned to
        elif user.role in ['teacher', 'ta']:
            assigned_course_ids = CourseInstructor.objects.filter(user=user).values_list('course_id', flat=True)
            queryset = queryset.filter(id__in=assigned_course_ids)
        # Students can only see courses for their department and year
        elif user.role == 'student' and user.university_student:
            queryset = queryset.filter(
                department_id=user.university_student.department_id,
                academic_year=user.university_student.year
            )
        
        return queryset
    
    def perform_create(self, serializer):
        instance = serializer.save()
        log_activity(self.request.user, 'create', 'مادة', instance.name_ar, department=instance.department)
    
    def perform_update(self, serializer):
        instance = serializer.save()
        log_activity(self.request.user, 'update', 'مادة', instance.name_ar, department=instance.department)
    
    def perform_destroy(self, instance):
        instance.is_deleted = True
        instance.save()
        log_activity(self.request.user, 'delete', 'مادة', instance.name_ar, department=instance.department)


class CourseInstructorViewSet(viewsets.ModelViewSet):
    """ViewSet for Course Instructor assignments"""
    queryset = CourseInstructor.objects.all()
    serializer_class = CourseInstructorSerializer
    
    def get_permissions(self):
        # Allow department managers, supervisors, and system managers
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsDepartmentLevel()]
        return [permissions.IsAuthenticated()]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        
        # Department managers and supervisors only see instructors for their department's courses
        if user.role in ['department_manager', 'supervisor']:
            dept = get_user_department(user)
            if dept:
                queryset = queryset.filter(course__department=dept)
            else:
                queryset = queryset.none()
        
        course = self.request.query_params.get('course')
        if course:
            queryset = queryset.filter(course_id=course)
        
        instructor_user = self.request.query_params.get('user')
        if instructor_user:
            queryset = queryset.filter(user_id=instructor_user)
        
        return queryset
    
    def perform_create(self, serializer):
        user = self.request.user
        course = serializer.validated_data.get('course')
        
        # Validate department manager/supervisor can only assign to their department's courses
        if user.role in ['department_manager', 'supervisor']:
            dept = get_user_department(user)
            if not dept or course.department != dept:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("لا يمكنك تعيين مدرسين لمواد خارج قسمك")
        
        instance = serializer.save()
        log_activity(user, 'create', 'تعيين مدرس', f'{instance.user} → {instance.course}', department=instance.course.department)

class LectureViewSet(viewsets.ModelViewSet):
    """ViewSet for Lecture management"""
    queryset = Lecture.objects.all()
    serializer_class = LectureSerializer
    
    def get_permissions(self):
        if self.action == 'destroy':
            return [IsManagerOnly()]
        if self.action in ['create', 'update', 'partial_update']:
            return [IsTeacherOrTA()]
        return [permissions.IsAuthenticated()]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        
        # Supervisor sees only their department's lectures
        if user.role == 'supervisor':
            dept = get_user_department(user)
            if dept:
                queryset = queryset.filter(course__department=dept)
            else:
                queryset = queryset.none()
        
        course = self.request.query_params.get('course')
        if course:
            queryset = queryset.filter(course_id=course)
        
        lecture_type = self.request.query_params.get('type')
        if lecture_type:
            queryset = queryset.filter(lecture_type=lecture_type)
        
        return queryset
    
    # ❌ تم حذف دالة _handle_bunny_video بالكامل

    def perform_create(self, serializer):
        # حفظ مباشر.. جانغو سيتكفل برفع الفيديو إلى Bunny Storage عبر storage.py
        instance = serializer.save(created_by=self.request.user)
        log_activity(self.request.user, 'create', 'محاضرة', instance.title, department=instance.course.department)

    def perform_update(self, serializer):
        # تحديث مباشر وبسيط
        instance = serializer.save()
        log_activity(self.request.user, 'update', 'محاضرة', instance.title, department=instance.course.department)

    def perform_destroy(self, instance):
        # ❌ تم حذف كود حذف الفيديو من Bunny Stream
        # ملاحظة: سيتم حذف السجل من قاعدة البيانات. 
        # (يفضل دائماً ترك الفيديوهات في Storage كأرشيف أو استخدام مكتبات مثل django-cleanup لحذف الملفات التلقائي لاحقاً)
        log_activity(self.request.user, 'delete', 'محاضرة', instance.title, department=instance.course.department)
        instance.delete()


class AssignmentViewSet(viewsets.ModelViewSet):
    """ViewSet for Assignment management"""
    queryset = Assignment.objects.all()
    serializer_class = AssignmentSerializer
    
    def get_permissions(self):
        if self.action == 'destroy':
            return [IsManagerOnly()]
        if self.action in ['create', 'update', 'partial_update']:
            return [IsTeacherOrTA()]
        return [permissions.IsAuthenticated()]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        
        # Supervisor sees only their department's assignments
        if user.role == 'supervisor':
            dept = get_user_department(user)
            if dept:
                queryset = queryset.filter(course__department=dept)
            else:
                queryset = queryset.none()
        
        course = self.request.query_params.get('course')
        if course:
            queryset = queryset.filter(course_id=course)
        
        assignment_type = self.request.query_params.get('type')
        if assignment_type:
            queryset = queryset.filter(assignment_type=assignment_type)
        
        return queryset
    
    def perform_create(self, serializer):
        instance = serializer.save(created_by=self.request.user)
        log_activity(self.request.user, 'create', 'واجب', instance.title, department=instance.course.department)
    
    def perform_update(self, serializer):
        instance = serializer.save()
        log_activity(self.request.user, 'update', 'واجب', instance.title, department=instance.course.department)
    
    def perform_destroy(self, instance):
        log_activity(self.request.user, 'delete', 'واجب', instance.title, department=instance.course.department)
        instance.delete()


class SubmissionViewSet(viewsets.ModelViewSet):
    """ViewSet for Submission management"""
    queryset = Submission.objects.all()
    serializer_class = SubmissionSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    
    def get_permissions(self):
        if self.action == 'destroy':
            return [IsManagerOnly()]
        return [permissions.IsAuthenticated()]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        
        # Students can only see their own submissions
        if user.role == 'student':
            queryset = queryset.filter(student=user)
        # Supervisor sees only their department's submissions
        elif user.role == 'supervisor':
            dept = get_user_department(user)
            if dept:
                queryset = queryset.filter(assignment__course__department=dept)
            else:
                queryset = queryset.none()
        
        assignment = self.request.query_params.get('assignment')
        if assignment:
            queryset = queryset.filter(assignment_id=assignment)
        
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(student=self.request.user)
    
    @action(detail=True, methods=['patch'], permission_classes=[IsTeacherOnly])
    def grade(self, request, pk=None):
        """Grade a submission — Teachers and above only (TAs cannot grade)"""
        submission = self.get_object()
        serializer = SubmissionGradeSerializer(submission, data=request.data, partial=True)
        
        if serializer.is_valid():
            serializer.save(graded_by=request.user, graded_at=timezone.now())
            log_activity(request.user, 'grade', 'تسليم', f'{submission.assignment.title} - {submission.student}', department=submission.assignment.course.department)
            return Response(SubmissionSerializer(submission).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CourseResultViewSet(viewsets.ModelViewSet):
    """ViewSet for Course Result management"""
    queryset = CourseResult.objects.all()
    serializer_class = CourseResultSerializer
    
    def get_permissions(self):
        if self.action == 'destroy':
            return [IsManagerOnly()]
        if self.action in ['create', 'update', 'partial_update', 'publish']:
            return [IsTeacherOrTA()]
        return [permissions.IsAuthenticated()]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        
        # Students can only see published results for themselves
        if user.role == 'student':
            queryset = queryset.filter(student=user, is_published=True)
        # Supervisor sees only their department's results
        elif user.role == 'supervisor':
            dept = get_user_department(user)
            if dept:
                queryset = queryset.filter(course__department=dept)
            else:
                queryset = queryset.none()
        
        course = self.request.query_params.get('course')
        if course:
            queryset = queryset.filter(course_id=course)
        
        return queryset
    
    @action(detail=True, methods=['post'])
    def publish(self, request, pk=None):
        """Publish a course result (Teachers only)"""
        if request.user.role not in ['system_manager', 'department_manager', 'supervisor', 'teacher']:
            return Response(
                {'error': 'فقط المدرسين يمكنهم نشر النتائج'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        result = self.get_object()
        result.is_published = True
        result.published_by = request.user
        result.published_at = timezone.now()
        result.save()
        
        log_activity(request.user, 'publish', 'نتيجة', f'{result.course} - {result.student}', department=result.course.department)
        return Response(CourseResultSerializer(result).data)


from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from public.models import ContactMessage, Event

User = get_user_model()


class DashboardStatsView(APIView):
    """Return dashboard statistics based on user role"""
    
    def get(self, request):
        user = request.user
        stats = {}
        
        if user.role == 'system_manager' or user.is_superuser:
            # System manager stats
            stats = {
                'departments': Department.objects.filter(is_deleted=False).count(),
                'courses': Course.objects.filter(is_deleted=False).count(),
                'students': User.objects.filter(role='student').count(),
                'staff': User.objects.exclude(role='student').count(),
                'events': Event.objects.filter(is_published=True).count(),
                'messages': ContactMessage.objects.count(),
                'unread_messages': ContactMessage.objects.filter(is_read=False).count(),
            }
        elif user.role in ['department_manager', 'supervisor']:
            # Department manager / supervisor stats — scoped to their department
            dept = get_user_department(user)
            if dept:
                dept_courses = Course.objects.filter(is_deleted=False, department=dept)
                dept_course_ids = dept_courses.values_list('id', flat=True)
                stats = {
                    'courses': dept_courses.count(),
                    'instructors': CourseInstructor.objects.filter(course_id__in=dept_course_ids).values('user').distinct().count(),
                    'assignments': Assignment.objects.filter(course_id__in=dept_course_ids).count(),
                    'pending_submissions': Submission.objects.filter(assignment__course_id__in=dept_course_ids, grade__isnull=True).count(),
                }
            else:
                stats = {'courses': 0, 'instructors': 0, 'assignments': 0, 'pending_submissions': 0}
        elif user.role in ['teacher', 'ta']:
            # Teacher/TA stats
            my_courses = CourseInstructor.objects.filter(user=user).values_list('course_id', flat=True)
            stats = {
                'courses': len(my_courses),
                'assignments': Assignment.objects.filter(course_id__in=my_courses).count(),
                'pending_grading': Submission.objects.filter(
                    assignment__course_id__in=my_courses,
                    grade__isnull=True
                ).count(),
                'lectures': Lecture.objects.filter(course_id__in=my_courses).count(),
            }
        elif user.role == 'student':
            # Student stats
            if user.university_student:
                dept_id = user.university_student.department_id
                year = user.university_student.year
                stats = {
                    'enrolled_courses': Course.objects.filter(
                        department_id=dept_id,
                        academic_year=year,
                        is_deleted=False
                    ).count(),
                    'pending_assignments': 0,  # Would need enrollment tracking
                    'completed_results': CourseResult.objects.filter(
                        student=user,
                        is_published=True
                    ).count(),
                    'credit_hours': 0,  # Would sum from courses
                }
            else:
                stats = {'enrolled_courses': 0, 'pending_assignments': 0, 'completed_results': 0}
        
        return Response(stats)


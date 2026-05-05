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
        
        # Department manager sees only their department's lectures
        if user.role == 'department_manager':
            dept = get_user_department(user)
            if dept:
                queryset = queryset.filter(course__department=dept)
            else:
                queryset = queryset.none()
        # Supervisor sees only their department's lectures
        elif user.role == 'supervisor':
            dept = get_user_department(user)
            if dept:
                queryset = queryset.filter(course__department=dept)
            else:
                queryset = queryset.none()
        # Teachers and TAs see only lectures for their assigned courses
        elif user.role in ['teacher', 'ta']:
            assigned_course_ids = CourseInstructor.objects.filter(
                user=user
            ).values_list('course_id', flat=True)
            queryset = queryset.filter(course_id__in=assigned_course_ids)
        # Students see only lectures for their department and year courses
        elif user.role == 'student' and hasattr(user, 'university_student') and user.university_student:
            queryset = queryset.filter(
                course__department_id=user.university_student.department_id,
                course__academic_year=user.university_student.year
            )
        
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


class LectureStatsView(APIView):
    """Return lecture statistics scoped by user role"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        from django.db.models import Count
        from django.db.models.functions import TruncDate
        from django.utils import timezone
        import datetime

        # Determine scope
        if user.role == 'system_manager' or user.is_superuser:
            lectures_qs = Lecture.objects.all()
            courses_qs = Course.objects.filter(is_deleted=False)
        elif user.role in ['department_manager', 'supervisor']:
            dept = get_user_department(user)
            if dept:
                courses_qs = Course.objects.filter(is_deleted=False, department=dept)
                lectures_qs = Lecture.objects.filter(course__department=dept)
            else:
                return Response({'error': 'لا يوجد قسم مرتبط'}, status=403)
        elif user.role in ['teacher', 'ta']:
            assigned = CourseInstructor.objects.filter(user=user).values_list('course_id', flat=True)
            courses_qs = Course.objects.filter(is_deleted=False, id__in=assigned)
            lectures_qs = Lecture.objects.filter(course_id__in=assigned)
        else:
            return Response({'error': 'غير مصرح'}, status=403)

        total_lectures = lectures_qs.count()
        total_files = lectures_qs.exclude(file=None).exclude(file='').count()
        total_videos = lectures_qs.filter(video_file__isnull=False).exclude(video_file='').count() + \
                       lectures_qs.filter(video_url__isnull=False).exclude(video_url='').count()
        courses_with_lectures = lectures_qs.values('course').distinct().count()
        total_courses = courses_qs.count()

        # Recent uploads (last 7 days)
        seven_days_ago = timezone.now() - datetime.timedelta(days=7)
        recent_uploads = lectures_qs.filter(created_at__gte=seven_days_ago).count()

        # Upload trends by day (last 30 days)
        thirty_days_ago = timezone.now() - datetime.timedelta(days=30)
        trends = (
            lectures_qs
            .filter(created_at__gte=thirty_days_ago)
            .annotate(date=TruncDate('created_at'))
            .values('date')
            .annotate(count=Count('id'))
            .order_by('date')
        )
        upload_trends = [
            {'date': str(t['date']), 'count': t['count']}
            for t in trends
        ]

        # Last upload
        last_lecture = lectures_qs.order_by('-created_at').first()
        last_upload = str(last_lecture.created_at.date()) if last_lecture else None

        # Theory vs Lab
        theory_count = lectures_qs.filter(lecture_type='theory').count()
        lab_count = lectures_qs.filter(lecture_type='lab').count()

        return Response({
            'total_lectures': total_lectures,
            'total_files': total_files,
            'total_videos': total_videos,
            'courses_with_lectures': courses_with_lectures,
            'total_courses': total_courses,
            'courses_without_lectures': total_courses - courses_with_lectures,
            'recent_uploads': recent_uploads,
            'last_upload': last_upload,
            'theory_count': theory_count,
            'lab_count': lab_count,
            'upload_trends': upload_trends,
        })


class DepartmentReportView(APIView):
    """Full department analytics for Reports page — dept manager & supervisor only"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        from django.db.models import Count, Q
        from django.db.models.functions import TruncDate
        from django.utils import timezone
        import datetime
        from accounts.models import UniversityStudent

        if user.role not in ['department_manager', 'supervisor', 'system_manager']:
            return Response({'error': 'غير مصرح'}, status=403)

        # Determine department scope
        if user.role == 'system_manager' or user.is_superuser:
            dept_id = request.query_params.get('department')
            if dept_id:
                try:
                    dept = Department.objects.get(id=dept_id, is_deleted=False)
                except Department.DoesNotExist:
                    return Response({'error': 'القسم غير موجود'}, status=404)
            else:
                # Return all-dept summary for system manager
                dept = None
        else:
            dept = get_user_department(user)
            if not dept:
                return Response({'error': 'لا يوجد قسم مرتبط'}, status=403)

        if dept:
            courses_qs = Course.objects.filter(is_deleted=False, department=dept)
            lectures_qs = Lecture.objects.filter(course__department=dept)
            students_qs = UniversityStudent.objects.filter(department=dept)
        else:
            courses_qs = Course.objects.filter(is_deleted=False)
            lectures_qs = Lecture.objects.all()
            students_qs = UniversityStudent.objects.all()

        # --- Course Statistics ---
        total_courses = courses_qs.count()
        course_ids = courses_qs.values_list('id', flat=True)

        # --- Lecture Statistics ---
        total_lectures = lectures_qs.count()
        total_files = lectures_qs.exclude(file=None).exclude(file='').count()
        thirty_days_ago = timezone.now() - datetime.timedelta(days=30)
        seven_days_ago = timezone.now() - datetime.timedelta(days=7)
        recent_7d = lectures_qs.filter(created_at__gte=seven_days_ago).count()
        recent_30d = lectures_qs.filter(created_at__gte=thirty_days_ago).count()

        # Courses with / without lectures
        courses_with_lec_ids = lectures_qs.values('course').distinct()
        courses_with_lectures = courses_with_lec_ids.count()
        courses_without_lectures = total_courses - courses_with_lectures

        # Most and least active course
        course_lecture_counts = (
            courses_qs
            .annotate(lec_count=Count('lectures'))
            .order_by('-lec_count')
        )
        most_active = None
        least_active = None
        if course_lecture_counts.exists():
            ma = course_lecture_counts.first()
            most_active = {'name': ma.name_ar, 'code': ma.code, 'count': ma.lec_count}
            la = course_lecture_counts.last()
            least_active = {'name': la.name_ar, 'code': la.code, 'count': la.lec_count}

        avg_per_course = round(total_lectures / total_courses, 1) if total_courses > 0 else 0

        # Upload trends by day (last 30 days)
        trends = (
            lectures_qs
            .filter(created_at__gte=thirty_days_ago)
            .annotate(date=TruncDate('created_at'))
            .values('date')
            .annotate(count=Count('id'))
            .order_by('date')
        )
        upload_trends = [{'date': str(t['date']), 'count': t['count']} for t in trends]

        # --- Department / People Statistics ---
        total_students = students_qs.count()
        registered_students = students_qs.filter(is_registered=True).count()

        # Supervisors & managers in this dept
        if dept:
            total_supervisors = Department.objects.filter(id=dept.id).values('supervisor').exclude(supervisor=None).count()
            total_managers = 1 if dept.department_manager else 0
        else:
            total_supervisors = Department.objects.filter(is_deleted=False).exclude(supervisor=None).count()
            total_managers = Department.objects.filter(is_deleted=False).exclude(department_manager=None).count()

        # Instructors in dept
        instructors_count = (
            CourseInstructor.objects.filter(course_id__in=course_ids)
            .values('user').distinct().count()
        )

        # --- Per-course detail table ---
        course_details = []
        for course in courses_qs.annotate(lec_count=Count('lectures')):
            last_lec = Lecture.objects.filter(course=course).order_by('-created_at').first()
            instr = CourseInstructor.objects.filter(course=course).select_related('user').first()
            course_details.append({
                'id': course.id,
                'name': course.name_ar,
                'code': course.code,
                'year': course.academic_year,
                'semester': course.semester,
                'supervisor': instr.user.full_name_ar or instr.user.username if instr else '—',
                'lecture_count': course.lec_count,
                'last_upload': str(last_lec.created_at.date()) if last_lec else None,
                'completion_pct': min(100, round((course.lec_count / 10) * 100)) if course.lec_count else 0,
            })

        # Last upload overall
        last_lec_global = lectures_qs.order_by('-created_at').first()
        last_upload = str(last_lec_global.created_at.date()) if last_lec_global else None

        return Response({
            'department': {'id': dept.id, 'name': dept.name_ar} if dept else None,
            'course_stats': {
                'total': total_courses,
                'with_lectures': courses_with_lectures,
                'without_lectures': courses_without_lectures,
            },
            'lecture_stats': {
                'total': total_lectures,
                'total_files': total_files,
                'recent_7d': recent_7d,
                'recent_30d': recent_30d,
                'avg_per_course': avg_per_course,
                'most_active': most_active,
                'least_active': least_active,
                'last_upload': last_upload,
                'upload_trends': upload_trends,
            },
            'department_stats': {
                'total_students': total_students,
                'registered_students': registered_students,
                'total_supervisors': total_supervisors,
                'total_managers': total_managers,
                'instructors': instructors_count,
            },
            'course_details': course_details,
        })


class ProfessorsListView(APIView):
    """List professors with their assigned subjects, scoped by user role"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.role not in ['system_manager', 'department_manager', 'supervisor']:
            return Response({'error': 'غير مصرح'}, status=403)

        from django.db.models import Q

        # Determine scope
        if user.role == 'system_manager':
            instructors_qs = CourseInstructor.objects.filter(
                course__is_deleted=False
            ).select_related('user', 'course', 'course__department')
            # Optional department filter
            dept_filter = request.query_params.get('department')
            if dept_filter:
                instructors_qs = instructors_qs.filter(course__department_id=dept_filter)
        else:
            dept = get_user_department(user)
            if not dept:
                return Response([])
            instructors_qs = CourseInstructor.objects.filter(
                course__department=dept,
                course__is_deleted=False
            ).select_related('user', 'course', 'course__department')

        # Search by professor name
        search = request.query_params.get('search', '').strip()
        if search:
            instructors_qs = instructors_qs.filter(
                Q(user__full_name_ar__icontains=search) |
                Q(user__username__icontains=search) |
                Q(user__first_name__icontains=search) |
                Q(user__last_name__icontains=search)
            )

        # Group by professor
        professors_map = {}
        for ci in instructors_qs:
            uid = ci.user.id
            if uid not in professors_map:
                professors_map[uid] = {
                    'id': uid,
                    'name': ci.user.full_name_ar or ci.user.username,
                    'assigned_subjects': [],
                    'study_years': set(),
                    'semesters': set(),
                    'departments': set(),
                    'department_name': '',
                }
            p = professors_map[uid]
            subj_label = f"{ci.course.code} - {ci.course.name_ar}"
            if subj_label not in p['assigned_subjects']:
                p['assigned_subjects'].append(subj_label)
            p['study_years'].add(ci.course.academic_year)
            p['semesters'].add(ci.course.semester)
            p['departments'].add(ci.course.department.name_ar)
            p['department_name'] = ci.course.department.name_ar

        # Convert sets to sorted lists for JSON
        result = []
        for prof in professors_map.values():
            result.append({
                'id': prof['id'],
                'name': prof['name'],
                'assigned_subjects': prof['assigned_subjects'],
                'study_years': sorted(prof['study_years']),
                'semesters': sorted(prof['semesters']),
                'department_name': ', '.join(sorted(prof['departments'])),
            })

        result.sort(key=lambda x: x['name'])
        return Response(result)


class ComprehensiveReportView(APIView):
    """Comprehensive analytics dashboard — system_manager and department-level users"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        from django.db.models import Count, Q
        from accounts.models import UniversityStudent

        if user.role not in ['department_manager', 'supervisor', 'system_manager']:
            return Response({'error': 'غير مصرح'}, status=403)

        # Determine department scope
        if user.role == 'system_manager':
            dept_id = request.query_params.get('department')
            if dept_id:
                try:
                    dept = Department.objects.get(id=dept_id, is_deleted=False)
                except Department.DoesNotExist:
                    return Response({'error': 'القسم غير موجود'}, status=404)
            else:
                dept = None
        else:
            dept = get_user_department(user)
            if not dept:
                return Response({'error': 'لا يوجد قسم مرتبط'}, status=403)

        # Optional filters
        level_filter = request.query_params.get('level')
        semester_filter = request.query_params.get('semester')
        subject_filter = request.query_params.get('subject')

        # Base querysets
        if dept:
            courses_qs = Course.objects.filter(is_deleted=False, department=dept)
            students_qs = UniversityStudent.objects.filter(department=dept)
            all_depts = Department.objects.filter(id=dept.id, is_deleted=False)
        else:
            courses_qs = Course.objects.filter(is_deleted=False)
            students_qs = UniversityStudent.objects.all()
            all_depts = Department.objects.filter(is_deleted=False)

        # Apply level/semester filters to courses
        if level_filter:
            courses_qs = courses_qs.filter(academic_year=level_filter)
        if semester_filter:
            courses_qs = courses_qs.filter(semester=semester_filter)

        course_ids = courses_qs.values_list('id', flat=True)

        # Lectures, assignments, submissions scoped to filtered courses
        lectures_qs = Lecture.objects.filter(course_id__in=course_ids)
        assignments_qs = Assignment.objects.filter(course_id__in=course_ids)
        submissions_qs = Submission.objects.filter(assignment__course_id__in=course_ids)

        if subject_filter:
            lectures_qs = lectures_qs.filter(course_id=subject_filter)
            assignments_qs = assignments_qs.filter(course_id=subject_filter)
            submissions_qs = submissions_qs.filter(assignment__course_id=subject_filter)

        # --- Quick Overview KPIs ---
        total_departments = all_depts.count()
        total_subjects = courses_qs.count()
        assigned_subjects = CourseInstructor.objects.filter(
            course_id__in=course_ids
        ).values('course').distinct().count()
        unassigned_subjects = total_subjects - assigned_subjects
        total_lectures = lectures_qs.count()
        total_assignments = assignments_qs.count()
        total_submissions = submissions_qs.count()

        # --- Student Distribution ---
        # Per department
        students_per_dept = list(
            students_qs.values('department__name_ar')
            .annotate(count=Count('id'))
            .order_by('-count')
        )
        for item in students_per_dept:
            item['name'] = item.pop('department__name_ar') or 'غير محدد'

        # Per study level
        students_per_level = list(
            students_qs.filter(year__isnull=False)
            .values('year')
            .annotate(count=Count('id'))
            .order_by('year')
        )
        for item in students_per_level:
            item['name'] = f"السنة {item['year']}"

        # Per semester
        students_per_semester = list(
            students_qs.filter(semester__isnull=False)
            .values('semester')
            .annotate(count=Count('id'))
            .order_by('semester')
        )
        for item in students_per_semester:
            item['name'] = f"الفصل {item['semester']}"

        # --- Leaderboards ---

        # Most Active Professors
        prof_stats = (
            CourseInstructor.objects.filter(course_id__in=course_ids)
            .values('user__id', 'user__full_name_ar', 'user__username')
            .annotate(
                subjects_count=Count('course', distinct=True),
            )
            .order_by('-subjects_count')[:10]
        )
        active_professors = []
        for ps in prof_stats:
            prof_user_id = ps['user__id']
            prof_course_ids = CourseInstructor.objects.filter(
                user_id=prof_user_id, course_id__in=course_ids
            ).values_list('course_id', flat=True)
            active_professors.append({
                'name': ps['user__full_name_ar'] or ps['user__username'],
                'subjects_count': ps['subjects_count'],
                'lectures_count': Lecture.objects.filter(course_id__in=prof_course_ids).count(),
                'assignments_count': Assignment.objects.filter(course_id__in=prof_course_ids).count(),
                'graded_count': Submission.objects.filter(
                    assignment__course_id__in=prof_course_ids,
                    grade__isnull=False
                ).count(),
            })
        active_professors.sort(key=lambda x: x['subjects_count'], reverse=True)

        # Most Advanced Subjects
        advanced_subjects = []
        subject_data = (
            courses_qs
            .annotate(
                lec_count=Count('lectures', distinct=True),
                assign_count=Count('assignments', distinct=True),
            )
            .order_by('-lec_count')[:10]
        )
        for s in subject_data:
            instr = CourseInstructor.objects.filter(course=s).select_related('user').first()
            sub_count = Submission.objects.filter(assignment__course=s).count()
            advanced_subjects.append({
                'name': s.name_ar,
                'code': s.code,
                'lectures_count': s.lec_count,
                'department': s.department.name_ar if hasattr(s, 'department') else '',
                'professor': (instr.user.full_name_ar or instr.user.username) if instr else '—',
                'assignments_count': s.assign_count,
                'submissions_count': sub_count,
            })

        # Most Active Department
        dept_activity = list(
            all_depts
            .annotate(
                subjects=Count('courses', filter=Q(courses__is_deleted=False), distinct=True),
                lectures=Count('courses__lectures', filter=Q(courses__is_deleted=False), distinct=True),
                assignments=Count('courses__assignments', filter=Q(courses__is_deleted=False), distinct=True),
            )
            .values('name_ar', 'subjects', 'lectures', 'assignments')
            .order_by('-lectures')[:5]
        )
        for item in dept_activity:
            item['name'] = item.pop('name_ar')

        # Most Active Level
        level_activity = list(
            courses_qs
            .values('academic_year')
            .annotate(
                subjects=Count('id', distinct=True),
                lectures=Count('lectures', distinct=True),
                assignments=Count('assignments', distinct=True),
            )
            .order_by('-lectures')
        )
        for item in level_activity:
            item['name'] = f"السنة {item['academic_year']}"

        # Most Active Semester
        semester_activity = list(
            courses_qs
            .values('semester')
            .annotate(
                subjects=Count('id', distinct=True),
                lectures=Count('lectures', distinct=True),
                assignments=Count('assignments', distinct=True),
            )
            .order_by('-lectures')
        )
        for item in semester_activity:
            item['name'] = f"الفصل {item['semester']}"

        return Response({
            'department': {'id': dept.id, 'name': dept.name_ar} if dept else None,
            'kpis': {
                'total_departments': total_departments,
                'total_subjects': total_subjects,
                'assigned_subjects': assigned_subjects,
                'unassigned_subjects': unassigned_subjects,
                'total_lectures': total_lectures,
                'total_assignments': total_assignments,
                'total_submissions': total_submissions,
            },
            'student_distribution': {
                'per_department': students_per_dept,
                'per_level': students_per_level,
                'per_semester': students_per_semester,
            },
            'leaderboards': {
                'active_professors': active_professors,
                'advanced_subjects': advanced_subjects,
                'active_departments': dept_activity,
                'active_levels': level_activity,
                'active_semesters': semester_activity,
            },
        })

from rest_framework import status, viewsets, generics
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import authenticate, get_user_model
from django.conf import settings

from .models import UniversityStudent, ActivityLog
from .serializers import (
    UserSerializer, UserProfileSerializer, StudentRegistrationSerializer,
    LoginSerializer, UniversityStudentSerializer, UserManageSerializer,
    ActivityLogSerializer
)

User = get_user_model()


class ActivityLogListView(generics.ListAPIView):
    """List activity logs for department managers.
    Shows operations by supervisors, teachers, and TAs."""
    serializer_class = ActivityLogSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.role not in ('system_manager', 'department_manager'):
            return ActivityLog.objects.none()
        
        # Base queryset: department_manager, supervisor, teacher, ta actions
        qs = ActivityLog.objects.filter(
            user__role__in=['department_manager', 'supervisor', 'teacher', 'ta']
        ).select_related('user')
        
        # Department managers see only their department's logs
        if user.role == 'department_manager':
            managed_dept = getattr(user, 'managed_department', None)
            if managed_dept:
                qs = qs.filter(department=managed_dept)
            else:
                return ActivityLog.objects.none()
        
        # Optional filters
        action = self.request.query_params.get('action')
        if action:
            qs = qs.filter(action=action)
        
        user_id = self.request.query_params.get('user_id')
        if user_id:
            qs = qs.filter(user_id=user_id)
        
        return qs[:200]  # Limit to latest 200


class StudentRegistrationView(APIView):
    """Handle student registration"""
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = StudentRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            
            # Generate tokens
            refresh = RefreshToken.for_user(user)
            
            response = Response({
                'message': 'تم التسجيل بنجاح',
                'user': UserSerializer(user).data
            }, status=status.HTTP_201_CREATED)
            
            # Set cookies
            response.set_cookie(
                key='access_token',
                value=str(refresh.access_token),
                httponly=True,
                secure=settings.SIMPLE_JWT.get('AUTH_COOKIE_SECURE', False),
                samesite='Lax',
                max_age=settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'].total_seconds()
            )
            response.set_cookie(
                key='refresh_token',
                value=str(refresh),
                httponly=True,
                secure=settings.SIMPLE_JWT.get('AUTH_COOKIE_SECURE', False),
                samesite='Lax',
                max_age=settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'].total_seconds()
            )
            
            return response
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    """Handle user login"""
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            login_id = serializer.validated_data['username']
            password = serializer.validated_data['password']
            
            # 1) Try standard username authentication
            user = authenticate(username=login_id, password=password)
            
            # 2) Try full_name_ar (case-insensitive)
            if user is None:
                try:
                    u = User.objects.get(full_name_ar__iexact=login_id)
                    if u.check_password(password):
                        user = u
                except (User.DoesNotExist, User.MultipleObjectsReturned):
                    pass
            
            # 3) Try university_number lookup
            if user is None:
                try:
                    uni = UniversityStudent.objects.get(university_number=login_id)
                    u = User.objects.get(university_student=uni)
                    if u.check_password(password):
                        user = u
                except (UniversityStudent.DoesNotExist, User.DoesNotExist):
                    pass
            
            if user is None:
                return Response({
                    'error': 'اسم المستخدم أو كلمة المرور غير صحيحة'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            if not user.is_active:
                return Response({
                    'error': 'الحساب غير مفعل'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            # Generate tokens
            refresh = RefreshToken.for_user(user)
            
            response = Response({
                'message': 'تم تسجيل الدخول بنجاح',
                'user': UserProfileSerializer(user).data
            })
            
            # Set cookies
            response.set_cookie(
                key='access_token',
                value=str(refresh.access_token),
                httponly=True,
                secure=settings.SIMPLE_JWT.get('AUTH_COOKIE_SECURE', False),
                samesite='Lax',
                max_age=settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'].total_seconds()
            )
            response.set_cookie(
                key='refresh_token',
                value=str(refresh),
                httponly=True,
                secure=settings.SIMPLE_JWT.get('AUTH_COOKIE_SECURE', False),
                samesite='Lax',
                max_age=settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'].total_seconds()
            )
            
            return response
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LogoutView(APIView):
    """Handle user logout"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        response = Response({'message': 'تم تسجيل الخروج بنجاح'})
        response.delete_cookie('access_token')
        response.delete_cookie('refresh_token')
        return response


class RefreshTokenView(APIView):
    """Refresh access token"""
    permission_classes = [AllowAny]
    
    def post(self, request):
        refresh_token = request.COOKIES.get('refresh_token')
        
        if not refresh_token:
            return Response({
                'error': 'لم يتم العثور على رمز التحديث'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        try:
            refresh = RefreshToken(refresh_token)
            access_token = str(refresh.access_token)
            
            response = Response({'message': 'تم تحديث الرمز بنجاح'})
            response.set_cookie(
                key='access_token',
                value=access_token,
                httponly=True,
                secure=settings.SIMPLE_JWT.get('AUTH_COOKIE_SECURE', False),
                samesite='Lax',
                max_age=settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'].total_seconds()
            )
            
            return response
        except Exception as e:
            return Response({
                'error': 'رمز التحديث غير صالح'
            }, status=status.HTTP_401_UNAUTHORIZED)


class CurrentUserView(APIView):
    """Get current authenticated user"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        return Response(UserProfileSerializer(request.user).data)


class ProfileUpdateView(APIView):
    """Update current user's profile"""
    permission_classes = [IsAuthenticated]
    
    def patch(self, request):
        user = request.user
        
        # Base allowed fields for all users
        if user.role == 'student':
            # Students cannot update full_name_ar, but can update username
            allowed_user_fields = ['username', 'email', 'phone']
        else:
            allowed_user_fields = ['full_name_ar', 'email', 'phone']
        
        # Validate username uniqueness if being changed
        if 'username' in request.data and user.role == 'student':
            new_username = request.data['username'].strip()
            if new_username and new_username != user.username:
                if User.objects.filter(username=new_username).exclude(id=user.id).exists():
                    return Response(
                        {'error': 'اسم المستخدم مستخدم بالفعل'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
        
        for field in allowed_user_fields:
            if field in request.data:
                setattr(user, field, request.data[field])
        
        user.save()
        
        # Handle student-specific fields (year, semester)
        if user.role == 'student' and user.university_student:
            updated = False
            if 'year' in request.data:
                user.university_student.year = int(request.data['year']) if request.data['year'] else None
                updated = True
            if 'semester' in request.data:
                user.university_student.semester = int(request.data['semester']) if request.data['semester'] else None
                updated = True
            if updated:
                user.university_student.save()
        
        return Response(UserProfileSerializer(user).data)


class ChangePasswordView(APIView):
    """Change current user's password"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        user = request.user
        current_password = request.data.get('current_password')
        new_password = request.data.get('new_password')
        
        if not current_password or not new_password:
            return Response(
                {'error': 'كلمة المرور الحالية والجديدة مطلوبة'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not user.check_password(current_password):
            return Response(
                {'error': 'كلمة المرور الحالية غير صحيحة'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if len(new_password) < 8:
            return Response(
                {'error': 'كلمة المرور يجب أن تكون 8 أحرف على الأقل'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user.set_password(new_password)
        user.save()
        
        return Response({'message': 'تم تغيير كلمة المرور بنجاح'})


class UniversityStudentViewSet(viewsets.ModelViewSet):
    """ViewSet for managing university students"""
    queryset = UniversityStudent.objects.all()
    serializer_class = UniversityStudentSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        
        # Import Department model
        from academic.models import Department
        
        # Department managers only see students in their department
        if user.role == 'department_manager':
            managed_dept = Department.objects.filter(department_manager=user).first()
            if managed_dept:
                queryset = queryset.filter(department=managed_dept)
            else:
                return queryset.none()
        
        # Filter by department (query param)
        department = self.request.query_params.get('department')
        if department:
            queryset = queryset.filter(department_id=department)
        
        # Filter by year
        year = self.request.query_params.get('year')
        if year:
            queryset = queryset.filter(year=year)
        
        # Filter by registration status
        registered = self.request.query_params.get('registered')
        if registered is not None:
            queryset = queryset.filter(is_registered=registered.lower() == 'true')
        
        return queryset
    
    def perform_destroy(self, instance):
        """Supervisors cannot delete students."""
        if self.request.user.role == 'supervisor':
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("المشرفون لا يمكنهم حذف الطلاب")
        super().perform_destroy(instance)

    @action(detail=False, methods=['post'], parser_classes=[MultiPartParser, FormParser], url_path='bulk-upload')
    def bulk_upload(self, request):
        """Bulk upload university students from CSV or Excel file"""
        import csv
        import io
        from academic.models import Department
        
        file = request.FILES.get('file')
        if not file:
            return Response({'error': 'لم يتم رفع ملف'}, status=status.HTTP_400_BAD_REQUEST)
        
        created = 0
        updated = 0
        errors = []
        
        filename = file.name.lower()
        
        # Build department lookup cache (by name and name_ar)
        dept_cache = {}
        for dept in Department.objects.filter(is_deleted=False):
            dept_cache[dept.name.lower()] = dept.id
            if dept.name_ar:
                dept_cache[dept.name_ar.lower()] = dept.id
        
        try:
            if filename.endswith('.csv'):
                # Handle CSV file
                content = file.read().decode('utf-8')
                reader = csv.DictReader(io.StringIO(content))
                rows = list(reader)
            elif filename.endswith(('.xlsx', '.xls')):
                # Handle Excel file
                try:
                    import openpyxl
                except ImportError:
                    return Response({
                        'error': 'مكتبة openpyxl غير مثبتة. يرجى استخدام ملف CSV بدلاً من ذلك.'
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                workbook = openpyxl.load_workbook(file)
                sheet = workbook.active
                
                # Get headers from first row
                headers = [cell.value for cell in sheet[1] if cell.value]
                rows = []
                
                for row in sheet.iter_rows(min_row=2, values_only=True):
                    if any(row):  # Skip empty rows
                        row_dict = dict(zip(headers, row))
                        rows.append(row_dict)
            else:
                return Response({
                    'error': 'نوع الملف غير مدعوم. يرجى استخدام ملف CSV أو Excel (.xlsx)'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            for row in rows:
                try:
                    uni_num = str(row.get('university_number', '')).strip()
                    if not uni_num:
                        continue
                    
                    # Get department - could be ID or name
                    dept_value = row.get('department_id') or row.get('department') or ''
                    dept_id = None
                    
                    if dept_value:
                        # Try as integer ID first
                        try:
                            dept_id = int(dept_value)
                        except (ValueError, TypeError):
                            # It's a string name, look up in cache
                            dept_name = str(dept_value).strip().lower()
                            dept_id = dept_cache.get(dept_name)
                            if not dept_id:
                                errors.append(f"Row {uni_num}: Department '{dept_value}' not found")
                                continue
                    
                    year = row.get('year', 1)
                    
                    obj, was_created = UniversityStudent.objects.update_or_create(
                        university_number=uni_num,
                        defaults={
                            'full_name': str(row.get('full_name', '')).strip(),
                            'department_id': dept_id,
                            'year': int(year) if year else 1,
                        }
                    )
                    if was_created:
                        created += 1
                    else:
                        updated += 1
                except Exception as e:
                    errors.append(f"Error at row {uni_num}: {str(e)}")
            
            return Response({
                'message': f'تم رفع الملف بنجاح. تم إنشاء {created} وتحديث {updated} طالب.',
                'created': created,
                'updated': updated,
                'errors': errors[:10]  # Return first 10 errors only
            })
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class UserViewSet(viewsets.ModelViewSet):
    """ViewSet for managing users (system managers only)"""
    queryset = User.objects.all().order_by('-date_joined')
    serializer_class = UserManageSerializer
    
    def get_permissions(self):
        # Only system managers and superusers can manage users
        return [IsAuthenticated()]
    
    def get_queryset(self):
        user = self.request.user
        role_filter = self.request.query_params.get('role')
        
        # System managers and superusers can see all users
        if user.is_superuser or user.role == 'system_manager':
            qs = User.objects.all().order_by('-date_joined')
            if role_filter:
                qs = qs.filter(role=role_filter)
            else:
                qs = qs.exclude(role='student')
            return qs
        
        # Department managers and supervisors can view teachers, TAs, and students when explicitly requested
        if user.role in ['department_manager', 'supervisor']:
            if role_filter == 'student':
                return User.objects.filter(role='student').order_by('-date_joined')
            return User.objects.filter(role__in=['teacher', 'ta']).order_by('-date_joined')
        
        # Teachers and TAs can view students (for results publishing)
        if user.role in ['teacher', 'ta']:
            if role_filter == 'student':
                return User.objects.filter(role='student').order_by('-date_joined')
            return User.objects.none()
        
        return User.objects.none()
    
    def perform_destroy(self, instance):
        """Only system_manager and department_manager can delete users. Supervisors cannot."""
        if self.request.user.role == 'supervisor':
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("المشرفون لا يمكنهم حذف المستخدمين")
        super().perform_destroy(instance)



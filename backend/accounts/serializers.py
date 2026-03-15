from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from .models import UniversityStudent, ActivityLog

User = get_user_model()


class ActivityLogSerializer(serializers.ModelSerializer):
    """Serializer for activity log entries"""
    user_name = serializers.SerializerMethodField()
    user_role = serializers.CharField(source='user.role', read_only=True)
    action_display = serializers.CharField(source='get_action_display', read_only=True)
    
    class Meta:
        model = ActivityLog
        fields = ['id', 'user', 'user_name', 'user_role', 'action', 'action_display',
                  'target_type', 'target_name', 'details', 'created_at']
        read_only_fields = fields
    
    def get_user_name(self, obj):
        return obj.user.full_name_ar or obj.user.username


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model"""
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'full_name_ar', 'role', 'phone', 'first_name', 'last_name']
        read_only_fields = ['id', 'role']


class UserManageSerializer(serializers.ModelSerializer):
    """Serializer for admin user management - allows creating/updating users"""
    password = serializers.CharField(write_only=True, required=False)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'full_name_ar', 'role', 'phone', 'password', 'is_active']
        read_only_fields = ['id']
    
    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = User(**validated_data)
        if password:
            user.set_password(password)
        user.save()
        return user
    
    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance


class UserProfileSerializer(serializers.ModelSerializer):
    """Detailed user profile serializer"""
    department = serializers.SerializerMethodField()
    year = serializers.SerializerMethodField()
    semester = serializers.SerializerMethodField()
    university_number = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'full_name_ar', 'role', 'phone', 
                  'first_name', 'last_name', 'department', 'year', 'semester',
                  'university_number']
        read_only_fields = ['id', 'role', 'department', 'year', 'semester',
                            'university_number']
    
    def get_department(self, obj):
        if obj.university_student and obj.university_student.department:
            return {
                'id': obj.university_student.department.id,
                'name': obj.university_student.department.name,
                'name_ar': obj.university_student.department.name_ar,
            }
        return None
    
    def get_year(self, obj):
        if obj.university_student:
            return obj.university_student.year
        return None
    
    def get_semester(self, obj):
        if obj.university_student:
            return obj.university_student.semester
        return None
    
    def get_university_number(self, obj):
        if obj.university_student:
            return obj.university_student.university_number
        return None


class StudentRegistrationSerializer(serializers.Serializer):
    """Serializer for student registration"""
    university_number = serializers.CharField(max_length=50)
    full_name = serializers.CharField(max_length=200)
    username = serializers.CharField(max_length=150, required=False, allow_blank=True)
    year = serializers.IntegerField(required=False, min_value=1, max_value=6)
    semester = serializers.IntegerField(required=False, min_value=1, max_value=10)
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)
    
    def validate_username(self, value):
        if value and User.objects.filter(username=value).exists():
            raise serializers.ValidationError('اسم المستخدم مستخدم بالفعل')
        return value
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({'password_confirm': 'كلمات المرور غير متطابقة'})
        
        # Check if university student exists
        try:
            university_student = UniversityStudent.objects.get(
                university_number=attrs['university_number']
            )
        except UniversityStudent.DoesNotExist:
            raise serializers.ValidationError({'university_number': 'الرقم الجامعي غير موجود'})
        
        # Validate full name matches
        if university_student.full_name.strip().lower() != attrs['full_name'].strip().lower():
            raise serializers.ValidationError({'full_name': 'الاسم غير متطابق مع السجلات'})
        
        # Check if already registered
        if university_student.is_registered:
            raise serializers.ValidationError({'university_number': 'هذا الحساب مسجل مسبقاً'})
        
        attrs['university_student'] = university_student
        return attrs
    
    def create(self, validated_data):
        university_student = validated_data['university_student']
        
        # Use custom username if provided, otherwise fall back to university_number
        username = validated_data.get('username', '').strip() or validated_data['university_number']
        
        # Update year and semester on university_student if provided
        if 'year' in validated_data:
            university_student.year = validated_data['year']
        if 'semester' in validated_data:
            university_student.semester = validated_data['semester']
        
        # Create user account
        user = User.objects.create_user(
            username=username,
            password=validated_data['password'],
            full_name_ar=validated_data['full_name'],
            role='student',
            university_student=university_student
        )
        
        # Mark as registered
        university_student.is_registered = True
        university_student.save()
        
        return user


class LoginSerializer(serializers.Serializer):
    """Serializer for user login"""
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)


class UniversityStudentSerializer(serializers.ModelSerializer):
    """Serializer for UniversityStudent model"""
    department_name = serializers.CharField(source='department.name_ar', read_only=True)
    
    class Meta:
        model = UniversityStudent
        fields = ['id', 'university_number', 'full_name', 'email', 'phone',
                  'gender', 'nationality', 'birth_date', 'address',
                  'department', 'department_name',
                  'year', 'semester', 'is_registered', 'created_at']
        read_only_fields = ['is_registered', 'created_at']


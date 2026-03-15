from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Extended User model with role-based access"""
    
    ROLE_CHOICES = [
        ('system_manager', 'System Manager'),
        ('department_manager', 'Department Manager'),
        ('supervisor', 'Supervisor'),
        ('teacher', 'Teacher'),
        ('ta', 'Teaching Assistant'),
        ('student', 'Student'),
    ]
    
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='student')
    full_name_ar = models.CharField(max_length=200, blank=True, verbose_name='الاسم الكامل')
    phone = models.CharField(max_length=20, blank=True)
    
    # Link to UniversityStudent for students
    university_student = models.OneToOneField(
        'UniversityStudent',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='user_account'
    )
    
    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'
    
    def __str__(self):
        return self.full_name_ar or self.get_full_name() or self.username


class UniversityStudent(models.Model):
    """
    Source of truth for student identity.
    Pre-populated with official registered students.
    """
    GENDER_CHOICES = [
        ('male', 'ذكر'),
        ('female', 'أنثى'),
    ]

    university_number = models.CharField(max_length=50, unique=True, verbose_name='الرقم الجامعي')
    full_name = models.CharField(max_length=200, verbose_name='الاسم الكامل')
    email = models.EmailField(null=True, blank=True, verbose_name='البريد الإلكتروني')
    phone = models.CharField(max_length=20, null=True, blank=True, verbose_name='رقم الهاتف')
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, null=True, blank=True, verbose_name='الجنس')
    nationality = models.CharField(max_length=100, null=True, blank=True, verbose_name='الجنسية')
    birth_date = models.DateField(null=True, blank=True, verbose_name='تاريخ الميلاد')
    address = models.TextField(null=True, blank=True, verbose_name='العنوان')
    department = models.ForeignKey(
        'academic.Department',
        on_delete=models.PROTECT,
        related_name='university_students',
        verbose_name='القسم',
        null=True,
        blank=True,
    )
    year = models.PositiveIntegerField(null=True, blank=True, verbose_name='السنة الدراسية')
    semester = models.PositiveIntegerField(null=True, blank=True, verbose_name='الفصل الدراسي',
                                           help_text='من 1 إلى 10')
    is_registered = models.BooleanField(default=False, verbose_name='مسجل في النظام')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'University Student'
        verbose_name_plural = 'University Students'
        ordering = ['university_number']
    
    def __str__(self):
        return f"{self.university_number} - {self.full_name}"


class ActivityLog(models.Model):
    """Track operations performed by users"""
    ACTION_CHOICES = [
        ('create', 'إنشاء'),
        ('update', 'تعديل'),
        ('delete', 'حذف'),
        ('publish', 'نشر'),
        ('grade', 'تصحيح'),
    ]
    
    user = models.ForeignKey(
        'User',
        on_delete=models.CASCADE,
        related_name='activity_logs',
        verbose_name='المستخدم'
    )
    department = models.ForeignKey(
        'academic.Department',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='activity_logs',
        verbose_name='القسم'
    )
    action = models.CharField(max_length=20, choices=ACTION_CHOICES, verbose_name='الإجراء')
    target_type = models.CharField(max_length=50, verbose_name='نوع العنصر')
    target_name = models.CharField(max_length=300, verbose_name='اسم العنصر')
    details = models.TextField(blank=True, verbose_name='التفاصيل')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='التاريخ')
    
    class Meta:
        verbose_name = 'Activity Log'
        verbose_name_plural = 'Activity Logs'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['-created_at']),
            models.Index(fields=['user', '-created_at']),
        ]
    
    def __str__(self):
        return f"{self.user} - {self.get_action_display()} - {self.target_name}"

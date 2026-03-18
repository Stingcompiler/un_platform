from django.db import models
from django.conf import settings


class Department(models.Model):
    """Academic Department"""
    name = models.CharField(max_length=200, verbose_name='Department Name')
    name_ar = models.CharField(max_length=200, verbose_name='اسم القسم')
    description = models.TextField(blank=True)
    description_ar = models.TextField(blank=True, verbose_name='الوصف')
    department_manager = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='managed_department',
        limit_choices_to={'role': 'department_manager'},
        verbose_name='مدير القسم'
    )
    supervisor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='supervised_departments',
        limit_choices_to={'role': 'supervisor'},
        verbose_name='المشرف'
    )
    is_deleted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Department'
        verbose_name_plural = 'Departments'
        ordering = ['name_ar']
    
    def __str__(self):
        return self.name_ar


class Course(models.Model):
    """Course within a department"""
    name = models.CharField(max_length=200, verbose_name='Course Name')
    name_ar = models.CharField(max_length=200, verbose_name='اسم المادة')
    code = models.CharField(max_length=20, unique=True, verbose_name='رمز المادة')
    description = models.TextField(blank=True)
    description_ar = models.TextField(blank=True)
    department = models.ForeignKey(
        Department,
        on_delete=models.PROTECT,
        related_name='courses',
        verbose_name='القسم'
    )
    academic_year = models.PositiveIntegerField(verbose_name='السنة الدراسية')
    semester = models.PositiveIntegerField(default=1, verbose_name='الفصل الدراسي')
    credit_hours = models.PositiveIntegerField(default=3, verbose_name='الساعات المعتمدة')
    is_deleted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Course'
        verbose_name_plural = 'Courses'
        ordering = ['code']
    
    def __str__(self):
        return f"{self.code} - {self.name_ar}"


class CourseInstructor(models.Model):
    """Many-to-Many relationship between instructors and courses"""
    ROLE_CHOICES = [
        ('teacher', 'Teacher'),
        ('ta', 'Teaching Assistant'),
    ]
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='teaching_assignments',
        verbose_name='المدرس'
    )
    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name='instructors',
        verbose_name='المادة'
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, verbose_name='الدور')
    assigned_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'Course Instructor'
        verbose_name_plural = 'Course Instructors'
        unique_together = ['user', 'course']
    
    def __str__(self):
        return f"{self.user} - {self.course} ({self.get_role_display()})"

class Lecture(models.Model):
    """Lecture content for a course"""
    TYPE_CHOICES = [
        ('theory', 'Theory'),
        ('lab', 'Lab'),
    ]
    
    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name='lectures',
        verbose_name='المادة'
    )
    title = models.CharField(max_length=200, verbose_name='العنوان')
    title_ar = models.CharField(max_length=200, blank=True, verbose_name='العنوان بالعربية')
    content = models.TextField(verbose_name='المحتوى')
    lecture_type = models.CharField(max_length=10, choices=TYPE_CHOICES, verbose_name='النوع')
    order = models.PositiveIntegerField(default=0, verbose_name='الترتيب')
    
    # File attachments (PDFs, PPTs)
    file = models.FileField(upload_to='lectures/files/', null=True, blank=True, verbose_name='ملف مرفق')

    # 🚀 حقل الفيديو الجديد (يُرفع مباشرة لمساحة التخزين الخاصة بك ويمر عبر Cloudflare)
    video_file = models.FileField(
        upload_to='lectures/videos/', 
        null=True, 
        blank=True, 
        verbose_name='ملف فيديو (MP4)'
    )

    # External URLs (YouTube/Vimeo)
    video_url = models.URLField(null=True, blank=True, verbose_name='رابط فيديو خارجي', help_text='رابط يوتيوب أو فيميو')
    reference_url = models.URLField(null=True, blank=True, verbose_name='رابط المراجع')
    
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_lectures',
        verbose_name='أنشئ بواسطة'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Lecture'
        verbose_name_plural = 'Lectures'
        ordering = ['order', 'created_at']
    
    def __str__(self):
        return f"{self.course.code} - {self.title}"

class Assignment(models.Model):
    """Assignment for a course"""
    TYPE_CHOICES = [
        ('theory', 'Theory'),
        ('lab', 'Lab'),
    ]
    
    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name='assignments',
        verbose_name='المادة'
    )
    title = models.CharField(max_length=200, verbose_name='العنوان')
    title_ar = models.CharField(max_length=200, blank=True, verbose_name='العنوان بالعربية')
    description = models.TextField(verbose_name='الوصف')
    assignment_type = models.CharField(max_length=10, choices=TYPE_CHOICES, verbose_name='النوع')
    due_date = models.DateTimeField(verbose_name='تاريخ التسليم')
    max_grade = models.DecimalField(max_digits=5, decimal_places=2, default=100, verbose_name='الدرجة القصوى')
    file = models.FileField(upload_to='assignments/', null=True, blank=True, verbose_name='ملف مرفق')
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_assignments',
        verbose_name='أنشئ بواسطة'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Assignment'
        verbose_name_plural = 'Assignments'
        ordering = ['-due_date']
    
    def __str__(self):
        return f"{self.course.code} - {self.title}"


class Submission(models.Model):
    """Student submission for an assignment"""
    assignment = models.ForeignKey(
        Assignment,
        on_delete=models.CASCADE,
        related_name='submissions',
        verbose_name='الواجب'
    )
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='submissions',
        verbose_name='الطالب'
    )
    content = models.TextField(blank=True, verbose_name='المحتوى')
    file = models.FileField(upload_to='submissions/', null=True, blank=True, verbose_name='الملف المرفق')
    submitted_at = models.DateTimeField(auto_now_add=True)
    
    # Grading
    grade = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, verbose_name='الدرجة')
    feedback = models.TextField(blank=True, verbose_name='الملاحظات')
    graded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='graded_submissions',
        verbose_name='مصحح بواسطة'
    )
    graded_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        verbose_name = 'Submission'
        verbose_name_plural = 'Submissions'
        unique_together = ['assignment', 'student']
        ordering = ['-submitted_at']
    
    def __str__(self):
        return f"{self.student} - {self.assignment}"


class CourseResult(models.Model):
    """Final course result for a student"""
    LETTER_GRADE_CHOICES = [
        ('A+', 'A+'), ('A', 'A'), ('A-', 'A-'),
        ('B+', 'B+'), ('B', 'B'), ('B-', 'B-'),
        ('C+', 'C+'), ('C', 'C'), ('C-', 'C-'),
        ('D+', 'D+'), ('D', 'D'),
        ('F', 'F'),
    ]
    
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='course_results',
        verbose_name='الطالب'
    )
    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name='results',
        verbose_name='المادة'
    )
    total_grade = models.DecimalField(max_digits=5, decimal_places=2, verbose_name='الدرجة الكلية')
    letter_grade = models.CharField(max_length=2, choices=LETTER_GRADE_CHOICES, verbose_name='التقدير')
    passed = models.BooleanField(verbose_name='ناجح')
    is_published = models.BooleanField(default=False, verbose_name='منشور')
    published_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='published_results',
        verbose_name='نشر بواسطة'
    )
    published_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Course Result'
        verbose_name_plural = 'Course Results'
        unique_together = ['student', 'course']
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.student} - {self.course}: {self.letter_grade}"

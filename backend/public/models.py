from django.db import models


class Event(models.Model):
    """Public event for the college"""
    title = models.CharField(max_length=200, verbose_name='Event Title')
    title_ar = models.CharField(max_length=200, verbose_name='عنوان الفعالية')
    description = models.TextField(blank=True, verbose_name='Description')
    description_ar = models.TextField(blank=True, verbose_name='الوصف')
    date = models.DateTimeField(verbose_name='تاريخ الفعالية')
    location = models.CharField(max_length=200, blank=True, verbose_name='المكان')
    image = models.ImageField(upload_to='events/', null=True, blank=True, verbose_name='الصورة')
    is_published = models.BooleanField(default=False, verbose_name='منشور')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Event'
        verbose_name_plural = 'Events'
        ordering = ['-date']
    
    def __str__(self):
        return self.title_ar


class ContactMessage(models.Model):
    """Contact form submissions"""
    name = models.CharField(max_length=200, verbose_name='الاسم')
    email = models.EmailField(verbose_name='البريد الإلكتروني')
    phone = models.CharField(max_length=20, blank=True, verbose_name='رقم الهاتف')
    subject = models.CharField(max_length=200, verbose_name='الموضوع')
    message = models.TextField(verbose_name='الرسالة')
    is_read = models.BooleanField(default=False, verbose_name='مقروء')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'Contact Message'
        verbose_name_plural = 'Contact Messages'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.name} - {self.subject}"


class Policy(models.Model):
    """Privacy Policy and Terms"""
    POLICY_TYPES = [
        ('privacy', 'Privacy Policy'),
        ('terms', 'Terms of Service'),
    ]
    
    policy_type = models.CharField(max_length=20, choices=POLICY_TYPES, unique=True)
    title = models.CharField(max_length=200)
    title_ar = models.CharField(max_length=200)
    content = models.TextField()
    content_ar = models.TextField()
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Policy'
        verbose_name_plural = 'Policies'
    
    def __str__(self):
        return self.title_ar

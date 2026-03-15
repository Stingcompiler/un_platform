from django.contrib import admin
from .models import Event, ContactMessage, Policy


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ['title_ar', 'date', 'location', 'is_published']
    list_filter = ['is_published', 'date']
    search_fields = ['title', 'title_ar', 'description']


@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    list_display = ['name', 'subject', 'email', 'is_read', 'created_at']
    list_filter = ['is_read', 'created_at']
    search_fields = ['name', 'email', 'subject']


@admin.register(Policy)
class PolicyAdmin(admin.ModelAdmin):
    list_display = ['policy_type', 'title_ar', 'updated_at']
    list_filter = ['policy_type']

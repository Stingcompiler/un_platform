from rest_framework import serializers
from .models import Event, ContactMessage, Policy


class EventSerializer(serializers.ModelSerializer):
    """Serializer for Event"""
    class Meta:
        model = Event
        fields = ['id', 'title', 'title_ar', 'description', 'description_ar',
                  'date', 'location', 'image', 'is_published', 'created_at']
        read_only_fields = ['id', 'created_at']


class EventListSerializer(serializers.ModelSerializer):
    """Simplified serializer for listing public events"""
    class Meta:
        model = Event
        fields = ['id', 'title', 'title_ar', 'description_ar', 'date', 'location', 'image']


class ContactMessageSerializer(serializers.ModelSerializer):
    """Serializer for ContactMessage"""
    class Meta:
        model = ContactMessage
        fields = ['id', 'name', 'email', 'phone', 'subject', 'message', 'is_read', 'created_at']
        read_only_fields = ['id', 'created_at']


class PolicySerializer(serializers.ModelSerializer):
    """Serializer for Policy"""
    class Meta:
        model = Policy
        fields = ['id', 'policy_type', 'title', 'title_ar', 'content', 'content_ar', 'updated_at']
        read_only_fields = ['id', 'updated_at']

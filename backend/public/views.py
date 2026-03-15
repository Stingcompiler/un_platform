from rest_framework import viewsets, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Event, ContactMessage, Policy
from .serializers import (
    EventSerializer, EventListSerializer,
    ContactMessageSerializer, PolicySerializer
)


class IsAdminUser(permissions.BasePermission):
    """Permission for admin users"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['system_manager', 'department_manager']


class PublicEventListView(APIView):
    """List published events for public website"""
    permission_classes = [permissions.AllowAny]
    
    def get(self, request):
        events = Event.objects.filter(is_published=True).order_by('-date')[:10]
        serializer = EventListSerializer(events, many=True)
        return Response(serializer.data)


class PublicEventDetailView(APIView):
    """Get event details for public website"""
    permission_classes = [permissions.AllowAny]
    
    def get(self, request, pk):
        try:
            event = Event.objects.get(pk=pk, is_published=True)
            serializer = EventSerializer(event)
            return Response(serializer.data)
        except Event.DoesNotExist:
            return Response({'error': 'الفعالية غير موجودة'}, status=status.HTTP_404_NOT_FOUND)


class EventViewSet(viewsets.ModelViewSet):
    """ViewSet for Event management (admin)"""
    queryset = Event.objects.all()
    serializer_class = EventSerializer
    permission_classes = [IsAdminUser]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        published = self.request.query_params.get('published')
        if published is not None:
            queryset = queryset.filter(is_published=published.lower() == 'true')
        
        return queryset


class ContactMessageCreateView(APIView):
    """Create contact message from public website"""
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = ContactMessageSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({
                'message': 'تم إرسال رسالتك بنجاح'
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ContactMessageViewSet(viewsets.ModelViewSet):
    """ViewSet for managing contact messages (admin)"""
    queryset = ContactMessage.objects.all()
    serializer_class = ContactMessageSerializer
    permission_classes = [IsAdminUser]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        is_read = self.request.query_params.get('is_read')
        if is_read is not None:
            queryset = queryset.filter(is_read=is_read.lower() == 'true')
        
        return queryset


class PolicyPublicView(APIView):
    """Get policy by type for public website"""
    permission_classes = [permissions.AllowAny]
    
    def get(self, request, policy_type):
        try:
            policy = Policy.objects.get(policy_type=policy_type)
            serializer = PolicySerializer(policy)
            return Response(serializer.data)
        except Policy.DoesNotExist:
            return Response({'error': 'السياسة غير موجودة'}, status=status.HTTP_404_NOT_FOUND)


class PolicyViewSet(viewsets.ModelViewSet):
    """ViewSet for Policy management (admin)"""
    queryset = Policy.objects.all()
    serializer_class = PolicySerializer
    permission_classes = [IsAdminUser]

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    PublicEventListView, PublicEventDetailView, EventViewSet,
    ContactMessageCreateView, ContactMessageViewSet,
    PolicyPublicView, PolicyViewSet
)

router = DefaultRouter()
router.register(r'events-manage', EventViewSet)
router.register(r'messages', ContactMessageViewSet)
router.register(r'policies-manage', PolicyViewSet)

urlpatterns = [
    # Public endpoints
    path('events/', PublicEventListView.as_view(), name='public-events'),
    path('events/<int:pk>/', PublicEventDetailView.as_view(), name='public-event-detail'),
    path('contact/', ContactMessageCreateView.as_view(), name='contact'),
    path('policy/<str:policy_type>/', PolicyPublicView.as_view(), name='policy'),
    # Admin endpoints
    path('', include(router.urls)),
]

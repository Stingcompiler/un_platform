from django.urls import path, include
from django.http import JsonResponse
from rest_framework.routers import DefaultRouter
from .views import (
    StudentRegistrationView, LoginView, LogoutView,
    RefreshTokenView, CurrentUserView, UniversityStudentViewSet, UserViewSet,
    ProfileUpdateView, ChangePasswordView, ActivityLogListView
)

router = DefaultRouter()
router.register(r'university-students', UniversityStudentViewSet)
router.register(r'users', UserViewSet)

urlpatterns = [
    path('health/', lambda r: JsonResponse({'status': 'ok'}), name='health'),
    path('register/', StudentRegistrationView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('refresh/', RefreshTokenView.as_view(), name='refresh'),
    path('me/', CurrentUserView.as_view(), name='current-user'),
    path('profile/', ProfileUpdateView.as_view(), name='profile-update'),
    path('change-password/', ChangePasswordView.as_view(), name='change-password'),
    path('activity-logs/', ActivityLogListView.as_view(), name='activity-logs'),
    path('', include(router.urls)),
]


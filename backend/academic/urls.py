from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    DepartmentViewSet, CourseViewSet, CourseInstructorViewSet,
    LectureViewSet, AssignmentViewSet, SubmissionViewSet, CourseResultViewSet,
    DashboardStatsView, LectureStatsView, DepartmentReportView,
    ProfessorsListView, ComprehensiveReportView
)

router = DefaultRouter()
router.register(r'departments', DepartmentViewSet)
router.register(r'courses', CourseViewSet)
router.register(r'instructors', CourseInstructorViewSet)
router.register(r'lectures', LectureViewSet)
router.register(r'assignments', AssignmentViewSet)
router.register(r'submissions', SubmissionViewSet)
router.register(r'results', CourseResultViewSet)

urlpatterns = [
    path('dashboard-stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('lecture-stats/', LectureStatsView.as_view(), name='lecture-stats'),
    path('department-report/', DepartmentReportView.as_view(), name='department-report'),
    path('professors/', ProfessorsListView.as_view(), name='professors-list'),
    path('comprehensive-report/', ComprehensiveReportView.as_view(), name='comprehensive-report'),
    path('', include(router.urls)),
]


from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DashboardStatsView
from .views import RegisterView
from .views import ProfileView
from .views import ReportsView

from .views import (
    UserViewSet,
    ProjectViewSet,
    TaskViewSet,
    CommentViewSet,
    NotificationViewSet,
     DashboardStatsView,
     ActivityLogViewSet,
)

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'projects', ProjectViewSet)
router.register(r'tasks', TaskViewSet)
router.register(r'comments', CommentViewSet)
router.register(r'notifications', NotificationViewSet)
router.register("activity-logs", ActivityLogViewSet)
urlpatterns = [
    path("dashboard/", DashboardStatsView.as_view(), name="dashboard"),
    path('', include(router.urls)),
    path("register/", RegisterView.as_view(), name="register"),
    path("profile/", ProfileView.as_view(), name="profile"),
    path("reports/", ReportsView.as_view(), name="reports"),
]
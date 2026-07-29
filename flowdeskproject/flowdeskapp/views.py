from django.shortcuts import render
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Project, Task, User, Notification
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import User, Project, Task, Comment, Notification
from .serializers import (
    UserSerializer,
    ProjectSerializer,
    TaskSerializer,
    CommentSerializer,
    NotificationSerializer,
)


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer

    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]

    filterset_fields = ["status", "priority"]

    search_fields = ["name", "description"]

    ordering_fields = ["start_date", "due_date", "created_at"]


class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]

filterset_fields = [
    "status",
    "priority",
    "assigned_to",
    "project"
]

search_fields = [
    "title",
    "description"
]

ordering_fields = [
    "due_date",
    "created_at"
]


class CommentViewSet(viewsets.ModelViewSet):
    queryset = Comment.objects.all()
    serializer_class = CommentSerializer


class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer

from rest_framework.views import APIView
from rest_framework.response import Response

class DashboardStatsView(APIView):

    def get(self, request):
        data = {
            "total_projects": Project.objects.count(),
            "active_projects": Project.objects.filter(status="active").count(),
            "completed_projects": Project.objects.filter(status="completed").count(),
            "total_tasks": Task.objects.count(),
            "completed_tasks": Task.objects.filter(status="completed").count(),
            "pending_tasks": Task.objects.exclude(status="completed").count(),
            "employees": User.objects.filter(role="employee").count(),
            "managers": User.objects.filter(role="manager").count(),
            "notifications": Notification.objects.count(),
        }

        return Response(data)
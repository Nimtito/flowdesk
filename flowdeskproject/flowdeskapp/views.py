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
from rest_framework import generics
from rest_framework.permissions import AllowAny
from .serializers import RegisterSerializer
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .permissions import IsTaskOwnerOrManager
from .models import User, Project, Task, Comment, Notification
from .serializers import (
    UserSerializer,
    ProjectSerializer,
    TaskSerializer,
    CommentSerializer,
    NotificationSerializer,
)
from .permissions import (
    IsAdmin,
    IsManager,
    IsEmployee,
    IsAdminOrManager,
)

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAdmin]
    
class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    permission_classes = [IsAdminOrManager]

    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]

    filterset_fields = ["status", "priority"]

    search_fields = ["name", "description"]

    ordering_fields = ["start_date", "due_date", "created_at"]


class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated, IsTaskOwnerOrManager]

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
    permission_classes = [IsAuthenticated]
    filter_backends = [SearchFilter, OrderingFilter]

    search_fields = ["comment"]

    ordering_fields = ["created_at"]


class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]

    filterset_fields = ["is_read"]

    search_fields = ["title", "message"]

    ordering_fields = ["created_at"]

from rest_framework.views import APIView
from rest_framework.response import Response

class DashboardStatsView(APIView):
    permission_classes = [IsAuthenticated]    

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

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    def put(self, request):
        serializer = UserSerializer(
            request.user,
            data=request.data,
            partial=True
        )

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
from django.db.models import Count
from django.utils import timezone

from rest_framework import generics, status, viewsets
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.filters import SearchFilter, OrderingFilter

from django_filters.rest_framework import DjangoFilterBackend

from .models import (
    User,
    Project,
    Task,
    Comment,
    Notification,
    ActivityLog,
)

from .serializers import (
    UserSerializer,
    RegisterSerializer,
    ProjectSerializer,
    TaskSerializer,
    CommentSerializer,
    NotificationSerializer,
    ActivityLogSerializer,
)

from .permissions import (
    IsAdmin,
    IsAdminOrManager,
    IsTaskOwnerOrManager,
)


# ==========================
# USER VIEWSET
# ==========================
class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAdmin]


# ==========================
# PROJECT VIEWSET
# ==========================
class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    permission_classes = [IsAdminOrManager]

    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["status", "priority"]
    search_fields = ["name", "description"]
    ordering_fields = ["start_date", "due_date", "created_at"]

    def perform_create(self, serializer):
        project = serializer.save()

        ActivityLog.objects.create(
            user=self.request.user,
            action="create",
            description=f'Created project "{project.name}"'
        )

    def perform_update(self, serializer):
        project = serializer.save()

        ActivityLog.objects.create(
            user=self.request.user,
            action="update",
            description=f'Updated project "{project.name}"'
        )

    def perform_destroy(self, instance):
        ActivityLog.objects.create(
            user=self.request.user,
            action="delete",
            description=f'Deleted project "{instance.name}"'
        )

        instance.delete()


# ==========================
# TASK VIEWSET
# ==========================
class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated, IsTaskOwnerOrManager]

    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = [
        "status",
        "priority",
        "assigned_to",
        "project",
    ]
    search_fields = [
        "title",
        "description",
    ]
    ordering_fields = [
        "due_date",
        "created_at",
    ]


# ==========================
# COMMENT VIEWSET
# ==========================
class CommentViewSet(viewsets.ModelViewSet):
    queryset = Comment.objects.all()
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticated]

    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ["comment"]
    ordering_fields = ["created_at"]


# ==========================
# NOTIFICATION VIEWSET
# ==========================
class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["is_read"]
    search_fields = ["title", "message"]
    ordering_fields = ["created_at"]


# ==========================
# ACTIVITY LOG VIEWSET
# ==========================
class ActivityLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ActivityLog.objects.all().order_by("-created_at")
    serializer_class = ActivityLogSerializer
    permission_classes = [IsAuthenticated]


# ==========================
# DASHBOARD
# ==========================
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


# ==========================
# REGISTER USER
# ==========================
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]


# ==========================
# PROFILE
# ==========================
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

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


# ==========================
# REPORTS
# ==========================
class ReportsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):

        report = {
            "total_projects": Project.objects.count(),
            "active_projects": Project.objects.filter(status="active").count(),
            "completed_projects": Project.objects.filter(status="completed").count(),

            "total_tasks": Task.objects.count(),
            "completed_tasks": Task.objects.filter(status="completed").count(),
            "pending_tasks": Task.objects.exclude(status="completed").count(),

            "overdue_tasks": Task.objects.filter(
                due_date__lt=timezone.now().date(),
                status__in=["todo", "in_progress"],
            ).count(),

            "employee_workload": list(
                User.objects.filter(role="employee")
                .annotate(tasks=Count("tasks"))
                .values("username", "tasks")
            ),

            "project_progress": list(
                Project.objects.values(
                    "name",
                    "status",
                    "priority",
                )
            ),
        }

        return Response(report)
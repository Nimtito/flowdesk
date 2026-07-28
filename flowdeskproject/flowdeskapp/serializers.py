from rest_framework import serializers
from .models import User, Project, Task, Comment, Notification

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = "__all__"
        extra_kwargs = {
            "password": {"write_only": True}
        }

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class ProjectSerializer(serializers.ModelSerializer):
    manager_name = serializers.CharField(source="manager.username", read_only=True)

    class Meta:
        model = Project
        fields = "__all__"


class TaskSerializer(serializers.ModelSerializer):
    assigned_to_name = serializers.CharField(source="assigned_to.username", read_only=True)
    project_name = serializers.CharField(source="project.name", read_only=True)

    class Meta:
        model = Task
        fields = "__all__"


class CommentSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source="author.username", read_only=True)
    task_title = serializers.CharField(source="task.title", read_only=True)

    class Meta:
        model = Comment
        fields = "__all__"


class NotificationSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = Notification
        fields = "__all__"
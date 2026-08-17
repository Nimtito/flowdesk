from django.urls import path
from .views import GenerateTaskView

urlpatterns = [
    path(
        "generate-tasks/",
        GenerateTaskView.as_view(),
        name="generate-tasks",
    ),
]
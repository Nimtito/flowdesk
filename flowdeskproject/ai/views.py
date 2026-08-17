from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from .serializers import GenerateTaskSerializer
from .services import AIService


class GenerateTaskView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = GenerateTaskSerializer(data=request.data)

        if serializer.is_valid():
            ai_service = AIService()

            tasks = ai_service.generate_tasks(
                project_name=serializer.validated_data["project_name"],
                description=serializer.validated_data["description"]
            )

            return Response(
                {
                    "project_name": serializer.validated_data["project_name"],
                    "generated_tasks": tasks
                },
                status=status.HTTP_200_OK
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )
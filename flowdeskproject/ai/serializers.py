from rest_framework import serializers


class GenerateTaskSerializer(serializers.Serializer):
    project_name = serializers.CharField(max_length=200)
    description = serializers.CharField()
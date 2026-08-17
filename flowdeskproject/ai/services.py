from openai import OpenAI
from django.conf import settings

from .prompts import TASK_GENERATION_PROMPT


class AIService:
    def __init__(self):
        self.client = OpenAI(
            api_key=settings.OPENAI_API_KEY
        )

    def generate_tasks(self, project_name, description):
        prompt = TASK_GENERATION_PROMPT.format(
            project_name=project_name,
            description=description
        )

        response = self.client.responses.create(
            model="gpt-5.5",
            input=prompt,
        )

        return response.output_text
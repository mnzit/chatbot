import google.generativeai as genai
from app.core.config import settings

class AIService:
    def __init__(self):
        if settings.GOOGLE_API_KEY:
            genai.configure(api_key=settings.GOOGLE_API_KEY)
        self.model = genai.GenerativeModel('gemini-flash-latest')

    async def generate_response(self, context: str, message: str):
        prompt = f"Context: {context}\n\nQuestion: {message}\n\nAnswer based on the context."
        gemini_response = self.model.generate_content(prompt)
        if gemini_response.parts:
            return gemini_response.text
        return "Error generating response."

ai_service = AIService()

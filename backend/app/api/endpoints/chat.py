from fastapi import APIRouter, HTTPException
from app.schemas.bot import ChatMessage
from app.services.vector_service import vector_service
from app.services.ai_service import ai_service

router = APIRouter()

@router.post("/")
async def chat_with_bot(chat_msg: ChatMessage):
    try:
        # Retrieve context
        context = vector_service.query(chat_msg.bot_id, chat_msg.message)
        
        # Generate response
        response = await ai_service.generate_response(context, chat_msg.message)
        
        return {"response": response}
    except Exception as e:
        error_msg = str(e)
        if "429" in error_msg or "quota" in error_msg.lower():
            return {"response": "I'm currently receiving too many requests. Please wait a moment and try again! ⏳"}
        raise HTTPException(status_code=500, detail=error_msg)

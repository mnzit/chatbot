from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from datetime import datetime
from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.bot import Bot
from app.schemas.bot import Bot as BotSchema
from app.services.vector_service import vector_service

router = APIRouter()

@router.post("/", response_model=BotSchema)
async def create_bot(
    name: str = Form(...),
    context: str = Form(""),
    files: List[UploadFile] = File(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Process PDF files
    pdf_contents = []
    if files:
        for file in files:
            if file.content_type != "application/pdf":
                continue # Skip non-PDF files for now
            content = await file.read()
            pdf_contents.append(content)
    
    # Generate unique bot_id
    safe_name = name.lower().replace(" ", "-")
    unique_id = f"{safe_name}-{current_user.id}-{int(datetime.utcnow().timestamp())}"
    
    # Save to MySQL (storing only text context + count of files for metadata maybe?)
    new_bot = Bot(
        name=name,
        context=context, # Store the manual text context
        bot_id=unique_id,
        owner_id=current_user.id
    )
    db.add(new_bot)
    db.commit()
    db.refresh(new_bot)
    
    # Save to Vector DB (Includes PDF processing)
    vector_service.create_collection(unique_id, context, pdf_contents)
    
    return new_bot

@router.get("/", response_model=List[BotSchema])
async def list_bots(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(Bot).filter(Bot.owner_id == current_user.id).all()

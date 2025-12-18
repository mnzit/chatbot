from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.bot import Bot
from app.schemas.bot import BotCreate, Bot as BotSchema
from app.services.vector_service import vector_service

router = APIRouter()

@router.post("/", response_model=BotSchema)
async def create_bot(
    bot_in: BotCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Generate unique bot_id
    safe_name = bot_in.name.lower().replace(" ", "-")
    unique_id = f"{safe_name}-{current_user.id}-{int(datetime.utcnow().timestamp())}"
    
    # Save to MySQL
    new_bot = Bot(
        name=bot_in.name,
        context=bot_in.context,
        bot_id=unique_id,
        owner_id=current_user.id
    )
    db.add(new_bot)
    db.commit()
    db.refresh(new_bot)
    
    # Save to Vector DB
    vector_service.create_collection(unique_id, bot_in.context)
    
    return new_bot

@router.get("/", response_model=List[BotSchema])
async def list_bots(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(Bot).filter(Bot.owner_id == current_user.id).all()

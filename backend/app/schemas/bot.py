from pydantic import BaseModel

class BotBase(BaseModel):
    name: str
    context: str

class BotCreate(BotBase):
    pass

class Bot(BotBase):
    id: int
    bot_id: str
    owner_id: int

    class Config:
        from_attributes = True

class ChatMessage(BaseModel):
    bot_id: str
    message: str

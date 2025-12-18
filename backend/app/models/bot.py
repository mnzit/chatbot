from sqlalchemy import Column, Integer, String, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.db.session import Base

class Bot(Base):
    __tablename__ = "bots"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255))
    context = Column(Text)
    bot_id = Column(String(255), unique=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"))
    owner = relationship("User", back_populates="bots")

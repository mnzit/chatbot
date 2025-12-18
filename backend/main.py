import logging
import os
import traceback
from datetime import datetime, timedelta
from typing import List, Optional

import chromadb
import google.generativeai as genai
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Depends, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
from sqlalchemy import create_engine, Column, Integer, String, Text, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Database Setup
DATABASE_URL = os.getenv("DATABASE_URL", "mysql+pymysql://root:Root@12345@localhost:3306/mybot")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# JWT Config
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 # 1 day

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Models
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True)
    hashed_password = Column(String(255))
    bots = relationship("BotModel", back_populates="owner")

class BotModel(Base):
    __tablename__ = "bots"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255))
    context = Column(Text)
    bot_id = Column(String(255), unique=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"))
    owner = relationship("User", back_populates="bots")

Base.metadata.create_all(bind=engine)

# Pydantic Schemas
class BotCreate(BaseModel):
    name: str
    context: str

class BotResponse(BaseModel):
    id: int
    name: str
    bot_id: str
    context: str

    class Config:
        from_attributes = True

class ChatMessage(BaseModel):
    bot_id: str
    message: str

class UserCreate(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

# FastAPI Init
app = FastAPI(title="MyBot API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Initialize Chroma and Embedding
try:
    chroma_client = chromadb.PersistentClient(path="./chroma_db")
    embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
    api_key = os.getenv('GOOGLE_API_KEY')
    if api_key:
        genai.configure(api_key=api_key)
    logger.info("Initialized models and vector DB")
except Exception as e:
    logger.error(f"Init error: {str(e)}")

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Auth Utils
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
    return user

# Routes
@app.post("/register", response_model=Token)
async def register(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    new_user = User(email=user.email, hashed_password=get_password_hash(user.password))
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    access_token = create_access_token(data={"sub": new_user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/token", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/create-bot", response_model=BotResponse)
async def create_bot(bot: BotCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        # Generate a unique bot_id
        safe_name = bot.name.lower().replace(" ", "-")
        unique_id = f"{safe_name}-{current_user.id}-{int(datetime.utcnow().timestamp())}"
        
        # Save to MySQL
        db_bot = BotModel(name=bot.name, context=bot.context, bot_id=unique_id, owner_id=current_user.id)
        db.add(db_bot)
        db.commit()
        db.refresh(db_bot)
        
        # Save to ChromaDB
        collection = chroma_client.get_or_create_collection(name=unique_id)
        embeddings = embedding_model.encode(bot.context)
        collection.add(
            embeddings=[embeddings.tolist()],
            documents=[bot.context],
            ids=["context_1"]
        )
        
        return db_bot
    except Exception as e:
        logger.error(f"Error creating bot: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/bots", response_model=List[BotResponse])
async def list_bots(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(BotModel).filter(BotModel.owner_id == current_user.id).all()

@app.post("/chat")
async def chat_with_bot(message: ChatMessage):
    try:
        collection = chroma_client.get_collection(name=message.bot_id)
        query_embedding = embedding_model.encode(message.message)
        results = collection.query(
            query_embeddings=[query_embedding.tolist()],
            n_results=1
        )
        
        context = results['documents'][0][0] if results.get('documents') and results['documents'][0] else "No context found."
        
        model = genai.GenerativeModel('gemini-flash-latest')
        prompt = f"Context: {context}\n\nQuestion: {message.message}\n\nAnswer based on the context."
        
        gemini_response = model.generate_content(prompt)
        response_text = gemini_response.text if gemini_response.parts else "Error generating response."
        
        return {"response": response_text}
    except Exception as e:
        logger.error(f"Chat error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Static files
widget_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "widget")
app.mount("/widget", StaticFiles(directory=widget_path), name="widget")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
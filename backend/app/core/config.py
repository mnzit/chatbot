import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    PROJECT_NAME: str = "MyBot API"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24
    
    DATABASE_URL: str = os.getenv("DATABASE_URL", "mysql+pymysql://root:Root%4012345@localhost:3306/mybot")
    GOOGLE_API_KEY: str = os.getenv("GOOGLE_API_KEY", "")
    CHROMA_DB_PATH: str = "./chroma_db"
    
    WIDGET_PATH: str = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))), 
        "widget"
    )

settings = Settings()

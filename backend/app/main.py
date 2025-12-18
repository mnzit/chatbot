from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.api.endpoints import auth, bots, chat
from app.core.config import settings
from app.db.session import engine, Base

# Initialize Database
Base.metadata.create_all(bind=engine)

app = FastAPI(title=settings.PROJECT_NAME)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Routes
app.include_router(auth.router, prefix="/api/auth", tags=["authentication"])
app.include_router(bots.router, prefix="/api/bots", tags=["bots"])
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])

# Legacy/Root routes for frontend compatibility
app.include_router(auth.router, tags=["frontend-compat"])
app.include_router(bots.router, prefix="/bots", tags=["frontend-compat"])
app.include_router(chat.router, prefix="/chat", tags=["frontend-compat"])

# Legacy support for frontend URLs (optional, but good for compatibility)
app.include_router(auth.router, tags=["legacy-auth"]) # for /register, /token
# We need to manually add the /token route if the frontend specifically looks for it at root
# Let's add it in auth.py as well or just here.

# Static Files for Widget
app.mount("/widget", StaticFiles(directory=settings.WIDGET_PATH), name="widget")

@app.get("/")
def health_check():
    return {"status": "ok", "project": settings.PROJECT_NAME}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

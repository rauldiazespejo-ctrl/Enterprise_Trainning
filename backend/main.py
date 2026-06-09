from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import procedures, documents, websockets, chat

app = FastAPI(title="Training System API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(procedures.router, prefix="/api/v1/procedures", tags=["Procedures"])
app.include_router(documents.router, prefix="/api/v1/documents", tags=["Documents"])
app.include_router(websockets.router, tags=["WebSockets"])
app.include_router(chat.router, prefix="/api/v1/chat", tags=["Chat"])

@app.get("/health")
def health_check():
    return {"status": "ok"}

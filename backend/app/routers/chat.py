from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.qdrant_service import search_sections
from app.services.llm_processor import client
import uuid

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    procedure_id: uuid.UUID

class ChatResponse(BaseModel):
    reply: str
    sources: list[str]

@router.post("/ask", response_model=ChatResponse)
async def ask_safety_assistant(request: ChatRequest):
    # 1. Retrieve context using Hybrid Search
    results = search_sections(query=request.message, procedure_id=str(request.procedure_id), limit=3)
    
    if not results:
        return ChatResponse(
            reply="No encontré información relevante en el procedimiento actual para responder a tu pregunta.",
            sources=[]
        )
        
    # Combine context
    context_text = "\n\n".join([f"Extracto {i+1}: {res['text']}" for i, res in enumerate(results)])
    sources = [res['id'] for res in results]
    
    # 2. Build Prompt for DeepSeek
    system_prompt = """
    Eres el 'Asistente de Seguridad' (Safety Assistant), una IA experta en procedimientos operativos e industriales.
    Tu objetivo es responder a las preguntas del trabajador de manera clara, directa y segura, basándote ÚNICAMENTE en el contexto proporcionado del manual de procedimientos.
    Si la respuesta no está en el contexto, indica claramente que no tienes esa información en el manual actual y recomiéndale consultar al supervisor.
    Mantén un tono profesional pero accesible. Si mencionas riesgos o equipo de protección (EPP), resáltalo.
    """
    
    user_prompt = f"""
    Contexto del Procedimiento:
    {context_text}
    
    Pregunta del Trabajador: {request.message}
    """
    
    try:
        response = await client.chat.completions.create(
            model="deepseek-chat",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.3
        )
        
        reply = response.choices[0].message.content
        return ChatResponse(reply=reply, sources=sources)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

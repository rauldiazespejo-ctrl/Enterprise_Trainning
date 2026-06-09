from temporalio import activity
import os
import uuid
import json
import httpx
from loguru import logger

# Ensure we don't import database/LLM models at the top level of temporal activities 
# if they cause side-effects, but here it's fine for simple functions.
from app.services.pdf_extractor import extract_text_from_pdf
from app.services.llm_processor import generate_infographic_spec
from app.services.qdrant_service import add_document_sections

@activity.defn
async def extract_text_activity(file_path: str) -> str:
    """Extracts text from PDF."""
    if not os.path.exists(file_path):
        raise RuntimeError(f"File not found: {file_path}")
    text = extract_text_from_pdf(file_path)
    return text

@activity.defn
async def generate_knowledge_graph_activity(document_text: str) -> dict:
    """Uses LLM to extract JSON spec."""
    spec = await generate_infographic_spec(document_text)
    return spec

@activity.defn
async def save_to_vector_db_activity(procedure_id: str, sections_data: list) -> bool:
    """Saves generated sections to Qdrant."""
    add_document_sections(sections_data)
    return True

@activity.defn
async def update_database_status_activity(procedure_version_id: str, status: str) -> bool:
    """Updates the Postgres DB to mark version as processed/published."""
    from app.database import SessionLocal
    from app.models.learning import ProcedureVersion
    
    db = SessionLocal()
    try:
        proc = db.query(ProcedureVersion).filter(ProcedureVersion.id == procedure_version_id).first()
        if proc:
            proc.status = status
            db.commit()
            return True
    finally:
        db.close()
    return False

@activity.defn
async def cleanup_temp_file_activity(file_path: str) -> bool:
    """Removes the temporary file."""
    if os.path.exists(file_path):
        os.remove(file_path)
    return True

@activity.defn
async def broadcast_status_activity(workflow_id: str, status: str, step: str, message: str) -> bool:
    """Sends HTTP POST to internal FastAPI endpoint to trigger WebSocket broadcast."""
    try:
        # Assuming FastAPI runs on 8000
        async with httpx.AsyncClient() as client:
            await client.post(
                f"http://localhost:8000/api/v1/internal/broadcast/{workflow_id}",
                json={"status": status, "step": step, "message": message}
            )
        return True
    except Exception as e:
        logger.error(f"Broadcast failed: {e}")
        return False

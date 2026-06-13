from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
import uuid
import hashlib
import os
import asyncio
from app.database import SessionLocal, get_db
from app.models.learning import Procedure, ProcedureVersion
from app.services.websocket_manager import manager
from app.services.pdf_extractor import extract_text_from_pdf
from app.services.llm_processor import generate_infographic_spec
from app.services.qdrant_service import add_document_sections

router = APIRouter()

async def upload_to_supabase_storage(file_path: str, bucket: str = "documents"):
    """
    Mock: Uploads file to Supabase S3-compatible storage.
    In production, this replaces local file storage.
    """
    print(f"Uploading {file_path} to Supabase bucket: {bucket}...")
    await asyncio.sleep(1) # simulate network latency
    return f"https://supabase.co/storage/v1/object/public/{bucket}/{os.path.basename(file_path)}"

async def process_document_pipeline_free_tier(file_hash: str, procedure_id: uuid.UUID, procedure_version_id: uuid.UUID, file_path: str):
    """
    Lightweight background task to process documents (0 RAM overhead, replaces Temporal).
    """
    workflow_id = f"process-doc-{procedure_version_id}"
    
    try:
        await manager.broadcast_status(workflow_id, "processing", "extraction", "Extracting text from PDF (Supabase/Local)...")
        extracted_text = extract_text_from_pdf(file_path)
        
        await manager.broadcast_status(workflow_id, "processing", "ai_analysis", "Analyzing content with DeepSeek AI...")
        spec = await generate_infographic_spec(extracted_text)
        
        await manager.broadcast_status(workflow_id, "processing", "vectorization", "Generating embeddings and saving to Qdrant Cloud...")
        sections = []
        for idx, step in enumerate(spec.get("steps", [])):
            sections.append({
                "id": str(uuid.uuid4()),
                "procedure_id": str(procedure_id),
                "text": step.get("action", "")
            })
            
        add_document_sections(sections)
        
        # Update DB Status
        db = SessionLocal()
        try:
            proc = db.query(ProcedureVersion).filter(ProcedureVersion.id == procedure_version_id).first()
            if proc:
                proc.status = "published"
                db.commit()
        finally:
            db.close()
            
        await manager.broadcast_status(workflow_id, "success", "complete", "Document processed successfully!")
        
        # Cleanup
        if os.path.exists(file_path):
            os.remove(file_path)
            
    except Exception as e:
        await manager.broadcast_status(workflow_id, "failed", "error", f"Workflow failed: {str(e)}")
        db = SessionLocal()
        try:
            proc = db.query(ProcedureVersion).filter(ProcedureVersion.id == procedure_version_id).first()
            if proc:
                proc.status = "failed"
                db.commit()
        finally:
            db.close()


@router.post("/upload")
async def upload_procedure_document(
    company_id: uuid.UUID,
    title: str,
    background_tasks: BackgroundTasks,
    doc_type: str = "internal",
    client_id: uuid.UUID = None,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    if not file.filename.endswith((".pdf", ".docx", ".doc")):
        raise HTTPException(status_code=400, detail="Only PDF or Word documents are allowed")

    content = await file.read()
    file_hash = hashlib.sha256(content).hexdigest()
    
    # Check if a procedure with this title already exists for the company
    procedure = db.query(Procedure).filter_by(company_id=company_id, title=title).first()
    
    if not procedure:
        procedure = Procedure(
            company_id=company_id,
            client_id=client_id,
            type=doc_type,
            title=title
        )
        db.add(procedure)
        db.commit()
        db.refresh(procedure)
        
    # Count existing versions to define the new version name (e.g. v1.0, v2.0)
    version_count = db.query(ProcedureVersion).filter_by(procedure_id=procedure.id).count()
    new_version_str = f"v{version_count + 1}.0"
    
    proc_version = ProcedureVersion(
        procedure_id=procedure.id,
        version=new_version_str,
        status="processing",
        file_hash=file_hash
    )
    db.add(proc_version)
    db.commit()
    db.refresh(proc_version)
    
    # Save the original file locally temporarily
    temp_dir = os.path.join(os.getcwd(), "tmp")
    os.makedirs(temp_dir, exist_ok=True)

    # SECURITY FIX: Prevent path traversal by extracting the base filename
    # replacing backslashes to handle Windows paths safely
    secure_filename = os.path.basename(file.filename.replace("\\", "/"))
    temp_file_path = os.path.join(temp_dir, f"{file_hash}_{secure_filename}")
    
    with open(temp_file_path, "wb") as f:
        f.write(content)
    
    # Trigger AI processing workflow via BackgroundTasks (Free Tier)
    background_tasks.add_task(process_document_pipeline_free_tier, file_hash, procedure.id, proc_version.id, temp_file_path)
    
    return {
        "message": "Document uploaded and processing started",
        "procedure_id": procedure.id,
        "procedure_version_id": proc_version.id,
        "version": proc_version.version,
        "status": "processing"
    }

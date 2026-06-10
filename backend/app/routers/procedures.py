from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db

router = APIRouter()

from typing import List, Optional
from pydantic import BaseModel
from sqlalchemy import desc
from app.models.learning import Procedure, ProcedureVersion

class ProcedureResponse(BaseModel):
    id: str
    title: str
    type: str
    latest_version: Optional[str] = None
    status: Optional[str] = None
    created_at: str

    class Config:
        from_attributes = True

@router.get("/", response_model=List[ProcedureResponse])
def get_procedures(db: Session = Depends(get_db)):
    # Fetch procedures and their latest version
    procedures = db.query(Procedure).order_by(desc(Procedure.created_at)).all()

    result = []
    for proc in procedures:
        # Get latest version
        latest = db.query(ProcedureVersion).filter_by(procedure_id=proc.id).order_by(desc(ProcedureVersion.created_at)).first()

        result.append({
            "id": str(proc.id),
            "title": proc.title,
            "type": proc.type,
            "latest_version": latest.version if latest else None,
            "status": latest.status if latest else None,
            "created_at": proc.created_at.isoformat() if proc.created_at else ""
        })

    return result

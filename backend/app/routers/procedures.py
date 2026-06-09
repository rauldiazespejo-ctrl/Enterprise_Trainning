from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db

router = APIRouter()

@router.get("/")
def get_procedures(db: Session = Depends(get_db)):
    # Placeholder for fetching procedures
    return {"message": "List of procedures"}

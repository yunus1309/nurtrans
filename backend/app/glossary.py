from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models import Glossary
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter(prefix="/glossary", tags=["glossary"])

class GlossaryCreate(BaseModel):
    source_term: str
    target_term: str
    description: Optional[str] = None

class GlossaryResponse(GlossaryCreate):
    id: int

    class Config:
        from_attributes = True

@router.post("/", response_model=GlossaryResponse)
def create_term(term: GlossaryCreate, db: Session = Depends(get_db)):
    # Check case-insensitive uniqueness
    existing = db.query(Glossary).filter(func.lower(Glossary.source_term) == func.lower(term.source_term)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Term already exists in glossary")

    new_term = Glossary(
        source_term=term.source_term,
        target_term=term.target_term,
        description=term.description
    )
    db.add(new_term)
    db.commit()
    db.refresh(new_term)
    return new_term

@router.get("/", response_model=List[GlossaryResponse])
def get_terms(db: Session = Depends(get_db)):
    return db.query(Glossary).all()

@router.delete("/{term_id}")
def delete_term(term_id: int, db: Session = Depends(get_db)):
    term = db.query(Glossary).filter(Glossary.id == term_id).first()
    if not term:
        raise HTTPException(status_code=404, detail="Term not found")
    db.delete(term)
    db.commit()
    return {"message": "Deleted successfully"}

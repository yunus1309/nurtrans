from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Comment, Segment, User
from pydantic import BaseModel
from typing import List
from datetime import datetime

router = APIRouter(prefix="/comments", tags=["comments"])

class CommentCreate(BaseModel):
    segment_id: int
    content: str

class CommentResponse(BaseModel):
    id: int
    segment_id: int
    user_id: int
    content: str
    created_at: datetime

    class Config:
        from_attributes = True

@router.post("/", response_model=CommentResponse)
def add_comment(comment: CommentCreate, db: Session = Depends(get_db)):
    # Assuming user_id=1 for mock
    user_id = 1

    seg = db.query(Segment).filter(Segment.id == comment.segment_id).first()
    if not seg:
        raise HTTPException(status_code=404, detail="Segment not found")

    new_comment = Comment(
        segment_id=comment.segment_id,
        user_id=user_id,
        content=comment.content
    )
    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)
    return new_comment

@router.get("/segment/{segment_id}", response_model=List[CommentResponse])
def get_comments(segment_id: int, db: Session = Depends(get_db)):
    return db.query(Comment).filter(Comment.segment_id == segment_id).all()

@router.delete("/{comment_id}")
def delete_comment(comment_id: int, db: Session = Depends(get_db)):
    # Logic to check if user is admin or creator
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    db.delete(comment)
    db.commit()
    return {"message": "Comment deleted"}

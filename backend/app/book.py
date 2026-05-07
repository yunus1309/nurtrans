from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Project, Document, Paragraph, Segment, SegmentStatusEnum

router = APIRouter(prefix="/book", tags=["book"])

@router.get("/{project_id}")
def get_book_view(project_id: int, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    docs = db.query(Document).filter(Document.project_id == project_id).all()
    # In a real app we'd construct the hierarchical JSON response (Doc -> Para -> Segments)
    return {"project_id": project_id, "documents": [{"id": d.id, "title": d.title} for d in docs]}

@router.post("/{project_id}/mass_approve")
def mass_approve_chapter(project_id: int, document_id: int, db: Session = Depends(get_db)):
    # Assuming "mass approval" means taking all segments in a document that are not 'completed' and marking them as completed
    # Or more safely, confirming all existing 'completed' segments and locking them down
    # Here we just mark all as completed for demo purposes

    count = db.query(Segment).filter(
        Segment.paragraph_id.in_(db.query(Paragraph.id).filter(Paragraph.document_id == document_id)),
        Segment.status != SegmentStatusEnum.completed
    ).update({Segment.status: SegmentStatusEnum.completed}, synchronize_session=False)

    db.commit()
    return {"message": f"Mass approved {count} segments."}

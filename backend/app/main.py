import os
from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.concurrency import run_in_threadpool
from sqlalchemy.orm import Session
from app.database import engine, Base, get_db
from app.models import User, Project, Document, Segment, Paragraph
from app.schemas import UserCreate, UserResponse, Token, ProjectCreate, ProjectResponse, SegmentResponse, UserUpdate
from fastapi.security import OAuth2PasswordRequestForm
from app.auth import get_password_hash, verify_password, create_access_token, get_current_user
from app.worker.tasks import process_document
from typing import List
from app.sockets import router as sockets_router
from app.glossary import router as glossary_router
from app.book import router as book_router
from app.comments import router as comments_router
from fastapi.middleware.cors import CORSMiddleware

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Translation Software API")

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, set this to the actual frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(sockets_router)
app.include_router(glossary_router)
app.include_router(book_router)
app.include_router(comments_router)

@app.post("/auth/register", response_model=UserResponse)
def register(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")

    hashed_password = get_password_hash(user.password)
    new_user = User(username=user.username, hashed_password=hashed_password, language=user.language)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/auth/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.username == form_data.username).first()
    if not db_user or not verify_password(form_data.password, db_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(data={"sub": db_user.username})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/users/me", response_model=UserResponse)
def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

@app.put("/users/me/language", response_model=UserResponse)
def update_user_language(user_update: UserUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user_update.language is not None:
        current_user.language = user_update.language
        db.commit()
        db.refresh(current_user)
    return current_user

@app.post("/projects", response_model=ProjectResponse)
def create_project(project: ProjectCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    new_project = Project(
        name=project.name,
        description=project.description,
        source_language=project.source_language,
        target_language=project.target_language
    )
    db.add(new_project)
    db.commit()
    db.refresh(new_project)
    # Admin rights are handled via ProjectUser in a full impl
    return new_project

@app.get("/projects", response_model=List[ProjectResponse])
def get_projects(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Project).all()

@app.get("/projects/{project_id}", response_model=ProjectResponse)
def get_project(project_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@app.post("/projects/{project_id}/documents")
async def upload_document(
    project_id: int,
    file: UploadFile = File(...),
    page_number: int = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Run synchronous database query in a threadpool to avoid blocking the event loop
    project = await run_in_threadpool(
        db.query(Project).filter(Project.id == project_id).first
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    file_content = await file.read()
    file_extension = ""
    if file.filename.endswith(".txt"):
        file_extension = ".txt"
    elif file.filename.endswith(".docx"):
        file_extension = ".docx"
    else:
        raise HTTPException(status_code=400, detail="Unsupported file format")

    import base64

    new_doc = Document(project_id=project.id, title=file.filename, page_number=page_number)

    def save_document_sync(doc):
        db.add(doc)
        db.commit()
        db.refresh(doc)

    await run_in_threadpool(save_document_sync, new_doc)

    # Queue the background task - encoding bytes to b64 string to be JSON serializable for Celery
    b64_content = base64.b64encode(file_content).decode('utf-8')
    process_document.delay(new_doc.id, b64_content, file_extension)

    return {"message": "Document uploaded and processing started", "document_id": new_doc.id}

@app.get("/documents/{document_id}/segments", response_model=List[SegmentResponse])
def get_document_segments(document_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    segments = db.query(Segment).join(Paragraph).filter(Paragraph.document_id == document_id).order_by(Paragraph.order, Segment.order).all()
    return segments

from pydantic import BaseModel
class SegmentUpdateRequest(BaseModel):
    target_text: str
    status: str

@app.put("/segments/{segment_id}", response_model=SegmentResponse)
def update_segment(segment_id: int, update_data: SegmentUpdateRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    segment = db.query(Segment).filter(Segment.id == segment_id).first()
    if not segment:
        raise HTTPException(status_code=404, detail="Segment not found")

    segment.target_text = update_data.target_text
    segment.status = update_data.status
    segment.last_modified_by = current_user.id

    db.commit()
    db.refresh(segment)
    return segment

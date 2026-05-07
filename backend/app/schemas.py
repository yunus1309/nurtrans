from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from app.models import RoleEnum, SegmentStatusEnum, AccessLevelEnum

from pydantic import BaseModel, Field

class UserCreate(BaseModel):
    username: str
    password: str = Field(..., max_length=72)
    language: Optional[str] = "en"

class UserResponse(BaseModel):
    id: int
    username: str
    role: RoleEnum
    is_active: bool
    language: str

    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    language: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str

class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None
    source_language: str
    target_language: str

class ProjectCreate(ProjectBase):
    pass

class DocumentResponse(BaseModel):
    id: int
    project_id: int
    title: str
    page_number: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ProjectResponse(ProjectBase):
    id: int
    created_at: datetime
    documents: List[DocumentResponse] = []

    class Config:
        from_attributes = True

class ProjectUserResponse(BaseModel):
    user_id: int
    project_id: int
    access_level: AccessLevelEnum
    can_edit_source: bool
    user: UserResponse

    class Config:
        from_attributes = True

class SegmentResponse(BaseModel):
    id: int
    paragraph_id: int
    order: int
    uid: Optional[str] = None
    kind: Optional[str] = None
    trados_id: Optional[str] = None
    source_text: str
    target_text: Optional[str] = None
    status: SegmentStatusEnum

    class Config:
        from_attributes = True

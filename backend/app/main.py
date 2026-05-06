from datetime import datetime, timedelta, timezone
from typing import Literal

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, EmailStr

app = FastAPI(title="NurTrans API", version="0.1.0")

# MVP in-memory stores (replace with PostgreSQL/Redis in next iteration)
USERS = {}
GLOSSARY = {}
SEGMENTS = {
    1: {"id": 1, "source": "Hallo Welt", "target": "", "status": "new", "version": 1},
    2: {"id": 2, "source": "Das ist ein Test", "target": "", "status": "new", "version": 1},
}


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class GlossaryEntry(BaseModel):
    id: int | None = None
    source_term: str
    target_term: str
    description: str = ""
    status: Literal["approved", "draft", "deprecated"] = "approved"


class ReplaceRequest(BaseModel):
    source_term: str
    new_target_term: str
    apply_to_done_segments: bool = False


class SegmentUpdateRequest(BaseModel):
    target: str
    status: Literal["new", "in_progress", "done"]
    version: int


@app.get("/health")
def health():
    return {"status": "ok", "timestamp": datetime.now(timezone.utc).isoformat()}


@app.post("/auth/register")
def register(payload: RegisterRequest):
    if payload.email in USERS:
        raise HTTPException(400, "User already exists")
    USERS[payload.email] = {"password": payload.password}
    return {"message": "registered"}


@app.post("/auth/login")
def login(payload: LoginRequest):
    user = USERS.get(payload.email)
    if not user or user["password"] != payload.password:
        raise HTTPException(401, "Invalid credentials")
    return {
        "access_token": f"mvp-token-{payload.email}",
        "expires_at": (datetime.now(timezone.utc) + timedelta(hours=1)).isoformat(),
    }


@app.get("/segments")
def list_segments():
    return list(SEGMENTS.values())


@app.patch("/segments/{segment_id}")
def update_segment(segment_id: int, payload: SegmentUpdateRequest):
    segment = SEGMENTS.get(segment_id)
    if not segment:
        raise HTTPException(404, "Segment not found")
    if payload.version != segment["version"]:
        raise HTTPException(409, "Version conflict")
    segment["target"] = payload.target
    segment["status"] = payload.status
    segment["version"] += 1
    return segment


@app.get("/glossary")
def list_glossary():
    return list(GLOSSARY.values())


@app.post("/glossary")
def add_glossary(entry: GlossaryEntry):
    next_id = max(GLOSSARY.keys(), default=0) + 1
    obj = entry.model_dump()
    obj["id"] = next_id
    GLOSSARY[next_id] = obj
    return obj


@app.post("/glossary/replace-preview")
def replace_preview(payload: ReplaceRequest):
    hits = []
    for seg in SEGMENTS.values():
        if payload.source_term.lower() in seg["source"].lower() or payload.source_term.lower() in seg["target"].lower():
            if not payload.apply_to_done_segments and seg["status"] == "done":
                continue
            hits.append(seg)
    return {"count": len(hits), "hits": hits}

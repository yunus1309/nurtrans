from sqlalchemy.orm import Session
from sqlalchemy import text
from app.models import TranslationMemory, SegmentHistory, Segment, SegmentStatusEnum
from typing import List

def setup_trgm_extension(db: Session):
    db.execute(text("CREATE EXTENSION IF NOT EXISTS pg_trgm;"))
    db.commit()

def create_tm_index(db: Session):
    # Setup GIN index for trigram similarity
    db.execute(text("CREATE INDEX IF NOT EXISTS trgm_idx_source_text ON translation_memories USING GIN (source_text gin_trgm_ops);"))
    db.commit()

def search_tm(db: Session, query: str, threshold: float = 0.5) -> List[dict]:
    # Set the similarity threshold for the session
    db.execute(text("SET pg_trgm.similarity_threshold = :threshold"), {"threshold": threshold})

    # Query for matches above the threshold
    sql = text("""
        SELECT id, source_text, target_text, similarity(source_text, :query) as sml
        FROM translation_memories
        WHERE source_text % :query
        ORDER BY sml DESC
        LIMIT 5;
    """)
    result = db.execute(sql, {"query": query}).fetchall()

    return [{"id": row[0], "source_text": row[1], "target_text": row[2], "similarity": row[3]} for row in result]

def save_to_tm(db: Session, source_text: str, target_text: str):
    new_tm = TranslationMemory(source_text=source_text, target_text=target_text)
    db.add(new_tm)
    db.commit()

def record_segment_history(db: Session, segment_id: int, user_id: int, target_text: str, status: SegmentStatusEnum):
    history = SegmentHistory(
        segment_id=segment_id,
        user_id=user_id,
        target_text=target_text,
        status=status
    )
    db.add(history)
    db.commit()

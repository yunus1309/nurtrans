from app.worker.celery_app import celery_app
from app.database import SessionLocal
from app.models import Document, Paragraph, Segment
from app.worker.parser import parse_txt_file, segment_paragraph, parse_docx_file
import tempfile
import os

import base64

@celery_app.task
def process_document(document_id: int, b64_content: str, file_extension: str):
    db = SessionLocal()
    try:
        doc = db.query(Document).filter(Document.id == document_id).first()
        if not doc:
            return "Document not found"

        file_content = base64.b64decode(b64_content)

        paragraphs = []
        if file_extension == ".txt":
            content_str = file_content.decode("utf-8")
            paragraphs = parse_txt_file(content_str)
        elif file_extension == ".docx":
            # Save to temp file since python-docx needs a file path or file-like object
            with tempfile.NamedTemporaryFile(delete=False, suffix=".docx") as temp:
                temp.write(file_content)
                temp_path = temp.name
            paragraphs = parse_docx_file(temp_path)
            os.remove(temp_path)
        else:
            return "Unsupported file type"

        for p_idx, p_text in enumerate(paragraphs):
            new_paragraph = Paragraph(
                document_id=doc.id,
                order=p_idx
            )
            db.add(new_paragraph)
            db.flush() # To get the new_paragraph.id

            sentences = segment_paragraph(p_text)
            for s_idx, s_text in enumerate(sentences):
                # We can generate a UID based on doc.id, p_idx, s_idx
                uid = f"d{doc.id}-p{p_idx}-s{s_idx}"
                new_segment = Segment(
                    paragraph_id=new_paragraph.id,
                    order=s_idx,
                    uid=uid,
                    kind="prose",
                    source_text=s_text
                )
                db.add(new_segment)

        db.commit()
        return f"Processed document {document_id} successfully."
    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close()

from app.worker.exporter import generate_yaml_corpus

@celery_app.task
def export_project_corpus(project_id: int):
    db = SessionLocal()
    try:
        file_path = generate_yaml_corpus(db, project_id)
        # In a real app, upload this file to S3 or a shared volume and notify the user
        return f"Exported corpus to {file_path}"
    except Exception as e:
        raise e
    finally:
        db.close()

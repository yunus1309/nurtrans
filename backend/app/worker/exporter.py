from app.models import Project, Document, Paragraph, Segment
from sqlalchemy.orm import Session
import yaml
import tempfile
import os

def generate_yaml_corpus(db: Session, project_id: int):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        return None

    documents = db.query(Document).filter(Document.project_id == project_id).order_by(Document.page_number).all()

    yaml_data = {
        'schema_version': 1,
        'book': {
            'title': project.name,
            'pages': []
        }
    }

    for doc in documents:
        page_data = {
            'page_no': doc.page_number or doc.id,
            'headings': {'l1': None, 'l2': None, 'l3': None, 'l4': None, 'l5': None}, # Basic structure
            'paragraphs': []
        }

        paragraphs = db.query(Paragraph).filter(Paragraph.document_id == doc.id).order_by(Paragraph.order).all()
        for p in paragraphs:
            para_data = {
                'paragraph_no': p.order + 1,
                'sentences': []
            }
            segments = db.query(Segment).filter(Segment.paragraph_id == p.id).order_by(Segment.order).all()
            for s in segments:
                sent_data = {
                    'uid': s.uid,
                    'sentence_no_in_paragraph': s.order + 1,
                    'trados_sentence_id': s.trados_id,
                    'kind': s.kind or 'prose',
                    'original': s.source_text,
                    'translated_de': s.target_text,
                    'notes': None
                }
                para_data['sentences'].append(sent_data)
            page_data['paragraphs'].append(para_data)

        yaml_data['book']['pages'].append(page_data)

    class CustomDumper(yaml.Dumper):
        def increase_indent(self, flow=False, indentless=False):
            return super(CustomDumper, self).increase_indent(flow, False)

    with tempfile.NamedTemporaryFile(delete=False, suffix=".yaml", mode="w", encoding="utf-8") as temp:
        yaml.dump(yaml_data, temp, Dumper=CustomDumper, default_flow_style=False, sort_keys=False, allow_unicode=True)
        return temp.name

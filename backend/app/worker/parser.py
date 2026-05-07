import re
from docx import Document

def parse_txt_file(content: str):
    """
    Reads the .txt file content and returns a list of paragraphs.
    """
    paragraphs = []
    for line in content.splitlines():
        line = line.strip()
        if line:
            paragraphs.append(line)
    return paragraphs

def segment_paragraph(paragraph_text: str):
    """
    Very simple sentence boundary detection.
    Splits by . ! ? followed by space or end of string.
    """
    sentences = re.split(r'(?<=[.!?])\s+', paragraph_text.strip())
    return [s.strip() for s in sentences if s.strip()]

def parse_docx_file(file_path: str):
    """
    Reads a docx file and extracts paragraphs.
    We'll keep it simple for now and just extract text.
    In a real scenario, we'd want to preserve formatting tags (like TipTap JSON).
    """
    doc = Document(file_path)
    paragraphs = []
    for p in doc.paragraphs:
        if p.text.strip():
            paragraphs.append(p.text.strip())
    return paragraphs

import fitz  # PyMuPDF

def extract_text_from_pdf(file_path: str) -> str:
    """Extracts text and basic layout from a PDF file."""
    doc = fitz.open(file_path)
    full_text = ""
    for page_num in range(len(doc)):
        page = doc.load_page(page_num)
        text = page.get_text("text")
        full_text += f"\n--- Page {page_num + 1} ---\n{text}"
    return full_text

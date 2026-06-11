import fitz  # PyMuPDF

def extract_text_from_pdf(file_path: str) -> str:
    """Extracts text and basic layout from a PDF file."""
    # ⚡ Bolt optimization: Use list for O(N) string building instead of O(N^2) concatenation
    doc = fitz.open(file_path)
    pages_text = []
    for page_num in range(len(doc)):
        page = doc.load_page(page_num)
        text = page.get_text("text")
        pages_text.append(f"\n--- Page {page_num + 1} ---\n{text}")
    return "".join(pages_text)

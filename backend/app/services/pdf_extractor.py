import fitz  # PyMuPDF

def extract_text_from_pdf(file_path: str) -> str:
    """Extracts text and basic layout from a PDF file."""
    # BOLT OPTIMIZATION: Use context manager to prevent memory/file-descriptor leaks
    # and list buffer + join() to avoid O(N^2) string concatenation overhead.
    with fitz.open(file_path) as doc:
        pages_text = []
        for page_num in range(len(doc)):
            page = doc.load_page(page_num)
            text = page.get_text("text")
            pages_text.append(f"\n--- Page {page_num + 1} ---\n{text}")
        return "".join(pages_text)

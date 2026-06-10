import fitz  # PyMuPDF

def extract_text_from_pdf(file_path: str) -> str:
    """Extracts text and basic layout from a PDF file."""
    doc = fitz.open(file_path)

    # ⚡ Bolt Optimization: Replace O(N²) string concatenation (+=) with O(N) list joining.
    # Appending to a list and joining at the end is significantly faster,
    # especially for PDFs with hundreds of pages.
    text_chunks = []

    for page_num in range(len(doc)):
        page = doc.load_page(page_num)
        text = page.get_text("text")
        text_chunks.append(f"\n--- Page {page_num + 1} ---\n{text}")

    return "".join(text_chunks)

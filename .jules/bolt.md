## 2024-05-24 - Avoid Event Loop Blocking and O(N²) String Concatenation

**Learning:**
1. **Event Loop Blocking:** Using synchronous operations (like `fitz.open()` from PyMuPDF, or synchronous `qdrant_client` network calls) directly inside FastAPI `async def` endpoints or BackgroundTasks blocks the main event loop. This leads to severe performance degradation because all other concurrent requests are paused while waiting for I/O or CPU-intensive work to complete.
2. **PyMuPDF Overhead & Leaks:** Using `+=` to concatenate strings in a loop when extracting text from large PDFs causes O(N²) performance degradation because strings are immutable in Python, requiring continuous memory reallocation. Additionally, failing to close `fitz.open()` correctly leads to memory and file descriptor leaks.

**Action:**
- **Offload Synchronous Work:** Always use `asyncio.to_thread(func, *args)` to wrap synchronous blocking functions when inside an `async def` context in FastAPI. This runs the work in a separate thread and prevents blocking the event loop.
- **Efficient PDF Extraction:** Always use a context manager (`with fitz.open(...) as doc:`) when dealing with PyMuPDF to automatically clean up resources. When building large text strings, use a list buffer (`pages.append(text)`) and join them (`"".join(pages)`) to maintain O(N) performance.

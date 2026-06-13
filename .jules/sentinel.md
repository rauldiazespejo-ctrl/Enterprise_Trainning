## 2026-06-13 - [Path Traversal in Document Upload]
**Vulnerability:** Found a Path Traversal vulnerability in the document upload endpoint (`backend/app/routers/documents.py`). The user-provided `file.filename` was directly used in `os.path.join` without sanitization, allowing potential path traversal despite the hash prefix.
**Learning:** The built-in upload logic must always sanitize filenames, as FastAPI's `UploadFile.filename` does not provide platform-independent sanitization against directory traversal characters.
**Prevention:** Always sanitize `UploadFile.filename` by replacing backslashes with forward slashes and extracting the basename (`os.path.basename`) before joining it with internal paths.

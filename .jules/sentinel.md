## 2024-06-12 - [Critical] Path Traversal in File Upload
**Vulnerability:** The temporary file path for uploaded documents was being constructed by directly concatenating a hash with the user-provided `file.filename` using `os.path.join`. Because `os.path.join` preserves absolute paths or relative traversals like `../` on Linux, an attacker could supply a filename like `foo/../../../etc/passwd` to overwrite arbitrary system files or write outside the intended directory.
**Learning:** `os.path.join` is not safe when working with user-provided filenames, even when prepended with a prefix like `hash_`.
**Prevention:** Always extract only the filename base using `os.path.basename()` (or `werkzeug.utils.secure_filename`) before using user-supplied filenames in file system operations.

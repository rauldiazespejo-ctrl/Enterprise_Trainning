## 2024-06-11 - [String Concatenation in Document Parsing]
**Learning:** Python string concatenation (`+=`) in loops leads to O(N^2) time complexity, which causes performance bottlenecks for large inputs (like extracting text from multi-page PDFs).
**Action:** Always use a list to accumulate strings and `"".join()` at the end for O(N) complexity when processing large documents.

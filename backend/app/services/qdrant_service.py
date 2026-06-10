import os
import uuid
from qdrant_client import QdrantClient
from qdrant_client.http import models
from typing import List, Dict, Any
from app.config import settings

# Initialize Qdrant Client. FastEmbed model is loaded automatically on first use.
if settings.QDRANT_URL and settings.QDRANT_API_KEY:
    client = QdrantClient(url=settings.QDRANT_URL, api_key=settings.QDRANT_API_KEY)
else:
    QDRANT_HOST = os.getenv("QDRANT_HOST", "localhost")
    QDRANT_PORT = int(os.getenv("QDRANT_PORT", "6333"))
    client = QdrantClient(host=QDRANT_HOST, port=QDRANT_PORT)

client.set_model("sentence-transformers/all-MiniLM-L6-v2")
client.set_sparse_model("Qdrant/bm25")

COLLECTION_NAME = "document_sections_hybrid"

def init_qdrant():
    """Initializes the Qdrant collection if it doesn't exist for Hybrid Search."""
    if not client.collection_exists(COLLECTION_NAME):
        client.create_collection(
            collection_name=COLLECTION_NAME,
            vectors_config=client.get_fastembed_vector_params(),
            sparse_vectors_config=client.get_fastembed_sparse_vector_params()
        )

def add_document_sections(sections: List[Dict[str, Any]]):
    """
    Adds sections to Qdrant.
    sections expected format: [{"id": "uuid", "text": "...", "procedure_id": "..."}]
    """
    init_qdrant()
        
    docs = [sec["text"] for sec in sections]
    metadata = [{"procedure_id": str(sec.get("procedure_id")), "section_id": str(sec.get("id"))} for sec in sections]
    
    # We generate UUIDs as strings for Qdrant if they are UUID objects
    ids = [str(sec["id"]) for sec in sections]
    
    client.add(
        collection_name=COLLECTION_NAME,
        documents=docs,
        metadata=metadata,
        ids=ids
    )

def search_sections(query: str, procedure_id: str = None, limit: int = 5):
    """
    Searches for relevant sections using Hybrid Search (Dense + Sparse BM25 + Reciprocal Rank Fusion).
    """
    query_filter = None
    if procedure_id:
        query_filter = models.Filter(
            must=[
                models.FieldCondition(
                    key="procedure_id",
                    match=models.MatchValue(value=str(procedure_id))
                )
            ]
        )
        
    results = client.query(
        collection_name=COLLECTION_NAME,
        query_text=query,
        query_filter=query_filter,
        limit=limit
    )
    
    return [
        {
            "id": res.id,
            "text": res.document,
            "score": res.score,
            "metadata": res.metadata
        }
        for res in results
    ]

import asyncio
import os
from temporalio.client import Client
from temporalio.worker import Worker

from app.workflows.document_workflow import ProcessDocumentWorkflow
from app.workflows.document_activities import (
    extract_text_activity,
    generate_knowledge_graph_activity,
    save_to_vector_db_activity,
    update_database_status_activity,
    cleanup_temp_file_activity
)

TEMPORAL_HOST = os.getenv("TEMPORAL_HOST", "localhost:7233")

async def main():
    # Connect to the Temporal cluster
    client = await Client.connect(TEMPORAL_HOST)
    
    # Run the worker
    worker = Worker(
        client,
        task_queue="document-processing-queue",
        workflows=[ProcessDocumentWorkflow],
        activities=[
            extract_text_activity,
            generate_knowledge_graph_activity,
            save_to_vector_db_activity,
            update_database_status_activity,
            cleanup_temp_file_activity
        ],
    )
    print(f"Starting Temporal Worker on task queue 'document-processing-queue' connecting to {TEMPORAL_HOST}...")
    await worker.run()

if __name__ == "__main__":
    asyncio.run(main())

import asyncio
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
from loguru import logger
from app.config import settings

TEMPORAL_HOST = settings.TEMPORAL_HOST

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
    logger.info(f"Starting Temporal Worker on task queue 'document-processing-queue' connecting to {TEMPORAL_HOST}...")
    await worker.run()

if __name__ == "__main__":
    asyncio.run(main())

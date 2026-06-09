from datetime import timedelta
from temporalio import workflow

with workflow.unsafe.imports_passed_through():
    from app.workflows.document_activities import (
        extract_text_activity,
        generate_knowledge_graph_activity,
        save_to_vector_db_activity,
        update_database_status_activity,
        cleanup_temp_file_activity,
        broadcast_status_activity
    )

@workflow.defn
class ProcessDocumentWorkflow:
    @workflow.run
    async def run(self, file_path: str, procedure_id: str, procedure_version_id: str) -> dict:
        try:
            workflow_id = workflow.info().workflow_id
            
            await workflow.execute_activity(
                broadcast_status_activity,
                args=[workflow_id, "processing", "extraction", "Extracting text from PDF..."],
                start_to_close_timeout=timedelta(seconds=10),
            )
            
            # 1. Extract Text
            text = await workflow.execute_activity(
                extract_text_activity,
                file_path,
                start_to_close_timeout=timedelta(minutes=5),
            )
            
            await workflow.execute_activity(
                broadcast_status_activity,
                args=[workflow_id, "processing", "ai_analysis", "Analyzing content with DeepSeek AI..."],
                start_to_close_timeout=timedelta(seconds=10),
            )
            
            # 2. Extract structured knowledge via LLM
            spec = await workflow.execute_activity(
                generate_knowledge_graph_activity,
                text,
                start_to_close_timeout=timedelta(minutes=10),
            )
            
            await workflow.execute_activity(
                broadcast_status_activity,
                args=[workflow_id, "processing", "vectorization", "Generating embeddings and saving to Qdrant..."],
                start_to_close_timeout=timedelta(seconds=10),
            )
            
            # 3. Save pseudo-sections to Qdrant
            sections = []
            for idx, step in enumerate(spec.get("steps", [])):
                import uuid
                sec_id = str(uuid.uuid4())
                sections.append({
                    "id": sec_id,
                    "procedure_id": procedure_id,
                    "text": step.get("action", "")
                })
                
            await workflow.execute_activity(
                save_to_vector_db_activity,
                args=[procedure_id, sections],
                start_to_close_timeout=timedelta(minutes=2),
            )
            
            # 4. Mark complete in DB
            await workflow.execute_activity(
                update_database_status_activity,
                args=[procedure_version_id, "published"],
                start_to_close_timeout=timedelta(seconds=30),
            )

            await workflow.execute_activity(
                broadcast_status_activity,
                args=[workflow_id, "success", "complete", "Document processed successfully!"],
                start_to_close_timeout=timedelta(seconds=10),
            )
            
            return {"status": "success", "spec_title": spec.get("title")}
            
        except Exception as e:
            await workflow.execute_activity(
                update_database_status_activity,
                args=[procedure_version_id, "failed"],
                start_to_close_timeout=timedelta(seconds=30),
            )
            
            workflow_id = workflow.info().workflow_id
            await workflow.execute_activity(
                broadcast_status_activity,
                args=[workflow_id, "failed", "error", f"Workflow failed: {str(e)}"],
                start_to_close_timeout=timedelta(seconds=10),
            )
            
            raise e
        finally:
            await workflow.execute_activity(
                cleanup_temp_file_activity,
                file_path,
                start_to_close_timeout=timedelta(seconds=30),
            )

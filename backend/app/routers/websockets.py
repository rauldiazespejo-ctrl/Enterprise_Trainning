from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException
from pydantic import BaseModel
from app.services.websocket_manager import manager

router = APIRouter()

class BroadcastMessage(BaseModel):
    status: str
    step: str
    message: str

@router.post("/api/v1/internal/broadcast/{workflow_id}")
async def internal_broadcast(workflow_id: str, payload: BroadcastMessage):
    # This endpoint is intended to be called by the Temporal worker to notify the frontend
    await manager.broadcast_status(workflow_id, payload.status, payload.step, payload.message)
    return {"success": True}

@router.websocket("/ws/workflow/{workflow_id}")
async def websocket_endpoint(websocket: WebSocket, workflow_id: str):
    await manager.connect(websocket, workflow_id)
    try:
        while True:
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, workflow_id)

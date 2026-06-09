from fastapi import WebSocket
from typing import Dict, List
import json

class ConnectionManager:
    def __init__(self):
        # Maps workflow_id to a list of connected websockets
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, workflow_id: str):
        await websocket.accept()
        if workflow_id not in self.active_connections:
            self.active_connections[workflow_id] = []
        self.active_connections[workflow_id].append(websocket)

    def disconnect(self, websocket: WebSocket, workflow_id: str):
        if workflow_id in self.active_connections:
            self.active_connections[workflow_id].remove(websocket)
            if len(self.active_connections[workflow_id]) == 0:
                del self.active_connections[workflow_id]

    async def broadcast_status(self, workflow_id: str, status: str, step: str, message: str):
        """Sends a JSON status update to all clients listening to a specific workflow."""
        if workflow_id in self.active_connections:
            payload = json.dumps({"status": status, "step": step, "message": message})
            for connection in self.active_connections[workflow_id]:
                await connection.send_text(payload)

manager = ConnectionManager()

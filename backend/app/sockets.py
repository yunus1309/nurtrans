from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, List
import json

router = APIRouter()

class ConnectionManager:
    def __init__(self):
        # Maps document_id to a list of WebSockets
        self.active_connections: Dict[str, List[WebSocket]] = {}
        # Maps document_id to segment_id to user_id (who is currently locking it)
        self.locks: Dict[str, Dict[str, str]] = {}
        # Maps WebSocket to user_id
        self.user_ids: Dict[WebSocket, str] = {}

    async def connect(self, websocket: WebSocket, document_id: str):
        await websocket.accept()
        if document_id not in self.active_connections:
            self.active_connections[document_id] = []
            self.locks[document_id] = {}
        self.active_connections[document_id].append(websocket)
        # Send current locks state to the new connection
        await websocket.send_json({"type": "init_locks", "locks": self.locks[document_id]})

    def disconnect(self, websocket: WebSocket, document_id: str):
        if websocket in self.user_ids:
            del self.user_ids[websocket]
        if document_id in self.active_connections:
            if websocket in self.active_connections[document_id]:
                self.active_connections[document_id].remove(websocket)
            if not self.active_connections[document_id]:
                del self.active_connections[document_id]
                if document_id in self.locks:
                    del self.locks[document_id]

    async def broadcast(self, document_id: str, message: dict, sender: WebSocket = None):
        if document_id in self.active_connections:
            for connection in self.active_connections[document_id]:
                if connection != sender:
                    try:
                        await connection.send_json(message)
                    except Exception:
                        pass # Handle dead connections

manager = ConnectionManager()

@router.websocket("/ws/editor/{document_id}")
async def websocket_endpoint(websocket: WebSocket, document_id: str):
    await manager.connect(websocket, document_id)
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            msg_type = message.get("type")

            if msg_type == "lock_segment":
                segment_id = message.get("segment_id")
                user_id = message.get("user_id")
                # Record user_id association
                manager.user_ids[websocket] = user_id
                # Store lock
                manager.locks[document_id][segment_id] = user_id
                # Broadcast lock to others
                await manager.broadcast(document_id, {
                    "type": "segment_locked",
                    "segment_id": segment_id,
                    "user_id": user_id
                }, sender=websocket)

            elif msg_type == "unlock_segment":
                segment_id = message.get("segment_id")
                user_id = message.get("user_id")
                if segment_id in manager.locks[document_id] and manager.locks[document_id][segment_id] == user_id:
                    del manager.locks[document_id][segment_id]
                # Broadcast unlock
                await manager.broadcast(document_id, {
                    "type": "unlock_segment",
                    "segment_id": segment_id
                }, sender=websocket)

            elif msg_type == "segment_update":
                # E.g. typing in progress or completed
                await manager.broadcast(document_id, message, sender=websocket)

    except WebSocketDisconnect:
        user_id = manager.user_ids.get(websocket)
        manager.disconnect(websocket, document_id)
        if user_id and document_id in manager.locks:
            segments_to_unlock = [
                seg_id for seg_id, u_id in manager.locks[document_id].items()
                if u_id == user_id
            ]
            for segment_id in segments_to_unlock:
                del manager.locks[document_id][segment_id]
                await manager.broadcast(document_id, {
                    "type": "unlock_segment",
                    "segment_id": segment_id
                })

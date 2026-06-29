from fastapi import WebSocket
from typing import Dict, List
import json

class ConnectionManager:
    def __init__(self):
        # conv_id -> list of (user_id, websocket)
        self.rooms: Dict[int, List[tuple]] = {}

    async def connect(self, websocket: WebSocket, conv_id: int, user_id: int):
        await websocket.accept()
        self.rooms.setdefault(conv_id, []).append((user_id, websocket))

    def disconnect(self, websocket: WebSocket, conv_id: int):
        self.rooms[conv_id] = [(uid, ws) for uid, ws in self.rooms.get(conv_id, []) if ws != websocket]

    async def broadcast(self, conv_id: int, data: dict, exclude_ws: WebSocket = None):
        for uid, ws in self.rooms.get(conv_id, []):
            if ws != exclude_ws:
                try:
                    await ws.send_text(json.dumps(data))
                except Exception:
                    pass

    async def send_to(self, conv_id: int, user_id: int, data: dict):
        for uid, ws in self.rooms.get(conv_id, []):
            if uid == user_id:
                try:
                    await ws.send_text(json.dumps(data))
                except Exception:
                    pass

manager = ConnectionManager()

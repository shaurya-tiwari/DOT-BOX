import json
from fastapi import WebSocket
from typing import Dict, List, Tuple


class ConnectionManager:
    def __init__(self):
        # room_id -> list of (websocket, player_id)
        self._rooms: Dict[str, List[Tuple[WebSocket, str]]] = {}

    async def connect(self, ws: WebSocket, room_id: str, player_id: str):
        await ws.accept()
        if room_id not in self._rooms:
            self._rooms[room_id] = []
        self._rooms[room_id].append((ws, player_id))

    def disconnect(self, ws: WebSocket, room_id: str):
        if room_id in self._rooms:
            self._rooms[room_id] = [
                (w, pid) for w, pid in self._rooms[room_id] if w is not ws
            ]

    async def broadcast(self, room_id: str, message: dict):
        payload = json.dumps(message)
        if room_id not in self._rooms:
            return
        dead = []
        for ws, pid in self._rooms[room_id]:
            try:
                await ws.send_text(payload)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(ws, room_id)

    async def send_personal(self, ws: WebSocket, message: dict):
        await ws.send_text(json.dumps(message))

import json
import asyncio
from fastapi import WebSocket
from typing import Dict, List, Tuple


class ConnectionManager:
    def __init__(self):
        # room_id -> list of (websocket, player_id)
        self._rooms: Dict[str, List[Tuple[WebSocket, str]]] = {}
        # per-room async lock to prevent race conditions on simultaneous moves
        self._locks: Dict[str, asyncio.Lock] = {}

    def _get_lock(self, room_id: str) -> asyncio.Lock:
        if room_id not in self._locks:
            self._locks[room_id] = asyncio.Lock()
        return self._locks[room_id]

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
            # Clean up empty rooms
            if not self._rooms[room_id]:
                del self._rooms[room_id]
                self._locks.pop(room_id, None)

    def get_player_count(self, room_id: str) -> int:
        return len(self._rooms.get(room_id, []))

    async def broadcast(self, room_id: str, message: dict):
        payload = json.dumps(message)
        if room_id not in self._rooms:
            return
        dead = []
        for ws, pid in list(self._rooms[room_id]):
            try:
                await ws.send_text(payload)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(ws, room_id)

    async def send_personal(self, ws: WebSocket, message: dict):
        try:
            await ws.send_text(json.dumps(message))
        except Exception:
            pass

    async def room_lock(self, room_id: str):
        """Returns the asyncio lock for this room (use as async context manager)."""
        return self._get_lock(room_id)

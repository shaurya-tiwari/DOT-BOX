import json
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from models import CreateGameRequest, JoinGameRequest
from game import games, create_game, join_game, add_wall, reset_game, start_game, set_player_connection, remove_player
from manager import ConnectionManager

app = FastAPI(title="DOT-BOX API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

manager = ConnectionManager()


# ── HTTP Routes ───────────────────────────────────────────────────────────────

@app.get("/api/health")
async def health():
    return {"status": "ok", "rooms": len(games)}


@app.post("/api/games")
async def create_game_endpoint(req: CreateGameRequest):
    if req.grid_size not in range(6, 21):   # 6×6 through 20×20
        raise HTTPException(400, "grid_size must be between 6 and 20")
    if req.max_players not in range(2, 6):
        raise HTTPException(400, "max_players must be between 2 and 5")
    game, player_id = create_game(req.player_name, req.grid_size, req.max_players)
    return {"room_id": game.room_id, "player_id": player_id, "max_players": game.max_players}


@app.post("/api/games/{room_id}/join")
async def join_game_endpoint(room_id: str, req: JoinGameRequest):
    game, player_id, error = join_game(room_id.upper(), req.player_name)
    if error:
        raise HTTPException(400, error)
    return {"room_id": game.room_id, "player_id": player_id}


@app.get("/api/games/{room_id}")
async def get_game_endpoint(room_id: str):
    game = games.get(room_id.upper())
    if not game:
        raise HTTPException(404, "Game not found")
    return game


# ── WebSocket ─────────────────────────────────────────────────────────────────

@app.websocket("/ws/{room_id}/{player_id}")
async def websocket_endpoint(ws: WebSocket, room_id: str, player_id: str):
    await manager.connect(ws, room_id, player_id)
    lock = await manager.room_lock(room_id)

    game = games.get(room_id)
    if not game:
        await manager.send_personal(ws, {"type": "error", "message": "Room not found"})
        manager.disconnect(ws, room_id)
        return

    async with lock:
        set_player_connection(game, player_id, True)

    # Find the player who just connected
    connecting_player = next((p for p in game.players if p.player_id == player_id), None)

    # Send current game state to the newly connected client
    await manager.send_personal(ws, {"type": "game_state", "game": game.model_dump()})

    # Broadcast to everyone in the room that this player connected
    if connecting_player:
        await manager.broadcast(room_id, {
            "type": "player_connected",
            "player_id": player_id,
            "player_name": connecting_player.name,
        })

    # Broadcast full game state to all room members when lobby or playing
    # This ensures the host sees the updated player list + status change
    if game.status in ("lobby", "playing"):
        await manager.broadcast(room_id, {"type": "game_state", "game": game.model_dump()})

    try:
        while True:
            raw = await ws.receive_text()
            msg = json.loads(raw)
            game = games.get(room_id)
            if not game:
                continue

            if msg["type"] == "make_move":
                async with lock:
                    completed, error = add_wall(game, player_id, msg["wall_id"])
                if error:
                    await manager.send_personal(ws, {"type": "error", "message": error})
                else:
                    await manager.broadcast(room_id, {"type": "game_state", "game": game.model_dump()})

            elif msg["type"] == "rematch":
                async with lock:
                    if game.status == "finished":
                        reset_game(game)
                        await manager.broadcast(room_id, {"type": "game_state", "game": game.model_dump()})

            elif msg["type"] == "back_to_lobby":
                async with lock:
                    if game.status in ("finished", "playing"):
                        reset_game(game)
                        await manager.broadcast(room_id, {"type": "game_state", "game": game.model_dump()})

            elif msg["type"] == "start_game":
                async with lock:
                    active = len([p for p in game.players if p.connected])
                    if game.status == "lobby" and active >= 2:
                        start_game(game)
                        await manager.broadcast(room_id, {"type": "game_state", "game": game.model_dump()})

            elif msg["type"] == "leave_room":
                async with lock:
                    remove_player(game, player_id)
                    await manager.broadcast(room_id, {"type": "game_state", "game": game.model_dump()})

    except WebSocketDisconnect:
        manager.disconnect(ws, room_id)
        game = games.get(room_id)
        if game:
            async with lock:
                set_player_connection(game, player_id, False)
                active = [p for p in game.players if p.connected]
            
            if not active:
                if room_id in games:
                    del games[room_id]
            else:
                disconnecting_player = next((p for p in game.players if p.player_id == player_id), None)
                await manager.broadcast(room_id, {
                    "type": "player_disconnected",
                    "player_id": player_id,
                    "player_name": disconnecting_player.name if disconnecting_player else "Opponent",
                })
                await manager.broadcast(room_id, {"type": "game_state", "game": game.model_dump()})

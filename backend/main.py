import json
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from models import CreateGameRequest, JoinGameRequest
from game import games, create_game, join_game, add_wall, reset_game
from manager import ConnectionManager

app = FastAPI(title="DOT-BOX API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

manager = ConnectionManager()


# ── HTTP Routes ───────────────────────────────────────────────────────────────

@app.post("/api/games")
async def create_game_endpoint(req: CreateGameRequest):
    if req.grid_size not in (3, 4, 5):
        raise HTTPException(400, "grid_size must be 3, 4, or 5")
    game, player_id = create_game(req.player_name, req.grid_size)
    return {"room_id": game.room_id, "player_id": player_id}


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
    try:
        game = games.get(room_id)
        if game:
            # Send current state to the connecting client
            await manager.send_personal(ws, {"type": "game_state", "game": game.model_dump()})
            # If both players now connected, broadcast start
            if game.status == "playing":
                await manager.broadcast(room_id, {"type": "game_state", "game": game.model_dump()})

        while True:
            raw = await ws.receive_text()
            msg = json.loads(raw)
            game = games.get(room_id)
            if not game:
                continue

            if msg["type"] == "make_move":
                completed, error = add_wall(game, player_id, msg["wall_id"])
                if error:
                    await manager.send_personal(ws, {"type": "error", "message": error})
                else:
                    await manager.broadcast(room_id, {"type": "game_state", "game": game.model_dump()})

            elif msg["type"] == "rematch":
                if game.status == "finished":
                    reset_game(game)
                    await manager.broadcast(room_id, {"type": "game_state", "game": game.model_dump()})

    except WebSocketDisconnect:
        manager.disconnect(ws, room_id)
        game = games.get(room_id)
        if game:
            await manager.broadcast(room_id, {
                "type": "player_disconnected",
                "player_id": player_id,
            })

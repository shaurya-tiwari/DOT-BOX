from pydantic import BaseModel
from typing import Optional, Dict, List


class Player(BaseModel):
    player_id: str
    name: str
    score: int = 0
    connected: bool = True


class Game(BaseModel):
    room_id: str
    grid_size: int
    max_players: int = 2           # 2–5 players
    players: List[Player] = []
    walls: List[str] = []              # e.g. ["h-0-1", "v-2-3"]
    wall_owners: Dict[str, str] = {}   # wall_id -> player_id (who drew it)
    boxes: Dict[str, str] = {}         # box_id -> player_id
    current_turn: Optional[str] = None
    status: str = "waiting"            # waiting | lobby | playing | finished
    winner: Optional[str] = None       # player_id or "draw"


class CreateGameRequest(BaseModel):
    player_name: str
    grid_size: int = 4
    max_players: int = 2


class JoinGameRequest(BaseModel):
    player_name: str

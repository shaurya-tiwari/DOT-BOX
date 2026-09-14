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
    walls: List[str] = []              # serialized list for JSON transport
    wall_owners: Dict[str, str] = {}   # wall_id -> player_id (who drew it)
    boxes: Dict[str, str] = {}         # box_id -> player_id
    current_turn: Optional[str] = None
    status: str = "waiting"            # waiting | lobby | playing | finished
    winner: Optional[str] = None       # player_id or "draw"

    # Runtime-only O(1) lookup set — NOT serialized (excluded from model_dump).
    # Must be kept in sync with `walls` list by game.py functions.
    # Pydantic v2: use model_config to exclude non-annotated private state.
    model_config = {"arbitrary_types_allowed": True}

    # We store this as a plain attribute set after construction so Pydantic
    # doesn't try to validate/serialize it.  game.py always accesses via
    # game.walls_set, not game.walls, for membership checks.
    def model_post_init(self, __context):
        object.__setattr__(self, "walls_set", set(self.walls))

    def model_dump(self, **kwargs):
        # Exclude the runtime set from JSON serialization
        d = super().model_dump(**kwargs)
        d.pop("walls_set", None)
        return d


class CreateGameRequest(BaseModel):
    player_name: str
    grid_size: int = 4
    max_players: int = 2


class JoinGameRequest(BaseModel):
    player_name: str

import uuid
import random
import string
from typing import Dict, Optional, Tuple
from models import Game, Player

# ── In-memory store ──────────────────────────────────────────────────────────
games: Dict[str, Game] = {}


# ── Helpers ───────────────────────────────────────────────────────────────────
def _gen_room_id() -> str:
    chars = string.ascii_uppercase + string.digits
    return "".join(random.choices(chars, k=6))


def _player_id() -> str:
    return str(uuid.uuid4())[:8]


# ── Public API ────────────────────────────────────────────────────────────────
def create_game(player_name: str, grid_size: int) -> Tuple[Game, str]:
    room_id = _gen_room_id()
    while room_id in games:
        room_id = _gen_room_id()

    pid = _player_id()
    player = Player(player_id=pid, name=player_name)
    game = Game(room_id=room_id, grid_size=grid_size, players=[player])
    games[room_id] = game
    return game, pid


def join_game(room_id: str, player_name: str) -> Tuple[Optional[Game], Optional[str], Optional[str]]:
    """Returns (game, player_id, error)"""
    if room_id not in games:
        return None, None, "Room not found"
    game = games[room_id]
    if game.status != "waiting":
        return None, None, "Room is full or game already in progress"
    if len(game.players) >= 2:
        return None, None, "Room is full"

    pid = _player_id()
    player = Player(player_id=pid, name=player_name)
    game.players.append(player)
    game.status = "playing"
    game.current_turn = game.players[0].player_id
    return game, pid, None


def add_wall(game: Game, player_id: str, wall_id: str) -> Tuple[list, Optional[str]]:
    """Returns (completed_box_ids, error_or_None)"""
    if game.status != "playing":
        return [], "Game is not in progress"
    if game.current_turn != player_id:
        return [], "Not your turn"
    if wall_id in game.walls:
        return [], "Wall already placed"

    game.walls.append(wall_id)
    completed = _check_boxes(game, wall_id)
    _assign_boxes(game, completed, player_id)

    scored = len(completed) > 0
    game.current_turn = _next_turn(game, scored)

    if _is_game_over(game):
        game.status = "finished"
        game.winner = _get_winner(game)

    return completed, None


def reset_game(game: Game):
    game.walls = []
    game.boxes = {}
    game.winner = None
    game.status = "playing"
    game.current_turn = game.players[0].player_id
    for p in game.players:
        p.score = 0


# ── Internal logic ────────────────────────────────────────────────────────────
def _check_boxes(game: Game, wall_id: str) -> list:
    n = game.grid_size - 1          # cells per side
    parts = wall_id.split("-")
    orient, r, c = parts[0], int(parts[1]), int(parts[2])

    candidates = ([(r - 1, c), (r, c)] if orient == "h" else [(r, c - 1), (r, c)])
    walls_set = set(game.walls)
    completed = []

    for br, bc in candidates:
        if 0 <= br < n and 0 <= bc < n:
            box_id = f"b-{br}-{bc}"
            if box_id not in game.boxes:
                top    = f"h-{br}-{bc}"
                bottom = f"h-{br+1}-{bc}"
                left   = f"v-{br}-{bc}"
                right  = f"v-{br}-{bc+1}"
                if all(w in walls_set for w in [top, bottom, left, right]):
                    completed.append(box_id)

    return completed


def _assign_boxes(game: Game, box_ids: list, player_id: str):
    for box_id in box_ids:
        game.boxes[box_id] = player_id
        for p in game.players:
            if p.player_id == player_id:
                p.score += 1
                break


def _next_turn(game: Game, scored: bool) -> str:
    if scored:
        return game.current_turn
    for p in game.players:
        if p.player_id != game.current_turn:
            return p.player_id
    return game.current_turn


def _is_game_over(game: Game) -> bool:
    n = game.grid_size - 1
    return len(game.boxes) >= n * n


def _get_winner(game: Game) -> str:
    if len(game.players) < 2:
        return "draw"
    p1, p2 = game.players[0], game.players[1]
    if p1.score > p2.score:
        return p1.player_id
    if p2.score > p1.score:
        return p2.player_id
    return "draw"

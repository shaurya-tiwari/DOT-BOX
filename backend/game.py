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
def create_game(player_name: str, grid_size: int, max_players: int = 2) -> Tuple[Game, str]:
    room_id = _gen_room_id()
    while room_id in games:
        room_id = _gen_room_id()

    pid = _player_id()
    player = Player(player_id=pid, name=player_name)
    game = Game(
        room_id=room_id,
        grid_size=grid_size,
        max_players=max_players,
        players=[player],
    )
    games[room_id] = game
    return game, pid


def join_game(room_id: str, player_name: str) -> Tuple[Optional[Game], Optional[str], Optional[str]]:
    """Returns (game, player_id, error)"""
    if room_id not in games:
        return None, None, "Room not found"
    game = games[room_id]
    # Allow joining a 'waiting' or 'lobby' room
    if game.status not in ("waiting", "lobby"):
        return None, None, "Game already in progress"
    if len(game.players) >= game.max_players:
        return None, None, "Room is full"

    pid = _player_id()
    player = Player(player_id=pid, name=player_name)
    game.players.append(player)

    # Move to lobby so host can start when all expected players have joined
    game.status = "lobby"
    game.current_turn = None
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
    game.wall_owners[wall_id] = player_id

    completed = _check_boxes(game, wall_id)
    _assign_boxes(game, completed, player_id)

    scored = len(completed) > 0
    game.current_turn = _next_turn(game, player_id, scored)

    if _is_game_over(game):
        game.status = "finished"
        game.winner = _get_winner(game)

    return completed, None


def remove_player(game: Game, player_id: str):
    if game.status == "playing" and game.current_turn == player_id:
        game.current_turn = _next_turn(game, player_id, False)

    game.players = [p for p in game.players if p.player_id != player_id]

    if game.status == "playing" and len([p for p in game.players if p.connected]) < 2:
        game.status = "finished"
        game.winner = _get_winner(game)


def set_player_connection(game: Game, player_id: str, connected: bool):
    for p in game.players:
        if p.player_id == player_id:
            p.connected = connected
            break

    if game.status == "playing":
        active_count = len([p for p in game.players if p.connected])
        if active_count < 2:
            game.status = "finished"
            game.winner = _get_winner(game)
        elif not connected and game.current_turn == player_id:
            game.current_turn = _next_turn(game, player_id, False)


def reset_game(game: Game):
    """Reset board → lobby so players can confirm restart."""
    game.walls = []
    game.wall_owners = {}
    game.boxes = {}
    game.winner = None
    game.status = "lobby"
    game.current_turn = None
    for p in game.players:
        p.score = 0


def start_game(game: Game):
    """Transition from lobby → playing."""
    game.status = "playing"
    for p in game.players:
        if p.connected:
            game.current_turn = p.player_id
            break


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


def _next_turn(game: Game, current_player_id: str, scored: bool) -> str:
    """Cycle through all players. If scored, same player goes again."""
    if scored:
        return current_player_id
    
    active = [p for p in game.players if p.connected]
    if not active:
        return current_player_id

    # Find current index and advance to next connected player
    idx = next((i for i, p in enumerate(game.players) if p.player_id == current_player_id), 0)
    for i in range(1, len(game.players)):
        next_idx = (idx + i) % len(game.players)
        if game.players[next_idx].connected:
            return game.players[next_idx].player_id
            
    return current_player_id


def _is_game_over(game: Game) -> bool:
    n = game.grid_size - 1
    return len(game.boxes) >= n * n


def _get_winner(game: Game) -> str:
    if not game.players:
        return "draw"
    # Player(s) with highest score win. If tie → "draw"
    max_score = max(p.score for p in game.players)
    winners = [p for p in game.players if p.score == max_score]
    if len(winners) == 1:
        return winners[0].player_id
    return "draw"

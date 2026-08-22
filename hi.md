# Dots & Boxes — Final Implementation Plan

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | React + Vite + Tailwind CSS |
| Backend | FastAPI (Python) |
| Real-time | WebSocket |
| State | Python in-memory `dict` |

---

## Room Isolation — How Concurrent Rooms Stay Independent

Every room is a completely separate object. Rooms never touch each other.

### In-memory store

```python
games: dict[str, Game] = {}
#        ↑
#   room_id is the key
#   Room X7K92P and Room AB92KL are two separate Game objects
#   A move in X7K92P never touches AB92KL
```

### WebSocket manager

```python
class ConnectionManager:
    rooms: dict[str, list[WebSocket]] = {}
    #           ↑
    #      each room has its OWN list of connections
    #      broadcast(room_id) only sends to that room's list
```

When Ashish makes a move in room `X7K92P`:

```
FastAPI receives move
       ↓
games["X7K92P"]   ← only this object is touched
       ↓
manager.broadcast("X7K92P", state)
       ↓
Only Ashish and Rahul receive it
Room AB92KL players receive NOTHING
```

### Race condition protection (within a single room)

Two players in the same room could theoretically send moves at the same millisecond.
We handle this with a per-room async lock:

```python
@dataclass
class Game:
    ...
    lock: asyncio.Lock = field(default_factory=asyncio.Lock)
```

```python
# in main.py WebSocket handler
async with game.lock:
    result = add_wall(game, player_id, wall_id)
    await manager.broadcast(room_id, result)
```

This means:
- Move 1 is fully processed and broadcast **before** move 2 is even looked at
- No two moves can corrupt the same game state simultaneously
- The lock is **per room** — Room A's lock never blocks Room B

### Summary: what makes rooms independent

| Thing | How it's isolated |
|---|---|
| Game state | Separate `Game` object per `room_id` |
| WebSocket connections | Separate list per `room_id` in `ConnectionManager` |
| Broadcasts | `broadcast(room_id)` only reaches that room |
| Concurrent moves | Per-room `asyncio.Lock` prevents race conditions |
| Room creation | `room_id` is a random 6-char code — collision chance is negligible |

> [!IMPORTANT]
> 100 rooms running at the same time = 100 completely separate `Game` objects. They share zero state. One room crashing or glitching does not affect any other.

---

## Answered Questions

| Question | Answer |
|---|---|
| Grid size | Player 1 picks: **3×3 / 4×4 / 5×5** |
| After game ends | Two buttons: **Play Again** (same room, reset) + **Go Home** |
| Devices | **Fully responsive** — laptop + phone both work |

---

## Why do we need `api.js` (HTTP) at all?

Good question. We have **both** HTTP and WebSocket. Here is why:

```
STEP 1 — Create / Join Room
   → HTTP POST
   → Gets back: room_id, player_id
   → One-time action, needs a response

STEP 2 — Play the game
   → WebSocket (always open)
   → Real-time back and forth
```

**The problem with doing everything over WebSocket:**

To open a WebSocket connection, you need to know the `room_id` first.
But to know the `room_id`, you need to create the room first.
So you **cannot open the WebSocket before the HTTP call**.

HTTP is used for:
- `POST /api/games` → create room → get `room_id` + `player_id`
- `POST /api/games/{room_id}/join` → join room → get `player_id`

WebSocket is used for:
- Everything during gameplay (moves, state sync, turn changes, game over)

HTTP = **setup** (once).  
WebSocket = **gameplay** (always open).

That's it. `api.js` is just 2 functions. `socket.js` handles the rest.

---

## Project Structure

```
dots-and-boxes/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.jsx         ← room code display
│   │   │   ├── ScoreBoard.jsx     ← box counts at bottom
│   │   │   ├── TurnIndicator.jsx  ← whose turn
│   │   │   ├── GameBoard.jsx      ← dot matrix + lines + boxes
│   │   │   └── Dot.jsx            ← single draggable dot
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── CreateGame.jsx     ← name + grid size (3/4/5)
│   │   │   ├── JoinGame.jsx
│   │   │   ├── WaitingRoom.jsx
│   │   │   ├── Game.jsx
│   │   │   └── GameResult.jsx     ← Play Again + Go Home
│   │   ├── api.js                 ← 2 HTTP functions
│   │   ├── socket.js              ← WebSocket wrapper
│   │   ├── board.js               ← wall/box ID helpers
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   └── package.json
│
└── backend/
    ├── main.py
    ├── game.py
    ├── models.py
    ├── manager.py
    └── requirements.txt
```

---

## UI Design

**Theme:** Minimal. Full beige background. Black dots. Clean typography.

### Color Palette

```
Background  →  #F5F0E8   (warm beige)
Dots        →  #1A1A1A   (near black)
Lines drawn →  #1A1A1A   (black)
Lines hover →  #888888   (grey preview)
Player 1    →  #1A1A1A   (black)
Player 2    →  #5C4033   (dark brown)
Text        →  #1A1A1A
```

### Page Layout (Game screen)

```
┌──────────────────────────────────────┐
│                                      │
│   ASHISH          RAHUL              │  ← player names, top
│   (you)                              │
│                                      │
│   ● ─── ● ─── ● ─── ● ─── ●          │
│   │     │           │                │
│   ●     ● ─── ●     ●     ●          │
│   │           │     │                │  ← dot matrix, middle
│   ● ─── ●     ● ─── ●     ●         │
│               │           │         │
│   ●     ● ─── ● ─── ●     ●         │
│   │                       │         │
│   ● ─── ● ─── ● ─── ● ─── ●         │
│                                      │
│                                      │
│   Boxes: 5        Boxes: 3           │  ← box counts, bottom
│                                      │
└──────────────────────────────────────┘
```

- **Top section:** Both player names. Your name says "(you)".
- **Middle (biggest area):** The dot grid fills most of the screen.
- **Bottom:** Simple box count for each player.

### Responsive behaviour

| Device | Board |
|---|---|
| Desktop / laptop | Full size, comfortable drag |
| Tablet | Slightly smaller dots, same layout |
| Phone | Board scales to fit screen width. Tap-drag works on touch. |

Board sizing is calculated as:

```js
const cellSize = Math.min(
  (screenWidth - padding) / gridSize,
  (screenHeight * 0.65) / gridSize
)
```

So the board always fits the screen, regardless of size or grid.

---

## Drag Mechanic

```
Touch / click on a dot
        ↓
Drag in one direction (up / down / left / right)
        ↓
If direction is valid and neighbor exists:
  → show a grey preview line while dragging
        ↓
Release on the neighbor dot
        ↓
compute wall_id from (start_dot, end_dot)
        ↓
send { type: "make_move", wall_id }
        ↓
server responds with full game_state
        ↓
board re-renders for both players
```

Works with both **mouse drag** (desktop) and **touch drag** (mobile).

---

## Game Result Screen

```
┌──────────────────────────┐
│                          │
│      ASHISH WINS!        │
│                          │
│   Ashish    7            │
│   Rahul     3            │
│                          │
│  [ Play Again ]          │
│  [ Go Home    ]          │
│                          │
└──────────────────────────┘
```

- **Play Again** → server resets the same room, same players, same grid size
- **Go Home** → disconnects and goes back to `Home.jsx`

---

## Backend Data Model

```python
@dataclass
class Player:
    id: str
    name: str
    score: int = 0

@dataclass
class Game:
    room_id: str
    grid_size: int               # 3, 4, or 5
    players: list[Player]
    walls: set[str]              # {"h-0-0", "v-1-2", ...}
    boxes: dict[str, str]        # "box-0-0" → player_id
    current_player: str
    status: str                  # waiting | playing | finished
```

---

## WebSocket Messages

**Client → Server (make a move)**
```json
{ "type": "make_move", "wall_id": "h-2-3", "player_id": "abc123" }
```

**Client → Server (rematch)**
```json
{ "type": "rematch", "player_id": "abc123" }
```

**Server → Both (game state)**
```json
{
  "type": "game_state",
  "game": {
    "status": "playing",
    "grid_size": 4,
    "current_player": "abc123",
    "walls": ["h-0-0", "v-1-2"],
    "boxes": { "box-0-0": "abc123" },
    "scores": { "abc123": 5, "xyz789": 3 },
    "players": [
      { "id": "abc123", "name": "Ashish" },
      { "id": "xyz789", "name": "Rahul" }
    ]
  }
}
```

---

## Build Phases

| # | Phase | What gets built |
|---|---|---|
| 1 | **Foundation** | Vite + Tailwind scaffold, FastAPI scaffold |
| 2 | **Rooms** | Create/join via HTTP, room code, grid size picker |
| 3 | **WebSocket** | Connect both players, broadcast join |
| 4 | **Board Render** | Auto-generate dots from `grid_size`, responsive sizing |
| 5 | **Drag Mechanic** | Mouse + touch drag, grey preview line, compute wall_id |
| 6 | **Game Engine** | `game.py`: validate, add wall, detect boxes, score, turn |
| 7 | **Sync** | WS state → React → both boards update |
| 8 | **Game Over** | Winner screen, Play Again, Go Home |
| 9 | **Edge Cases** | Wrong turn, wall taken, disconnect, room full |
| 10 | **Polish** | Beige theme, animations, mobile fine-tuning |
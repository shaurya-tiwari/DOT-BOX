# 🎯 Dots & Boxes — Step-by-Step Development Timeline & Roadmap

> **Status Legend:**  
> ✅ **Completed** &nbsp;|&nbsp; 🔨 **In Progress** &nbsp;|&nbsp; ⬜ **Pending / Up Next**

---

## 📊 Roadmap Overview

| Phase | Title | Scope | Est. Effort | Status |
|---|---|---|---|:---:|
| **0** | **Foundation & Setup** | Vite + React scaffold, Tailwind, Backend files | Setup | ✅ Done |
| **1** | **Backend Core (FastAPI & HTTP)** | Models, Game state, Room creation/join endpoints | Small | ⬜ Pending |
| **2** | **Frontend Navigation & Rooms** | Home, Create Game, Join Game screens & HTTP API | Small | ⬜ Pending |
| **3** | **WebSocket & Waiting Room** | Real-time connection, player matching, lobby | Medium | ⬜ Pending |
| **4** | **Game Board Rendering** | Dynamic N×N dot grid, responsive sizing & beige theme | Medium | ⬜ Pending |
| **5** | **Drag & Draw Line Mechanic** | Mouse/touch dragging, preview line, move emission | Medium | ⬜ Pending |
| **6** | **Game Engine & Rules (Backend)** | Wall validation, box completion detection, scoring, turns | Medium | ⬜ Pending |
| **7** | **Real-Time State Synchronization** | Server broadcast → Client board state updates | Medium | ⬜ Pending |
| **8** | **HUD, Scoreboard & Turn Indicators** | Top header, active turn badge, bottom score display | Small | ⬜ Pending |
| **9** | **Game Over & Rematch Flow** | Winner screen, Play Again (reset room), Go Home | Small | ⬜ Pending |
| **10** | **Edge Cases & Error Handling** | Invalid moves, disconnects, room full, collisions | Small | ⬜ Pending |
| **11** | **UI/UX Polish & Micro-Interactions** | Animations, smooth transitions, mobile optimization | Small | ⬜ Pending |
| **12** | **Deployment & Production Setup** | Vercel (frontend) + Render/Railway (backend) | Small | ⬜ Pending |

---

## 🛠️ Detailed Phase Breakdown

---

### ✅ Phase 0 — Foundation & Setup
**Objective:** Scaffold project structure, install dependencies, verify dev servers.

- [x] Create React + Vite frontend (`frontend/`)
- [x] Configure Tailwind CSS & PostCSS
- [x] Create empty project directories and files
- [x] Set up `.gitignore` for clean git tracking
- [x] Test `npm run dev` locally on `localhost:5173`

---

### ⬜ Phase 1 — Backend Core (FastAPI & HTTP)
**Objective:** Build basic FastAPI server with in-memory room management and HTTP endpoints to create/join games.

#### Files:
- `backend/requirements.txt` — `fastapi`, `uvicorn[standard]`, `websockets`
- `backend/models.py` — `Player`, `Game`, and request/response models
- `backend/game.py` — `create_game()`, `join_game()`, room generator
- `backend/manager.py` — `ConnectionManager` class skeleton for WebSocket lists
- `backend/main.py` — FastAPI app with CORS middleware and HTTP routes:
  - `POST /api/games` → Creates room, returns `{ room_id, player_id }`
  - `POST /api/games/{room_id}/join` → Joins room, returns `{ player_id }`

#### Completion Checklist:
- [ ] Virtualenv created & requirements installed
- [ ] `uvicorn main:app --reload` runs cleanly on `localhost:8000`
- [ ] `POST /api/games` returns a 6-character `room_id` and player object
- [ ] `POST /api/games/{id}/join` allows second player to join successfully

---

### ⬜ Phase 2 — Frontend Navigation & Room Flow
**Objective:** Users can create a new game (choose grid size) or enter a room code to join an existing game.

#### Files:
- `frontend/src/api.js` — Axios/Fetch functions for `createGame()` and `joinGame()`
- `frontend/src/pages/Home.jsx` — Landing screen with "Create Game" & "Join Game" options
- `frontend/src/pages/CreateGame.jsx` — Player Name input + Grid size selector (3×3, 4×4, 5×5)
- `frontend/src/pages/JoinGame.jsx` — Player Name input + 6-character Room Code input
- `frontend/src/App.jsx` — Simple view router switching between pages based on state

#### Completion Checklist:
- [ ] Creating a game sends request to backend and redirects to Waiting Room
- [ ] Joining an existing room code validates and connects the user
- [ ] Input validation for empty names or invalid room codes

---

### ⬜ Phase 3 — WebSocket & Waiting Room Lobby
**Objective:** Establish WebSocket connections for players. Transition players when room is full.

#### Files:
- `backend/main.py` — `WebSocket /ws/{room_id}/{player_id}` endpoint
- `backend/manager.py` — Multi-room connection registry with per-room locks & broadcasting
- `frontend/src/socket.js` — WebSocket helper class (auto-connect, message emitter, listeners)
- `frontend/src/pages/WaitingRoom.jsx` — Shows room code, copy button, "Waiting for Player 2..."
- `frontend/src/pages/Game.jsx` — Host container for active game session

#### Completion Checklist:
- [ ] Player 1 enters Waiting Room with active WebSocket connection
- [ ] Player 2 joins → Backend detects 2 players, updates status to `playing`
- [ ] Broadcast triggers both players to navigate automatically to the `Game` screen

---

### ⬜ Phase 4 — Game Board Visual Rendering
**Objective:** Render the N×N dot grid dynamically according to `grid_size` with responsive layout and the beige minimalist theme.

#### Files:
- `frontend/src/utils/board.js` — Grid generator: dots matrix, horizontal/vertical wall IDs, box IDs
- `frontend/src/components/GameBoard.jsx` — SVG/Canvas/CSS Grid wrapper with dynamic cell sizing
- `frontend/src/components/Dot.jsx` — Individual dot component with responsive coordinates
- `frontend/src/index.css` — Custom warm beige theme variables (`#F5F0E8`, `#1A1A1A`, `#5C4033`)

#### Responsive Formula:
```js
const cellSize = Math.min(
  (window.innerWidth - 48) / gridSize,
  (window.innerHeight * 0.60) / gridSize
);
```

#### Completion Checklist:
- [ ] 3×3, 4×4, and 5×5 grids render with crisp dot alignment
- [ ] Board scales automatically for mobile screens and desktop screens
- [ ] Minimalist aesthetic with warm beige background and clean typography

---

### ⬜ Phase 5 — Drag & Draw Line Interaction
**Objective:** Smooth mouse and touch drag interactions to connect adjacent dots with a live visual preview.

#### Files:
- `frontend/src/components/Dot.jsx` — Pointer event handlers (`onPointerDown`, `onTouchStart`)
- `frontend/src/components/GameBoard.jsx` — Drag coordinate tracker, grey preview line rendering
- `frontend/src/utils/board.js` — Coordinate-to-wall calculation (`h-r-c` or `v-r-c`), adjacency checker
- `frontend/src/socket.js` — `sendMove(wallId)`

#### Drag Rules:
- Only orthogonally adjacent dots (distance = 1 step)
- Prevent diagonal drags
- Prevent drawing already existing lines
- Show grey preview line while dragging, snap to solid black on valid release

#### Completion Checklist:
- [ ] Dragging mouse or finger between adjacent dots shows preview line
- [ ] Releasing sends `make_move` payload via WebSocket
- [ ] Invalid drags (diagonals / non-adjacent) cleanly cancel

---

### ⬜ Phase 6 — Backend Game Engine Rules
**Objective:** Robust server-side game logic: move validation, wall recording, box completion detection, scoring, and turn management.

#### Functions in `backend/game.py`:
- `add_wall(game, player_id, wall_id)` — Validates turn, duplicates, and records wall
- `check_boxes(game, wall_id)` — Checks up to 2 adjacent boxes for closure
- `assign_boxes(game, completed_boxes, player_id)` — Attributes boxes to player, updates score
- `next_turn(game, scored_this_turn)` — Keeps turn if a box was completed, else alternates turn
- `is_game_over(game)` — Checks if all `(grid_size - 1)^2` boxes are closed
- `get_winner(game)` — Determines winner or draw

#### Completion Checklist:
- [ ] Unit tests for 3×3, 4×4, 5×5 box closure detection
- [ ] Multi-box completion in a single move correctly awards multiple points
- [ ] Extra turn awarded when claiming a box; turn passes when no box claimed

---

### ⬜ Phase 7 — Real-Time State Synchronization
**Objective:** Instant real-time state broadcast from server to all room clients.

#### Flow:
```
Player Move (Frontend) 
  → WebSocket: { type: "make_move", wall_id: "h-0-1" }
  → Backend: Lock room → Validate move → Update state → Check boxes
  → Broadcast: { type: "game_state", game: {...} }
  → Both Clients: React re-renders walls & box claims with animations
```

#### Completion Checklist:
- [ ] Move by Player 1 updates Player 2's screen in <50ms
- [ ] Claimed boxes render player initial/color with smooth transition
- [ ] Disconnected/out-of-sync clients recover on next message

---

### ⬜ Phase 8 — Header, Scoreboard & Turn Indicator
**Objective:** Polish HUD with room details, active turn indicator, and real-time box score counters.

#### Files:
- `frontend/src/components/Header.jsx` — Room code display with one-click copy button
- `frontend/src/components/TurnIndicator.jsx` — Animated badge ("Your turn" vs "Opponent's turn")
- `frontend/src/components/ScoreBoard.jsx` — Player 1 vs Player 2 score counter at bottom
- `frontend/src/pages/Game.jsx` — Layout wrapper organizing HUD + Board

#### Completion Checklist:
- [ ] Clear visual indication of whose turn it is
- [ ] Live box counters increment immediately when boxes are captured
- [ ] Copy room link/code button works with feedback toast

---

### ⬜ Phase 9 — Game Over & Rematch Flow
**Objective:** Modal / screen when all boxes are filled with game statistics and Rematch / Exit options.

#### Files:
- `frontend/src/components/GameResult.jsx` — Winner banner, final score summary, action buttons
- `backend/game.py` — `reset_game(room_id)` to reinitialize board for the same players
- `frontend/src/socket.js` — `sendRematch()` handler

#### Options:
- **Play Again:** Resets board for current room; both players start fresh round
- **Go Home:** Leaves room, closes WebSocket, redirects to Home page

#### Completion Checklist:
- [ ] Winner modal triggers automatically when last box is filled
- [ ] "Play Again" allows immediate replay without re-creating rooms
- [ ] "Go Home" cleans up state and disconnects cleanly

---

### ⬜ Phase 10 — Edge Cases & Error Handling
**Objective:** Guarantee resilience against unexpected inputs, concurrency, and network disruptions.

#### Edge Cases to Guard:
- [ ] **Wrong Turn Attempt:** Server rejects move; frontend displays brief warning
- [ ] **Duplicate Wall Move:** Server ignores duplicate attempts
- [ ] **Room Code Collision:** Secure random 6-character room codes
- [ ] **Room Not Found / Full:** User-friendly error message on join screen
- [ ] **Opponent Disconnect:** Banner notification if other player leaves or loses connection

---

### ⬜ Phase 11 — Visual Polish & Animations
**Objective:** Deliver a state-of-the-art, elegant user experience with micro-interactions.

- [ ] Line drawing snap animation
- [ ] Subtle pulsing glow on current player's indicator
- [ ] Box completion pop / smooth fill animation
- [ ] Haptic feedback (on supported mobile devices) on line snap
- [ ] Audio toggle (optional subtle pop sound on box completion)

---

### ⬜ Phase 12 — Production Deployment
**Objective:** Deploy live build accessible on the web.

- [ ] **Frontend:** Deploy to Vercel
- [ ] **Backend:** Deploy to Render / Railway / Fly.io
- [ ] **Environment Config:** Set `VITE_API_URL` and `VITE_WS_URL` in `.env.production`
- [ ] **CORS Configuration:** Allow production frontend domain in FastAPI

---

## 🚀 Recommended Next Step
👉 **Start Phase 1: Backend Core (`backend/models.py`, `backend/game.py`, `backend/manager.py`, `backend/main.py`)**

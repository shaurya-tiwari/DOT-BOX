# 🎯 Dots & Boxes — Step-by-Step Development Timeline & Roadmap

> **Status Legend:**  
> ✅ **Completed** | 🔨 **In Progress** | ⬜ **Pending / Up Next**

---

## 📊 Roadmap Overview

| Phase | Title | Status |
|---|---|:---:|
| **0** | **Foundation & Setup** | ✅ Done |
| **1** | **Backend Core (FastAPI & HTTP)** | ✅ Done |
| **2** | **Frontend Navigation & Rooms** | ✅ Done |
| **3** | **WebSocket & Waiting Room** | ✅ Done |
| **4** | **Game Board Rendering** | ✅ Done |
| **5** | **Drag & Draw Line Mechanic** | ✅ Done |
| **6** | **Game Engine & Rules (Backend)** | ✅ Done |
| **7** | **Real-Time State Synchronization** | ✅ Done |
| **8** | **HUD, Scoreboard & Turn Indicators** | ✅ Done |
| **9** | **Game Over & Rematch Flow** | ✅ Done |
| **10** | **Edge Cases & Error Handling** | ✅ Done |
| **11** | **UI/UX Polish & Micro-Interactions** | ✅ Done |
| **12** | **Deployment & Production Setup** | ✅ Done |
| **13** | **CI/CD Pipeline (GitHub Actions)** | ✅ Done |

---

## 🛠️ Detailed Phase Breakdown

---

### ✅ Phase 0 — Foundation & Setup

- [x] Create React + Vite frontend
- [x] Configure Tailwind CSS
- [x] Set up .gitignore
- [x] Test npm run dev locally

---

### ✅ Phase 1 — Backend Core (FastAPI & HTTP)

- [x] requirements.txt — fastapi, uvicorn, websockets
- [x] models.py — Player, Game, request models
- [x] game.py — create_game(), join_game()
- [x] manager.py — ConnectionManager class
- [x] main.py — FastAPI app, CORS, HTTP routes
- [x] POST /api/games returns room_id and player_id
- [x] POST /api/games/{id}/join works correctly

---

### ✅ Phase 2 — Frontend Navigation & Room Flow

- [x] api.js — createGame(), joinGame() fetch functions
- [x] Home.jsx — Landing screen
- [x] CreateGame.jsx — Name + grid size selector (6x6 to 20x20)
- [x] JoinGame.jsx — Name + room code input
- [x] App.jsx — View router
- [x] Input validation for empty names or invalid room codes

---

### ✅ Phase 3 — WebSocket & Waiting Room Lobby

- [x] WebSocket /ws/{room_id}/{player_id} endpoint
- [x] Multi-room broadcast with per-room async locks
- [x] socket.js — auto-connect, exponential backoff reconnect
- [x] WaitingRoom.jsx — room code, copy button, player list, Start button
- [x] Supports 2 to 5 players

---

### ✅ Phase 4 — Game Board Visual Rendering

- [x] board.js — grid generator, wall/box ID helpers
- [x] GameBoard.jsx — SVG board with dynamic cell sizing
- [x] Dot.jsx — individual dot component
- [x] 6x6 through 20x20 grids render correctly
- [x] Fully responsive (mobile + desktop)

---

### ✅ Phase 5 — Drag & Draw Line Interaction

- [x] Pointer events drag system on SVG
- [x] Only orthogonally adjacent dots allowed
- [x] Dashed preview line while dragging
- [x] Snaps to solid color on valid release
- [x] Optimistic rendering — line stays visible until server confirms (no flicker)
- [x] Larger invisible hit areas for easier mobile touch

---

### ✅ Phase 6 — Backend Game Engine Rules

- [x] add_wall() — validates turn, records wall
- [x] _check_boxes() — detects box closures
- [x] _assign_boxes() — scores and attributes boxes
- [x] _next_turn() — keeps turn if scored, else advances
- [x] _is_game_over() — checks all boxes filled
- [x] _get_winner() — winner or draw logic

---

### ✅ Phase 7 — Real-Time State Synchronization

- [x] All players receive updates in real-time via WebSocket broadcast
- [x] Box pop animation on claim
- [x] Async locks prevent race conditions on simultaneous moves
- [x] Auto-reconnect with exponential backoff

---

### ✅ Phase 8 — HUD, Scoreboard & Turn Indicator

- [x] Header.jsx — room code display
- [x] TurnIndicator.jsx — animated turn badge
- [x] ScoreBoard.jsx — per-player score counters
- [x] Player colors consistent across board and HUD

---

### ✅ Phase 9 — Game Over & Rematch Flow

- [x] GameResult.jsx — winner banner and final scores
- [x] reset_game() for instant rematch
- [x] Host can send all players back to lobby
- [x] Go Home disconnects cleanly

---

### ✅ Phase 10 — Edge Cases & Error Handling

- [x] Wrong turn rejected by server
- [x] Duplicate wall move ignored
- [x] Room collision-safe 6-char room IDs
- [x] Room not found / full — shown to user
- [x] Opponent disconnect banner
- [x] Browser back button / tab close protection modal
- [x] Empty room cleanup from memory

---

### ✅ Phase 11 — Visual Polish & Animations

- [x] wallDrawIn — dash offset draw-in animation
- [x] boxPop — spring scale animation on box claim
- [x] Dot grows on drag start and snap target
- [x] Pulsing glow on current player indicator
- [x] Page fade-in transitions
- [x] Reconnecting banner with spinner

---

### ✅ Phase 12 — Production Deployment

- [x] render.yaml — declarative config for both services
- [x] Backend on Render (Python web service)
- [x] Frontend on Render (static site)
- [x] VITE_API_URL auto-injected from RENDER_EXTERNAL_URL
- [x] CORS configured for production

---

### ✅ Phase 13 — CI/CD Pipeline (GitHub Actions)

**Files:**
- `.github/workflows/deploy.yml` — GitHub Actions workflow
- `backend/ruff.toml` — Ruff linter config

**Pipeline:**
```
git push to main
      ↓
Job 1: ruff check backend/     ← all .py files checked
Job 2: oxlint + vite build     ← all .jsx/.js files checked
      ↓
❌ Any error → Deploy BLOCKED
✅ All pass  → Render deploy hook → Live site updated
```

- [x] Ruff lints all backend Python files
- [x] Backend import verified (import main)
- [x] oxlint checks all JSX/JS files
- [x] Vite build catches all compile-time errors
- [x] Deploy only on main branch pushes (not PRs)
- [x] RENDER_DEPLOY_HOOK_URL stored as GitHub secret
- [x] Node.js 24 (no deprecation warnings)

---

## 🏁 Project Complete

All 13 phases shipped. The game is live, tested, and protected by CI/CD.

| What | Where |
|---|---|
| CI/CD | `.github/workflows/deploy.yml` |
| Architecture Graph | `graphify-out/graph.html` |
| Full Spec | `hi.md` |

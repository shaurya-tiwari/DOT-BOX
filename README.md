<div align="center">

# DOT - BOX

### *The nostalgic pencil-and-paper game — now online, real-time, multiplayer.*

> Connect the dots. Draw the lines. Steal the boxes. Outsmart your friends.

<br/>

[![Play Now](https://img.shields.io/badge/▶%20PLAY%20NOW-dot--box--frontend.onrender.com-D4874E?style=for-the-badge&logoColor=white)](https://dot-box-frontend.onrender.com)

<br/>

![DOT-BOX Game](https://dot-box-frontend.onrender.com/icon-512.png)

<br/>

![React](https://img.shields.io/badge/React_19-20232A?style=flat-square&logo=react&logoColor=61DAFB)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)
![WebSockets](https://img.shields.io/badge/WebSockets-Real--Time-6B6560?style=flat-square)
![PWA](https://img.shields.io/badge/PWA-Installable-D4874E?style=flat-square)
![Deploy](https://img.shields.io/badge/Deployed-Render-1A1A1A?style=flat-square)

</div>

---

## 🎮 What is DOT-BOX?

Remember that game you played on paper as a kid — the one with dots and lines in a notebook?

**DOT-BOX brings it back.** But now it's:
- ⚡ **Real-time** — moves sync instantly to all players
- 👥 **Multiplayer** — 2 to 5 players in one room
- 📱 **Installable** — works as a phone app (PWA)
- 🌐 **No download** — just share a link and play

**How to play:**
1. Take turns drawing a line between two adjacent dots
2. Complete the 4th side of a box → you **claim it** and get an **extra turn**
3. Most boxes when the grid is full → **you win**

---

## ▶️ Play Online

**No sign-up. No download. Just play.**

👉 **[dot-box-frontend.onrender.com](https://dot-box-frontend.onrender.com)**

> **Tip:** Share your room code with a friend and start playing in seconds.

---

## 📱 Install as App (PWA)

Play like a native app — no browser bar, home screen icon.

**Android (Chrome):**
1. Open the site in Chrome
2. Tap the **3-dot menu** → **"Add to Home Screen"**
3. Tap **Install**

**iOS (Safari):**
1. Open the site in Safari
2. Tap the **Share button** (⬆️)
3. Tap **"Add to Home Screen"**

---

## 🏗️ Tech Stack

| Layer | Tech | Details |
|---|---|---|
| **Frontend** | React 19 + Vite | Warm beige minimalist UI |
| **Drag Engine** | SVG + Pointer Events | Mouse & touch, optimistic rendering |
| **Backend** | FastAPI + Uvicorn | In-memory game state, per-room async locks |
| **Real-time** | WebSockets | Sub-50ms state sync across all players |
| **Deploy** | Render | Frontend (static) + Backend (Python) |
| **CI/CD** | GitHub Actions | Lint + build checks before every deploy |
| **PWA** | manifest.json + SW | Installable, offline-capable |

---

## 🚀 Local Development

### Prerequisites
- **Node.js** v18+ — `node -v`
- **Python** v3.10+ — `python3 --version`

### Option A — One command (recommended)

```bash
# From project root
npm install && npm run dev
```

> Starts both backend and frontend together via `concurrently`.

---

### Option B — Manually

**Terminal 1 — Backend:**
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
> API: http://localhost:8000 | Docs: http://localhost:8000/docs

**Terminal 2 — Frontend:**
```bash
cd frontend
npm install
npm run dev
```
> Game: http://localhost:5173

---

## 📁 Project Structure

```
DOT-BOX/
├── backend/
│   ├── main.py          # FastAPI app — HTTP routes & WebSocket endpoint
│   ├── game.py          # Game engine — walls, boxes, scoring, turns
│   ├── models.py        # Pydantic models — Game, Player
│   ├── manager.py       # ConnectionManager — per-room broadcast & locks
│   └── requirements.txt
│
├── frontend/
│   ├── public/
│   │   ├── manifest.json   # PWA manifest
│   │   ├── sw.js           # Service Worker
│   │   ├── favicon.svg     # Browser tab icon
│   │   └── icon-*.png      # App icons (192, 512)
│   └── src/
│       ├── components/
│       │   ├── GameBoard.jsx   # SVG board + drag engine
│       │   ├── Dot.jsx         # Individual dot
│       │   ├── Header.jsx      # Room code display
│       │   ├── ScoreBoard.jsx  # Player scores
│       │   └── TurnIndicator.jsx
│       ├── pages/
│       │   ├── Home.jsx
│       │   ├── CreateGame.jsx
│       │   ├── JoinGame.jsx
│       │   ├── WaitingRoom.jsx
│       │   ├── Game.jsx
│       │   └── GameResult.jsx
│       ├── utils/board.js   # Grid math, wall/box ID helpers
│       ├── api.js           # HTTP client
│       ├── socket.js        # WebSocket manager + reconnect
│       └── App.jsx
│
├── .github/workflows/
│   └── deploy.yml       # CI/CD — lint → build → deploy
│
├── render.yaml          # Render deployment config
├── TIMELINE.md          # 13-phase development roadmap
└── README.md
```

---

## 🔄 CI/CD Pipeline

Every push to `main` runs automatically:

```
git push
    ↓
① ruff check — Python lint
② oxlint + vite build — Frontend lint & compile
    ↓
❌ Fail → Deploy blocked
✅ Pass → Render auto-deploys → Live in ~60s
```

---

## 🤖 AI IDE Setup (Antigravity / Cursor / Claude Code)

If you're working on this with an AI coding assistant, run Graphify once to give it a full understanding of the codebase:

```bash
pip install graphifyy
graphify              # builds knowledge graph
graphify --update     # refresh after changes
```

Open `graphify-out/graph.html` in your browser to see the interactive architecture map.

---

## 📜 License

MIT — free to use, fork, and remix.

---

<div align="center">

Made with ☕ and nostalgia

**[▶ Play DOT-BOX now](https://dot-box-frontend.onrender.com)**

</div>

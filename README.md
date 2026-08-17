# 🎯 Dots & Boxes — Real-Time Multiplayer Game

A minimal, real-time multiplayer implementation of the classic **Dots & Boxes** game built with **React (Vite + Tailwind CSS)** and **FastAPI (Python WebSockets)**.

---

## 🏗️ Architecture & Tech Stack

| Layer | Technology | Details |
|---|---|---|
| **Frontend** | React 19, Vite, Tailwind CSS | Warm beige minimalist UI, mouse & touch drag engine |
| **Backend** | FastAPI, Uvicorn, WebSockets | In-memory game state, room isolation, async locks |
| **Transport** | Dual Transport | HTTP (room creation/join) + WebSocket (real-time gameplay) |
| **Dev Tools** | Oxlint, Graphify | High-speed linting, architectural knowledge graph |

---

## 🚀 Quick Start (Local Setup)

Clone the repository and follow the steps below to run both the backend and frontend servers locally.

### 1. Prerequisites
- **Node.js**: v18 or higher (`node -v`)
- **Python**: v3.10 or higher (`python3 --version`)

---

### 2. Backend Setup (FastAPI)

```bash
# Navigate to backend folder
cd backend

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
# .\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start FastAPI development server
uvicorn main:app --reload --port 8000
```
> 🌐 Backend API will be available at: **http://localhost:8000**  
> 📑 Interactive Swagger Docs: **http://localhost:8000/docs**

---

### 3. Frontend Setup (React + Vite)

Open a **new terminal tab/window**:

```bash
# Navigate to frontend folder
cd frontend

# Install npm packages
npm install

# Start Vite development server
npm run dev
```
> 🎮 Frontend UI will be available at: **http://localhost:5173**

---

## 📁 Project Structure

```
DOT-BOX/
├── backend/
│   ├── main.py             # FastAPI app, HTTP routes & WebSocket endpoint
│   ├── game.py             # Core game engine (box validation, scoring, turn rules)
│   ├── models.py           # Dataclasses & Pydantic models for Game & Player
│   ├── manager.py          # WebSocket ConnectionManager with per-room broadcast
│   └── requirements.txt    # Python dependencies
│
├── frontend/
│   ├── src/
│   │   ├── components/     # UI Components (GameBoard, Dot, Header, ScoreBoard, etc.)
│   │   ├── pages/          # Screens (Home, CreateGame, JoinGame, WaitingRoom, Game, GameResult)
│   │   ├── utils/board.js  # Grid calculation & wall/box ID helpers
│   │   ├── api.js          # HTTP API client (create/join room)
│   │   ├── socket.js       # WebSocket manager
│   │   ├── App.jsx         # App view controller
│   │   └── main.jsx        # React entrypoint
│   ├── package.json
│   └── vite.config.js
│
├── TIMELINE.md             # 12-Phase Development Roadmap & Checklists
├── hi.md                   # Full System Architecture & Specifications
└── README.md               # Setup Guide
```

---

## 🧭 Roadmap & Timeline

Follow our step-by-step 12-phase development progress in [TIMELINE.md](file:///Users/shauryatiwari/Desktop/CODE/DOT%20-%20BOX%20/TIMELINE.md).

---

## 🤖 Using an AI IDE? (Antigravity, Cursor, Windsurf, Claude Code)

> [!IMPORTANT]
> **If you are building this project with an AI IDE / Coding Assistant:**  
> Please install and run **Graphify** once after cloning. This generates a local architectural knowledge graph (`graphify-out/`) so your AI assistant understands the whole project structure, file connections, and design decisions accurately without hallucinations.

### Quick Setup for AI Memory:
```bash
# 1. Install Graphify (one-time global/local install)
pip install graphifyy
# or with uv:
# uv tool install graphifyy

# 2. Generate knowledge graph in project root
graphify
```

- 🗺️ **Visual Graph:** Open `graphify-out/graph.html` in your browser to view the interactive map.
- 🔄 **Incremental Updates:** Whenever you finish a major phase or add new files, run `graphify --update` to refresh memory in ~2 seconds.


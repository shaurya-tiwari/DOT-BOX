#!/bin/bash
# DOT-BOX — Start both backend and frontend
# Usage: ./start.sh

set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "🎯 DOT-BOX Starting..."
echo ""

# Start backend
echo "▶ Starting backend (FastAPI on :8000)..."
cd "$ROOT/backend"

# Activate venv if it exists
if [ -d ".venv" ]; then
  source .venv/bin/activate
elif [ -d "../.venv" ]; then
  source ../.venv/bin/activate
fi

# Install deps if needed
pip install -q -r requirements.txt

uvicorn main:app --reload --port 8000 &
BACKEND_PID=$!

# Start frontend
echo "▶ Starting frontend (Vite on :5173)..."
cd "$ROOT/frontend"
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ Both servers running!"
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:8000"
echo ""
echo "Press Ctrl+C to stop both."

# Kill both on Ctrl+C
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo ''; echo '👋 Stopped.'" INT TERM
wait

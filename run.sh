#!/usr/bin/env bash
set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"
VENV_DIR="$ROOT_DIR/.venv"

GREEN='\033[0;32m'
AMBER='\033[0;33m'
DIM='\033[0;90m'
NC='\033[0m'

echo -e "${GREEN}▸ MACRO INVESTMENT DASHBOARD${NC}"
echo -e "${DIM}Starting local server...${NC}"
echo ""

# ── Python venv ───────────────────────────────────────────────────────────────
if [ ! -d "$VENV_DIR" ]; then
  echo -e "${AMBER}Creating Python virtual environment...${NC}"
  python3 -m venv "$VENV_DIR"
fi

source "$VENV_DIR/bin/activate"

echo -e "${AMBER}Installing Python dependencies...${NC}"
pip install -q -r "$BACKEND_DIR/requirements.txt"

# ── .env ─────────────────────────────────────────────────────────────────────
if [ ! -f "$ROOT_DIR/.env" ]; then
  echo -e "${AMBER}.env not found — copying from .env.example${NC}"
  cp "$ROOT_DIR/.env.example" "$ROOT_DIR/.env"
  echo -e "${AMBER}→ Edit .env to add your FRED_API_KEY before market data works.${NC}"
fi

# ── Node dependencies ─────────────────────────────────────────────────────────
if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
  echo -e "${AMBER}Installing Node dependencies...${NC}"
  cd "$FRONTEND_DIR" && npm install && cd "$ROOT_DIR"
fi

echo ""
echo -e "${GREEN}Starting backend on http://localhost:8000${NC}"
echo -e "${GREEN}Starting frontend on http://localhost:5173${NC}"
echo -e "${DIM}Press Ctrl+C to stop both servers.${NC}"
echo ""

# ── Start backend ─────────────────────────────────────────────────────────────
cd "$ROOT_DIR"
PYTHONPATH="$ROOT_DIR" uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

# ── Start frontend ────────────────────────────────────────────────────────────
cd "$FRONTEND_DIR"
npm run dev &
FRONTEND_PID=$!

# ── Cleanup on exit ───────────────────────────────────────────────────────────
cleanup() {
  echo ""
  echo -e "${AMBER}Stopping servers...${NC}"
  kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true
  wait "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true
  echo -e "${DIM}Done.${NC}"
}
trap cleanup INT TERM EXIT

wait "$BACKEND_PID" "$FRONTEND_PID"

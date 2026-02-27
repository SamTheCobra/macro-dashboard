.PHONY: start install clean reset backend frontend lint

## Start both backend and frontend
start:
	@chmod +x run.sh && ./run.sh

## Install all dependencies without starting servers
install:
	@python3 -m venv .venv && \
	  . .venv/bin/activate && \
	  pip install -q -r backend/requirements.txt
	@cd frontend && npm install

## Start only the backend
backend:
	@. .venv/bin/activate && \
	  PYTHONPATH=. uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload

## Start only the frontend
frontend:
	@cd frontend && npm run dev

## Remove database and restart fresh (keeps .env)
reset:
	@rm -f backend/macro_dashboard.db
	@echo "Database reset. Run 'make start' to reload seed data."

## Remove all generated files
clean:
	@rm -rf .venv frontend/node_modules frontend/dist backend/macro_dashboard.db __pycache__
	@find . -name "*.pyc" -delete
	@find . -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true
	@echo "Cleaned."

## Show API docs
docs:
	@echo "Backend API docs: http://localhost:8000/docs"
	@echo "Frontend:         http://localhost:5173"

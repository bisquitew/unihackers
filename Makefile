.PHONY: help install backend ai web mobile docker-up docker-down

help:
	@echo "UNIHACK 2026 - Timișoara City Hub (UniHackers)"
	@echo "=============================================="
	@echo "make install      - Install dependencies for backend and ai-service"
	@echo "make backend      - Run FastAPI core backend on port 8000"
	@echo "make ai           - Run AI & Voice service on port 8001"
	@echo "make web          - Run Vite/React web portal on port 5173"
	@echo "make mobile       - Start Expo React Native mobile project"
	@echo "make docker-up    - Start full stack using Docker Compose"
	@echo "make docker-down  - Stop all running Docker containers"

install:
	pip install -r packages/backend/requirements.txt
	pip install -r packages/ai-service/requirements.txt

backend:
	cd packages/backend && python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

ai:
	cd packages/ai-service && python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload

web:
	cd packages/web && npm install && npm run dev

mobile:
	cd packages/mobile && npm install && npx expo start

docker-up:
	docker compose up --build -d

docker-down:
	docker compose down

# Signal Clone

A full-stack Signal messenger clone built with React + FastAPI.

## Stack
- **Frontend:** React 19, TanStack Router, Zustand, TailwindCSS, Vite
- **Backend:** FastAPI, SQLite, WebSockets, JWT + bcrypt

## Quick Start

### 1. Backend
```bash
cd backend
pip install -r requirements.txt
python seed.py
python -m uvicorn main:app --reload --port 8000
```

### 2. Frontend
```bash
npm install
npm run dev
```

Open **http://localhost:5173**

## Test Logins
| Username | Password |
|----------|----------|
| alice | password123 |
| bob | password123 |
| charlie | password123 |
| diana | password123 |

## Environment Variables

**`.env`** (frontend root)
```env
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
```

**`backend/.env`**
```env
SECRET_KEY=your-secret-key
DATABASE_URL=./signal.db
CORS_ORIGINS=http://localhost:5173
```

Copy from the `.env.example` files included in each directory.

## Features
- JWT auth with bcrypt password hashing
- Real-time messaging via WebSockets
- Direct and group conversations
- Typing indicators & read receipts
- Optimistic UI updates
- Archive, mute, delete chats

## Deploy
- **Backend → Railway:** set `SECRET_KEY`, `CORS_ORIGINS`, start cmd: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- **Frontend → Vercel:** set `VITE_API_URL` + `VITE_WS_URL` pointing to your Railway URL

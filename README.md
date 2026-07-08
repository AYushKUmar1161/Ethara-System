# Ethara — Seat Allocation & Project Mapping System

> Enterprise-grade seat allocation and project mapping for 5,000+ employees.  
> Built with FastAPI · Next.js 16 · PostgreSQL · Redis · AI Assistant

---

## 🔗 Live Links

| Resource | URL |
|----------|-----|
| **Frontend (Vercel)** | https://ethara-system.vercel.app |
| **Backend API (Render)** | https://ethara-backend.onrender.com |
| **Swagger / API Docs** | https://ethara-backend.onrender.com/docs |
| **GitHub Repository** | https://github.com/AYushKUmar1161/Ethara-System |

---

## 🔐 Default Login

| Field | Value |
|-------|-------|
| Username | `admin` |
| Password | `admin123` |

---

## Features

| Feature | Description |
|---------|-------------|
| 🗺️ **Floor Visualizer** | Interactive seat grid across 5 floors, color-coded by status |
| 👤 **Employee Management** | CRUD for 5,000 employees with seat & project tracking |
| 🪑 **Seat Engine** | Manual, auto, bulk allocate/release/transfer + maintenance |
| 📊 **Analytics Dashboard** | KPIs, utilization by floor/zone/project, joining trends |
| 🤖 **AI Assistant** | Natural language queries for seat & project information |
| 🔍 **Global Search** | Search employees, seats, and projects in real-time |
| 🔐 **RBAC** | Admin / HR / Project Manager / Employee roles with JWT |
| 📋 **Audit Logs** | Every action logged with user, IP, and timestamp |

---

## Architecture

```
[ Next.js 16 Frontend (Vercel) ]
             │  JWT + REST
             ▼
[ FastAPI Backend (Render) ]
       │              │
       ▼              ▼
[ PostgreSQL      [ Redis Cache
  (Neon.tech) ]    (Upstash) ]
```

---

## Documentation

| Doc | Description |
|-----|-------------|
| [docs/DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md) | Full schema: all tables, columns, relationships |
| [docs/AI_PROMPTS.md](docs/AI_PROMPTS.md) | AI assistant usage, all 11 NLP intents, API reference |
| [docs/DEBUGGING.md](docs/DEBUGGING.md) | All bugs found + root causes + fixes |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Step-by-step deploy guide (Vercel + Render + Neon) |

---

## Seed Data

| Entity | Count |
|--------|-------|
| Employees | 5,000 (EMP0001–EMP5000) |
| Seats | 5,500 (55/bay × 100 bays) |
| Projects | 10 |
| Departments | 8 |
| Floors / Zones / Bays | 5 / 10 / 100 |
| Roles | 4 (Admin, HR, PM, Employee) |

To re-seed:
```bash
cd backend
python -m app.seed
```

---

## Local Quickstart

### Docker (recommended)
```bash
docker-compose up --build -d
# Frontend: http://localhost:3000
# Swagger:  http://localhost:8000/docs
```

### Manual Setup

**Backend:**
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
# Set env vars (copy .env.example → .env)
alembic upgrade head
python -m app.seed
uvicorn main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install --legacy-peer-deps
# Set NEXT_PUBLIC_API_URL in .env.local
npm run dev
```

---

## Environment Variables

**Backend (`.env`):**
```env
DATABASE_URL=postgresql+asyncpg://user:pass@host/db?ssl=require
REDIS_URL=rediss://default:token@host:6379
SECRET_KEY=your-32-char-secret
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
BACKEND_CORS_ORIGINS=["https://ethara-system.vercel.app"]
```

**Frontend (`.env.local`):**
```env
NEXT_PUBLIC_API_URL=https://ethara-backend.onrender.com/api/v1
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, TypeScript, Tailwind CSS |
| Backend | FastAPI, Python 3.12, SQLAlchemy 2.x (async) |
| Database | PostgreSQL 16 (Neon.tech) |
| Cache | Redis (Upstash) |
| Auth | JWT (access + refresh tokens), bcrypt |
| ORM | SQLAlchemy 2.x with Alembic migrations |
| AI | Regex NLP engine + OpenAI/Gemini wrapper |
| Deploy | Vercel (frontend) + Render (backend) |
| CI/CD | GitHub Actions |

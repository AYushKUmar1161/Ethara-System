# Ethara Seat Allocation & Project Mapping System

Ethara is an enterprise-grade seat allocation and project mapping application designed to manage the workspace layout, physical seats, and project mappings of 5000+ employees. Built with scalability, performance, and user aesthetics in mind, it resembles modern administrative dashboards used by major tech firms like Google, Microsoft, and Stripe.

---

## Architecture Overview

The system uses a clean separation of concerns with a FastAPI Service/Repository backend, a Redis cache/rate-limiting registry, a PostgreSQL relational database, and a Next.js 15 client dashboard.

```
       [ Client: Next.js 15 ]
                 │ (HTTP, JWT & CORS)
                 ▼
       [ Nginx Reverse Proxy ]
                 │ 
        ┌────────┴────────┐
        ▼                 ▼
  [ Backend: FastAPI ]  [ Cache & Rate Limit: Redis ]
        │ 
        ▼
  [ Database: PostgreSQL ]
```

---

## Features
- **Seat Engine**: Auto-allocates seats prioritizing project cohesion (nearby teammates), department adjacency, and alternative floor mappings.
- **Interactive Floor Visualizer**: Render seat matrices, floor layouts, and zone groupings in real-time. Allows admins to release seats, trigger manual transfers, or block seats for maintenance.
- **AI Assistant**: A chat bubble assistant capable of resolving spatial queries ("Where is Ayush seated?", "Available seats on Floor 3") and triggering allocations/releases. Falls back automatically to a local regex keyword NLP parser.
- **Role-Based Access Control (RBAC)**: Support for Admin, HR, Project Manager, and Employee roles with short-lived JWT access tokens and database-backed refresh tokens.

---

## Local Quickstart (WSL or Docker)

### Option 1: Run with Docker Compose
To start the database, caching registry, backend web API, and frontend client concurrently:
```bash
docker-compose up --build -d
```
The application will be accessible at:
- **Frontend Panel**: `http://localhost:3000`
- **Swagger API Docs**: `http://localhost:8000/docs`

### Option 2: Local Developer Setup

#### 1. Setup Backend
```bash
cd backend
python -m venv .venv
# Activate venv:
# Windows: .\.venv\Scripts\activate | Linux: source .venv/bin/activate
pip install -r requirements.txt

# Run migrations and seed data (5,000 employees, 5,500 seats)
alembic upgrade head
python -m app.seed

# Run dev server
uvicorn main:app --reload
```

#### 2. Setup Frontend
```bash
cd frontend
npm install --legacy-peer-deps
npm run dev
```

---

## Database Schema (PostgreSQL)

The relational layout consists of:
- `users` / `roles` / `permissions` / `sessions`: Security and session storage.
- `departments` / `projects` / `employees`: Organizational structures.
- `floors` / `zones` / `bays` / `seats`: Physical office building hierarchy.
- `seat_allocations`: Historic and active assignments.
- `audit_logs` / `notifications`: Compliance and user notifications.

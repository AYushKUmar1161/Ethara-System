# Ethara — Production Deployment Guide

Complete step-by-step guide for deploying the Ethara Seat Allocation System to production.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Production Stack                          │
│                                                             │
│  Browser  ──HTTPS──►  Vercel (Frontend)                    │
│                         │                                   │
│                         │ NEXT_PUBLIC_API_URL               │
│                         ▼                                   │
│               Render.com (Backend / FastAPI)                │
│                    │              │                         │
│                    ▼              ▼                         │
│            Neon PostgreSQL    Upstash Redis                 │
└─────────────────────────────────────────────────────────────┘
```

---

## Prerequisites

- Git repository pushed to GitHub
- Accounts on: [Vercel](https://vercel.com), [Render](https://render.com), [Neon](https://neon.tech), [Upstash](https://upstash.com)

---

## Step 1 — Set Up Managed PostgreSQL (Neon.tech)

1. Go to [neon.tech](https://neon.tech) → Create Account → New Project
2. Name it `ethara`
3. Choose region closest to your users
4. Copy the **Connection String** — it looks like:
   ```
   postgresql://user:pass@ep-xxx-xxx.us-east-2.aws.neon.tech/ethara?sslmode=require
   ```
5. Convert to asyncpg format for FastAPI:
   ```
   postgresql+asyncpg://user:pass@ep-xxx-xxx.us-east-2.aws.neon.tech/ethara?ssl=require
   ```
6. **Save this as `DATABASE_URL`** — you'll need it in the next steps.

### Run Migrations on Production DB
```bash
# From your local machine with the production DATABASE_URL set:
cd backend
DATABASE_URL="postgresql+asyncpg://..." alembic upgrade head
```

### Seed Production Data
```bash
DATABASE_URL="postgresql+asyncpg://..." python -m app.seed
```

---

## Step 2 — Set Up Managed Redis (Upstash)

1. Go to [upstash.com](https://upstash.com) → Create Account → New Database
2. Name it `ethara-redis`, choose region
3. Select **Redis** (not Kafka)
4. Copy the **Redis URL** from the dashboard — it looks like:
   ```
   rediss://default:TOKEN@us1-xxx.upstash.io:6379
   ```
5. **Save this as `REDIS_URL`**

---

## Step 3 — Deploy Backend to Render.com

1. Go to [render.com](https://render.com) → New → **Web Service**
2. Connect your GitHub repository
3. Configure:
   - **Name**: `ethara-backend`
   - **Region**: Same as your database
   - **Runtime**: **Docker**
   - **Dockerfile Path**: `./infrastructure/Dockerfile.backend`
   - **Docker Context**: `./backend`
4. Set Environment Variables (from the Render dashboard):

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | `postgresql+asyncpg://...` (from Neon) |
| `REDIS_URL` | `rediss://...` (from Upstash) |
| `JWT_SECRET` | Run: `python -c "import secrets; print(secrets.token_hex(64))"` |
| `ENVIRONMENT` | `production` |
| `BACKEND_CORS_ORIGINS` | `https://ethara.vercel.app` (add after Step 4) |

5. Set **Health Check Path**: `/health`
6. Deploy and wait for green status
7. Copy your Render service URL (e.g., `https://ethara-backend.onrender.com`)

### Get Render Deploy Hook (for CI/CD)
1. In Render Dashboard → Your Service → **Settings** → **Deploy Hooks**
2. Create a new hook → Copy the URL
3. Add as GitHub Secret: `RENDER_DEPLOY_HOOK_URL`

---

## Step 4 — Deploy Frontend to Vercel

### Option A: Vercel CLI (Recommended)
```bash
npm install -g vercel
cd frontend
vercel login
vercel --prod
```

### Option B: Vercel Dashboard
1. Go to [vercel.com](https://vercel.com) → New Project → Import Git Repository
2. Select your GitHub repo
3. Configure:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `frontend`
4. Set Environment Variables:

| Variable | Value |
|----------|-------|
| `BACKEND_URL` | `https://ethara-backend.onrender.com` |
| `NEXT_PUBLIC_API_URL` | `https://ethara-backend.onrender.com/api/v1` |

5. Click **Deploy**
6. Copy your Vercel URL (e.g., `https://ethara.vercel.app`)

### Update Backend CORS
After getting your Vercel URL, go back to Render and update:
```
BACKEND_CORS_ORIGINS=https://ethara.vercel.app,https://your-custom-domain.com
```
Then redeploy the backend.

---

## Step 5 — Configure GitHub Secrets for CI/CD

Add these secrets in GitHub → Settings → Secrets and Variables → Actions:

| Secret | Description |
|--------|-------------|
| `VERCEL_TOKEN` | Get from vercel.com → Account Settings → Tokens |
| `VERCEL_ORG_ID` | Get from vercel.com → Account Settings |
| `VERCEL_PROJECT_ID` | Get from Vercel project → Settings |
| `RENDER_DEPLOY_HOOK_URL` | From Render dashboard → Deploy Hooks |
| `NEXT_PUBLIC_API_URL` | `https://ethara-backend.onrender.com/api/v1` |

---

## Step 6 — Self-Hosted Docker Deployment (VPS)

If using a VPS (DigitalOcean, Linode, AWS EC2):

### Generate SSL Certificates
```bash
# Self-signed (for testing)
bash infrastructure/generate-ssl.sh

# OR with Let's Encrypt (for production with a domain)
sudo apt install certbot
sudo certbot certonly --standalone -d your-domain.com
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem infrastructure/ssl/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem infrastructure/ssl/key.pem
```

### Create production .env file
```bash
cp backend/.env.production.example backend/.env
# Fill in all values in backend/.env
```

### Deploy with Docker Compose
```bash
export POSTGRES_PASSWORD="your-secure-password"
export JWT_SECRET="your-64-char-secret"
export REDIS_PASSWORD="your-redis-password"
export NEXT_PUBLIC_API_URL="https://your-domain.com/api/v1"
export BACKEND_CORS_ORIGINS="https://your-domain.com"

docker-compose -f docker-compose.prod.yml up -d --build
```

### Run migrations and seed
```bash
docker exec ethara-prod-backend alembic upgrade head
docker exec ethara-prod-backend python -m app.seed
```

---

## Step 7 — Verification Checklist

After deployment, verify the following:

### Frontend (Vercel)
- [ ] `https://ethara.vercel.app` loads without errors
- [ ] HTTPS padlock shows in browser (auto by Vercel)
- [ ] Login with `admin` / `admin123` works
- [ ] Dashboard loads with data
- [ ] No console errors in DevTools (F12 → Console)

### Backend API
- [ ] `https://ethara-backend.onrender.com/health` returns `{"status":"healthy"}`
- [ ] `https://ethara-backend.onrender.com/docs` shows Swagger UI
- [ ] `https://ethara-backend.onrender.com/redoc` shows ReDoc UI
- [ ] `https://ethara-backend.onrender.com/api/v1/openapi.json` returns valid JSON

### Database
- [ ] Employee list loads in frontend (confirms DB connection)
- [ ] Seat visualization renders (confirms 5,500 seats seeded)

### Redis
- [ ] `/health` endpoint shows `"redis_connected": true`

### Security
- [ ] HTTP redirects to HTTPS (check with `curl -I http://your-domain.com`)
- [ ] No secrets exposed in browser Network tab
- [ ] Security headers present (`X-Frame-Options: DENY`, etc.)

---

## Rollback Procedure

### Frontend Rollback
- Vercel → Deployments → Click previous deployment → **Promote to Production**

### Backend Rollback
- Render → Your Service → Events → Previous deploy → **Redeploy**
- Or use Docker SHA tags: `docker pull ghcr.io/YOUR_REPO/backend:PREVIOUS_SHA`

---

## Default Credentials

| User | Username | Password | Role |
|------|----------|----------|------|
| System Admin | `admin` | `admin123` | Admin |
| Regular Employee | `user1` | `password123` | Employee |

> ⚠️ **IMPORTANT**: Change all default passwords immediately after first login in production!

---

## API Documentation

Once deployed, access:
- **Swagger UI**: `https://your-backend-url/docs`
- **ReDoc**: `https://your-backend-url/redoc`
- **OpenAPI JSON**: `https://your-backend-url/api/v1/openapi.json`

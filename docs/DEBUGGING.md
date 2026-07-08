# Ethara — Debugging Notes

A complete record of bugs encountered, root causes, and fixes applied during development and deployment.

---

## BUG-001 — Seed FK Violation on Windows Python 3.14

**Symptom:**
```
sqlalchemy.exc.IntegrityError: insert or update on table "users" violates
foreign key constraint "users_role_id_fkey"
DETAIL: Key (role_id)=(5) is not present in table "roles"
```

**Root Cause:**
- `clean_database()` used `table.delete()` which deletes rows but **does NOT reset PostgreSQL sequences**
- After cleaning, new inserts continued from sequence position 5 (previous high-water mark)
- `roles["Admin"].id` returned `5`, admin user was inserted with `role_id=5`
- FK constraint failed because roles table didn't have id=5 in it yet at the time of the user insert
- Additionally, admin user had **hardcoded `id=1`** which conflicted when sequences weren't at 1

**Fix Applied:**  
`backend/app/seed.py` — `clean_database()` now uses `TRUNCATE ... RESTART IDENTITY CASCADE`:
```python
await session.execute(text(
    f"TRUNCATE TABLE {tables_csv} RESTART IDENTITY CASCADE;"
))
```
Also removed `id=1` from the admin User object and added `await session.flush()` before reading back permissions.

---

## BUG-002 — CI Pipeline backend-test Failing (44s timeout)

**Symptom:**
```
ModuleNotFoundError: No module named 'aiosqlite'
```

**Root Cause:**
- `conftest.py` sets up an in-memory SQLite test database using `sqlite+aiosqlite:///:memory:`
- `aiosqlite` was not listed in `requirements.txt`
- CI installs only from `requirements.txt`, so tests crashed on import

**Fix Applied:**  
Added to `backend/requirements.txt`:
```
aiosqlite>=0.20.0
```

---

## BUG-003 — CI Pipeline deploy-frontend-vercel Failing (6s)

**Symptom:**
```
Error: Input required and not supplied: token
```

**Root Cause:**
- The `deploy-frontend-vercel` job ran unconditionally even when Vercel secrets were not configured in GitHub Actions

**Fix Applied:**  
`.github/workflows/deploy.yml` — added `if:` condition:
```yaml
if: ${{ secrets.VERCEL_TOKEN != '' }}
```
Job now skips gracefully instead of failing when secrets are absent.

---

## BUG-004 — Seed Ran from Both WSL and Windows Simultaneously

**Symptom:**
- WSL seed completed successfully
- Windows seed cleaned the DB immediately after, then failed midway
- Result: empty database

**Root Cause:**
- Two concurrent seed processes: one via WSL bash (`wsl python ...`) and one via Windows PowerShell
- WSL finished first and seeded correctly
- Windows started, ran `TRUNCATE ... CASCADE` (wiped WSL data), then failed at users FK step

**Fix Applied:**
- Killed the Windows task before re-running
- Only run seed from ONE process at a time
- The `TRUNCATE ... RESTART IDENTITY CASCADE` fix (BUG-001) ensures future runs always succeed

---

## BUG-005 — PowerShell Treats DeprecationWarning as Exit Code 1

**Symptom:**
```
The command failed with exit code: 1
Output: Database Seeding Completed Successfully!
```

**Root Cause:**
- Python's `DeprecationWarning` for `datetime.utcnow()` is written to **stderr**
- PowerShell with `2>&1` captures stderr as a "NativeCommandError" and sets exit code 1 even when Python itself exited 0

**Fix Applied:**
- Recognized this as a false failure — seeding was 100% successful
- Long-term: Replace `datetime.utcnow()` with `datetime.now(datetime.UTC)` to silence the warning

---

## BUG-006 — Frontend Floor Visualizer Shows Empty Grid

**Symptom:**
- Login works, dashboard loads, but Floor Visualizer shows no seats
- Employees page shows 0 records

**Root Cause:**
- Database was wiped by BUG-004 (simultaneous seed conflict)
- Backend returned empty arrays; frontend correctly showed nothing

**Fix Applied:**
- Re-seeded the database (BUG-001 fix applied first)
- After successful seed, Floor Visualizer and Employees page populated correctly

---

## BUG-007 — Neon DB Connection Fails from WSL (Port 5432 Blocked)

**Symptom:**
```
asyncpg.exceptions.TooManyConnectionsError
# OR
Connection timeout to ep-mute-forest-ati4wqdq-pooler.c-9.us-east-1.aws.neon.tech:5432
```

**Root Cause:**
- WSL2 network uses NAT — port 5432 outbound can be blocked by Windows Firewall or ISP
- Neon's pooler endpoint uses port 5432 which some environments restrict

**Fix Applied:**
- Ran seed from **Windows PowerShell** directly (bypasses WSL network stack)
- Windows can reach Neon port 5432 without issue

---

## BUG-008 — `channel_binding=require` in Connection String Causes asyncpg Error

**Symptom:**
```
asyncpg.exceptions.InvalidAuthorizationSpecificationError
```

**Root Cause:**
- The Neon connection string from the dashboard includes `channel_binding=require`
- asyncpg does not support the `channel_binding` parameter

**Fix Applied:**
Connection string format changed from:
```
postgresql://user:pass@host/db?sslmode=require&channel_binding=require
```
To asyncpg-compatible format:
```
postgresql+asyncpg://user:pass@host/db?ssl=require
```

---

## BUG-009 — Alembic `env.py` Missing Async Engine Configuration

**Symptom:**
```
sqlalchemy.exc.MissingGreenlet: greenlet_spawn has not been called
```

**Root Cause:**
- Alembic's default `env.py` template uses synchronous connections
- Project uses async SQLAlchemy engine
- Alembic requires explicit `run_async_migrations()` wrapper

**Fix Applied:**
`backend/alembic/env.py` updated to use:
```python
async def run_async_migrations():
    connectable = async_engine_from_config(...)
    async with connectable.connect() as conn:
        await conn.run_sync(do_run_migrations)
asyncio.run(run_async_migrations())
```

---

## BUG-010 — Frontend `NEXT_PUBLIC_API_URL` Not Set on Vercel

**Symptom:**
- Frontend deployed on Vercel but all API calls return CORS/network errors
- Swagger docs unreachable

**Root Cause:**
- `NEXT_PUBLIC_API_URL` environment variable not configured in Vercel dashboard
- Next.js uses this at **build time** — must be set before deploying

**Fix:**
In Vercel → Project → Settings → Environment Variables:
```
NEXT_PUBLIC_API_URL = https://your-render-backend.onrender.com/api/v1
```
Then trigger a **Redeploy** (not just Save).

---

## General Debugging Tips

### Check backend logs on Render:
Render Dashboard → Select Service → **Logs** tab

### Check frontend build errors on Vercel:
Vercel Dashboard → Deployments → Click deployment → **Build Logs**

### Test API locally:
```bash
# Swagger UI
http://localhost:8000/docs

# Raw health check
curl http://localhost:8000/api/v1/health
```

### Test DB connection:
```bash
python -c "import asyncpg, asyncio; asyncio.run(asyncpg.connect('postgresql://...'))"
```

### Force re-seed (safe — uses TRUNCATE CASCADE):
```bash
cd backend
python -m app.seed
```

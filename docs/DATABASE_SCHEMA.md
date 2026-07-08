# Ethara — Database Schema

**Database:** PostgreSQL (hosted on Neon.tech)  
**ORM:** SQLAlchemy 2.x (async)  
**Migrations:** Alembic  

---

## Entity Relationship Overview

```
permissions ◄──── role_permissions ────► roles
                                           │
                                           ▼
                                         users ◄──── sessions
                                           │
                                           ▼
departments ◄──── employees ────► seat_allocations ◄──── seats
     │                 │                                   │
     ▼                 ▼                                   ▼
projects ◄──────────────                                  bays
                                                           │
                                                           ▼
                                                          zones
                                                           │
                                                           ▼
                                                          floors
```

---

## Tables

### `permissions`
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | INTEGER | PK, AUTO |
| `name` | VARCHAR(100) | UNIQUE, NOT NULL |
| `description` | VARCHAR(255) | NULLABLE |

**Seeded values:** `read:all`, `write:employees`, `write:projects`, `write:allocations`, `read:self`

---

### `roles`
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | INTEGER | PK, AUTO |
| `name` | VARCHAR(50) | UNIQUE, NOT NULL |
| `description` | VARCHAR(255) | NULLABLE |

**Seeded values:** `Admin`, `HR`, `Project Manager`, `Employee`

---

### `role_permissions` *(join table)*
| Column | Type | Constraints |
|--------|------|-------------|
| `role_id` | INTEGER | FK → roles.id CASCADE |
| `permission_id` | INTEGER | FK → permissions.id CASCADE |

---

### `users`
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | INTEGER | PK, AUTO |
| `username` | VARCHAR(50) | UNIQUE, NOT NULL |
| `email` | VARCHAR(100) | UNIQUE, NOT NULL |
| `hashed_password` | VARCHAR(255) | NOT NULL (bcrypt) |
| `role_id` | INTEGER | FK → roles.id RESTRICT |
| `is_active` | BOOLEAN | DEFAULT TRUE |
| `created_at` | TIMESTAMP | DEFAULT NOW() |
| `updated_at` | TIMESTAMP | ON UPDATE NOW() |

---

### `sessions`
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | INTEGER | PK, AUTO |
| `user_id` | INTEGER | FK → users.id CASCADE |
| `refresh_token` | VARCHAR(512) | UNIQUE, NOT NULL |
| `expires_at` | TIMESTAMP TZ | NOT NULL |
| `is_revoked` | BOOLEAN | DEFAULT FALSE |
| `user_agent` | VARCHAR(255) | NULLABLE |
| `ip_address` | VARCHAR(50) | NULLABLE |
| `created_at` | TIMESTAMP TZ | DEFAULT NOW() |

---

### `departments`
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | INTEGER | PK, AUTO |
| `name` | VARCHAR(100) | UNIQUE, NOT NULL |
| `code` | VARCHAR(20) | UNIQUE, NOT NULL |
| `description` | VARCHAR(255) | NULLABLE |
| `created_at` | TIMESTAMP | DEFAULT NOW() |
| `updated_at` | TIMESTAMP | ON UPDATE NOW() |

**Seeded:** Engineering, Product, Design, Sales, Marketing, HR, Finance, Operations

---

### `projects`
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | INTEGER | PK, AUTO |
| `name` | VARCHAR(100) | UNIQUE, NOT NULL |
| `code` | VARCHAR(20) | UNIQUE, NOT NULL |
| `description` | TEXT | NULLABLE |
| `status` | VARCHAR(20) | DEFAULT 'Active' |
| `start_date` | DATE | NULLABLE |
| `end_date` | DATE | NULLABLE |
| `created_at` | TIMESTAMP | DEFAULT NOW() |
| `updated_at` | TIMESTAMP | ON UPDATE NOW() |

**Seeded:** 10 projects (Apollo, Helios, Aurora, Nexus, Titan, Orion, Polaris, Nova, Quantum, Horizon)

---

### `employees`
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | INTEGER | PK, AUTO |
| `user_id` | INTEGER | FK → users.id SET NULL, NULLABLE |
| `employee_id` | VARCHAR(20) | UNIQUE, NOT NULL (e.g. EMP0001) |
| `first_name` | VARCHAR(100) | NOT NULL |
| `last_name` | VARCHAR(100) | NOT NULL |
| `email` | VARCHAR(150) | UNIQUE, NOT NULL |
| `phone` | VARCHAR(20) | NULLABLE |
| `department_id` | INTEGER | FK → departments.id SET NULL |
| `project_id` | INTEGER | FK → projects.id SET NULL |
| `designation` | VARCHAR(100) | NULLABLE |
| `status` | VARCHAR(20) | DEFAULT 'Active' |
| `joining_date` | DATE | NULLABLE |
| `created_at` | TIMESTAMP | DEFAULT NOW() |
| `updated_at` | TIMESTAMP | ON UPDATE NOW() |

**Seeded:** 5,000 employees (EMP0001–EMP5000)

---

### `floors`
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | INTEGER | PK, AUTO |
| `name` | VARCHAR(50) | UNIQUE, NOT NULL |
| `number` | INTEGER | UNIQUE, NOT NULL |

**Seeded:** Floor 1–5

---

### `zones`
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | INTEGER | PK, AUTO |
| `floor_id` | INTEGER | FK → floors.id CASCADE |
| `name` | VARCHAR(50) | NOT NULL |
| `code` | VARCHAR(20) | NOT NULL |
| *Unique:* | `(floor_id, name)` | `(floor_id, code)` |

**Seeded:** 2 zones per floor = 10 zones total (ZA, ZB per floor)

---

### `bays`
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | INTEGER | PK, AUTO |
| `zone_id` | INTEGER | FK → zones.id CASCADE |
| `name` | VARCHAR(50) | NOT NULL |
| `code` | VARCHAR(20) | NOT NULL |
| *Unique:* | `(zone_id, name)` | `(zone_id, code)` |

**Seeded:** 10 bays per zone = 100 bays total

---

### `seats`
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | INTEGER | PK, AUTO |
| `bay_id` | INTEGER | FK → bays.id CASCADE |
| `number` | VARCHAR(50) | UNIQUE, NOT NULL |
| `status` | VARCHAR(20) | DEFAULT 'Available' |
| `type` | VARCHAR(20) | DEFAULT 'Standard' |

**Status values:** `Available`, `Occupied`, `Reserved`, `Maintenance`  
**Type values:** `Standard` (90%), `HotDesk` (5%), `Ergonomic` (5%)  
**Seeded:** 55 seats per bay = 5,500 seats total  
**Seat number format:** `S-{BayCode}-{NN}` e.g. `S-F1ZAB01-01`

---

### `seat_allocations`
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | INTEGER | PK, AUTO |
| `seat_id` | INTEGER | FK → seats.id CASCADE |
| `employee_id` | INTEGER | FK → employees.id CASCADE |
| `project_id` | INTEGER | FK → projects.id SET NULL |
| `allocated_by` | INTEGER | FK → users.id SET NULL |
| `status` | VARCHAR(20) | DEFAULT 'Active' |
| `notes` | TEXT | NULLABLE |
| `start_date` | DATE | DEFAULT today |
| `end_date` | DATE | NULLABLE |
| `created_at` | TIMESTAMP | DEFAULT NOW() |
| `updated_at` | TIMESTAMP | ON UPDATE NOW() |

**Status values:** `Active`, `Released`, `Reserved`, `Transferred`

---

### `audit_logs`
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | INTEGER | PK, AUTO |
| `user_id` | INTEGER | FK → users.id SET NULL |
| `action` | VARCHAR(100) | NOT NULL |
| `details` | TEXT | NULLABLE |
| `ip_address` | VARCHAR(50) | NULLABLE |
| `created_at` | TIMESTAMP TZ | DEFAULT NOW() |

---

### `notifications`
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | INTEGER | PK, AUTO |
| `user_id` | INTEGER | FK → users.id CASCADE |
| `title` | VARCHAR(200) | NOT NULL |
| `message` | TEXT | NOT NULL |
| `is_read` | BOOLEAN | DEFAULT FALSE |
| `created_at` | TIMESTAMP | DEFAULT NOW() |
| `updated_at` | TIMESTAMP | ON UPDATE NOW() |

---

## Seed Data Summary

| Table | Count |
|-------|-------|
| Permissions | 5 |
| Roles | 4 |
| Departments | 8 |
| Projects | 10 |
| Floors | 5 |
| Zones | 10 (2/floor) |
| Bays | 100 (10/zone) |
| Seats | 5,500 (55/bay) |
| Users | 5,001 (1 admin + 5,000 employees) |
| Employees | 5,000 |
| Seat Allocations | ~4,500 active |
| Audit Logs | 2 (system init + login) |

---

## Alembic Migration

```bash
# Apply all migrations
alembic upgrade head

# Create a new migration
alembic revision --autogenerate -m "description"

# Downgrade one step
alembic downgrade -1
```

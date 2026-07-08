# Ethara — AI Assistant Prompts Reference

> **File**: `ai_prompts.md`  
> **Component**: `backend/app/services/ai_service.py` · `frontend/src/components/AIAssistant.tsx`  
> **Engine**: Deterministic NLP keyword parser with optional LLM fallback (OpenAI / Gemini)

---

## Overview

The Ethara Workspace Assistant uses a **two-tier AI pipeline**:

1. **LLM Tier** *(optional)* — If `OPENAI_API_KEY` or `GEMINI_API_KEY` is set, routes queries to the LLM  
2. **Keyword Fallback Tier** *(always active)* — Deterministic regex parser that guarantees accurate answers from the live database

The keyword parser runs in O(1) and returns **real-time database results** — not hallucinated responses.

---

## Quick Command Suggestions (Frontend Pills)

These are shown in the assistant tray when the user clicks the `?` icon:

| Pill Label | What It Sends |
|-----------|--------------|
| `Where is Ayush seated?` | Name-based seat lookup |
| `List available seats` | All available seats with floor breakdown |
| `Zone A seat utilization` | Occupancy rate for Zone A |
| `Show active projects` | All active project seat utilization |
| `Who is in Project Apollo?` | Members allocated under a project |

---

## Supported Query Patterns

### 1. Seat Allocation (Action)

**Trigger Pattern:**
```
allocate seat [SEAT_NUMBER] to [EMPLOYEE_ID]
```

**Regex:**
```
allocate\s+seat\s+([\w\-]+)\s+to\s+(emp\d+)
```

**Example Prompts:**
```
Allocate seat S-F1ZA-B01-01 to EMP0042
allocate seat S-F2ZB-B05-12 to emp0100
```

**Expected Response:**
```
Successfully allocated seat S-F1ZA-B01-01 to John Smith (EMP0042).
```

**Error Responses:**
```
Seat S-F1ZA-B01-01 not found.
Employee EMP0042 not found.
Failed to allocate seat: [reason]
```

---

### 2. Seat Release (Action)

**Trigger Pattern:**
```
release seat for [EMPLOYEE_ID]
```

**Regex:**
```
release\s+seat\s+for\s+(emp\d+)
```

**Example Prompts:**
```
Release seat for EMP0042
release seat for emp0100
```

**Expected Response:**
```
Successfully released seat allocation for John Smith (EMP0042).
```

---

### 3. Where Is [Employee] Seated?

**Trigger Patterns:**
```
Where is [Name/ID] seated?
Where sits [Name/ID]?
```

**Regex (OR match):**
```
where\s+is\s+([\w\.\s]+)\s+seated
where\s+sits\s+([\w\.\s]+)
```

**Example Prompts:**
```
Where is Ayush seated?
Where is EMP0001 seated?
Where is Priya Sharma seated?
where sits emp0050
```

**Expected Response:**
```
Employee Ayush Patel (EMP0001) is seated at S-F1ZA-B01-03 in Bay 1 (Zone A).
```

**Unseated Response:**
```
Employee Ayush Patel (EMP0001) is currently unseated (status: Pending Allocation).
```

**Not Found Response:**
```
Employee matching 'Ayush' was not found in the registry.
```

---

### 4. Who Sits Near [Employee]?

**Trigger Patterns:**
```
Who sits near [Name/ID]?
Who sits near me?
```

**Regex:**
```
who\s+sits\s+near\s+([\w\.\s]+)
```

**Example Prompts:**
```
Who sits near Priya?
Who sits near EMP0042?
Who sits near me?
```

**Expected Response:**
```
Employees seated near Priya in Bay 3 (Zone A): Rahul Verma (S-01), Neha Singh (S-02), Arun Kumar (S-05).
```

---

### 5a. Available Seats on a Specific Floor

**Trigger Pattern:**
```
Available seats on floor [N]
```

**Regex:**
```
available\s+seats\s+on\s+floor\s+(\d+)
```

**Example Prompts:**
```
Available seats on floor 2
available seats on floor 1
```

**Expected Response:**
```
There are 98 available seats on Floor 2. Sample seats: ZA-B01-12, ZA-B02-45, ZB-B03-07, ...
```

---

### 5b. List All Available Seats

**Trigger Pattern:**
```
List available seats
Available seats
Show available seats
```

**Keyword Match:** `"available seats" in query`

**Example Prompts:**
```
List available seats
Show available seats
How many seats are available?
available seats
```

**Expected Response:**
```
There are currently 499 available seats in the workspace.
Breakdown by floor:
- Floor 1: 102 available
- Floor 2: 98 available
- Floor 3: 105 available
- Floor 4: 97 available
- Floor 5: 97 available
```

---

### 5c. Zone Seat Utilization

**Trigger Pattern:**
```
Zone [X] seat utilization
Zone [X] utilization
```

**Regex:**
```
zone\s+(\w+)\s+(?:seat\s+)?utilization
```

**Example Prompts:**
```
Zone A seat utilization
Zone B utilization
zone a utilization
```

**Expected Response:**
```
Zone A has 550 total seats, with 520 currently occupied (Utilization Rate: 94.5%).
```

---

### 6a. Show Active Projects / Project Utilization

**Trigger Pattern:**
```
Show active projects
Project utilization
Active projects
List projects
```

**Keyword Match:** `"project" in query AND ("active" OR "list" OR "show" OR "utilization") in query`

**Example Prompts:**
```
Show active projects
Project utilization
List all projects
Show active projects count
```

**Expected Response:**
```
Active Projects seat utilization:
- Project Apollo: 512 seats allocated
- Project Gemini: 487 seats allocated
- Project Titan: 356 seats allocated
- Project Orion: 298 seats allocated
- Project Athena: 234 seats allocated
- Project Artemis: 189 seats allocated
- Project Ares: 412 seats allocated
- Project Phoenix: 321 seats allocated
- Project Hermes: 278 seats allocated
- Project Kronos: 445 seats allocated
```

---

### 6b. Who Is in Project [Name]?

**Trigger Pattern:**
```
Who is in Project [Name]?
Members of Project [Name]
```

**Regex (OR match):**
```
who\s+is\s+in\s+project\s+([\w\.\s\-]+)
members\s+of\s+project\s+([\w\.\s\-]+)
```

**Example Prompts:**
```
Who is in Project Apollo?
who is in project gemini
Members of Project Titan
```

**Expected Response:**
```
Active seated employees for Project Apollo: Ayush Patel (EMP0001), Priya Sharma (EMP0042), Rahul Verma (EMP0100), ...
```

---

### 7. Pending Allocations

**Trigger Pattern:**
```
Pending allocations
Unallocated employees
Who is unseated?
```

**Keyword Match:** `"pending allocations" OR "unallocated employees" OR "who is unseated" in query`

**Example Prompts:**
```
Pending allocations
Show unallocated employees
Who is unseated?
```

**Expected Response:**
```
Employees pending seat allocation (showing first 10): John Doe (EMP4951), Jane Smith (EMP4952), ...
```

---

## Fallback / Help Response

When no pattern matches, the assistant returns a formatted help message:

```
I couldn't match your query. Try asking me:
- 'Where is [Name/ID] seated?'
- 'Who sits near [Name/ID]?'
- 'Available seats on Floor [Number]'
- 'List available seats'
- 'Zone [Zone Name/Letter] utilization'
- 'Project utilization'
- 'Who is in Project [Project Name]?'
- 'Pending allocations'
```

---

## Welcome Message (System Prompt)

Displayed automatically when the assistant panel opens:

```
Hello! I am your AI Seat Allocation Assistant. How can I help you manage the workspace today?
```

---

## LLM Integration Prompts (Optional)

When `OPENAI_API_KEY` or `GEMINI_API_KEY` is set in the backend `.env`:

### Recommended System Prompt

```
You are an enterprise workspace management AI assistant for Ethara.
You help office administrators manage seat allocations, employee seating,
project assignments, and workspace utilization analytics.

You have access to:
- 5,000 employees across 8 departments
- 5,500 seats across 5 floors and 10 zones
- 10 active projects
- Real-time seat allocation data

When answering queries:
1. Always be precise and cite specific data (seat numbers, employee IDs)
2. Use friendly, professional language
3. If you cannot find an answer, suggest specific query formats
4. Never make up seat numbers, employee IDs, or project data
5. For actions (allocate/release), confirm with exact details before proceeding

Supported actions:
- Look up where an employee is seated
- Check seat availability by floor or zone
- View project team members and utilization
- Allocate or release seats (requires Admin/HR role)
```

### Context Payload to Inject into LLM

```json
{
  "context": {
    "system": "Ethara Seat Allocation System",
    "total_employees": 5000,
    "total_seats": 5500,
    "floors": [1, 2, 3, 4, 5],
    "zones_per_floor": ["Zone A", "Zone B"],
    "active_projects": [
      "Project Apollo", "Project Gemini", "Project Titan", "Project Orion",
      "Project Athena", "Project Artemis", "Project Ares", "Project Phoenix",
      "Project Hermes", "Project Kronos"
    ],
    "seat_statuses": ["Available", "Occupied", "Reserved", "Maintenance"],
    "user_role": "[INJECT: current_user.role.name]",
    "current_user_id": "[INJECT: current_user.id]"
  },
  "user_query": "[INJECT: user query string]"
}
```

---

## All Query Patterns — Quick Reference

| Intent | Example Prompt | Regex / Match | Handler |
|--------|---------------|---------------|---------|
| Allocate seat | `Allocate seat S-F1ZA-B01-01 to EMP0001` | `allocate\s+seat\s+([\w\-]+)\s+to\s+(emp\d+)` | `handle_api_allocation` |
| Release seat | `Release seat for EMP0042` | `release\s+seat\s+for\s+(emp\d+)` | `handle_api_release` |
| Find employee | `Where is Priya seated?` | `where\s+is\s+([\w\.\s]+)\s+seated` | `handle_where_is` |
| Find employee (alt) | `Where sits EMP0001` | `where\s+sits\s+([\w\.\s]+)` | `handle_where_is` |
| Neighbors | `Who sits near Rahul?` | `who\s+sits\s+near\s+([\w\.\s]+)` | `handle_who_sits_near` |
| Floor seats | `Available seats on floor 3` | `available\s+seats\s+on\s+floor\s+(\d+)` | `handle_available_seats_floor` |
| All available | `List available seats` | `"available seats" in query` | `handle_available_seats` |
| Zone utilization | `Zone A seat utilization` | `zone\s+(\w+)\s+(?:seat\s+)?utilization` | `handle_zone_utilization` |
| Project members | `Who is in Project Apollo?` | `who\s+is\s+in\s+project\s+([\w\.\s\-]+)` | `handle_project_members` |
| Project list | `Show active projects` | `"project" + "active/list/show"` | `handle_project_utilization` |
| Pending allocs | `Pending allocations` | `"pending allocations" in query` | `handle_pending_allocations` |

---

## REST API Endpoint

```http
POST /api/v1/ai/query
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json

{
  "query": "Where is Ayush seated?"
}
```

**Response:**
```json
{
  "response": "Employee Ayush Patel (EMP0001) is seated at S-F1ZA-B01-03 in Bay 1 (Zone A).",
  "timestamp": "2026-07-09T00:00:00Z"
}
```

---

## Error Handling

| Situation | Response |
|-----------|---------|
| Unmatched query | Fallback help message with suggested query formats |
| Employee not found | `"Employee matching '...' was not found."` |
| Seat not found | `"Seat ... not found."` |
| DB/internal error | `"An internal server error occurred. Please contact support."` |
| LLM API failure | Auto-falls back to deterministic keyword parser |

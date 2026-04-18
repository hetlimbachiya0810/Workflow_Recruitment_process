# HR & Recruitment Workflow Platform

A full-stack, multi-portal web application that digitizes and automates end-to-end recruitment workflows. Built with an AI-powered CV matching engine at its core, the system handles everything from receiving a job description to placing a candidate.

---

## Overview

Modern recruitment is fragmented — job descriptions shared over WhatsApp, CVs arriving unstructured, no pipeline visibility, and no audit trail. This platform solves that by bringing every stakeholder into a single, role-isolated system.

**Four portals. One pipeline.**

| Role | What They Do |
|---|---|
| Admin | User management, vendor approvals, matching engine config, financials |
| Recruiter | Log JDs, float to vendors, review CVs, compile shortlists, submit to client |
| Vendor | View assigned JDs, submit CVs via portal, track submission status |
| Client | View pipeline, review shortlisted candidates, give feedback, confirm interviews |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | FastAPI (Python 3.13) |
| Frontend | React + Vite |
| Database | PostgreSQL 17 + pgvector 0.8.2 |
| ORM & Migrations | SQLAlchemy + Alembic |
| AI / Matching | sentence-transformers (all-MiniLM-L6-v2) |
| CV File Storage | Cloudinary |
| Auth | JWT (access + refresh tokens) |
| State Management | Zustand |
| Styling | Tailwind CSS v3 |

---

## Architecture
```
Client Request
    ↓
FastAPI Router
    ↓
Service Layer (business logic)
    ↓
SQLAlchemy ORM → PostgreSQL
                      ↓
              pgvector (embeddings)
              Cloudinary (CV files)
```

### CV Matching Engine
Each CV is processed in three steps:
1. **Parse** — PDF text extracted via pdfplumber/PyMuPDF
2. **Embed** — Vector generated via sentence-transformers, stored in pgvector
3. **Score** — Weighted scoring across 5 dimensions:

| Dimension | Default Weight |
|---|---|
| Hard Skills | 40% |
| Certifications | 20% |
| Timezone Alignment | 20% |
| Soft Skills | 10% |
| Contract Duration | 10% |

Shortlist threshold: ≥ 80% (configurable). All weights are admin-configurable from the dashboard.

---

## Database Schema

16 tables across 5 clusters:

- **Auth** — users, roles
- **Parties** — clients, vendors
- **Recruitment Core** — job_descriptions, candidates, cv_submissions
- **Scoring & Shortlist** — match_scores, shortlists, shortlist_items
- **Post-Submission** — feedback, interviews, notifications
- **System** — system_config, audit_logs, jd_vendor_assignments

---

## Security Design

- JWT access tokens (60 min) + refresh tokens (7 days)
- Role-based route guards enforced at dependency level
- Vendor isolation: vendors only see JDs explicitly assigned to them (enforced at query level)
- Client isolation: clients never see vendor names, margins, or other clients' data
- Vendor approval gate: unapproved vendors cannot submit CVs
- Every action logged to audit_logs with timestamp and user ID
- Soft deletes only — no hard deletes, preserving audit integrity

---

## Project Structure
```
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── models/          # SQLAlchemy ORM models
│   │   ├── schemas/         # Pydantic request/response schemas
│   │   ├── routers/         # FastAPI route handlers
│   │   ├── services/        # Business logic layer
│   │   ├── core/            # Security, dependencies, audit
│   │   └── migrations/      # Alembic migrations
│   ├── requirements.txt
│   └── alembic.ini
├── frontend/
│   ├── src/
│   │   ├── api/             # Axios instance + per-resource API calls
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Role-based page components
│   │   ├── store/           # Zustand global state
│   │   ├── hooks/           # Custom React hooks
│   │   └── utils/           # Role routing helpers
│   └── package.json
└── README.md
```

---

## Local Setup

### Prerequisites
- Python 3.11+
- Node 18+
- PostgreSQL 17 with pgvector extension

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
source venv/bin/activate     # Mac/Linux

pip install -r requirements.txt

# Configure environment
cp .env.example .env         # Fill in your values

# Run migrations
alembic upgrade head

# Start server
uvicorn app.main:app --reload
```

Backend runs at: `http://localhost:8000`
Swagger docs at: `http://localhost:8000/docs`

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: `http://localhost:5173`

### Environment Variables

**backend/.env**
```
DATABASE_URL=postgresql://user:password@localhost:5432/recruitment_db
SECRET_KEY=your-64-char-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=7
ENVIRONMENT=development
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
```

**frontend/.env**
```
VITE_API_BASE_URL=http://localhost:8000
```

---

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| POST | /auth/login | Email + password → tokens |
| POST | /auth/refresh | Refresh token → new token pair |
| GET | /auth/me | Current user profile |

### User Management (Admin)
| Method | Endpoint | Description |
|---|---|---|
| POST | /users | Create user |
| GET | /users | List users (filterable) |
| GET | /users/{id} | Get single user |
| PATCH | /users/{id} | Update user |
| DELETE | /users/{id} | Deactivate user |

### Vendor Management (Admin)
| Method | Endpoint | Description |
|---|---|---|
| GET | /vendors | List vendors |
| GET | /vendors/{id} | Get single vendor |
| PATCH | /vendors/{id}/approval | Approve or revoke |

### Job Descriptions (Admin / Recruiter / Role-filtered)
| Method | Endpoint | Description |
|---|---|---|
| POST | /jds | Create JD (admin/recruiter) |
| GET | /jds | List JDs (role-filtered by access rules) |
| GET | /jds/{jd_id} | Get single JD |
| PATCH | /jds/{jd_id} | Partial update of JD |
| PATCH | /jds/{jd_id}/status | Status-only update |
| POST | /jds/{jd_id}/float | Float JD to vendors |
| GET | /jds/{jd_id}/assignments | List JD vendor assignments |
| PATCH | /jds/{jd_id}/acknowledge | Vendor acknowledges assignment |

### CV Submissions (Vendor)
| Method | Endpoint | Description |
|---|---|---|
| POST | /submissions | Submit CV with multipart upload |
| GET | /submissions/my | View vendor submission history |

### System
| Method | Endpoint | Description |
|---|---|---|
| GET | /config | Get matching engine config |
| GET | /health | Health check |

---

## Development Phases

| Phase | Description | Status |
|---|---|---|
| Phase 1 — Foundation | Auth, schema, role routing | ✅ Complete |
| Phase 2 — Core Recruitment Loop | JD management, vendor float/ack, CV submission portal | ✅ Backend Complete / 🔄 Frontend In Progress |
| Phase 3 — CV Matching Engine | PDF parsing, semantic scoring, shortlisting | 🔲 Planned |
| Phase 4 — Client Portal | Pipeline view, feedback, interviews | 🔲 Planned |
| Phase 5 — Admin, Financials & Config | Margin calculator, reports, config UI | 🔲 Planned |
| Phase 6 — Post-Submission | Notifications, interview management | 🔲 Planned |

---

## ML Roadmap

The system is deliberately built with a future ML upgrade path:

- **v1 (current)** — Weighted scoring with configurable parameters
- **v2** — Silent feedback logging — every recruiter override and client decision is recorded as training data
- **v3** — Train a classification model on accumulated outcome data, swap out the scoring function

The training data pipeline is already embedded in Phase 1 (`override_score`, `override_by`, `override_reason` fields in `match_scores` table).

---


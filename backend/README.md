# Court Evidence Management System (CEMS) — Backend REST API

A production-grade **Python + Flask** REST API backend connected to a **MySQL** relational database (`cems_db`), engineered for the **Court Evidence Management System (CEMS)**.

---

## ⚖️ Overview & Architecture

- **Frontend**: Pure Static HTML5 / CSS3 / Vanilla JavaScript ES6+ (deployable to Netlify).
- **Backend**: Python 3.10+ / Flask 3.1+ modular REST API with Flask-CORS.
- **Database**: MySQL 8.0+ / MariaDB 10.4+ (`cems_db`) with PyMySQL connection pooling.
- **Authentication**: JWT (JSON Web Tokens) with 24-hour expiration and Werkzeug password hashing.
- **Cryptographic Hashing**: Real server-side SHA-256 integrity verification (`hashlib.sha256`) with streaming chunk hashing for large digital evidence files.
- **Dual-Mode Frontend Client**: `js/api.js` communicates directly with Flask REST endpoints when available, and automatically falls back to LocalStorage demo mode if the server is offline.

---

## 📁 Directory Structure

```
backend/
├── app.py                      # Flask Application Factory, CORS & Blueprint Registry
├── config.py                   # Configuration Loader (.env, JWT, DB, Uploads)
├── requirements.txt            # Python Dependencies
├── .env.example                # Environment Variable Template
├── .env                        # Active Environment Variables
├── seed_db.py                  # 1-Click Database Creator & Seeder
├── test_api.py                 # Automated Test Suite (16/16 API tests)
│
├── database/
│   ├── db.py                   # PyMySQL Connection Pool & Transactions
│   ├── schema.sql              # MySQL DDL Schema for 10 Relational Tables
│   └── seed.sql                # Realistic Legal Seed Dataset
│
├── models/                     # CamelCase Serialization & Model Helpers
│   ├── user.py
│   ├── case.py
│   ├── evidence.py
│   ├── custody.py
│   ├── hearing.py
│   ├── document.py
│   ├── submission.py
│   ├── activity.py
│   ├── notification.py
│   └── setting.py
│
├── routes/                     # Modular REST Blueprints
│   ├── auth_routes.py          # /api/auth (Login, Logout, Me, Register)
│   ├── cases_routes.py         # /api/cases (CRUD, Multi-field Filters)
│   ├── evidence_routes.py      # /api/evidence (CRUD, Multipart Upload, Verify)
│   ├── custody_routes.py       # /api/custody (Timeline & Sequence Validator)
│   ├── hearings_routes.py      # /api/hearings (Calendar & Scheduling)
│   ├── documents_routes.py     # /api/documents (Case Document Repository)
│   ├── submissions_routes.py   # /api/submissions (Court Evidence Gateway)
│   ├── dashboard_routes.py     # /api/dashboard (Aggregated Metrics & Health)
│   ├── activity_routes.py      # /api/activity (Immutable Audit Trail)
│   ├── notifications_routes.py # /api/notifications (Alerts & Read Status)
│   ├── users_routes.py         # /api/users (Staff Directory)
│   └── settings_routes.py      # /api/settings (Preferences & Factory Reset)
│
├── services/                   # Business Logic & Cryptography
│   ├── auth_service.py         # JWT Token Lifecycle & Password Hashing
│   ├── hash_service.py         # Streaming SHA-256 File & Buffer Hasher
│   ├── evidence_service.py     # Evidence Ingestion & Verification Engine
│   ├── custody_service.py      # Sequence Anomaly & Gap Detection
│   └── audit_service.py        # Centralized Immutable Activity Logger
│
├── utils/                      # Middleware & File Helpers
│   ├── auth_middleware.py      # @token_required & @role_required Decorators
│   ├── file_upload.py          # Secure Filename & Upload Handlers
│   └── response.py             # Standardized JSON Response Wrappers
│
└── uploads/                    # Server-side File Storage
    ├── evidence/               # Uploaded Digital Evidence
    └── documents/              # Uploaded Legal Documents & Orders
```

---

## 🚀 Quickstart Guide

### 1. Prerequisites
- Python 3.10 or newer (`python --version`)
- MySQL Server (e.g. XAMPP MySQL running on `localhost:3306`)

### 2. Install Dependencies
In the terminal, navigate to the backend folder:
```bash
cd backend
pip install -r requirements.txt
```

### 3. Initialize & Seed Database
Ensure MySQL is running (e.g., start MySQL in XAMPP Control Panel), then run:
```bash
python seed_db.py
```
This script creates the `cems_db` database, executes all 10 table definitions from `schema.sql`, and inserts the seed data from `seed.sql`.

### 4. Run the Automated Test Suite
Verify that all endpoints and database connections are operational:
```bash
python test_api.py
```
Expected output: `16/16 tests passed (100.0%)`.

### 5. Start the Flask REST API Server
```bash
python app.py
```
The server will start on: `http://127.0.0.1:5000`

---

## 🔑 Default Credentials

| Email | Password | Role | Department |
|---|---|---|---|
| `admin@cems.com` | `admin123` | Evidence Officer | Central Evidence Vault |
| `arthur.court@cems.com` | `admin123` | Court Officer | Metropolitan High Court |
| `sarah.cyber@cems.com` | `admin123` | Investigator | Cyber Crime & Forensics |
| `elena.counsel@cems.com` | `admin123` | Advocate | Bar Association Panel |
| `evelyn.forensics@cems.com` | `admin123` | Reviewer | State Forensic Laboratory |

---

## 📡 REST API Reference

### Health Check
- `GET /api/health` — Check backend and MySQL connection status.

### Authentication (`/api/auth`)
- `POST /api/auth/login` — Authenticate and receive JWT Bearer token.
- `POST /api/auth/logout` — Log user logout activity.
- `GET /api/auth/me` — Retrieve profile of authenticated user.
- `POST /api/auth/register` — Register a new staff member.

### Case Management (`/api/cases`)
- `GET /api/cases` — List cases (Supports `?search=`, `?caseType=`, `?status=`, `?priority=`).
- `GET /api/cases/<case_id>` — Retrieve single case details.
- `POST /api/cases` — Create a new legal case.
- `PUT /api/cases/<case_id>` — Update case metadata.
- `DELETE /api/cases/<case_id>` — Delete case and cascade linked records.

### Evidence Registry & Lab (`/api/evidence`)
- `GET /api/evidence` — List evidence (Supports filters by case, type, verification status, court status).
- `GET /api/evidence/<evidence_id>` — Evidence profile & hash integrity details.
- `POST /api/evidence` — Ingest evidence. Supports multipart file upload (`file`) with automatic server-side SHA-256 calculation.
- `PUT /api/evidence/<evidence_id>` — Update evidence metadata.
- `DELETE /api/evidence/<evidence_id>` — Remove evidence item.
- `POST /api/evidence/<evidence_id>/verify` — Cryptographically audit evidence. Accepts file upload or `{"testHash": "..."}`.

### Chain of Custody (`/api/custody`)
- `GET /api/custody` — Chronological timeline of transfers (`?evidenceId=`).
- `POST /api/custody` — Log custody transfer event.
- `GET /api/custody/<evidence_id>/validate` — Sequence validator detecting skipped steps or gaps.

### Hearings (`/api/hearings`)
- `GET /api/hearings` — List hearings (`?caseId=`, `?status=`).
- `POST /api/hearings` — Schedule hearing.
- `PUT /api/hearings/<hearing_id>` — Update hearing date/status.
- `DELETE /api/hearings/<hearing_id>` — Cancel hearing.

### Case Documents (`/api/documents`)
- `GET /api/documents` — List documents (`?caseId=`).
- `POST /api/documents` — Ingest legal document file.
- `GET /api/documents/<doc_id>/download` — Download original stored document.
- `DELETE /api/documents/<doc_id>` — Delete document.

### Court Submissions (`/api/submissions`)
- `GET /api/submissions` — List evidence submitted to court.
- `POST /api/submissions` — Submit evidence to court and sync custody.
- `PUT /api/submissions/<sub_id>` — Update court admission status (`Accepted`, `Rejected`).

### Dashboard (`/api/dashboard`)
- `GET /api/dashboard/stats` — Real-time counters, status monitors, distributions, and recent records.

### Audit Trail (`/api/activity`)
- `GET /api/activity` — Retrieve immutable audit activity logs.

### System Settings (`/api/settings`)
- `GET /api/settings` — Get system configuration.
- `PUT /api/settings` — Update preferences.
- `POST /api/settings/reset` — Factory reset database back to seed dataset.

---

## 🌐 Frontend Integration

The frontend automatically connects to `http://127.0.0.1:5000/api`.
- When the backend is running, the top header displays: **MySQL Online** (green badge).
- When the backend is stopped or deployed as static-only (e.g. Netlify demo), the top header displays: **Demo Mode** (gold badge) and all features continue functioning seamlessly via LocalStorage.

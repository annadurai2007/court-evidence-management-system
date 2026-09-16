# Court Evidence Management System (CEMS)

> **Enterprise LegalTech SaaS Platform for Judicial Evidence Tracking, Cryptographic Chain of Custody & Court Hearing Dockets**

[![Netlify Deploy](https://img.shields.io/badge/Deploy-Netlify%20Ready-00C7B7?logo=netlify)](netlify.toml)
[![Backend Status](https://img.shields.io/badge/Backend-Python%20Flask%203.1-blue?logo=python)](backend/)
[![Database](https://img.shields.io/badge/Database-MySQL%20%2F%20MariaDB-00758F?logo=mysql)](backend/database/)
[![Security](https://img.shields.io/badge/Integrity-SHA--256%20Cryptographic-emerald)](pages/verification.html)
[![License](https://img.shields.io/badge/License-Proprietary%20Demo-gold.svg)](README.md)

---

## 🏛️ Executive Summary

The **Court Evidence Management System (CEMS)** is a modern, enterprise-grade Legal Technology web application engineered to streamline the end-to-end lifecycle of legal proceedings, courtroom dockets, digital evidence ingestion, cryptographic integrity verification, and audit logs. 

Designed with the visual aesthetics of high-end legal SaaS products, CEMS offers a dark navy interface accented with subtle gold highlights, glassmorphic cards, responsive mobile drawer navigation, and comprehensive data visualizations.

### 📐 Target Architecture
- **Frontend**: Pure Static HTML5 / CSS3 / Vanilla JavaScript ES6+ (deployable directly to **Netlify** with zero build steps).
- **Backend**: **Python + Flask** REST API with **PyMySQL** connection pooling, **JWT** Bearer authentication, and **Werkzeug** password hashing.
- **Database**: **MySQL** relational database (`cems_db`) with 10 tables, automated schema DDL, and realistic legal seed data.
- **Cryptography**: Server-side and client-side **SHA-256** hash verification with streaming chunk calculations for large multimedia files.
- **Dual-Mode Client**: `js/api.js` communicates directly with the Flask REST backend when running, and gracefully falls back to LocalStorage demo mode when running offline or standalone.

---

## 🔑 Demo Access Credentials

The application includes an authentication guard with 1-click persona quick-fill buttons on the login screen:

| Persona | Email | Password | Role / Access Level |
| :--- | :--- | :--- | :--- |
| **Evidence Officer** | `admin@cems.com` | `admin123` | Master Custodian, Vault & Custody Ledger |
| **Court Officer** | `arthur.court@cems.com` | `admin123` | Judicial Benches, Dockets & Admissibility |
| **Special Agent** | `sarah.cyber@cems.com` | `admin123` | Cyber Crime Forensics & Incident Reports |
| **Advocate** | `elena.counsel@cems.com` | `admin123` | Bar Association Panel & Case Defense |
| **Reviewer** | `evelyn.forensics@cems.com` | `admin123` | State Forensic Science Laboratory |

---

## 🚀 Complete Deployment Guide

### 1. LOCAL DEVELOPMENT (Step-by-Step)

#### Step 1.1: Start MySQL
Start MySQL server (e.g., in **XAMPP Control Panel** click "Start" next to MySQL on Port 3306).

#### Step 1.2: Setup & Seed Database
Run the 1-click database creator script:
```powershell
cd backend
python seed_db.py
```
This automatically connects to MySQL, creates `cems_db`, creates all 10 tables from `schema.sql`, and inserts the seed dataset from `seed.sql`.

#### Step 1.3: Configure Backend Environment
Copy the configuration template:
```powershell
copy .env.example .env
```
Ensure `DB_USER=root`, `DB_PASSWORD=`, `DB_NAME=cems_db`.

#### Step 1.4: Run Automated Tests
Verify all 36 REST endpoints and database functionality:
```powershell
python test_api.py
```
Expected output: `36/36 tests passed (100.0%)`.

#### Step 1.5: Start the Flask REST API Server
```powershell
python app.py
```
Backend runs at `http://127.0.0.1:5000` with CORS enabled for local frontend origins.

#### Step 1.6: Open Frontend
Open `index.html` or `pages/dashboard.html` in your browser (or use VS Code Live Server on `http://127.0.0.1:5500`).
The top header will display the pulsing green **`MySQL Online`** indicator badge.

---

### 2. NETLIFY FRONTEND DEPLOYMENT

The frontend is 100% static HTML/CSS/JS with zero build commands, deployable to Netlify in seconds:

#### Step 2.1: Configure Backend URL in `js/config.js`
Open `js/config.js` and set your deployed backend API URL:
```javascript
const defaultProductionApi = 'https://YOUR-BACKEND-API-DOMAIN.com/api';
```
*(Or set `window.CEMS_API_URL` or use the browser LocalStorage setting).*

#### Step 2.2: Push Frontend to GitHub
```bash
git add .
git commit -m "Deploy CEMS Frontend"
git push origin main
```

#### Step 2.3: Connect to Netlify
1. Go to [app.netlify.com](https://app.netlify.com) and click **"Add new site"** > **"Import an existing project"**.
2. Select your GitHub repository.
3. Configure build settings:
   - **Base directory**: (leave empty)
   - **Build command**: (leave empty)
   - **Publish directory**: `.` (root workspace)
4. Click **Deploy Site**.
5. Netlify will publish your site instantly (e.g. `https://cems-legal.netlify.app`).

#### Step 2.4: Verify Frontend
- Visit your Netlify URL.
- Log in with `admin@cems.com` / `admin123`.
- Verify pages, search, evidence hashing, custody records, and responsive mobile view.

---

### 3. BACKEND DEPLOYMENT (Render, Railway, AWS, DigitalOcean)

Deploy the Flask backend on any Python PaaS:

#### Step 3.1: Provision Production MySQL Database
Create a MySQL instance (e.g. on Railway, AWS RDS, PlanetScale, or Render Managed MySQL).
Execute `backend/database/schema.sql` and `backend/database/seed.sql` on the database.

#### Step 3.2: Set Environment Variables on Hosting Provider
Configure the following environment variables in your hosting dashboard:
```env
FLASK_ENV=production
PORT=5000
SECRET_KEY=generate-a-strong-64-character-random-secret-key
JWT_SECRET_KEY=generate-a-strong-64-character-random-jwt-key
DB_HOST=your-production-mysql-host.com
DB_PORT=3306
DB_USER=your_db_username
DB_PASSWORD=your_db_password
DB_NAME=cems_db
CORS_ORIGINS=https://your-site.netlify.app,https://your-custom-domain.com
```

#### Step 3.3: Production WSGI Start Command
The repository includes a `Procfile` and `waitress`/`gunicorn` in `requirements.txt`:
```bash
gunicorn --chdir backend app:app
```
*(On Windows or cross-platform, `python app.py` automatically uses `waitress` when `FLASK_ENV=production`).*

#### Step 3.4: Test Live Health Endpoint
Visit `https://YOUR-BACKEND-DOMAIN/api/health`.
Expected JSON response:
```json
{
  "status": "online",
  "database": "connected",
  "databaseMessage": "MySQL is healthy and responsive",
  "service": "Court Evidence Management System (CEMS) REST API",
  "version": "2.0.0"
}
```

#### Step 3.5: Whitelist Netlify Domain in CORS
Ensure your Netlify URL (e.g., `https://your-site.netlify.app`) is included in `CORS_ORIGINS`.

---

## 📡 REST API Reference Summary

| Endpoint | Method | Description |
|---|---|---|
| `GET /api/health` | GET | Health & MySQL connection status monitor |
| `POST /api/auth/login` | POST | Authenticate user & issue signed JWT Bearer token |
| `POST /api/auth/logout` | POST | Invalidate user session & log activity |
| `GET /api/auth/me` | GET | Authenticated user profile |
| `POST /api/auth/register` | POST | Create staff account with hashed password |
| `GET /api/cases` | GET | List cases with search & filter params |
| `POST /api/cases` | POST | Create case (auto-generates sequential ID) |
| `GET /api/cases/<id>` | GET | Single case profile |
| `PUT /api/cases/<id>` | PUT | Update case record |
| `DELETE /api/cases/<id>` | DELETE | Delete case and linked records |
| `GET /api/evidence` | GET | Evidence registry with multi-field filters |
| `POST /api/evidence` | POST | Ingest evidence (supports multipart file upload with SHA-256) |
| `GET /api/evidence/<id>` | GET | Evidence details & hash baseline |
| `POST /api/evidence/<id>/verify` | POST | Cryptographic SHA-256 audit against baseline |
| `GET /api/custody` | GET | Chain of Custody chronological timeline |
| `POST /api/custody` | POST | Record custody transfer event |
| `GET /api/custody/<id>/validate` | GET | Sequence gap and anomaly validator |
| `GET /api/hearings` | GET | List hearings |
| `POST /api/hearings` | POST | Schedule court hearing |
| `PUT /api/hearings/<id>` | PUT | Update hearing status |
| `GET /api/documents` | GET | List case documents |
| `POST /api/documents` | POST | Upload case document file |
| `GET /api/documents/<id>/download`| GET | Securely download original stored document |
| `GET /api/submissions` | GET | List evidence submitted to court |
| `POST /api/submissions` | POST | Submit evidence to court and sync custody |
| `PUT /api/submissions/<id>` | PUT | Update admission status (`Accepted`, `Rejected`) |
| `GET /api/dashboard/stats` | GET | Aggregated KPI counters, status monitors, distributions |
| `GET /api/activity` | GET | Immutable audit activity trail |
| `GET /api/notifications` | GET | System alerts |
| `PUT /api/notifications/<id>/read`| PUT | Mark notification as read |
| `GET /api/users` | GET | Staff and legal officer directory |
| `GET /api/settings` | GET | System preferences |
| `PUT /api/settings` | PUT | Save preferences |
| `POST /api/settings/reset` | POST | Factory reset database to seed dataset |

---

## ⚖️ Legal & Academic Disclaimer

> **NOTICE:** This application is developed for demonstration, evaluation, and academic purposes. It demonstrates modern LegalTech SaaS architecture, cryptographic evidence integrity tracking, and judicial workflow standards. It does not replace official government judicial systems.

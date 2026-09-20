# InterviewShield 🛡️

> **Browser-based interview-integrity monitoring system**  
> MUSA CodeX 2026 Round 2 | Problem CX0104: The Interview Body Double | Team Harrington's Tech

---

## 1. Overview

InterviewShield monitors interview session signals in real-time, detects behavioral anomalies (face absence, multiple faces, tab switching, revoked screen shares, audio-visual inconsistency), computes an explainable integrity score, and provides timestamped evidence for human recruiter review.

### Architectural Tenets
- **AI flags. Humans review.** The system provides advisory signals; recruiters make the hiring decision.
- **Privacy by Design**: All computer vision and audio analysis runs locally inside the candidate's browser via MediaPipe and Web Audio. Raw camera/mic feeds are **never** transmitted to the server.
- **Deterministic & Explainable**: The scoring engine uses pure mathematical rules and sliding window cooldowns rather than opaque black-box machine learning.

---

## 2. Monorepo Structure

```
interview-shield/
├── client/          # React 18 + Vite + TypeScript frontend (Candidate & Recruiter UI)
├── server/          # Node.js 20+ Express + WebSocket backend (REST API & Risk Engine)
├── shared/          # Shared TypeScript interfaces (Events, RiskState, WS Protocol)
├── docs/            # Approved specifications & architectural blueprints
├── Rule Book/       # Mandatory AI engineering rules (RULES.md)
├── docker-compose.yml # PostgreSQL 16 container definition
└── package.json     # Workspace root orchestrator
```

---

## 3. Quick Start for Developers

### Prerequisites
- **Node.js**: `v20.0.0` or higher (verified on Node `v26.2.0`)
- **npm**: `v10.0.0` or higher
- **PostgreSQL 16**: via Docker or local installation / cloud database (Neon, Supabase)

### Step 1: Install Dependencies
From the repository root, install dependencies for all workspaces:
```bash
npm install
```

### Step 2: Configure Environment
Copy the example environment configuration in `server/`:
```bash
cp server/.env.example server/.env
```
Ensure `DATABASE_URL` in `server/.env` points to your PostgreSQL database.

### Step 3: Start PostgreSQL (Optional via Docker)
If you have Docker installed:
```bash
docker compose up -d db
```

### Step 4: Generate Prisma Client
Generate the type-safe Prisma database client:
```bash
npm run db:generate
```

### Step 5: Start the Development Environment
Run both backend and frontend concurrently:
```bash
npm run dev
```

The services will be available at:
- **Client (Frontend)**: [http://localhost:5173](http://localhost:5173)
- **Server (Backend API)**: [http://localhost:3001](http://localhost:3001)
- **API Health Check**: [http://localhost:3001/api/health](http://localhost:3001/api/health)

---

## 4. Key Scripts

| Command | Action |
|---|---|
| `npm run dev` | Starts server (:3001) and client (:5173) concurrently |
| `npm run dev:server` | Starts server with live auto-reload via `tsx watch` |
| `npm run dev:client` | Starts Vite HMR dev server |
| `npm run build` | Compiles `shared/`, `server/`, and `client/` |
| `npm run db:generate` | Generates Prisma client from schema |
| `npm run db:migrate` | Runs database migrations |
| `npm run db:seed` | Seeds database with demo recruiter and test interviews |
| `npm run test` | Runs unit tests across all workspaces |
| `npm run lint` | Runs code quality checks across workspaces |

---

## 5. Specification Reference

Full architectural contracts and specifications are available in the `/docs` directory:
- [PRODUCT_SPEC.md](file:///c:/Users/sv369/OneDrive/Desktop/MUSA%20Project/docs/PRODUCT_SPEC.md) — Product requirements and MVP scope
- [ARCHITECTURE.md](file:///c:/Users/sv369/OneDrive/Desktop/MUSA%20Project/docs/ARCHITECTURE.md) — System design, monorepo structure, and dev setup
- [DETECTION_SPEC.md](file:///c:/Users/sv369/OneDrive/Desktop/MUSA%20Project/docs/DETECTION_SPEC.md) — MediaPipe and browser detectors
- [RISK_ENGINE.md](file:///c:/Users/sv369/OneDrive/Desktop/MUSA%20Project/docs/RISK_ENGINE.md) — Deterministic integrity scoring engine
- [DATABASE.md](file:///c:/Users/sv369/OneDrive/Desktop/MUSA%20Project/docs/DATABASE.md) — PostgreSQL 16 schema & indexes
- [API_CONTRACT.md](file:///c:/Users/sv369/OneDrive/Desktop/MUSA%20Project/docs/API_CONTRACT.md) — REST endpoints & WebSocket wire protocol
- [SECURITY.md](file:///c:/Users/sv369/OneDrive/Desktop/MUSA%20Project/docs/SECURITY.md) — Privacy principles and threat model
- [TEST_PLAN.md](file:///c:/Users/sv369/OneDrive/Desktop/MUSA%20Project/docs/TEST_PLAN.md) — Test cases & robustness scenarios
- [DEMO_SCRIPT.md](file:///c:/Users/sv369/OneDrive/Desktop/MUSA%20Project/docs/DEMO_SCRIPT.md) — Live judge demonstration guide

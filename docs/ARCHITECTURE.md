# InterviewShield — Architecture Document

> **Project**: InterviewShield — MUSA CodeX 2026 Round 2
> **Team**: Harrington's Tech
> **Version**: 1.0 — MVP

---

## 1. System Architecture Overview

InterviewShield is a monolithic application with two frontends (candidate + recruiter) and a single backend server. There are no microservices, no message queues, and no external AI services in the real-time path.

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        BROWSER (Candidate)                      │
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │  Camera   │  │   Mic    │  │  Screen  │  │ Visibility│       │
│  │  Stream   │  │  Stream  │  │  Share   │  │   API    │       │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘       │
│       │              │             │              │              │
│  ┌────▼─────┐  ┌────▼─────┐  ┌────▼─────┐  ┌────▼─────┐       │
│  │  Face     │  │  Audio   │  │  Screen  │  │  Tab     │       │
│  │ Detector  │  │ Detector │  │ Detector │  │ Detector │       │
│  │(MediaPipe)│  │(WebAudio)│  │(Track    │  │(Vis.API) │       │
│  └────┬─────┘  └────┬─────┘  │ Events)  │  └────┬─────┘       │
│       │              │        └────┬─────┘       │              │
│       │              │             │              │              │
│  ┌────▼──────────────▼─────────────▼──────────────▼─────┐       │
│  │              Audio-Visual Correlator                  │       │
│  │    (mouth movement + audio activity → consistency)    │       │
│  └────────────────────┬──────────────────────────────────┘       │
│                       │                                          │
│  ┌────────────────────▼──────────────────────────────────┐       │
│  │                 Event Buffer                           │       │
│  │        (queue + sequence numbers + retry)              │       │
│  └────────────────────┬──────────────────────────────────┘       │
│                       │ WebSocket (WSS)                          │
└───────────────────────┼──────────────────────────────────────────┘
                        │
          ══════════════╪═══════════════════
                        │  NETWORK
          ══════════════╪═══════════════════
                        │
┌───────────────────────┼──────────────────────────────────────────┐
│                 SERVER (Node.js + TypeScript)                     │
│                       │                                          │
│  ┌────────────────────▼──────────────────────────────────┐       │
│  │              WebSocket Server                          │       │
│  │     (event ingestion, session management)              │       │
│  └────────────────────┬──────────────────────────────────┘       │
│                       │                                          │
│  ┌────────────────────▼──────────────────────────────────┐       │
│  │              Event Processor                           │       │
│  │   (validate, store, trigger risk recalculation)        │       │
│  └───────┬────────────────────────────┬──────────────────┘       │
│          │                            │                          │
│  ┌───────▼──────────┐  ┌─────────────▼────────────────┐         │
│  │  Risk Engine      │  │  Evidence Service             │         │
│  │  (deterministic)  │  │  (snapshot storage)           │         │
│  │  weighted fusion  │  │  (retention management)       │         │
│  │  sliding windows  │  └──────────────────────────────┘         │
│  │  explainable      │                                           │
│  └───────┬──────────┘                                            │
│          │                                                       │
│  ┌───────▼──────────────────────────────────────────────┐        │
│  │                 REST API                              │        │
│  │  /api/interviews  /api/sessions  /api/events          │        │
│  │  /api/risk        /api/evidence  /api/reviews         │        │
│  └───────┬──────────────────────────────────────────────┘        │
│          │                                                       │
│  ┌───────▼──────────┐                                            │
│  │   PostgreSQL      │                                            │
│  │   (interviews,    │                                            │
│  │    sessions,      │                                            │
│  │    events,        │                                            │
│  │    risk,          │                                            │
│  │    evidence,      │                                            │
│  │    reviews)       │                                            │
│  └──────────────────┘                                            │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                    BROWSER (Recruiter)                            │
│                                                                  │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐            │
│  │  Interview   │  │   Session    │  │   Review     │            │
│  │  List        │──▶   Detail     │──▶   Controls   │            │
│  │  Dashboard   │  │  + Timeline  │  │  + Evidence  │            │
│  └─────────────┘  └──────────────┘  └──────────────┘            │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Data Flow Summary

```
Candidate camera/mic (browser-local ONLY, never sent to server)
        ↓
Client-side detectors (MediaPipe, Web Audio, Visibility API)
        ↓
Structured detection events (JSON)
        ↓ WebSocket (encrypted)
Server event processor
        ↓                    ↓
Risk engine              Evidence service
(score + explanation)    (snapshot storage)
        ↓
PostgreSQL
        ↓ REST API (authenticated)
Recruiter dashboard
```

---

## 2. Technology Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Frontend** | React 18 + TypeScript | Type safety, component model, ecosystem |
| **Build** | Vite | Fast dev server, simple config |
| **Styling** | Vanilla CSS + CSS custom properties | No framework lock-in, design tokens |
| **State** | React Context + useReducer | Sufficient for MVP; no external library needed |
| **Routing** | React Router v6 | Standard, well-maintained |
| **Face Detection** | `@mediapipe/tasks-vision` | Google-maintained, runs in browser, lightweight |
| **Audio Analysis** | Web Audio API (AnalyserNode) | Built-in, no dependency |
| **Backend** | Node.js 20 LTS + TypeScript | Same language as frontend, strong async I/O |
| **HTTP Framework** | Express.js | Minimal, well-understood, stable |
| **WebSocket** | `ws` library | Lightweight, no Socket.IO overhead |
| **Database** | PostgreSQL 16 | Relational integrity, JSONB for flexible payloads |
| **ORM** | Prisma | Type-safe queries, migration support |
| **Auth** | bcrypt + JWT | Simple, stateless auth for MVP |
| **Validation** | Zod | Runtime type validation, TypeScript integration |
| **Logging** | pino | Structured JSON logging, fast |
| **File Storage** | Local filesystem | MVP-appropriate; abstracted for future cloud swap |
| **Containerization** | Docker + Docker Compose | Reproducible dev/deploy environment |

---

## 3. Frontend Architecture

### 3.1 Route Structure

```
/join/:token                                → Candidate: system check → consent → interview
/interview/:sessionId                       → Candidate: live interview page
/login                                      → Recruiter: login
/dashboard                                  → Recruiter: interview list
/dashboard/:interviewId                     → Recruiter: session detail + timeline
/dashboard/:interviewId/evidence/:eventId   → Recruiter: evidence viewer
```

### 3.2 Component Hierarchy — Candidate

```
<App>
  <CandidateLayout>
    <SystemCheckPage>
      <CameraCheck />          — tests getUserMedia video
      <MicrophoneCheck />      — tests getUserMedia audio
      <ScreenShareCheck />     — tests getDisplayMedia
      <BrowserCheck />         — checks browser compatibility
      <CheckSummary />         — pass/fail summary + proceed button
    <ConsentPage>
      <ConsentText />          — what is monitored, stored, retention
      <ConsentCheckbox />      — explicit opt-in
      <ConsentButton />        — proceed to interview
    <InterviewPage>
      <VideoPreview />         — candidate's camera feed (local only)
      <StatusBar />            — connection state, timer, indicators
      <DetectorOrchestrator>   — manages all detectors
        <FaceDetector />       — MediaPipe face detection
        <AudioDetector />      — Web Audio API analysis
        <ScreenShareDetector />— track.onended listener
        <TabDetector />        — visibilitychange listener
        <AVCorrelator />       — cross-detector consistency
      <EventBuffer />          — queues events for WebSocket
    <CompletionPage>
      <SessionSummary />       — interview completed message
```

### 3.3 Component Hierarchy — Recruiter

```
<App>
  <RecruiterLayout>
    <LoginPage>
      <LoginForm />
    <DashboardPage>
      <InterviewList />              — table with status, score, date
        <InterviewRow />             — single interview entry
      <CreateInterviewModal />       — form to create new interview
    <SessionDetailPage>
      <IntegrityScoreCard />         — score gauge + risk state badge
      <SessionInfoPanel />           — candidate, duration, metadata
      <EventTimeline />              — chronological event list
        <TimelineEvent />            — single event with severity indicator
        <TimelineEventDetail />      — expanded view with evidence
      <EvidenceViewer />             — snapshot image display
    <ReviewPanel>
      <ReviewDecisionGroup />        — pass / flag / inconclusive
      <ReviewNotesField />           — text area for notes
      <SubmitReviewButton />
```

### 3.4 Key Frontend Design Decisions

1. **Detectors are independent modules** — each receives a media source, emits structured events, can be enabled/disabled independently. This enables testing each detector in isolation.

2. **DetectorOrchestrator** manages the detection loop — runs each detector at a configured interval (default 500ms = 2 fps). Detectors do not schedule themselves.

3. **EventBuffer** is a FIFO queue with sequence numbers — handles WebSocket disconnections by buffering events locally and replaying un-acknowledged events on reconnection.

4. **No candidate video is sent to the server** — the camera feed stays entirely local in the candidate's browser. Only structured detection events and optional low-resolution evidence snapshots (at event time) are transmitted.

5. **WebSocket client** wraps the native `WebSocket` API with automatic reconnection, exponential backoff, and heartbeat monitoring.

### 3.5 Design System (CSS Custom Properties)

```css
:root {
  /* Risk state colors */
  --color-normal: #22c55e;
  --color-attention: #eab308;
  --color-suspicious: #f97316;
  --color-high-risk: #ef4444;

  /* Severity colors */
  --severity-low: #94a3b8;
  --severity-medium: #eab308;
  --severity-high: #f97316;
  --severity-critical: #ef4444;

  /* UI */
  --color-bg: #0f172a;
  --color-surface: #1e293b;
  --color-border: #334155;
  --color-text: #f8fafc;
  --color-text-secondary: #94a3b8;
  --color-primary: #3b82f6;

  /* Spacing */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;

  /* Typography */
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
}
```

---

## 4. Backend Architecture

### 4.1 Module Structure

```
server/
├── src/
│   ├── index.ts                  — entry point
│   ├── config.ts                 — environment config with Zod validation
│   ├── app.ts                    — Express app setup, middleware registration
│   ├── ws/
│   │   ├── server.ts             — WebSocket server setup + upgrade handling
│   │   ├── handlers.ts           — message type handlers
│   │   ├── session-manager.ts    — active session tracking
│   │   └── protocol.ts           — message type definitions + validation
│   ├── api/
│   │   ├── middleware/
│   │   │   ├── auth.ts           — JWT verification middleware
│   │   │   ├── validate.ts       — Zod request validation middleware
│   │   │   └── error.ts          — centralized error handler
│   │   ├── routes/
│   │   │   ├── auth.routes.ts
│   │   │   ├── interview.routes.ts
│   │   │   ├── session.routes.ts
│   │   │   ├── event.routes.ts
│   │   │   ├── risk.routes.ts
│   │   │   ├── evidence.routes.ts
│   │   │   └── review.routes.ts
│   │   └── index.ts              — route registration
│   ├── services/
│   │   ├── auth.service.ts       — login, token generation
│   │   ├── interview.service.ts  — CRUD, token generation
│   │   ├── session.service.ts    — lifecycle management
│   │   ├── event.service.ts      — event persistence + risk trigger
│   │   ├── evidence.service.ts   — file storage + metadata
│   │   └── review.service.ts     — review persistence
│   ├── risk/
│   │   ├── engine.ts             — risk calculation core (pure function)
│   │   ├── weights.ts            — event weight configuration
│   │   ├── thresholds.ts         — risk state thresholds
│   │   └── explainer.ts          — human-readable explanation generator
│   ├── db/
│   │   └── client.ts             — Prisma client singleton
│   └── types/
│       ├── events.ts             — detection event types
│       ├── risk.ts               — risk score types
│       └── api.ts                — request/response types
├── prisma/
│   ├── schema.prisma             — database schema
│   ├── migrations/               — migration files
│   └── seed.ts                   — demo data seeder
├── package.json
├── tsconfig.json
└── Dockerfile
```

### 4.2 Key Backend Design Decisions

1. **Monolith** — a single server process serves both the REST API and the WebSocket server. No microservices, no message queues. The process listens on one port; the WebSocket server handles HTTP upgrade on the `/ws/` path.

2. **Risk engine is a pure function** — `calculateRisk(currentState, newEvent, config) → { score, state, explanation }`. No side effects, no database access inside the function. Fully unit-testable with synthetic input.

3. **Service layer** — routes call services, services call Prisma. Routes handle HTTP concerns (request parsing, response formatting). Services handle business logic. No business logic in routes.

4. **Evidence service** writes files to a configurable base path on disk. The interface is abstracted so that future implementations could use cloud storage (GCS, S3) without changing the service consumers.

5. **WebSocket protocol** is typed and versioned — every message has `type`, `version`, `payload`, `sequenceNumber`. Invalid messages are rejected with structured errors.

6. **Centralized error handling** — all thrown errors are caught by the error middleware, which logs structured JSON via pino and returns a safe error response to the client.

### 4.3 Request Flow — Detection Event

```
1. Client sends WebSocket message:
   { type: "detection:event", sequenceNumber: 42, payload: DetectionEvent }

2. WebSocket handler validates message schema (Zod)

3. Handler calls eventService.processEvent(sessionId, event)

4. eventService:
   a. Persists detection_event to database
   b. Calls riskEngine.calculateRisk(currentState, event, config)
   c. If score changed: persists risk_snapshot
   d. Updates session.current_integrity_score and current_risk_state

5. Server sends acknowledgment:
   { type: "ack", sequenceNumber: 42 }

6. If evidence snapshot was included:
   a. evidenceService.storeSnapshot(sessionId, eventId, imageData)
   b. Persists evidence_item record
```

---

## 5. Monorepo Structure

```
interview-shield/
├── client/                       — React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── detectors/
│   │   ├── hooks/
│   │   ├── services/             — API client, WebSocket client
│   │   ├── types/
│   │   ├── utils/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── package.json
├── server/                       — Node.js backend
│   ├── src/                      — (see §4.1)
│   ├── prisma/
│   ├── Dockerfile
│   ├── tsconfig.json
│   └── package.json
├── shared/                       — shared TypeScript types
│   ├── src/
│   │   ├── events.ts             — DetectionEvent interface
│   │   ├── risk.ts               — RiskState, IntegrityScore
│   │   ├── ws-protocol.ts        — WebSocket message types
│   │   └── index.ts
│   ├── tsconfig.json
│   └── package.json
├── docs/                         — architecture & spec documents
├── docker-compose.yml
├── package.json                  — workspace root (npm workspaces)
├── RULES.md
├── AGENTS.md
├── GEMINI.md
└── README.md
```

---

## 6. Development Order

Each phase must be demonstrably working before starting the next.

### Phase 1: Foundation (Day 1)
1. Project scaffolding (monorepo: `client/` + `server/` + `shared/`)
2. TypeScript config, ESLint config
3. Shared types package (`shared/`)
4. PostgreSQL + Prisma schema + initial migration
5. Basic Express server with health endpoint (`GET /api/health`)
6. Basic Vite + React app with routing shell
7. Database seed script (demo recruiter account)
8. Docker Compose for PostgreSQL

### Phase 2: Core Backend (Day 1–2)
9. Environment config with Zod validation
10. Recruiter auth (login, JWT, auth middleware)
11. Interview CRUD API (create, list, get, update, cancel)
12. Join token generation and validation
13. Session creation endpoint (candidate joins)
14. WebSocket server setup (connection, heartbeat, disconnect)
15. WebSocket message validation and routing
16. Event ingestion (validate, persist to database)

### Phase 3: Detection Pipeline (Day 2–3)
17. Candidate system check page (camera, mic, screen share, browser)
18. Consent page with timestamped consent record
19. Interview page shell (video preview, status bar)
20. Face Detector (MediaPipe integration, structured event output)
21. Tab Detector (Page Visibility API)
22. Screen Share Detector (track events)
23. Audio Detector (Web Audio API volume/frequency)
24. Detection Orchestrator (loop management, 2 fps)
25. Event Buffer (FIFO queue, sequence numbers)
26. WebSocket client (connect, send, reconnect, replay)

### Phase 4: Risk Engine (Day 3)
27. Risk engine core function (calculate, weights, cooldowns, recovery)
28. Risk state transitions (normal → attention → suspicious → high_risk)
29. Explanation generator (human-readable text)
30. Risk snapshot persistence
31. Wire: event ingestion → risk recalculation → session score update

### Phase 5: Recruiter Dashboard (Day 3–4)
32. Login page
33. Interview list page (table with status, score, actions)
34. Create interview modal
35. Session detail page (integrity score card, risk state)
36. Event timeline component (chronological, severity-coded)
37. Event detail expansion (payload, confidence, timestamp)
38. Evidence viewer (snapshot image display)
39. Review controls (pass / flag / inconclusive + notes)

### Phase 6: Audio-Visual Correlation + Evidence (Day 4)
40. Mouth movement detection from face detector bounding box
41. AV Correlator module (mouth movement ↔ audio activity)
42. Evidence snapshot capture (low-res canvas capture at event time)
43. Evidence upload via WebSocket
44. Evidence storage and retrieval API

### Phase 7: Integration & Polish (Day 4–5)
45. End-to-end flow testing (all robustness scenarios)
46. Error handling polish (graceful degradation, user-facing messages)
47. UI polish (design tokens, responsive layout, status indicators)
48. Interview completion flow (end session, final score)
49. Demo data seeder (pre-populated scenarios for judges)
50. Docker Compose setup (full stack: db + server + client)
51. README with setup instructions

---

## 7. Git / GitHub Strategy

### Branch Model (Hackathon — Simplified)

```
main              — stable, deployable at all times
  └── dev         — integration branch, feature branches merge here
       ├── feat/foundation         — Phase 1
       ├── feat/backend-api        — Phase 2
       ├── feat/detection-pipeline — Phase 3
       ├── feat/risk-engine        — Phase 4
       ├── feat/recruiter-dashboard— Phase 5
       ├── feat/av-correlation     — Phase 6
       └── feat/polish             — Phase 7
```

### Commit Convention

```
feat: add face detector with MediaPipe integration
fix: correct risk score cooldown calculation
docs: add API contract documentation
chore: configure Docker Compose for local dev
test: add risk engine unit tests
refactor: extract WebSocket message validation
```

### Rules
- Every feature branch → `dev` via PR
- `dev` → `main` only when demo-ready
- No force pushes to `main` or `dev`
- Commit messages must be descriptive (no "fix stuff", "wip")

---

## 8. Local Development Setup

### Prerequisites
- Node.js 20 LTS
- PostgreSQL 16 (or Docker)
- npm 10+

### Quick Start

```bash
# Clone
git clone <repo-url>
cd interview-shield

# Install all workspace dependencies
npm install

# Database setup
cp server/.env.example server/.env
# Edit server/.env with PostgreSQL credentials

# Run migrations
npm run db:migrate

# Seed demo data
npm run db:seed

# Start development (client + server concurrently)
npm run dev
```

### Development URLs
- **Client (Vite)**: http://localhost:5173
- **Server (Express)**: http://localhost:3001
- **API Health**: http://localhost:3001/api/health
- **WebSocket**: ws://localhost:3001/ws/session/:id

### Docker Alternative

```bash
# Start everything (PostgreSQL + server + client)
docker compose up

# Or just the database
docker compose up db
```

### Environment Variables (server/.env)

```bash
# Database
DATABASE_URL=postgresql://interviewshield:devpassword@localhost:5432/interviewshield

# Auth
JWT_SECRET=dev-secret-change-in-production

# Server
PORT=3001
NODE_ENV=development

# Client
CLIENT_URL=http://localhost:5173

# Evidence
EVIDENCE_STORAGE_PATH=./evidence

# Risk Engine
RISK_RECOVERY_RATE=2
RISK_INITIAL_SCORE=100

# Data Retention
EVIDENCE_RETENTION_DAYS=90
```

### npm Workspace Scripts

```json
{
  "scripts": {
    "dev": "concurrently \"npm run dev:server\" \"npm run dev:client\"",
    "dev:server": "npm run dev --workspace=server",
    "dev:client": "npm run dev --workspace=client",
    "build": "npm run build --workspaces",
    "db:migrate": "npm run db:migrate --workspace=server",
    "db:seed": "npm run db:seed --workspace=server",
    "test": "npm run test --workspaces",
    "lint": "npm run lint --workspaces"
  }
}
```

---

## 9. Deployment Architecture

### MVP Deployment (Hackathon Demo)

Single machine deployment — all services on one host.

```
┌─────────────────────────────────────────┐
│              Single Host                │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │   Nginx (reverse proxy)         │    │
│  │   :80/:443                      │    │
│  │   ├── /          → client build │    │
│  │   ├── /api/*     → server:3001  │    │
│  │   └── /ws/*      → server:3001  │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ┌──────────────┐  ┌──────────────┐     │
│  │ Node.js      │  │ PostgreSQL   │     │
│  │ Server       │  │ :5432        │     │
│  │ :3001        │  │              │     │
│  └──────────────┘  └──────────────┘     │
│                                         │
│  ┌──────────────┐                       │
│  │ Evidence     │                       │
│  │ /data/evidence/                      │
│  └──────────────┘                       │
└─────────────────────────────────────────┘
```

### Docker Compose (Production-lite)

```yaml
version: '3.8'

services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: interviewshield
      POSTGRES_USER: interviewshield
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - pgdata:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  server:
    build: ./server
    depends_on:
      - db
    environment:
      DATABASE_URL: postgresql://interviewshield:${DB_PASSWORD}@db:5432/interviewshield
      JWT_SECRET: ${JWT_SECRET}
      NODE_ENV: production
      EVIDENCE_STORAGE_PATH: /app/evidence
    ports:
      - "3001:3001"
    volumes:
      - evidence:/app/evidence

  client:
    build: ./client
    ports:
      - "80:80"

volumes:
  pgdata:
  evidence:
```

### Future Production Path (Not for MVP)
- Container orchestration (Cloud Run, ECS, or K8s)
- Managed PostgreSQL (Cloud SQL, RDS)
- Object storage for evidence (GCS, S3)
- CDN for static assets
- Load balancer with TLS termination
- Health checks and readiness probes

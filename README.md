# InterviewShield 🛡️

> **Browser-native interview integrity & body-double detection system.**  
> Built for **MUSA CodeX 2026** · Problem CX0104: *The Interview Body Double* · Team Harrington's Tech  
> 🌐 **Live Demo**: [interviewshieldmusa.vercel.app](https://interviewshieldmusa.vercel.app)

---

## 🎯 What Problem Does It Solve?

Remote technical hiring faces a growing integrity crisis:
- **Proxy Interviewees & Body Doubles**: Impersonators take interviews on behalf of candidates or swap seats mid-call.
- **Off-Screen Teleprompters & Multi-Screen Aid**: Candidates secretly read real-time AI solutions or live coaching feeds.
- **Invasive Spyware Backlash**: Traditional proctoring tools require kernel-level drivers, violate user privacy, and upload unencrypted candidate biometrics to third-party cloud servers.

**InterviewShield eliminates this trade-off.** It provides automated, real-time behavioral anomaly detection while running **100% locally in the candidate's browser**. Raw camera and microphone streams never leave the candidate's device.

---

## ⚡ What Is It?

InterviewShield is an end-to-end interview platform featuring a real-time risk engine that analyzes behavioral signals during technical interviews:

- **Zero-Upload Edge Detection**: Computer vision and acoustic processing execute in-browser via MediaPipe and Web Audio APIs. Raw video is never recorded or streamed to servers.
- **7 Behavioral Signals**:
  1. *Face Presence Continuity* (detects absence $\ge 3\text{s}$)
  2. *Multiple Face Detection* (identifies unauthorized assistants)
  3. *Off-Screen Gaze Deviation* (flags sustained teleprompter reading)
  4. *Tab Switching & Window Blur* (tracks hidden browser tab activity)
  5. *Screen Sharing Termination* (flags stopped presentation feeds)
  6. *Acoustic Energy & Silence* (identifies extended audio disconnects)
  7. *Audio-Visual Speech Mismatch* (cross-references lip aperture with voice RMS)
- **Explainable Mathematical Ledger**: Calculates a deterministic integrity score (0–100) with itemized deductions and recovery math — **never a black-box AI verdict**.
- **Human Recruiter Primacy**: The system provides advisory signals and evidence snapshots; the human recruiter retains 100% hiring authority.
- **Workstation Dashboard**: Google Meet-style meeting creation (Schedule, Instant, Google Calendar export), direct 1-click host start and link sharing.

---

## 🚀 How to Use

### Option A: Try the Live Web App (No Setup Required)
Visit **[interviewshieldmusa.vercel.app](https://interviewshieldmusa.vercel.app)**:

1. **For Interviewers / Recruiters**:
   - Go to the Dashboard and click **Start Call** on any scheduled interview, or click **New Interview** to create one (Instant meeting, Schedule for later, or Google Calendar).
   - In the live interview room, monitor candidate video, telemetry gauges, and collapsible diagnostic tools.
2. **For Candidates**:
   - Open the provided join link or enter the join code.
   - Complete the pre-interview camera & microphone checks, grant proctoring consent, and begin the session.
3. **Post-Interview Review**:
   - View the incident timeline, inspect timestamped forensic snapshots, and export the formal audit report.

---

### Option B: Run Locally

#### Prerequisites
- **Node.js**: `v20.0.0+`
- **npm**: `v10.0.0+`
- **PostgreSQL 16**: (Optional for full persistence, or use Docker)

#### Installation & Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/shubhamsanjayvarma/MUSA-Project.git
cd MUSA-Project

# 2. Install monorepo dependencies
npm install

# 3. Start development environment (frontend + backend)
npm run dev
```

- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:3001](http://localhost:3001)

#### Database Setup (Optional)
```bash
# Start PostgreSQL via Docker
docker compose up -d db

# Generate Prisma client and run migrations
npm run db:generate
npm run db:migrate
```

---

## 🧪 Testing & Verification

The codebase is hardened with a strict **4-tier TDD architecture** (Complexity, Logic, UI/Integration, STRIDE/OWASP Security):

```bash
# Run all 230 automated unit, integration, and security tests
npm test

# Build production bundles
npm run build
```

**Status**: 230 / 230 tests passing (100% green across monorepo).

---

## 🏛️ Project Structure

```
MUSA-Project/
├── client/          # React 18 + Vite + TypeScript (Dashboard, Recruiter Room, Candidate View)
├── server/          # Node.js + Express + WebSocket backend (REST API & Real-time Risk Engine)
├── shared/          # Shared TypeScript interfaces (Telemetry events, Wire protocols)
├── spec/            # Production technical specifications & architectural blueprints
├── docs/            # Problem statement & rubric references
└── package.json     # Monorepo workspace configuration
```

---

## 🔒 Privacy & Security First

- **Zero Camera/Audio Stream Ingress**: Video and audio streams are processed in temporary browser memory buffers and discarded immediately.
- **Adversarial Hardening**: Join tokens are cryptographically randomized, route parameters are URI-encoded against parameter pollution, and DOM fallbacks feature guaranteed garbage cleanup.
- **GDPR Compliance**: Candidate session data supports one-click crypto-shredding (`POST /api/sessions/:id/shred`).

---

**Team Harrington's Tech** · MUSA CodeX 2026

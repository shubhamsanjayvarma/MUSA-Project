# InterviewShield — Product Specification

> **Project**: InterviewShield — MUSA CodeX 2026 Round 2
> **Team**: Harrington's Tech
> **Problem Statement**: CX0104 — The Interview Body Double
> **Domain**: Artificial Intelligence & Machine Learning
> **Version**: 1.0 — MVP

---

## 1. Product Overview

InterviewShield is a browser-based interview-integrity monitoring system. It captures real-time behavioral signals during a remote interview, detects suspicious anomalies, produces an explainable integrity score, timestamps important events, and presents structured evidence for recruiter human review.

### Core Value Proposition

InterviewShield provides recruiters with objective, timestamped, explainable signals about interview integrity — enabling **human reviewers** to make informed decisions, rather than automated cheating verdicts.

### Core Workflow

```
Candidate joins
  → Pre-interview system check
    → Consent
      → Live signal capture
        → Client-side preprocessing
          → AI-powered signal extraction
            → Risk & integrity scoring
              → Anomaly detection & event generation
                → Recruiter review & decision
```

### Multimodal Signals

1. **Face consistency** — presence, count, orientation
2. **Audio-visual consistency** — mouth movement correlated with speech activity
3. **Audio signals** — speech activity detection
4. **Temporal consistency** — event correlation over sliding time windows

---

## 2. Product Principles

| # | Principle | Meaning |
|---|-----------|---------|
| 1 | **AI flags. Humans review.** | The system never makes a pass/fail decision about a candidate. |
| 2 | **Flag the moment, not the person.** | Events are timestamped behavioral observations, not character judgments. |
| 3 | **Explainable over accurate.** | A transparent 60% confidence flag is more useful than an opaque 95% confidence verdict. |
| 4 | **Privacy by design.** | Process locally where possible. Store minimum evidence. No continuous recording. |
| 5 | **Honest capability claims.** | Never claim deepfake detection, voice biometrics, or scientifically validated accuracy we have not evaluated. |

---

## 3. Users

| User | Role | Primary Goal |
|------|------|--------------|
| **Candidate** | Takes the interview. Grants permissions. Sees minimal monitoring UI. | Complete the interview with minimal friction. |
| **Recruiter** | Creates interviews. Reviews integrity signals. Makes human decisions. | Identify sessions that warrant further scrutiny based on objective signals. |

---

## 4. Critical Product Rules

These rules are non-negotiable and govern all implementation decisions.

1. **Never claim scientifically validated deepfake detection** unless we have actually evaluated it.
2. **Never invent accuracy percentages.**
3. **Never label a candidate as definitively cheating** based only on one signal.
4. The system should generate **suspicious events and evidence for human review**.
5. Every detector must output **structured, testable data**.
6. **Separate detection from risk fusion.**
7. **Separate risk fusion from recruiter decision-making.**
8. **Avoid unnecessary microservices.**
9. **Avoid unnecessary LLM usage** in the real-time detection path.
10. **Optimize for a strong, demonstrable Round 2 MVP** rather than a huge feature set.

---

## 5. Functional Requirements

### 5.1 Candidate-Side

| ID | Requirement | MVP | Notes |
|----|-------------|-----|-------|
| C1 | Join interview via unique link/token | ✅ | Single-use, expiring token |
| C2 | Pre-interview system check (camera, mic, browser, screen share) | ✅ | Must pass before proceeding |
| C3 | Explicit consent flow before monitoring begins | ✅ | Timestamped consent record |
| C4 | Camera permission grant | ✅ | `getUserMedia({ video: true })` |
| C5 | Microphone permission grant | ✅ | `getUserMedia({ audio: true })` |
| C6 | Screen-share permission grant | ✅ | `getDisplayMedia()` — requires user action |
| C7 | Live interview interface with status indicators | ✅ | Connection, recording, timer |
| C8 | Real-time signal collection (client-side detectors) | ✅ | 2 fps detection loop |
| C9 | Interview completion/end flow | ✅ | Clean session closure |
| C10 | Network interruption handling | ✅ | Event buffer, reconnection |

### 5.2 Recruiter-Side

| ID | Requirement | MVP | Notes |
|----|-------------|-----|-------|
| R1 | Create interview (candidate name, email, scheduled time) | ✅ | Generates join token |
| R2 | Interview list with status and integrity score | ✅ | Sortable, filterable |
| R3 | Session detail view | ✅ | Score, risk state, timeline |
| R4 | Integrity score display (0–100) with risk state | ✅ | Color-coded gauge |
| R5 | Event timeline (chronological event list) | ✅ | Grouped by minute |
| R6 | Event detail view (type, severity, confidence, timestamp) | ✅ | Expandable entries |
| R7 | Evidence viewer (snapshots at event time) | ✅ | Low-res images |
| R8 | Human review controls (pass / flag / inconclusive + notes) | ✅ | Persisted decision |
| R9 | Session report generation (exportable) | ⬜ | Post-MVP |
| R10 | Real-time monitoring of active sessions | ⬜ | Post-MVP |

### 5.3 Detection Signals

| ID | Signal | MVP | Notes |
|----|--------|-----|-------|
| D1 | Face present / absent | ✅ | MediaPipe Face Detector |
| D2 | Number of faces | ✅ | Same detector |
| D3 | Head orientation (basic: facing camera vs. turned away) | ✅ | Bounding box position heuristic |
| D4 | Mouth movement detection | ✅ | Required for AV correlation |
| D5 | Audio activity (speech vs. silence) | ✅ | Web Audio API volume/frequency |
| D6 | Audio-visual consistency (mouth ↔ speech) | ✅ | Heuristic correlator |
| D7 | Tab visibility (visible / hidden) | ✅ | Page Visibility API |
| D8 | Screen-share state (active / stopped) | ✅ | Track ended event |
| D9 | Facial landmarks (detailed mesh) | ⬜ | Post-MVP |
| D10 | Advanced lip-sync correlation (ML) | ⬜ | Post-MVP |

### 5.4 Risk Engine

| ID | Requirement | MVP | Notes |
|----|-------------|-----|-------|
| RE1 | Deterministic, rule-based scoring | ✅ | No ML |
| RE2 | Weighted event fusion | ✅ | Configurable weights |
| RE3 | Bounded integrity score 0–100 | ✅ | Clamped |
| RE4 | Configurable thresholds | ✅ | JSON config |
| RE5 | Explainable reasons for every score change | ✅ | Human-readable text |
| RE6 | Risk state categories | ✅ | normal / attention / suspicious / high_risk |
| RE7 | Temporal aggregation (sliding windows) | ✅ | Cooldowns per event type |
| RE8 | ML-based scoring | ⬜ | Never for MVP |

---

## 6. Non-Functional Requirements

| Category | Requirement | Target |
|----------|-------------|--------|
| **Performance** | Client-side detection loop | ≤ 500ms per cycle (2 fps) |
| **Performance** | Event delivery latency (client → server) | < 1 second (WebSocket) |
| **Performance** | Risk score recalculation | < 100ms per event |
| **Performance** | Recruiter dashboard page load | < 2 seconds |
| **Reliability** | WebSocket reconnection | Auto-reconnect within 5s; buffer up to 60s of events |
| **Reliability** | Graceful degradation | If one detector fails, others continue |
| **Security** | All traffic | HTTPS / WSS only (except localhost dev) |
| **Security** | Interview join links | Single-use tokens, expiring |
| **Security** | Recruiter auth | Password hash (bcrypt), JWT session tokens |
| **Privacy** | No continuous video storage | Only event-triggered snapshots |
| **Privacy** | Consent | Explicit opt-in before any monitoring |
| **Privacy** | Data retention | Configurable; default 90 days |
| **Scalability** | MVP target | 1–5 concurrent sessions |
| **Testability** | Every detector | Deterministic input → structured output |
| **Maintainability** | Code | TypeScript, strict mode, modular |

---

## 7. Final MVP Scope

### IN SCOPE — Must Ship for Round 2 Demo

**Candidate flow:**
- Join via token link → system check → consent → interview → completion
- Client-side detectors: face (present/absent/count/orientation), mouth movement, audio activity, tab visibility, screen-share state, audio-visual consistency
- WebSocket event streaming to server
- Event buffering and reconnection

**Server:**
- REST API for interviews, sessions, events, reviews
- WebSocket server for real-time event ingestion
- Deterministic risk engine (weighted, explainable)
- PostgreSQL database
- Evidence storage (file system, event-triggered snapshots)

**Recruiter dashboard:**
- Interview list → session detail → event timeline → evidence viewer → review controls
- Integrity score + risk state display

### OUT OF SCOPE — Do Not Build for MVP

- Real-time recruiter monitoring of live sessions (live video feed to recruiter)
- Deepfake detection (any claims thereof)
- Voice biometrics / speaker verification
- Virtual camera detection
- Detailed facial landmark mesh analysis
- Advanced lip-sync ML model
- Multi-tenant organization management
- Email notifications
- Calendar integration
- Candidate self-service portal
- Mobile support
- PDF report generation
- Horizontal scaling / load balancing
- CI/CD pipeline (manual deploy for hackathon)
- OAuth / SSO

---

## 8. Terminology

| Term | Definition |
|------|-----------|
| **Interview** | A scheduled assessment created by a recruiter for a specific candidate. |
| **Session** | A single connection/monitoring instance within an interview. An interview may have multiple sessions if the candidate reconnects. |
| **Detection Event** | A structured data record produced by a client-side detector when an anomaly or notable signal is observed. |
| **Integrity Score** | A bounded (0–100) numerical representation of session integrity, where 100 = no anomalies detected. |
| **Risk State** | A categorical label (normal / attention / suspicious / high_risk) derived from the integrity score. |
| **Evidence** | A low-resolution snapshot or metadata record captured at the moment of a detection event. |
| **Review** | A recruiter's human assessment of a completed session (pass / flag / inconclusive). |
| **Detector** | A client-side module that processes a specific signal source (camera, mic, browser API) and emits structured detection events. |
| **Risk Engine** | The server-side module that fuses detection events into an integrity score with explainable reasoning. |

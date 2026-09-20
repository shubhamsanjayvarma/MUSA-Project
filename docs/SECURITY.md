# InterviewShield — Security & Privacy Specification

> **Project**: InterviewShield — MUSA CodeX 2026 Round 2
> **Team**: Harrington's Tech
> **Version**: 1.0 — MVP

---

## 1. Privacy Model

### 1.1 Core Privacy Principles

| # | Principle | Implementation |
|---|-----------|----------------|
| 1 | **Minimal data collection** | Only structured events + low-res snapshots. No continuous recording. |
| 2 | **Local processing preferred** | All detection runs in the candidate's browser. Server never receives raw video/audio. |
| 3 | **No continuous recording** | Camera/mic streams are processed locally and discarded. Only detection events are transmitted. |
| 4 | **Explicit consent** | Monitoring cannot begin until the candidate explicitly opts in. |
| 5 | **Data minimization** | Evidence snapshots are 320×240 JPEG at 60% quality. Minimum viable resolution for review context. |
| 6 | **Bounded retention** | All stored data has a configurable retention period with automatic expiry. |
| 7 | **Right to deletion** | Candidate can request deletion of all their data. |

### 1.2 Data Classification

| Data Type | Sensitivity | Storage Location | Retention | Encryption |
|-----------|-------------|-----------------|-----------|------------|
| Recruiter credentials | High | Database (password hash only) | Until account deletion | bcrypt hash |
| Candidate name/email | Medium | Database | Configurable (default 90 days post-session) | At rest (DB encryption) |
| Detection events | Medium | Database (JSONB) | Configurable (default 90 days) | At rest (DB encryption) |
| Risk scores/snapshots | Low | Database | Configurable (default 90 days) | At rest (DB encryption) |
| Evidence snapshots | Medium | Filesystem | Configurable (default 90 days) | At rest (filesystem encryption) |
| Raw video/audio | N/A | **Never stored** | N/A | N/A |
| Join tokens | Medium | Database | Until used or expired | Generated via crypto.randomBytes |
| JWT tokens | High | Client-side only | 24 hours (session), per-session (candidate) | HMAC-SHA256 signed |
| Recruiter reviews | Low | Database | Configurable (default 90 days) | At rest (DB encryption) |

### 1.3 What Is NOT Collected

The system explicitly does **not** collect or store:

- Continuous video recordings
- Continuous audio recordings
- Screen capture content (image/video of shared screen)
- Keystroke data
- Clipboard content
- Browser history
- Other tab content
- IP address geolocation
- Device fingerprinting data beyond basic browser info
- Biometric templates (face encodings, voice prints)

### 1.4 Data Flow (Privacy View)

```
CANDIDATE BROWSER (local processing only)
┌────────────────────────────────────────────┐
│ Camera → Face Detector → events (JSON)     │
│ Mic    → Audio Detector → events (JSON)    │
│ Browser → Tab/Screen Detector → events     │
│                                            │
│ Raw video/audio: NEVER leaves the browser  │
│ Detection events: JSON, no raw media       │
│ Evidence snapshots: 320×240 JPEG at events │
└────────────────┬───────────────────────────┘
                 │ WebSocket (WSS, encrypted)
                 │ Only: structured events + small snapshots
                 ▼
SERVER
┌────────────────────────────────────────────┐
│ Event Processor → PostgreSQL (events)      │
│ Evidence Service → Filesystem (snapshots)  │
│                                            │
│ NO raw video/audio ever received           │
│ NO biometric data stored                   │
│ NO screen content captured                 │
└────────────────────────────────────────────┘
```

---

## 2. Consent Flow

### 2.1 Consent Requirements

1. Consent must be **explicit** — a distinct action (checkbox + button), not passive agreement
2. Consent must be **informed** — the candidate must be told what is monitored and stored
3. Consent must be **timestamped** — the exact time of consent is recorded
4. Consent must be **revocable** — the candidate can leave the interview at any time
5. Monitoring must **not begin** until consent is confirmed server-side

### 2.2 Consent Page Content

The consent page must clearly communicate:

```
Before we begin monitoring, please understand:

WHAT WE MONITOR:
✓ Whether your face is visible in the camera
✓ Whether additional faces appear on camera
✓ Whether you switch to other browser tabs
✓ Whether screen sharing remains active
✓ Whether audio is active during the session
✓ Whether audio and visual signals are consistent

WHAT WE STORE:
✓ Timestamped event records (e.g., "face absent at 10:15:30")
✓ Low-resolution snapshots at the time of detected events
✓ An integrity score based on detected events

WHAT WE DO NOT STORE:
✗ Video recordings of your session
✗ Audio recordings of your session
✗ Screen capture content
✗ Browsing history or other tab content

DATA RETENTION:
Your data will be retained for [90 days] after the interview, 
then automatically deleted.

YOUR RIGHTS:
You may end the interview at any time.
You may request deletion of your data by contacting [email].

[ ] I understand and consent to the monitoring described above.
[Begin Interview]
```

### 2.3 Consent Flow Sequence

```
1. Candidate clicks join link
2. System check page verifies hardware
3. Consent page displayed
4. Candidate reads consent text
5. Candidate checks consent checkbox
6. Candidate clicks "Begin Interview"
7. Client sends WebSocket: { type: "session:consent", payload: { consentGiven: true } }
8. Server records: session.consent_given = true, session.consent_given_at = NOW()
9. Server sends: { type: "ack" }
10. Client enables detection orchestrator
11. Monitoring begins
```

### 2.4 Consent Revocation

- Candidate can end the interview at any time via the "End Interview" button
- Ending the interview stops all monitoring immediately
- Already-collected events are retained per retention policy
- Candidate can request full data deletion by contacting the organization

---

## 3. Evidence Model

### 3.1 Evidence Types

| Type | Content | Format | Typical Size | Trigger |
|------|---------|--------|-------------|---------|
| `snapshot` | Low-resolution video frame | JPEG, 320×240, quality 60% | 15–30 KB | Medium+ severity detection events |
| `metadata` | Structured event data | JSONB in database | ~0.5 KB | Every detection event |

### 3.2 Evidence Capture Rules

| Event Type | Capture Snapshot | Rationale |
|------------|-----------------|-----------|
| `face_absent` | ✅ Yes | Shows empty frame for review context |
| `face_returned` | ❌ No | Informational, no review value |
| `multiple_faces` | ✅ Yes | Shows additional faces for review |
| `face_orientation_off` | ✅ Yes | Shows head position for context |
| `tab_hidden` | ❌ No | Tab is hidden; nothing to capture |
| `tab_visible` | ❌ No | Informational |
| `screen_share_stopped` | ❌ No | Event is definitive; no visual needed |
| `screen_share_started` | ❌ No | Informational |
| `av_mismatch` | ✅ Yes | Shows face for review context |
| `audio_silence_extended` | ❌ No | Low severity; no visual needed |

### 3.3 Evidence Storage

**Directory structure:**
```
evidence/
  {sessionId}/
    {eventId}_{timestamp}.jpg
```

**Example:**
```
evidence/
  a1b2c3d4-e5f6-7890-abcd-ef1234567890/
    f1e2d3c4-b5a6-7890-dcba-098765432100_2026-09-25T10-15-30.jpg
```

### 3.4 Evidence Access Control

- Evidence files are NOT served as static files
- All access goes through the authenticated API (`GET /api/evidence/:id/file`)
- Server verifies the recruiter owns the interview associated with the session
- Direct filesystem paths are never exposed to clients

### 3.5 Retention and Deletion

**Default retention**: 90 days from session end.

**Retention enforcement**:
- `evidence_items.retention_expires_at` is set at creation time
- A periodic cleanup process (can be a simple cron job or server startup task) deletes expired files and marks DB records
- For MVP: cleanup can run on server startup or be triggered manually

**Candidate deletion request**:
1. Request received (via recruiter or direct contact)
2. All evidence files for all sessions of that candidate are deleted
3. All detection events, risk snapshots, and evidence records are deleted
4. Session and interview records are anonymized (candidate_name, candidate_email cleared)
5. Recruiter reviews are retained (they are the recruiter's data) but session reference is anonymized

---

## 4. Security Controls

### 4.1 Transport Security

| Control | Implementation |
|---------|----------------|
| **HTTPS** | All HTTP traffic encrypted via TLS 1.2+ |
| **WSS** | All WebSocket traffic encrypted via TLS 1.2+ |
| **HSTS** | `Strict-Transport-Security` header in production |
| **Local dev exception** | HTTP/WS allowed on `localhost` only |

### 4.2 Authentication

#### Recruiter Authentication
| Control | Implementation |
|---------|----------------|
| **Password storage** | bcrypt hash (cost factor 12) |
| **Session tokens** | JWT, HMAC-SHA256, 24-hour expiry |
| **Token delivery** | Authorization header (`Bearer <token>`) |
| **Token validation** | Verify signature, check expiry, extract recruiter ID |

#### Candidate Authentication
| Control | Implementation |
|---------|----------------|
| **Join tokens** | 32-byte cryptographically random hex string |
| **Token lifetime** | Configurable, default 48 hours from interview creation |
| **Token usage** | Single-use (consumed on first valid join) |
| **Session tokens** | Short-lived JWT issued on join, scoped to session ID |

### 4.3 Authorization

| Resource | Recruiter Access | Candidate Access |
|----------|-----------------|-----------------|
| Interviews | Own interviews only | Via join token only |
| Sessions | Sessions of own interviews | Own session only |
| Events | Sessions of own interviews | None (post-session) |
| Evidence | Sessions of own interviews | None |
| Reviews | Sessions of own interviews | None |
| Risk data | Sessions of own interviews | None |

### 4.4 Input Validation

| Layer | Implementation |
|-------|----------------|
| **API request bodies** | Zod schemas validate all incoming JSON |
| **WebSocket messages** | Zod schemas validate all incoming messages |
| **Query parameters** | Zod schemas with coercion for type safety |
| **File uploads** | Size limit (50 KB for snapshots), type validation |
| **String fields** | Max length enforcement on all VARCHAR fields |
| **Numeric fields** | Range validation (confidence: 0–1, score: 0–100) |

### 4.5 Injection Prevention

| Attack Vector | Prevention |
|---------------|-----------|
| **SQL Injection** | Prisma ORM parameterized queries. No raw SQL in application code. |
| **XSS** | React's default output escaping. CSP headers. No `dangerouslySetInnerHTML`. |
| **CSRF** | SameSite cookie attribute. Token-based API (no cookie auth for API calls). |
| **Path Traversal** | Evidence file paths are constructed server-side from UUIDs. No user-supplied paths. |
| **Command Injection** | No shell command execution. No `eval()`. |

### 4.6 HTTP Security Headers

```typescript
// Applied via middleware
const securityHeaders = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '0',  // Disabled in favor of CSP
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob:",
    "connect-src 'self' ws://localhost:* wss://*",
    "media-src 'self' blob:",
    "worker-src 'self' blob:",
  ].join('; '),
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};
```

### 4.7 Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| `POST /api/auth/login` | 5 attempts | 15 minutes (per IP) |
| `POST /api/interviews/join` | 10 attempts | 15 minutes (per IP) |
| All other API endpoints | 100 requests | 1 minute (per token) |
| WebSocket messages | 50 messages | 1 second (per connection) |

### 4.8 Error Handling (Security)

| Rule | Implementation |
|------|----------------|
| **No stack traces in production** | Error middleware strips stack traces when `NODE_ENV=production` |
| **No internal details** | Error responses include code + message, never implementation details |
| **Consistent error format** | All errors use the same `ApiError` structure |
| **Failed auth** | Returns 401 with generic "Invalid credentials" — no "user not found" vs "wrong password" distinction |
| **Logging** | All errors logged server-side with full context via pino (structured JSON) |

### 4.9 Secret Management

| Secret | Storage | Notes |
|--------|---------|-------|
| `JWT_SECRET` | Environment variable | Must be ≥32 bytes, random |
| `DATABASE_URL` | Environment variable | Contains credentials |
| `DB_PASSWORD` | Environment variable (Docker) | For Docker Compose |
| Recruiter passwords | Database (bcrypt hash) | Never logged, never in responses |
| Join tokens | Database (plaintext) | Tokens are random and expiring; hashing adds complexity without meaningful security benefit for this use case |

**Rules**:
- No secrets in source code, ever
- No secrets in client-side bundles
- No secrets in error messages or logs
- `.env` files are in `.gitignore`
- `.env.example` contains placeholder values only

---

## 5. Threat Model (MVP Scope)

### 5.1 Threats Considered

| Threat | Severity | Mitigation |
|--------|----------|-----------|
| **Recruiter account compromise** | High | bcrypt, JWT expiry, rate-limited login |
| **Join token brute force** | Medium | 32-byte random tokens (256-bit entropy), expiry, rate limiting |
| **WebSocket message tampering** | Medium | WSS encryption, server-side validation, sequence dedup |
| **Fake detection events** | Medium | Events only accepted from authenticated sessions; risk engine uses confidence values; recruiter reviews all flags |
| **Evidence file access** | Medium | API-only access, auth required, no direct file URLs |
| **XSS** | Medium | React escaping, CSP headers |
| **SQL Injection** | High | Prisma parameterized queries |
| **Data exfiltration** | Medium | Authorization checks on all resources, recruiter sees only own data |

### 5.2 Threats NOT Addressed (MVP)

| Threat | Why Not | Future Plan |
|--------|---------|-------------|
| **Virtual camera spoofing** | No reliable browser-side detection exists | Research post-MVP |
| **Pre-recorded video playback** | Requires liveness detection (blink, head turn challenges) | Post-MVP |
| **MITM on localhost (dev)** | Acceptable for development | Production uses TLS |
| **DDoS** | MVP single-server, no infra | Cloud provider protection post-MVP |
| **Insider threat (malicious recruiter)** | MVP has no audit log | Post-MVP: audit trail |
| **Session hijacking** | JWT-based, no refresh tokens for MVP | Post-MVP: refresh token rotation |

---

## 6. CORS Configuration

```typescript
const corsOptions = {
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400, // 24 hours preflight cache
};
```

---

## 7. Compliance Notes

InterviewShield is designed with privacy best practices in mind. However, for a hackathon MVP, formal compliance certification (GDPR, CCPA, SOC 2) is not in scope.

**Design decisions that align with privacy regulations:**
- Data minimization (no continuous recording)
- Purpose limitation (data used only for integrity monitoring)
- Explicit consent (timestamped opt-in)
- Right to deletion (candidate data purge flow)
- Bounded retention (automatic expiry)
- Transparent processing (consent page explains what is monitored)

**Not implemented for MVP:**
- Data Protection Impact Assessment (DPIA)
- Data Processing Agreement (DPA)
- Privacy policy page
- Cookie consent (no tracking cookies used)
- Automated compliance reporting

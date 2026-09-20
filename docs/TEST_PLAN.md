# InterviewShield — Test Plan

> **Project**: InterviewShield — MUSA CodeX 2026 Round 2
> **Team**: Harrington's Tech
> **Version**: 1.0 — MVP

---

## 1. Testing Philosophy

Testing priorities for this MVP, in order:

1. **Risk engine unit tests** — this is the core business logic; must be thoroughly tested
2. **API integration tests** — verify request/response contracts
3. **Detector module tests** — each detector tested with synthetic input
4. **Manual robustness scenarios** — end-to-end behavioral verification for demo
5. **WebSocket protocol tests** — connection, message flow, reconnection

We do NOT aim for 100% code coverage. We aim for high confidence in the critical paths.

---

## 2. Testing Stack

| Tool | Purpose |
|------|---------|
| **Vitest** | Unit tests (server + shared) — fast, TypeScript-native |
| **Vitest** | Unit tests (client detectors) — same tooling |
| **Supertest** | HTTP integration tests for Express API |
| **Prisma test utils** | Database test setup/teardown |

### Test File Convention
```
src/
  risk/
    engine.ts
    engine.test.ts          ← co-located unit test
  api/
    routes/
      interviews.ts
      interviews.test.ts    ← co-located integration test
  detectors/               (client-side)
    face-detector.ts
    face-detector.test.ts
```

---

## 3. Unit Tests

### 3.1 Risk Engine (Critical Priority)

The risk engine is a pure function — perfect for unit testing.

**File**: `server/src/risk/engine.test.ts`

| # | Test Case | Input | Expected Output |
|---|-----------|-------|-----------------|
| 1 | Initial score, no events | Empty session | score=100, state=normal |
| 2 | Single face_absent | confidence=1.0 | score=95, state=normal |
| 3 | Single multiple_faces | confidence=1.0 | score=85, state=normal |
| 4 | Single tab_hidden | confidence=1.0 | score=90, state=normal |
| 5 | Single screen_share_stopped | confidence=1.0 | score=80, state=normal |
| 6 | Single face_orientation_off | confidence=1.0 | score=97, state=normal |
| 7 | Single av_mismatch | confidence=0.7 | score=94.4→94, state=normal |
| 8 | Single audio_silence_extended | confidence=0.7 | score=98.6→99, state=normal |
| 9 | Accumulate to attention | tab_hidden × 3 | score=70, state=attention |
| 10 | Accumulate to suspicious | face_absent ×3 + tab_hidden ×3 + multiple_faces | score ≤ 59, state=suspicious |
| 11 | Accumulate to high_risk | many events | score < 40, state=high_risk |
| 12 | Score floor at 0 | extreme events | score=0, state=high_risk |
| 13 | Score never negative | extreme events | score=0 (not -5) |
| 14 | Score never exceeds 100 | recovery from 100 | score=100 |
| 15 | Cooldown: same event within cooldown | tab_hidden at t=0, tab_hidden at t=3s | Second event: cooldownActive=true, score unchanged |
| 16 | Cooldown: same event after cooldown | tab_hidden at t=0, tab_hidden at t=6s | Second event: score deducted |
| 17 | Cooldown: different event types | tab_hidden at t=0, face_absent at t=1s | Both deducted (different types) |
| 18 | Recovery: 1 minute clean | No events for 60s | score += recoveryRate |
| 19 | Recovery: 3 minutes clean | No events for 180s | score += recoveryRate × 3 |
| 20 | Recovery: capped at peak | Recovery cannot exceed peakScore | score ≤ peakScore |
| 21 | Confidence scaling | face_absent at confidence=0.5 | deduction = -2.5 (not -5) |
| 22 | Confidence scaling: 0 confidence | confidence=0.0 | No deduction |
| 23 | Info events skip scoring | face_returned (severity=info) | score unchanged, changed=false |
| 24 | Unknown event type | eventType="unknown_type" | score unchanged, warning |
| 25 | Explanation: score decrease | tab_hidden | Contains previous score, new score, event description |
| 26 | Explanation: state change | Score crosses 80 threshold | Contains "state changed" text |
| 27 | Explanation: cooldown | Same event in cooldown | Contains "cooldown active" text |
| 28 | Explanation: recovery | Clean period + event | Contains "recovery" text |
| 29 | Determinism | Same inputs twice | Identical outputs |
| 30 | Custom config | Different weights | Deductions match custom weights |

### 3.2 Risk State Determination

**File**: `server/src/risk/thresholds.test.ts`

| # | Test Case | Score | Expected State |
|---|-----------|-------|----------------|
| 1 | Upper normal | 100 | normal |
| 2 | Lower normal | 80 | normal |
| 3 | Upper attention | 79 | attention |
| 4 | Lower attention | 60 | attention |
| 5 | Upper suspicious | 59 | suspicious |
| 6 | Lower suspicious | 40 | suspicious |
| 7 | Upper high_risk | 39 | high_risk |
| 8 | Zero | 0 | high_risk |
| 9 | Boundary: exactly 80 | 80 | normal |
| 10 | Boundary: exactly 60 | 60 | attention |
| 11 | Boundary: exactly 40 | 40 | suspicious |

### 3.3 Event Validation

**File**: `server/src/ws/protocol.test.ts` or `shared/src/events.test.ts`

| # | Test Case | Input | Expected |
|---|-----------|-------|----------|
| 1 | Valid detection event | Complete event object | Passes validation |
| 2 | Missing eventType | No eventType field | Validation error |
| 3 | Invalid severity | severity="unknown" | Validation error |
| 4 | Confidence below 0 | confidence=-0.1 | Validation error |
| 5 | Confidence above 1 | confidence=1.1 | Validation error |
| 6 | Missing timestamp | No timestamp field | Validation error |
| 7 | Missing payload | No payload field | Validation error |
| 8 | Extra fields ignored | Extra fields present | Passes (Zod strips extras) |

### 3.4 Detector Module Tests (Client-Side)

Each detector is tested with synthetic input to verify event emission.

#### Face Detector Tests

**File**: `client/src/detectors/face-detector.test.ts`

| # | Test Case | Synthetic Input | Expected Events |
|---|-----------|----------------|-----------------|
| 1 | Single face detected | Mock: 1 face, score 0.9 | No events (normal) |
| 2 | No face detected (first frame) | Mock: 0 faces | No event yet (debounce) |
| 3 | No face for 3+ seconds | Mock: 0 faces × 6 frames at 2fps | `face_absent` event |
| 4 | Face returns after absence | Mock: 0 faces → 1 face | `face_returned` event |
| 5 | Two faces detected | Mock: 2 faces | `multiple_faces` event |
| 6 | Face off-center for 5+ seconds | Mock: face at x=0.8 | `face_orientation_off` event |
| 7 | Low confidence detection | Mock: 1 face, score 0.3 | No event (below threshold) |

#### Audio Detector Tests

| # | Test Case | Synthetic Input | Expected Events |
|---|-----------|----------------|-----------------|
| 1 | Normal speech | Mock: volume above threshold, speech frequency | `audio_activity_detected` (info) |
| 2 | Silence for 30+ seconds | Mock: volume below threshold for 30s | `audio_silence_extended` |
| 3 | Below speech frequency | Mock: high volume but outside speech range | No speech detection |

#### Tab Detector Tests

| # | Test Case | Trigger | Expected Events |
|---|-----------|---------|-----------------|
| 1 | Tab hidden | visibilityState → "hidden" | `tab_hidden`, confidence 1.0 |
| 2 | Tab visible after hidden | visibilityState → "visible" | `tab_visible` with duration |

#### Screen Share Detector Tests

| # | Test Case | Trigger | Expected Events |
|---|-----------|---------|-----------------|
| 1 | Track ended | track.onended fires | `screen_share_stopped`, severity critical |
| 2 | Track started | Track provided | `screen_share_started`, info |

---

## 4. Integration Tests

### 4.1 API Integration Tests

**Framework**: Vitest + Supertest

**Database**: Test database with automatic cleanup between tests.

#### Auth Tests

| # | Test Case | Method & Path | Expected |
|---|-----------|---------------|----------|
| 1 | Login with valid credentials | POST /api/auth/login | 200, returns JWT |
| 2 | Login with wrong password | POST /api/auth/login | 401 |
| 3 | Login with nonexistent email | POST /api/auth/login | 401 (same as wrong password) |
| 4 | Access protected route without token | GET /api/interviews | 401 |
| 5 | Access protected route with invalid token | GET /api/interviews | 401 |
| 6 | Access protected route with expired token | GET /api/interviews | 401 |

#### Interview CRUD Tests

| # | Test Case | Method & Path | Expected |
|---|-----------|---------------|----------|
| 7 | Create interview | POST /api/interviews | 201, interview with joinToken |
| 8 | Create interview missing required field | POST /api/interviews | 400 |
| 9 | List own interviews | GET /api/interviews | 200, array of interviews |
| 10 | Get own interview by ID | GET /api/interviews/:id | 200 |
| 11 | Get another recruiter's interview | GET /api/interviews/:id | 404 or 403 |
| 12 | Update pending interview | PATCH /api/interviews/:id | 200 |
| 13 | Update non-pending interview | PATCH /api/interviews/:id | 409 |
| 14 | Cancel interview | DELETE /api/interviews/:id | 200, status=cancelled |

#### Session Tests

| # | Test Case | Method & Path | Expected |
|---|-----------|---------------|----------|
| 15 | Join with valid token | POST /api/interviews/join | 201, session + WS URL |
| 16 | Join with expired token | POST /api/interviews/join | 410 |
| 17 | Join with invalid token | POST /api/interviews/join | 404 |
| 18 | Get session details | GET /api/sessions/:id | 200 |

#### Event & Risk Tests

| # | Test Case | Method & Path | Expected |
|---|-----------|---------------|----------|
| 19 | Get events for session | GET /api/sessions/:id/events | 200, array |
| 20 | Filter events by type | GET /api/sessions/:id/events?eventType=tab_hidden | 200, filtered |
| 21 | Get risk score | GET /api/sessions/:id/risk | 200, score + state |
| 22 | Get risk history | GET /api/sessions/:id/risk/history | 200, array of snapshots |

#### Review Tests

| # | Test Case | Method & Path | Expected |
|---|-----------|---------------|----------|
| 23 | Submit review | POST /api/sessions/:id/review | 201 |
| 24 | Submit review with invalid decision | POST /api/sessions/:id/review | 400 |
| 25 | Submit duplicate review | POST /api/sessions/:id/review | 409 |
| 26 | Get review | GET /api/sessions/:id/review | 200 |

### 4.2 WebSocket Integration Tests

| # | Test Case | Expected |
|---|-----------|----------|
| 1 | Connect with valid session token | Receive `session:confirmed` |
| 2 | Connect with invalid token | Receive `session:error`, connection closed |
| 3 | Send heartbeat | Receive `pong` |
| 4 | Send detection event | Receive `ack` with matching sequence number |
| 5 | Send detection event → verify DB | Event persisted in detection_events table |
| 6 | Send detection event → verify risk | Risk snapshot created, session score updated |
| 7 | Send duplicate sequence number | No error, event deduplicated |
| 8 | Connection timeout (no heartbeat) | Server closes connection after 45s |

---

## 5. Manual Robustness Scenarios

These are end-to-end scenarios tested manually during development and before demo.

### 5.1 Test Execution Table

| # | Scenario | Steps | Expected System Behavior |
|---|----------|-------|------------------------|
| 1 | **Normal interview** | Sit normally, answer questions, maintain eye contact | Score 80–100, minimal events, state=normal |
| 2 | **Face missing** | Cover camera or look away for >3 seconds | `face_absent` event, score drops ~5 points, snapshot captured |
| 3 | **Face returns** | Uncover camera after absence | `face_returned` info event, score begins recovery |
| 4 | **Multiple faces** | Have another person enter the camera frame | `multiple_faces` event, score drops ~15 points, snapshot captured |
| 5 | **Tab switch** | Alt-Tab to another application or browser tab | `tab_hidden` event (immediate), score drops ~10 points |
| 6 | **Tab return** | Switch back to interview tab | `tab_visible` info event with hidden duration |
| 7 | **Screen share stop** | Click "Stop sharing" in browser prompt | `screen_share_stopped` event (critical), score drops ~20 points |
| 8 | **Extended off-camera orientation** | Look consistently to the side for >5 seconds | `face_orientation_off` event, score drops ~3 points |
| 9 | **Extended silence** | Don't speak for >30 seconds | `audio_silence_extended` event, score drops ~2 points |
| 10 | **Audio-visual mismatch** | Move mouth without speaking (or vice versa) for >5 seconds | `av_mismatch` event, score drops ~8 points |
| 11 | **Score recovery** | After triggering events, sit normally for 2+ minutes | Score recovers by ~4 points (2 per minute × 2 minutes) |
| 12 | **Multiple anomalies** | Tab switch + multiple faces + face absent | Score drops significantly, state transitions through attention → suspicious |
| 13 | **Network interruption** | Throttle network or disconnect WiFi briefly | Events buffered client-side, replayed on reconnect |
| 14 | **Low light** | Reduce room lighting | Face detection may fail; should see face_absent after threshold, not rapid-fire events |
| 15 | **Interview completion** | Click "End Interview" | Session ends cleanly, final score persisted |
| 16 | **Recruiter review** | Open dashboard → session detail → submit review | Review persisted, displayed on session |

### 5.2 Demo Verification Checklist

Before presenting to judges, verify:

- [ ] Recruiter can login
- [ ] Recruiter can create interview and copy join link
- [ ] Candidate can open join link and see system check
- [ ] System check detects camera, mic, screen share
- [ ] Consent page displays and requires explicit opt-in
- [ ] Interview page shows camera preview and status bar
- [ ] Tab switch triggers immediate event in timeline
- [ ] Face absence triggers event after ~3 seconds
- [ ] Multiple faces triggers event with snapshot
- [ ] Screen share stop triggers critical event
- [ ] Score decreases visibly in recruiter dashboard
- [ ] Score recovers during normal behavior
- [ ] Event timeline shows chronological events with severity colors
- [ ] Evidence snapshots are viewable
- [ ] Recruiter can submit review (pass/flag/inconclusive)
- [ ] All explanations are human-readable

---

## 6. Performance Targets

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Client detection loop cycle | ≤ 500ms (2 fps) | `performance.now()` before/after cycle in DetectorOrchestrator |
| Face detection inference | ≤ 200ms per frame | MediaPipe built-in performance timing |
| Event delivery latency (client → server persist) | < 1 second | Compare client timestamp to server timestamp on event record |
| Risk recalculation | < 50ms per event | `console.time()` around risk engine call |
| Dashboard page load (interview list) | < 2 seconds | Browser DevTools Network tab |
| Event timeline render (100 events) | < 500ms | React DevTools Profiler |
| WebSocket reconnection | < 5 seconds | Manual test: disconnect WiFi, reconnect, measure |
| Memory usage (candidate page, 30 min session) | < 500 MB | Browser Task Manager during extended test |
| Database query: events by session (100 events) | < 100ms | Prisma query logging |
| API response: interview list (20 items) | < 200ms | Supertest response timing |

### Performance Test Procedure

1. Start a session
2. Let detectors run for 30 minutes
3. Monitor: CPU usage, memory usage, detection loop timing
4. Verify: no memory leak (memory stays bounded), detection loop stays under 500ms
5. Check: database event count matches expected (2 fps × 30 min = ~3600 frames, events only on anomalies)

---

## 7. Test Execution Commands

```bash
# Run all tests
npm test

# Run server tests only
npm test --workspace=server

# Run client tests only
npm test --workspace=client

# Run specific test file
npx vitest run server/src/risk/engine.test.ts

# Run tests in watch mode
npx vitest --workspace=server

# Run with coverage
npx vitest run --coverage
```

---

## 8. Known Test Limitations

| Limitation | Impact | Mitigation |
|---|---|---|
| Cannot automate browser permission prompts | System check and media access require manual interaction | Manual testing for media flows |
| Cannot simulate real MediaPipe in tests | Face detector tests use mocked MediaPipe | Test the event emission logic, not the ML model |
| WebSocket tests require running server | Cannot unit-test WebSocket without server | Integration tests cover this |
| Performance varies by hardware | Detection timing depends on CPU/GPU | Test on target demo hardware; document minimum specs |

# InterviewShield — API Contract & WebSocket Protocol

> **Project**: InterviewShield — MUSA CodeX 2026 Round 2
> **Team**: Harrington's Tech
> **Version**: 1.0 — MVP

---

## 1. General Conventions

### Base URL
- **Development**: `http://localhost:3001/api`
- **WebSocket**: `ws://localhost:3001/ws`
- **Production**: `https://<host>/api` and `wss://<host>/ws`

### Response Envelope

All REST responses use a consistent envelope:

```typescript
interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: ApiError | null;
  meta?: PaginationMeta;
}

interface ApiError {
  code: string;
  message: string;
  details?: unknown[];
}

interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
```

### Success Response Example
```json
{
  "success": true,
  "data": { "id": "uuid", "name": "..." },
  "error": null
}
```

### Error Response Example
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "candidate_email is required",
    "details": [
      { "field": "candidate_email", "message": "Required" }
    ]
  }
}
```

### Error Codes

| Code | HTTP Status | Meaning |
|------|-------------|---------|
| `VALIDATION_ERROR` | 400 | Request body/params failed validation |
| `UNAUTHORIZED` | 401 | Missing or invalid auth token |
| `FORBIDDEN` | 403 | Authenticated but not authorized |
| `NOT_FOUND` | 404 | Resource does not exist |
| `CONFLICT` | 409 | Duplicate or state conflict |
| `TOKEN_EXPIRED` | 410 | Join token has expired |
| `INTERNAL_ERROR` | 500 | Server error (no details in production) |

### Authentication

Protected endpoints require a JWT token in the `Authorization` header:

```
Authorization: Bearer <jwt_token>
```

JWT payload:
```json
{
  "sub": "recruiter-uuid",
  "email": "recruiter@example.com",
  "iat": 1695200000,
  "exp": 1695286400
}
```

Token expiry: 24 hours.

### Pagination

List endpoints support pagination via query parameters:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number (1-indexed) |
| `pageSize` | number | 20 | Items per page (max 100) |

---

## 2. REST API Endpoints

### 2.1 Authentication

#### POST /api/auth/login

Login with email and password. Returns a JWT token.

**Auth**: None

**Request Body**:
```json
{
  "email": "recruiter@example.com",
  "password": "password123"
}
```

**Validation**:
- `email`: required, valid email format
- `password`: required, non-empty string

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOi...",
    "recruiter": {
      "id": "uuid",
      "email": "recruiter@example.com",
      "name": "Jane Doe"
    }
  },
  "error": null
}
```

**Error Responses**:
- 400: `VALIDATION_ERROR` — invalid input
- 401: `UNAUTHORIZED` — invalid credentials

---

#### POST /api/auth/logout

Logout (client-side token discard; server-side optional blacklist for MVP).

**Auth**: Bearer token

**Success Response** (200):
```json
{
  "success": true,
  "data": { "message": "Logged out" },
  "error": null
}
```

---

### 2.2 Interviews

#### GET /api/interviews

List interviews for the authenticated recruiter.

**Auth**: Bearer token

**Query Parameters**:
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `pageSize` | number | 20 | Items per page |
| `status` | string | (all) | Filter: `pending` \| `active` \| `completed` \| `cancelled` |

**Success Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Senior Developer Interview",
      "candidateName": "Alice Johnson",
      "candidateEmail": "alice@example.com",
      "status": "completed",
      "scheduledAt": "2026-09-20T10:00:00Z",
      "latestSession": {
        "id": "uuid",
        "integrityScore": 72,
        "riskState": "attention",
        "startedAt": "2026-09-20T10:02:00Z",
        "endedAt": "2026-09-20T10:45:00Z",
        "reviewDecision": "flag"
      },
      "createdAt": "2026-09-19T14:00:00Z"
    }
  ],
  "error": null,
  "meta": { "page": 1, "pageSize": 20, "total": 5, "totalPages": 1 }
}
```

---

#### POST /api/interviews

Create a new interview.

**Auth**: Bearer token

**Request Body**:
```json
{
  "title": "Senior Developer Interview",
  "candidateName": "Alice Johnson",
  "candidateEmail": "alice@example.com",
  "scheduledAt": "2026-09-25T10:00:00Z"
}
```

**Validation**:
- `title`: required, string, max 255 chars
- `candidateName`: required, string, max 255 chars
- `candidateEmail`: required, valid email format
- `scheduledAt`: optional, ISO 8601 datetime, must be in the future

**Success Response** (201):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Senior Developer Interview",
    "candidateName": "Alice Johnson",
    "candidateEmail": "alice@example.com",
    "joinToken": "a1b2c3d4e5f6...",
    "joinUrl": "http://localhost:5173/join/a1b2c3d4e5f6...",
    "tokenExpiresAt": "2026-09-27T10:00:00Z",
    "status": "pending",
    "scheduledAt": "2026-09-25T10:00:00Z",
    "createdAt": "2026-09-20T14:00:00Z"
  },
  "error": null
}
```

---

#### GET /api/interviews/:id

Get interview details with latest session summary.

**Auth**: Bearer token

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Senior Developer Interview",
    "candidateName": "Alice Johnson",
    "candidateEmail": "alice@example.com",
    "joinToken": "a1b2c3d4e5f6...",
    "joinUrl": "http://localhost:5173/join/a1b2c3d4e5f6...",
    "tokenExpiresAt": "2026-09-27T10:00:00Z",
    "status": "completed",
    "scheduledAt": "2026-09-25T10:00:00Z",
    "sessions": [
      {
        "id": "uuid",
        "startedAt": "2026-09-25T10:02:00Z",
        "endedAt": "2026-09-25T10:45:00Z",
        "integrityScore": 72,
        "riskState": "attention",
        "eventCount": 15
      }
    ],
    "createdAt": "2026-09-20T14:00:00Z"
  },
  "error": null
}
```

---

#### PATCH /api/interviews/:id

Update interview details. Only `pending` interviews can be updated.

**Auth**: Bearer token

**Request Body** (all fields optional):
```json
{
  "title": "Updated Title",
  "scheduledAt": "2026-09-26T10:00:00Z"
}
```

**Success Response** (200): Updated interview object.

**Error Responses**:
- 404: `NOT_FOUND`
- 409: `CONFLICT` — interview is not in `pending` status

---

#### DELETE /api/interviews/:id

Cancel an interview (soft delete — sets status to `cancelled`).

**Auth**: Bearer token

**Success Response** (200):
```json
{
  "success": true,
  "data": { "id": "uuid", "status": "cancelled" },
  "error": null
}
```

---

### 2.3 Sessions (Candidate Access)

#### POST /api/interviews/join

Candidate joins an interview using a token. Creates a new session.

**Auth**: None (token-based)

**Request Body**:
```json
{
  "joinToken": "a1b2c3d4e5f6..."
}
```

**Validation**:
- `joinToken`: required, string
- Token must exist, not be expired, and interview must be in `pending` or `active` status

**Success Response** (201):
```json
{
  "success": true,
  "data": {
    "sessionId": "uuid",
    "interviewId": "uuid",
    "interviewTitle": "Senior Developer Interview",
    "wsUrl": "ws://localhost:3001/ws/session/uuid",
    "sessionToken": "session-jwt-token"
  },
  "error": null
}
```

**Error Responses**:
- 400: `VALIDATION_ERROR`
- 404: `NOT_FOUND` — invalid token
- 410: `TOKEN_EXPIRED`

---

#### GET /api/sessions/:id

Get session details.

**Auth**: Bearer token (recruiter) or session token (candidate for own session)

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "interviewId": "uuid",
    "startedAt": "2026-09-25T10:02:00Z",
    "endedAt": null,
    "consentGiven": true,
    "consentGivenAt": "2026-09-25T10:03:00Z",
    "systemCheckPassed": true,
    "currentIntegrityScore": 85,
    "currentRiskState": "normal",
    "eventCount": 7,
    "duration": "00:23:15"
  },
  "error": null
}
```

---

#### PATCH /api/sessions/:id

Update session state (consent, system check, end).

**Auth**: Session token (candidate)

**Request Body** (context-dependent):
```json
{
  "consentGiven": true
}
```
or
```json
{
  "systemCheckPassed": true,
  "systemCheckDetails": {
    "browser": "Chrome 117",
    "cameraAvailable": true,
    "micAvailable": true,
    "screenShareAvailable": true
  }
}
```
or
```json
{
  "ended": true,
  "endReason": "completed"
}
```

---

### 2.4 Events

#### GET /api/sessions/:id/events

List detection events for a session.

**Auth**: Bearer token (recruiter)

**Query Parameters**:
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | |
| `pageSize` | number | 50 | |
| `eventType` | string | (all) | Filter by event type |
| `severity` | string | (all) | Filter by severity |
| `minConfidence` | number | 0 | Minimum confidence filter |

**Success Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "sequenceNumber": 42,
      "eventType": "tab_hidden",
      "detectorId": "tab_detector",
      "clientTimestamp": "2026-09-25T10:15:30.500Z",
      "serverTimestamp": "2026-09-25T10:15:31.100Z",
      "severity": "high",
      "confidence": 1.0,
      "payload": { "timestamp": 1695636930500 },
      "scoreBefore": 95,
      "scoreAfter": 85,
      "hasEvidence": true
    }
  ],
  "error": null,
  "meta": { "page": 1, "pageSize": 50, "total": 15, "totalPages": 1 }
}
```

---

#### GET /api/sessions/:id/timeline

Get aggregated timeline view (events grouped by minute with risk score at each point).

**Auth**: Bearer token (recruiter)

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "startedAt": "2026-09-25T10:02:00Z",
    "endedAt": "2026-09-25T10:45:00Z",
    "intervals": [
      {
        "minute": "2026-09-25T10:15:00Z",
        "events": [
          {
            "id": "uuid",
            "eventType": "tab_hidden",
            "severity": "high",
            "timestamp": "2026-09-25T10:15:30Z"
          }
        ],
        "integrityScore": 85,
        "riskState": "normal"
      }
    ]
  },
  "error": null
}
```

---

### 2.5 Risk

#### GET /api/sessions/:id/risk

Get current risk score and state.

**Auth**: Bearer token (recruiter)

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "integrityScore": 72,
    "riskState": "attention",
    "explanation": "Score decreased due to 2 tab switch events and 1 multiple faces detection.",
    "lastUpdated": "2026-09-25T10:28:00Z",
    "eventSummary": {
      "total": 15,
      "bySeverity": { "info": 5, "low": 2, "medium": 3, "high": 4, "critical": 1 },
      "byType": { "tab_hidden": 4, "face_absent": 3, "multiple_faces": 1 }
    }
  },
  "error": null
}
```

---

#### GET /api/sessions/:id/risk/history

Get risk score over time (for chart/graph display).

**Auth**: Bearer token (recruiter)

**Success Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "timestamp": "2026-09-25T10:02:00Z",
      "integrityScore": 100,
      "riskState": "normal",
      "explanation": "Session started"
    },
    {
      "timestamp": "2026-09-25T10:15:31Z",
      "integrityScore": 90,
      "riskState": "normal",
      "explanation": "Integrity score changed from 100 to 90 (-10): Candidate switched away from interview tab at 10:15:30."
    }
  ],
  "error": null
}
```

---

### 2.6 Evidence

#### GET /api/sessions/:id/evidence

List evidence items for a session.

**Auth**: Bearer token (recruiter)

**Success Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "eventId": "uuid",
      "evidenceType": "snapshot",
      "timestamp": "2026-09-25T10:20:15Z",
      "fileSizeBytes": 24576,
      "metadata": { "resolution": "320x240", "format": "jpeg" },
      "downloadUrl": "/api/evidence/uuid/file"
    }
  ],
  "error": null
}
```

---

#### GET /api/evidence/:id/file

Download an evidence file (snapshot image).

**Auth**: Bearer token (recruiter)

**Response**: Binary file with appropriate `Content-Type` header (`image/jpeg`).

**Error Responses**:
- 404: `NOT_FOUND` — evidence item or file does not exist

---

### 2.7 Reviews

#### POST /api/sessions/:id/review

Submit a human review for a session.

**Auth**: Bearer token (recruiter)

**Request Body**:
```json
{
  "decision": "flag",
  "notes": "Multiple faces detected at 10:20, candidate appeared to receive assistance."
}
```

**Validation**:
- `decision`: required, one of `pass` | `flag` | `inconclusive`
- `notes`: optional, string, max 5000 chars

**Success Response** (201):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "sessionId": "uuid",
    "recruiterId": "uuid",
    "decision": "flag",
    "notes": "Multiple faces detected at 10:20...",
    "reviewedAt": "2026-09-25T11:00:00Z"
  },
  "error": null
}
```

**Error Responses**:
- 409: `CONFLICT` — session already has a review (use PATCH to update)

---

#### GET /api/sessions/:id/review

Get the review for a session.

**Auth**: Bearer token (recruiter)

**Success Response** (200): Review object (same as POST response data).

**Error Responses**:
- 404: `NOT_FOUND` — no review submitted yet

---

### 2.8 System Check

#### POST /api/system-check

Candidate reports their system check results (informational, not enforced server-side beyond recording).

**Auth**: Session token

**Request Body**:
```json
{
  "browser": "Chrome 117.0.5938.132",
  "userAgent": "Mozilla/5.0...",
  "cameraAvailable": true,
  "cameraLabel": "HD Webcam",
  "microphoneAvailable": true,
  "microphoneLabel": "Internal Microphone",
  "screenShareAvailable": true,
  "webglAvailable": true,
  "mediaPipeLoadable": true
}
```

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "passed": true,
    "issues": []
  },
  "error": null
}
```

If issues detected:
```json
{
  "success": true,
  "data": {
    "passed": false,
    "issues": [
      { "component": "camera", "message": "Camera permission denied" },
      { "component": "mediaPipe", "message": "Face detection model failed to load" }
    ]
  },
  "error": null
}
```

---

## 3. WebSocket Protocol

### 3.1 Connection

**URL**: `ws://localhost:3001/ws/session/:sessionId`

**Authentication**: Session token as query parameter:
```
ws://localhost:3001/ws/session/uuid?token=session-jwt-token
```

**Connection lifecycle**:
1. Client connects with session ID and token
2. Server validates token and session existence
3. If valid: server sends `session:confirmed`
4. If invalid: server sends `session:error` and closes connection
5. Client begins heartbeat cycle

---

### 3.2 Message Format

All WebSocket messages are JSON with this structure:

```typescript
interface WsMessage {
  type: string;             // Message type identifier
  version: number;          // Protocol version (always 1 for MVP)
  sequenceNumber?: number;  // Client-assigned, for acknowledgment/dedup
  timestamp: string;        // ISO 8601
  payload: unknown;         // Type-specific payload
}
```

---

### 3.3 Client → Server Messages

#### `session:heartbeat`

Keep-alive signal. Client sends every 15 seconds.

```json
{
  "type": "session:heartbeat",
  "version": 1,
  "timestamp": "2026-09-25T10:15:00.000Z",
  "payload": {}
}
```

Server responds with `pong`. If no heartbeat received for 45 seconds, server considers the connection dead.

---

#### `session:consent`

Candidate grants consent to monitoring.

```json
{
  "type": "session:consent",
  "version": 1,
  "sequenceNumber": 1,
  "timestamp": "2026-09-25T10:03:00.000Z",
  "payload": {
    "consentGiven": true
  }
}
```

---

#### `session:start`

Candidate confirms interview has started (after system check and consent).

```json
{
  "type": "session:start",
  "version": 1,
  "sequenceNumber": 2,
  "timestamp": "2026-09-25T10:04:00.000Z",
  "payload": {
    "systemCheckPassed": true
  }
}
```

---

#### `session:end`

Candidate ends the interview.

```json
{
  "type": "session:end",
  "version": 1,
  "sequenceNumber": 150,
  "timestamp": "2026-09-25T10:45:00.000Z",
  "payload": {
    "reason": "completed"
  }
}
```

`reason` values: `completed` | `error` | `disconnected`

---

#### `detection:event`

A detection event from a client-side detector.

```json
{
  "type": "detection:event",
  "version": 1,
  "sequenceNumber": 42,
  "timestamp": "2026-09-25T10:15:30.500Z",
  "payload": {
    "eventType": "tab_hidden",
    "detectorId": "tab_detector",
    "timestamp": 1695636930500,
    "severity": "high",
    "confidence": 1.0,
    "payload": {
      "timestamp": 1695636930500
    }
  }
}
```

---

#### `evidence:snapshot`

Low-resolution snapshot captured at the time of a detection event.

```json
{
  "type": "evidence:snapshot",
  "version": 1,
  "sequenceNumber": 43,
  "timestamp": "2026-09-25T10:20:15.000Z",
  "payload": {
    "eventSequenceNumber": 41,
    "imageDataUrl": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
  }
}
```

**Size constraint**: Image must be ≤ 50KB. Server rejects larger payloads.

---

### 3.4 Server → Client Messages

#### `session:confirmed`

Sent after successful connection.

```json
{
  "type": "session:confirmed",
  "version": 1,
  "timestamp": "2026-09-25T10:02:00.000Z",
  "payload": {
    "sessionId": "uuid",
    "interviewTitle": "Senior Developer Interview",
    "serverTime": "2026-09-25T10:02:00.000Z"
  }
}
```

---

#### `session:error`

Error during session. May cause connection close.

```json
{
  "type": "session:error",
  "version": 1,
  "timestamp": "2026-09-25T10:02:00.000Z",
  "payload": {
    "code": "INVALID_TOKEN",
    "message": "Session token is invalid or expired",
    "fatal": true
  }
}
```

`fatal: true` means the server will close the connection.

---

#### `ack`

Acknowledges receipt and processing of a client message.

```json
{
  "type": "ack",
  "version": 1,
  "timestamp": "2026-09-25T10:15:31.100Z",
  "payload": {
    "sequenceNumber": 42
  }
}
```

---

#### `pong`

Response to heartbeat.

```json
{
  "type": "pong",
  "version": 1,
  "timestamp": "2026-09-25T10:15:00.100Z",
  "payload": {}
}
```

---

### 3.5 Sequence Number Protocol

1. Client maintains an incrementing integer sequence number, starting at 1 per session
2. Every client → server message (except heartbeat) includes `sequenceNumber`
3. Server acknowledges each message with an `ack` containing the sequence number
4. Client tracks which sequence numbers have been acknowledged
5. On WebSocket disconnection:
   a. Client retains un-acknowledged messages in the Event Buffer
   b. Client reconnects with exponential backoff (1s, 2s, 4s, 8s, max 30s)
   c. After reconnection, client replays all un-acknowledged messages
6. Server deduplicates by `(sessionId, sequenceNumber)` unique index — replayed messages that already exist are acknowledged without re-processing

### 3.6 Connection Management

| Parameter | Value |
|-----------|-------|
| Heartbeat interval (client) | 15 seconds |
| Heartbeat timeout (server) | 45 seconds |
| Reconnection initial delay | 1 second |
| Reconnection max delay | 30 seconds |
| Reconnection backoff | Exponential (×2) |
| Max buffer size | 500 messages |
| Max message size | 100 KB |

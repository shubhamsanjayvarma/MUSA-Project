# InterviewShield — Database Schema

> **Project**: InterviewShield — MUSA CodeX 2026 Round 2
> **Team**: Harrington's Tech
> **Version**: 1.0 — MVP

---

## 1. Overview

InterviewShield uses PostgreSQL 16 as its primary data store, accessed via Prisma ORM. The schema is designed for:

- **Relational integrity** — foreign keys enforce data relationships
- **Flexible payloads** — JSONB columns store detector-specific data without schema migration
- **Query performance** — targeted indexes for common access patterns
- **Auditability** — timestamps on all records

### Entity Relationship Diagram

```
recruiters 1──────* interviews 1──────* sessions 1──────* detection_events
    │                                      │                    │
    │                                      │               evidence_items
    │                                      │
    └──────────────* recruiter_reviews *────┘
                                           │
                                      risk_snapshots
```

---

## 2. Schema Definition (SQL)

### recruiters

Recruiter user accounts.

```sql
CREATE TABLE recruiters (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) UNIQUE NOT NULL,
  name          VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, auto-generated | |
| email | VARCHAR(255) | UNIQUE, NOT NULL | Login identifier |
| name | VARCHAR(255) | NOT NULL | Display name |
| password_hash | VARCHAR(255) | NOT NULL | bcrypt hash, never store plaintext |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Updated on profile changes |

---

### interviews

Interview records created by recruiters for specific candidates.

```sql
CREATE TABLE interviews (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_id     UUID NOT NULL REFERENCES recruiters(id),
  title            VARCHAR(255) NOT NULL,
  candidate_name   VARCHAR(255) NOT NULL,
  candidate_email  VARCHAR(255) NOT NULL,
  join_token       VARCHAR(64) UNIQUE NOT NULL,
  token_expires_at TIMESTAMPTZ NOT NULL,
  status           VARCHAR(50) NOT NULL DEFAULT 'pending',
  scheduled_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, auto-generated | |
| recruiter_id | UUID | FK → recruiters(id), NOT NULL | Interview creator |
| title | VARCHAR(255) | NOT NULL | e.g., "Senior Developer Interview" |
| candidate_name | VARCHAR(255) | NOT NULL | |
| candidate_email | VARCHAR(255) | NOT NULL | For identification, not auth |
| join_token | VARCHAR(64) | UNIQUE, NOT NULL | Cryptographically random, used in join URL |
| token_expires_at | TIMESTAMPTZ | NOT NULL | Token validity window |
| status | VARCHAR(50) | NOT NULL, DEFAULT 'pending' | `pending` \| `active` \| `completed` \| `cancelled` |
| scheduled_at | TIMESTAMPTZ | nullable | Optional scheduling |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |

**Status transitions:**
```
pending → active     (candidate joins)
pending → cancelled  (recruiter cancels)
active  → completed  (session ends)
active  → cancelled  (recruiter cancels during interview)
```

---

### sessions

Individual monitoring sessions within an interview. One interview may have multiple sessions if the candidate reconnects.

```sql
CREATE TABLE sessions (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id            UUID NOT NULL REFERENCES interviews(id),
  started_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at                TIMESTAMPTZ,
  consent_given           BOOLEAN NOT NULL DEFAULT FALSE,
  consent_given_at        TIMESTAMPTZ,
  system_check_passed     BOOLEAN NOT NULL DEFAULT FALSE,
  current_integrity_score INTEGER NOT NULL DEFAULT 100,
  current_risk_state      VARCHAR(50) NOT NULL DEFAULT 'normal',
  peak_integrity_score    INTEGER NOT NULL DEFAULT 100,
  event_sequence_number   INTEGER NOT NULL DEFAULT 0,
  metadata                JSONB NOT NULL DEFAULT '{}',
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK | |
| interview_id | UUID | FK → interviews(id), NOT NULL | |
| started_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Session start time |
| ended_at | TIMESTAMPTZ | nullable | NULL while active |
| consent_given | BOOLEAN | NOT NULL, DEFAULT FALSE | Monitoring requires consent |
| consent_given_at | TIMESTAMPTZ | nullable | Timestamp of consent |
| system_check_passed | BOOLEAN | NOT NULL, DEFAULT FALSE | Pre-interview check |
| current_integrity_score | INTEGER | NOT NULL, DEFAULT 100 | Live score (0–100) |
| current_risk_state | VARCHAR(50) | NOT NULL, DEFAULT 'normal' | Live risk state |
| peak_integrity_score | INTEGER | NOT NULL, DEFAULT 100 | Highest score after recovery |
| event_sequence_number | INTEGER | NOT NULL, DEFAULT 0 | Last processed sequence number |
| metadata | JSONB | NOT NULL, DEFAULT '{}' | Stores lastEventTimes, lastAnomalyTimestamp |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |

**metadata JSONB structure:**
```json
{
  "lastEventTimes": {
    "face_absent": 1695200000000,
    "tab_hidden": 1695200120000
  },
  "lastAnomalyTimestamp": 1695200120000,
  "systemCheckDetails": {
    "browser": "Chrome 117",
    "cameraAvailable": true,
    "micAvailable": true,
    "screenShareAvailable": true
  }
}
```

---

### detection_events

Individual detection events emitted by client-side detectors.

```sql
CREATE TABLE detection_events (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id       UUID NOT NULL REFERENCES sessions(id),
  sequence_number  INTEGER NOT NULL,
  event_type       VARCHAR(100) NOT NULL,
  detector_id      VARCHAR(100) NOT NULL,
  client_timestamp TIMESTAMPTZ NOT NULL,
  server_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  severity         VARCHAR(50) NOT NULL,
  confidence       FLOAT NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  payload          JSONB NOT NULL,
  score_before     INTEGER,
  score_after      INTEGER,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK | |
| session_id | UUID | FK → sessions(id), NOT NULL | |
| sequence_number | INTEGER | NOT NULL | Client-assigned, used for deduplication |
| event_type | VARCHAR(100) | NOT NULL | e.g., `face_absent`, `tab_hidden` |
| detector_id | VARCHAR(100) | NOT NULL | e.g., `face_detector`, `tab_detector` |
| client_timestamp | TIMESTAMPTZ | NOT NULL | When the client detected the event |
| server_timestamp | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Canonical timestamp |
| severity | VARCHAR(50) | NOT NULL | `info` \| `low` \| `medium` \| `high` \| `critical` |
| confidence | FLOAT | NOT NULL, CHECK 0–1 | Detector's confidence in the event |
| payload | JSONB | NOT NULL | Detector-specific structured data |
| score_before | INTEGER | nullable | Integrity score before this event processed |
| score_after | INTEGER | nullable | Integrity score after this event processed |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |

---

### risk_snapshots

Periodic captures of the risk score, recorded when the score changes.

```sql
CREATE TABLE risk_snapshots (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id            UUID NOT NULL REFERENCES sessions(id),
  timestamp             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  integrity_score       INTEGER NOT NULL CHECK (integrity_score >= 0 AND integrity_score <= 100),
  risk_state            VARCHAR(50) NOT NULL,
  explanation           TEXT NOT NULL,
  contributing_event_id UUID REFERENCES detection_events(id),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK | |
| session_id | UUID | FK → sessions(id), NOT NULL | |
| timestamp | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | When the snapshot was taken |
| integrity_score | INTEGER | NOT NULL, CHECK 0–100 | Score at this point in time |
| risk_state | VARCHAR(50) | NOT NULL | State at this point |
| explanation | TEXT | NOT NULL | Human-readable explanation |
| contributing_event_id | UUID | FK → detection_events(id), nullable | Event that caused this change |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |

---

### evidence_items

Evidence artifacts (low-resolution snapshots) captured at event time.

```sql
CREATE TABLE evidence_items (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id           UUID NOT NULL REFERENCES sessions(id),
  event_id             UUID REFERENCES detection_events(id),
  evidence_type        VARCHAR(50) NOT NULL,
  timestamp            TIMESTAMPTZ NOT NULL,
  file_path            VARCHAR(500),
  file_size_bytes      INTEGER,
  metadata             JSONB NOT NULL DEFAULT '{}',
  retention_expires_at TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK | |
| session_id | UUID | FK → sessions(id), NOT NULL | |
| event_id | UUID | FK → detection_events(id), nullable | Associated event |
| evidence_type | VARCHAR(50) | NOT NULL | `snapshot` \| `metadata` |
| timestamp | TIMESTAMPTZ | NOT NULL | When the evidence was captured |
| file_path | VARCHAR(500) | nullable | Relative path to stored file |
| file_size_bytes | INTEGER | nullable | File size for storage tracking |
| metadata | JSONB | NOT NULL, DEFAULT '{}' | Additional metadata |
| retention_expires_at | TIMESTAMPTZ | nullable | When this evidence should be purged |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |

---

### recruiter_reviews

Human review decisions made by recruiters.

```sql
CREATE TABLE recruiter_reviews (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id   UUID NOT NULL REFERENCES sessions(id) UNIQUE,
  recruiter_id UUID NOT NULL REFERENCES recruiters(id),
  decision     VARCHAR(50) NOT NULL,
  notes        TEXT,
  reviewed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK | |
| session_id | UUID | FK → sessions(id), UNIQUE, NOT NULL | One review per session |
| recruiter_id | UUID | FK → recruiters(id), NOT NULL | Reviewer |
| decision | VARCHAR(50) | NOT NULL | `pass` \| `flag` \| `inconclusive` |
| notes | TEXT | nullable | Free-text notes |
| reviewed_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | When the review was submitted |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |

---

## 3. Indexes

```sql
-- Interview lookups
CREATE INDEX idx_interviews_recruiter ON interviews(recruiter_id);
CREATE INDEX idx_interviews_status ON interviews(status);
CREATE INDEX idx_interviews_token ON interviews(join_token);

-- Session lookups
CREATE INDEX idx_sessions_interview ON sessions(interview_id);

-- Event lookups (most critical for performance)
CREATE INDEX idx_events_session ON detection_events(session_id);
CREATE INDEX idx_events_session_time ON detection_events(session_id, server_timestamp);
CREATE INDEX idx_events_type ON detection_events(event_type);
CREATE UNIQUE INDEX idx_events_session_seq ON detection_events(session_id, sequence_number);

-- Risk snapshot lookups
CREATE INDEX idx_risk_session ON risk_snapshots(session_id);

-- Evidence lookups
CREATE INDEX idx_evidence_session ON evidence_items(session_id);
```

### Index Rationale

| Index | Query Pattern |
|-------|---------------|
| `idx_interviews_recruiter` | Recruiter dashboard: list my interviews |
| `idx_interviews_status` | Filter interviews by status |
| `idx_interviews_token` | Candidate join: validate token |
| `idx_sessions_interview` | Get sessions for an interview |
| `idx_events_session` | Get all events for a session (timeline) |
| `idx_events_session_time` | Get events in time order (most common query) |
| `idx_events_type` | Filter events by type |
| `idx_events_session_seq` | Deduplication on reconnection (UNIQUE) |
| `idx_risk_session` | Get risk history for a session |
| `idx_evidence_session` | Get evidence for a session |

---

## 4. Prisma Schema

The Prisma schema equivalent for ORM usage:

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Recruiter {
  id           String   @id @default(uuid()) @db.Uuid
  email        String   @unique @db.VarChar(255)
  name         String   @db.VarChar(255)
  passwordHash String   @map("password_hash") @db.VarChar(255)
  createdAt    DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt    DateTime @default(now()) @updatedAt @map("updated_at") @db.Timestamptz

  interviews Interview[]
  reviews    RecruiterReview[]

  @@map("recruiters")
}

model Interview {
  id             String   @id @default(uuid()) @db.Uuid
  recruiterId    String   @map("recruiter_id") @db.Uuid
  title          String   @db.VarChar(255)
  candidateName  String   @map("candidate_name") @db.VarChar(255)
  candidateEmail String   @map("candidate_email") @db.VarChar(255)
  joinToken      String   @unique @map("join_token") @db.VarChar(64)
  tokenExpiresAt DateTime @map("token_expires_at") @db.Timestamptz
  status         String   @default("pending") @db.VarChar(50)
  scheduledAt    DateTime? @map("scheduled_at") @db.Timestamptz
  createdAt      DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt      DateTime @default(now()) @updatedAt @map("updated_at") @db.Timestamptz

  recruiter Recruiter @relation(fields: [recruiterId], references: [id])
  sessions  Session[]

  @@index([recruiterId], map: "idx_interviews_recruiter")
  @@index([status], map: "idx_interviews_status")
  @@index([joinToken], map: "idx_interviews_token")
  @@map("interviews")
}

model Session {
  id                    String   @id @default(uuid()) @db.Uuid
  interviewId           String   @map("interview_id") @db.Uuid
  startedAt             DateTime @default(now()) @map("started_at") @db.Timestamptz
  endedAt               DateTime? @map("ended_at") @db.Timestamptz
  consentGiven          Boolean  @default(false) @map("consent_given")
  consentGivenAt        DateTime? @map("consent_given_at") @db.Timestamptz
  systemCheckPassed     Boolean  @default(false) @map("system_check_passed")
  currentIntegrityScore Int      @default(100) @map("current_integrity_score")
  currentRiskState      String   @default("normal") @map("current_risk_state") @db.VarChar(50)
  peakIntegrityScore    Int      @default(100) @map("peak_integrity_score")
  eventSequenceNumber   Int      @default(0) @map("event_sequence_number")
  metadata              Json     @default("{}") @db.JsonB
  createdAt             DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt             DateTime @default(now()) @updatedAt @map("updated_at") @db.Timestamptz

  interview      Interview        @relation(fields: [interviewId], references: [id])
  events         DetectionEvent[]
  riskSnapshots  RiskSnapshot[]
  evidenceItems  EvidenceItem[]
  review         RecruiterReview?

  @@index([interviewId], map: "idx_sessions_interview")
  @@map("sessions")
}

model DetectionEvent {
  id              String   @id @default(uuid()) @db.Uuid
  sessionId       String   @map("session_id") @db.Uuid
  sequenceNumber  Int      @map("sequence_number")
  eventType       String   @map("event_type") @db.VarChar(100)
  detectorId      String   @map("detector_id") @db.VarChar(100)
  clientTimestamp  DateTime @map("client_timestamp") @db.Timestamptz
  serverTimestamp  DateTime @default(now()) @map("server_timestamp") @db.Timestamptz
  severity        String   @db.VarChar(50)
  confidence      Float
  payload         Json     @db.JsonB
  scoreBefore     Int?     @map("score_before")
  scoreAfter      Int?     @map("score_after")
  createdAt       DateTime @default(now()) @map("created_at") @db.Timestamptz

  session        Session        @relation(fields: [sessionId], references: [id])
  riskSnapshots  RiskSnapshot[]
  evidenceItems  EvidenceItem[]

  @@unique([sessionId, sequenceNumber], map: "idx_events_session_seq")
  @@index([sessionId], map: "idx_events_session")
  @@index([sessionId, serverTimestamp], map: "idx_events_session_time")
  @@index([eventType], map: "idx_events_type")
  @@map("detection_events")
}

model RiskSnapshot {
  id                  String   @id @default(uuid()) @db.Uuid
  sessionId           String   @map("session_id") @db.Uuid
  timestamp           DateTime @default(now()) @db.Timestamptz
  integrityScore      Int      @map("integrity_score")
  riskState           String   @map("risk_state") @db.VarChar(50)
  explanation         String   @db.Text
  contributingEventId String?  @map("contributing_event_id") @db.Uuid
  createdAt           DateTime @default(now()) @map("created_at") @db.Timestamptz

  session           Session         @relation(fields: [sessionId], references: [id])
  contributingEvent DetectionEvent? @relation(fields: [contributingEventId], references: [id])

  @@index([sessionId], map: "idx_risk_session")
  @@map("risk_snapshots")
}

model EvidenceItem {
  id                 String   @id @default(uuid()) @db.Uuid
  sessionId          String   @map("session_id") @db.Uuid
  eventId            String?  @map("event_id") @db.Uuid
  evidenceType       String   @map("evidence_type") @db.VarChar(50)
  timestamp          DateTime @db.Timestamptz
  filePath           String?  @map("file_path") @db.VarChar(500)
  fileSizeBytes      Int?     @map("file_size_bytes")
  metadata           Json     @default("{}") @db.JsonB
  retentionExpiresAt DateTime? @map("retention_expires_at") @db.Timestamptz
  createdAt          DateTime @default(now()) @map("created_at") @db.Timestamptz

  session Session         @relation(fields: [sessionId], references: [id])
  event   DetectionEvent? @relation(fields: [eventId], references: [id])

  @@index([sessionId], map: "idx_evidence_session")
  @@map("evidence_items")
}

model RecruiterReview {
  id          String   @id @default(uuid()) @db.Uuid
  sessionId   String   @unique @map("session_id") @db.Uuid
  recruiterId String   @map("recruiter_id") @db.Uuid
  decision    String   @db.VarChar(50)
  notes       String?  @db.Text
  reviewedAt  DateTime @default(now()) @map("reviewed_at") @db.Timestamptz
  createdAt   DateTime @default(now()) @map("created_at") @db.Timestamptz

  session   Session   @relation(fields: [sessionId], references: [id])
  recruiter Recruiter @relation(fields: [recruiterId], references: [id])

  @@map("recruiter_reviews")
}
```

---

## 5. Seed Data

For development and demo purposes, the seed script creates:

```typescript
// prisma/seed.ts

// 1. Demo recruiter
const recruiter = {
  email: 'recruiter@demo.interviewshield.dev',
  name: 'Demo Recruiter',
  password: 'demo123',  // bcrypt hashed before insert
};

// 2. Sample interviews in various states
const interviews = [
  { title: 'Senior Developer Interview', candidateName: 'Alice Johnson',
    candidateEmail: 'alice@example.com', status: 'pending' },
  { title: 'Frontend Engineer Screen', candidateName: 'Bob Smith',
    candidateEmail: 'bob@example.com', status: 'completed' },
];

// 3. For the completed interview: a session with sample events and a risk score
// Events demonstrate the full range: face_absent, tab_hidden, multiple_faces, etc.
```

---

## 6. Migration Strategy

- Prisma handles migrations via `npx prisma migrate dev`
- Migration files are committed to version control
- Initial migration creates all tables and indexes
- Future schema changes require a new migration (never edit existing migrations)
- Seed data is idempotent (can be re-run safely)

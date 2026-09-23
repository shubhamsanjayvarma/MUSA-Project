# Backend Design & Data Model — InterviewShield

> **Document Type:** LIVING Domain & Data Specification
> **System Name:** InterviewShield — Multimodal Interview Integrity & Evidence Platform
> **Architecture Standard:** Hybrid YAML Architecture per AGENTS.md Rule 6, Rule 7, Rule 23 & Rule 31
> **Security & Reliability Status:** Fortified via Council of Subagents Adversarial Review

## 1. Tactical Domain-Driven Design (DDD) & Aggregate Roots

```yaml
tactical_ddd_architecture:
  bounded_context: "Interview Integrity & Anomaly Audit Context"
  aggregates:
    interview_aggregate:
      root_entity: "Interview"
      invariants:
        - "An interview must have exactly one Recruiter owner."
        - "Join tokens are NEVER stored in plaintext; only SHA-256 hash (64 hex characters) is persisted."
        - "Join token expiry cannot be set to a past timestamp."
        - "Status transitions must follow: pending -> active -> completed/cancelled."

    session_aggregate:
      root_entity: "Session"
      child_entities:
        - "DetectionEvent"
        - "RiskSnapshot"
        - "EvidenceItem"
        - "RecruiterReview"
        - "SessionEncryptionKey"
      invariants:
        - "Every session belongs to exactly one Interview."
        - "Active session uniqueness: an interview can have at most one active session at a time."
        - "Integrity score is strictly bounded between [0, 100]."
        - "Risk states strictly conform to closed set: normal, attention, suspicious, high_risk."
        - "Detection events carry monotonically strictly increasing sequence numbers from unified session counter."
        - "Deduplication invariant: (session_id, sequence_number) is strictly unique across events and evidence."
        - "Gating invariant: telemetry messages are rejected with INVALID_SESSION_STATE if consent_given == false."
        - "A session can have at most one RecruiterReview record."
```

## 2. Relational Schema Data Modeling (YAML Primacy)

```yaml
relational_schema_definitions:
  table_recruiters:
    columns:
      id: { type: "UUID", constraints: "PRIMARY KEY DEFAULT gen_random_uuid()" }
      email: { type: "VARCHAR(255)", constraints: "UNIQUE NOT NULL" }
      name: { type: "VARCHAR(255)", constraints: "NOT NULL" }
      password_hash: { type: "VARCHAR(255)", constraints: "NOT NULL (bcrypt cost 12)" }
      created_at: { type: "TIMESTAMPTZ", constraints: "NOT NULL DEFAULT NOW()" }
      updated_at: { type: "TIMESTAMPTZ", constraints: "NOT NULL DEFAULT NOW()" }

  table_interviews:
    columns:
      id: { type: "UUID", constraints: "PRIMARY KEY DEFAULT gen_random_uuid()" }
      recruiter_id: { type: "UUID", constraints: "NOT NULL REFERENCES recruiters(id) ON DELETE CASCADE" }
      title: { type: "VARCHAR(255)", constraints: "NOT NULL" }
      candidate_name: { type: "VARCHAR(255)", constraints: "NOT NULL" }
      candidate_email: { type: "VARCHAR(255)", constraints: "NOT NULL" }
      join_token_hash: { type: "VARCHAR(64)", constraints: "UNIQUE NOT NULL (SHA-256 digest of raw join token)" }
      token_expires_at: { type: "TIMESTAMPTZ", constraints: "NOT NULL" }
      status: { type: "VARCHAR(50)", constraints: "NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','completed','cancelled'))" }
      scheduled_at: { type: "TIMESTAMPTZ", constraints: "NULLABLE" }
      created_at: { type: "TIMESTAMPTZ", constraints: "NOT NULL DEFAULT NOW()" }
      updated_at: { type: "TIMESTAMPTZ", constraints: "NOT NULL DEFAULT NOW()" }

  table_sessions:
    columns:
      id: { type: "UUID", constraints: "PRIMARY KEY DEFAULT gen_random_uuid()" }
      interview_id: { type: "UUID", constraints: "NOT NULL REFERENCES interviews(id) ON DELETE CASCADE" }
      started_at: { type: "TIMESTAMPTZ", constraints: "NOT NULL DEFAULT NOW()" }
      ended_at: { type: "TIMESTAMPTZ", constraints: "NULLABLE" }
      consent_given: { type: "BOOLEAN", constraints: "NOT NULL DEFAULT FALSE" }
      consent_given_at: { type: "TIMESTAMPTZ", constraints: "NULLABLE" }
      system_check_passed: { type: "BOOLEAN", constraints: "NOT NULL DEFAULT FALSE" }
      current_integrity_score: { type: "INTEGER", constraints: "NOT NULL DEFAULT 100 CHECK (current_integrity_score BETWEEN 0 AND 100)" }
      current_risk_state: { type: "VARCHAR(50)", constraints: "NOT NULL DEFAULT 'normal' CHECK (current_risk_state IN ('normal','attention','suspicious','high_risk'))" }
      peak_integrity_score: { type: "INTEGER", constraints: "NOT NULL DEFAULT 100 CHECK (peak_integrity_score BETWEEN 0 AND 100)" }
      event_sequence_number: { type: "INTEGER", constraints: "NOT NULL DEFAULT 0" }
      version: { type: "INTEGER", constraints: "NOT NULL DEFAULT 1 (Optimistic Concurrency Lock)" }
      metadata: { type: "JSONB", constraints: "NOT NULL DEFAULT '{}'::jsonb" }
      created_at: { type: "TIMESTAMPTZ", constraints: "NOT NULL DEFAULT NOW()" }
      updated_at: { type: "TIMESTAMPTZ", constraints: "NOT NULL DEFAULT NOW()" }

  table_detection_events:
    columns:
      id: { type: "UUID", constraints: "PRIMARY KEY DEFAULT gen_random_uuid()" }
      session_id: { type: "UUID", constraints: "NOT NULL REFERENCES sessions(id) ON DELETE CASCADE" }
      sequence_number: { type: "INTEGER", constraints: "NOT NULL CHECK (sequence_number > 0 AND sequence_number <= 2147483647)" }
      event_type: { type: "VARCHAR(100)", constraints: "NOT NULL CHECK (event_type IN ('face_absent','face_returned','multiple_faces','face_orientation_off','tab_hidden','tab_visible','screen_share_stopped','screen_share_started','av_mismatch','audio_silence_extended'))" }
      detector_id: { type: "VARCHAR(100)", constraints: "NOT NULL" }
      client_timestamp: { type: "TIMESTAMPTZ", constraints: "NOT NULL" }
      server_timestamp: { type: "TIMESTAMPTZ", constraints: "NOT NULL DEFAULT NOW()" }
      severity: { type: "VARCHAR(50)", constraints: "NOT NULL CHECK (severity IN ('info','low','medium','high','critical'))" }
      confidence: { type: "FLOAT", constraints: "NOT NULL CHECK (confidence >= 0 AND confidence <= 1)" }
      payload: { type: "JSONB", constraints: "NOT NULL" }
      score_before: { type: "INTEGER", constraints: "NULLABLE" }
      score_after: { type: "INTEGER", constraints: "NULLABLE" }
      created_at: { type: "TIMESTAMPTZ", constraints: "NOT NULL DEFAULT NOW()" }

  table_risk_snapshots:
    columns:
      id: { type: "UUID", constraints: "PRIMARY KEY DEFAULT gen_random_uuid()" }
      session_id: { type: "UUID", constraints: "NOT NULL REFERENCES sessions(id) ON DELETE CASCADE" }
      timestamp: { type: "TIMESTAMPTZ", constraints: "NOT NULL DEFAULT NOW()" }
      integrity_score: { type: "INTEGER", constraints: "NOT NULL CHECK (integrity_score BETWEEN 0 AND 100)" }
      risk_state: { type: "VARCHAR(50)", constraints: "NOT NULL CHECK (risk_state IN ('normal','attention','suspicious','high_risk'))" }
      explanation: { type: "TEXT", constraints: "NOT NULL" }
      contributing_event_id: { type: "UUID", constraints: "NULLABLE REFERENCES detection_events(id) ON DELETE SET NULL" }
      created_at: { type: "TIMESTAMPTZ", constraints: "NOT NULL DEFAULT NOW()" }

  table_evidence_items:
    columns:
      id: { type: "UUID", constraints: "PRIMARY KEY DEFAULT gen_random_uuid()" }
      session_id: { type: "UUID", constraints: "NOT NULL REFERENCES sessions(id) ON DELETE CASCADE" }
      sequence_number: { type: "INTEGER", constraints: "NOT NULL CHECK (sequence_number > 0 AND sequence_number <= 2147483647)" }
      event_id: { type: "UUID", constraints: "NULLABLE REFERENCES detection_events(id) ON DELETE SET NULL" }
      event_sequence_number: { type: "INTEGER", constraints: "NULLABLE CHECK (event_sequence_number > 0)" }
      evidence_type: { type: "VARCHAR(50)", constraints: "NOT NULL CHECK (evidence_type IN ('snapshot','metadata'))" }
      timestamp: { type: "TIMESTAMPTZ", constraints: "NOT NULL" }
      file_path: { type: "VARCHAR(500)", constraints: "NULLABLE" }
      file_size_bytes: { type: "INTEGER", constraints: "NULLABLE CHECK (file_size_bytes <= 51200)" }
      metadata: { type: "JSONB", constraints: "NOT NULL DEFAULT '{}'::jsonb" }
      retention_expires_at: { type: "TIMESTAMPTZ", constraints: "NULLABLE" }
      created_at: { type: "TIMESTAMPTZ", constraints: "NOT NULL DEFAULT NOW()" }

  table_session_encryption_keys:
    columns:
      session_id: { type: "UUID", constraints: "PRIMARY KEY REFERENCES sessions(id) ON DELETE CASCADE" }
      dek_ciphertext: { type: "TEXT", constraints: "NOT NULL (AES-256-GCM session key wrapped with KMS Master Key)" }
      key_algorithm: { type: "VARCHAR(50)", constraints: "NOT NULL DEFAULT 'AES-256-GCM'" }
      created_at: { type: "TIMESTAMPTZ", constraints: "NOT NULL DEFAULT NOW()" }

  table_audit_logs:
    columns:
      id: { type: "UUID", constraints: "PRIMARY KEY DEFAULT gen_random_uuid()" }
      actor_id: { type: "VARCHAR(255)", constraints: "NOT NULL" }
      action: { type: "VARCHAR(100)", constraints: "NOT NULL" }
      target_resource: { type: "VARCHAR(255)", constraints: "NOT NULL" }
      payload_hash: { type: "VARCHAR(64)", constraints: "NOT NULL (SHA-256)" }
      prev_entry_hash: { type: "VARCHAR(64)", constraints: "NOT NULL (Cryptographic Hash Chain)" }
      created_at: { type: "TIMESTAMPTZ", constraints: "NOT NULL DEFAULT NOW()" }

  table_recruiter_reviews:
    columns:
      id: { type: "UUID", constraints: "PRIMARY KEY DEFAULT gen_random_uuid()" }
      session_id: { type: "UUID", constraints: "UNIQUE NOT NULL REFERENCES sessions(id) ON DELETE CASCADE" }
      recruiter_id: { type: "UUID", constraints: "NOT NULL REFERENCES recruiters(id) ON DELETE CASCADE" }
      decision: { type: "VARCHAR(50)", constraints: "NOT NULL CHECK (decision IN ('pass','flag','inconclusive'))" }
      notes: { type: "TEXT", constraints: "NULLABLE" }
      reviewed_at: { type: "TIMESTAMPTZ", constraints: "NOT NULL DEFAULT NOW()" }
      created_at: { type: "TIMESTAMPTZ", constraints: "NOT NULL DEFAULT NOW()" }
```

## 3. Indexing Strategy & Secondary Index Write Amplification Math

```yaml
indexing_strategy:
  index_definitions:
    - name: "idx_interviews_recruiter"
      table: "interviews"
      columns: ["recruiter_id"]
      pattern: "Recruiter dashboard list filtering (WHERE recruiter_id = ?)"
    - name: "idx_interviews_token_hash"
      table: "interviews"
      columns: ["join_token_hash"]
      unique: true
      pattern: "Candidate authentication lookup (WHERE join_token_hash = ?)"
    - name: "idx_events_session_seq"
      table: "detection_events"
      columns: ["session_id", "sequence_number"]
      unique: true
      pattern: "Exactly-once deduplication on client event retransmission"
    - name: "idx_evidence_session_seq"
      table: "evidence_items"
      columns: ["session_id", "sequence_number"]
      unique: true
      pattern: "Exactly-once deduplication on client snapshot retransmission"
    - name: "idx_events_session_time"
      table: "detection_events"
      columns: ["session_id", "server_timestamp DESC"]
      pattern: "Timeline chronological pagination"
    - name: "idx_risk_session"
      table: "risk_snapshots"
      columns: ["session_id", "timestamp ASC"]
      pattern: "Score trajectory timeline chart rendering"

  write_amplification_audit:
    analysis: >
      Each detection event insert incurs 3 index updates: PK btree, unique (session_id, sequence_number),
      and compound (session_id, server_timestamp). At 0.33 QPS per candidate, total write I/O per candidate
      is < 2 KB/sec, well within SSD random write thresholds (10,000+ IOPS).
```

## 4. Database Connection Pool Physics & Sizing

```yaml
connection_pool_physics:
  math_formula: "connections = ((core_count * 2) + effective_spindle_count)"
  deployment_sizing:
    tier_1_two_vcpu_host:
      environment: "Standard Docker Compose host (2 vCPU, 4GB RAM)"
      formula: "((2 cores * 2) + 1 spindle) = 5 connections"
      connection_limit: 5
      pool_timeout_seconds: 2
    tier_2_four_vcpu_host:
      environment: "Dedicated Node.js host (4 vCPU, 8GB RAM)"
      formula: "((4 cores * 2) + 1 spindle) = 9 connections"
      connection_limit: 9
      pool_timeout_seconds: 2

  in_band_load_shedding:
    concurrency_semaphore: "max_concurrent_db_tasks = connection_limit"
    behavior: "When active queries reach connection_limit, incoming requests shed load with HTTP 503 / Retry-After: 1 to prevent queue buildup."
```

## 5. RBAC / ABAC Security Matrix & IDOR Prevention

```yaml
access_control_matrix:
  roles:
    - "Anonymous Candidate"
    - "Active Candidate (Scoped Session Token)"
    - "Authenticated Recruiter (JWT)"

  matrix:
    interviews:
      create: ["Authenticated Recruiter"]
      read_list: ["Authenticated Recruiter (Own interviews only via WHERE recruiter_id = jwt.sub)"]
      read_detail: ["Authenticated Recruiter (Own interviews only)"]
      update: ["Authenticated Recruiter (Pending status only)"]
      cancel: ["Authenticated Recruiter (Own interviews only)"]
    sessions:
      join_create: ["Anonymous Candidate (Valid join token hash required)"]
      read_detail: ["Authenticated Recruiter (Own interviews via interview.recruiter_id == jwt.sub)", "Active Candidate (Own session only via token.sessionId == params.id)"]
      update_state: ["Active Candidate (Own session token required)"]
    events_and_evidence:
      ingest: ["Active Candidate (Scoped session token via WebSocket, verified against active session)"]
      read: ["Authenticated Recruiter (Own interviews only via multi-relation join)"]
      download_file: ["Authenticated Recruiter (Own interviews only)"]
    reviews:
      create_or_update: ["Authenticated Recruiter (Own interviews only)"]
      read: ["Authenticated Recruiter (Own interviews only)"]

  idor_prevention_guards:
    rule: "Every database query on sessions, events, or evidence MUST join through the parent interview and verify recruiter_id == req.user.id"
    violation_handling: "Returns HTTP 404 NOT FOUND instead of 403 to prevent resource enumeration attacks"
```

## 6. API Validation Contracts (Zod Schemas)

```yaml
api_contracts_and_validation:
  zod_schemas:
    login_request:
      email: "z.string().email().max(255)"
      password: "z.string().min(8).max(128)"

    create_interview_request:
      title: "z.string().min(1).max(255)"
      candidateName: "z.string().min(1).max(255)"
      candidateEmail: "z.string().email().max(255)"
      scheduledAt: "z.string().datetime().refine(val => new Date(val) > new Date(), 'Must be in future').optional()"

    join_interview_request:
      joinToken: "z.string().length(64).regex(/^[0-9a-f]{64}$/i, 'Must be valid 64-char hex string')"

    detection_event_message:
      type: "z.literal('detection:event')"
      sequenceNumber: "z.number().int().positive().max(2147483647)"
      payload:
        eventType: "z.enum(['face_absent','face_returned','multiple_faces','face_orientation_off','tab_hidden','tab_visible','screen_share_stopped','screen_share_started','av_mismatch','audio_silence_extended'])"
        detectorId: "z.string().min(1).max(100)"
        timestamp: "z.number().int().positive()"
        severity: "z.enum(['info', 'low', 'medium', 'high', 'critical'])"
        confidence: "z.number().finite().min(0).max(1)"
        payload: "z.record(z.unknown())"

    evidence_snapshot_message:
      type: "z.literal('evidence:snapshot')"
      sequenceNumber: "z.number().int().positive().max(2147483647)"
      payload:
        eventSequenceNumber: "z.number().int().positive().max(2147483647)"
        imageDataUrl: "z.string().max(70000).regex(/^data:image\\/jpeg;base64,[A-Za-z0-9+/=]+$/, 'Must be valid JPEG data URL')"

    session_consent_message:
      type: "z.literal('session:consent')"
      sequenceNumber: "z.number().int().positive().max(2147483647)"
      payload:
        consentGiven: "z.literal(true)"

    session_heartbeat_message:
      type: "z.literal('session:heartbeat')"
      sequenceNumber: "z.number().int().positive().max(2147483647).optional()"
      timestamp: "z.string().datetime()"

    recruiter_review_request:
      decision: "z.enum(['pass', 'flag', 'inconclusive'])"
      notes: "z.string().max(5000).optional()"
```

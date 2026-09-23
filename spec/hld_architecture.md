# High-Level Design (HLD) & Macro System Architecture — InterviewShield

> **Document Type:** LIVING Macro Architecture Specification
> **System Name:** InterviewShield — Multimodal Interview Integrity & Evidence Platform
> **Architecture Standard:** Hybrid YAML Architecture per AGENTS.md Rule 6, Rule 21, Rule 23 & Rule 31
> **Security & Reliability Status:** Fortified via Council of Subagents Adversarial Review

## 1. System Topology & Ingress Architecture

```yaml
macro_topology:
  system_classification: "Monolithic Real-Time Telemetry & Event Ingestion Platform"
  primary_ingress:
    reverse_proxy: "Nginx 1.25 Alpine / TLS 1.3 Termination"
    ports:
      http_https: "80 / 443"
      internal_upstream: "127.0.0.1:3001"
    routing_rules:
      - path: "/"
        destination: "Static React Client Build (Vite output, cached via immutable headers)"
      - path: "/api/*"
        destination: "Express.js REST API Server"
        headers:
          connection: "keep-alive"
          x_forwarded_for: "$remote_addr"
          x_request_id: "$request_id"
      - path: "/ws/*"
        destination: "Node.js WebSocket Server (HTTP Upgrade)"
        headers:
          upgrade: "$http_upgrade"
          connection: "Upgrade"
          read_timeout: "60s"
          send_timeout: "60s"

  trust_boundaries_and_auth_handshake:
    boundary_1_client_to_proxy:
      zone: "Untrusted Public Internet to DMZ"
      controls: "WSS/HTTPS TLS 1.3, CSP Headers, HSTS, Rate Limiting per IP"
    boundary_2_proxy_to_node:
      zone: "DMZ to Application Runtime"
      controls: >
        WebSocket authentication strictly via 'Sec-WebSocket-Protocol' header or initial
        'session:authenticate' frame (never URL query parameters). Strict Origin header
        matching against CLIENT_URL to prevent Cross-Site WebSocket Hijacking (CSWSH).
    boundary_3_node_to_postgres:
      zone: "Application to Data Persistence"
      controls: "Prisma ORM parameterized queries, connection pooling (5 connections on 2-vCPU), non-root DB user"
    boundary_4_node_to_filesystem:
      zone: "Application to Local Evidence Store"
      controls: "Server-constructed UUID filenames, strict path.resolve() containment assertion, zero user-supplied components"
```

## 2. Capacity Estimations, ELU & Latency Budgeting

```yaml
capacity_and_performance_math:
  assumptions:
    target_concurrency: "5 concurrent active interviews (MVP target), peak burst to 25"
    detection_frequency: "2 FPS client sampling rate (500ms cycle)"
    anomaly_event_rate: "Average 1 anomaly event every 15 seconds per active candidate"
    session_duration: "45 minutes (2,700 seconds) per interview"

  equivalent_load_units_elu:
    formula: "ELU = QPS_read + (omega_write * QPS_write) where omega_write = 10.0 for relational DB with B+ tree indexes"
    baseline_concurrency_5_sessions:
      qps_read: "1.0 QPS (recruiter status polls)"
      qps_write: "0.33 QPS (detection events) + 0.33 QPS (session score updates) = 0.66 QPS"
      elu_baseline: "1.0 + (10.0 * 0.66) = 7.6 ELU"
    peak_concurrency_25_sessions:
      qps_read: "5.0 QPS"
      qps_write: "1.67 QPS (events) + 1.67 QPS (score updates) = 3.34 QPS"
      elu_peak: "5.0 + (10.0 * 3.34) = 38.4 ELU"
    microburst_envelope:
      subsecond_burst_coefficient: "k_burst = 3.0"
      instantaneous_peak_ingress: "25.5 QPS (Trivially handled by Node.js event loop capacity of ~1,500 QPS)"
      littles_law_concurrency: "L_peak = 25.5 QPS * 0.050s = 1.28 concurrent in-flight requests"

  unified_physical_storage_multiplier:
    formula: "Phi_storage = ((1 + mu_mvcc) * (1 + beta_idx)) / (rho_fill * (1 - sigma_slack))"
    parameters:
      mu_mvcc: "0.20 (PostgreSQL tuple row header overhead)"
      beta_idx: "0.45 (3 compound B+ tree secondary indexes)"
      rho_fill: "0.70 (8KB page fill factor)"
      sigma_slack: "0.25 (Filesystem emergency reserve margin)"
      effective_multiplier: "Phi_storage >= 5.0x for PostgreSQL storage"
    session_storage_breakdown:
      raw_database_records: "180 events + 15 snapshots + session updates = ~135 KB"
      physical_database_disk: "135 KB * 5.0 = 675 KB"
      raw_evidence_snapshots: "10 snapshots * 25 KB = 250 KB"
      filesystem_block_and_slack: "250 KB / 0.75 = ~333 KB"
      total_physical_storage_per_session: "675 KB (DB) + 333 KB (FS) = ~1.0 MB"
      storage_at_1000_interviews: "1,000 * 1.0 MB = 1.0 GB physical disk space (Not 340 MB)"

  line_rate_bandwidth_budgeting:
    ingress_telemetry_json: "25 sessions * 1.67 QPS * 500 B * 8 * 1.15 = 7.68 Kbps"
    ingress_snapshot_burst: "(25 snapshots * 25 KB / 2s) * 8 * 1.15 = 2.88 Mbps"
    egress_recruiter_streaming: "25 recruiters * 5 QPS * 5 KB * 8 * 1.15 = 230 Kbps"

  client_500ms_frame_lifecycle_budget:
    total_budget: "500ms (2.0 FPS)"
    active_compute:
      canvas_draw: "Max 10ms (ctx.drawImage to reusable offscreen canvas)"
      mediapipe_vision: "Max 150ms (FaceDetector WebAssembly/WebGL)"
      web_audio_rms_fft: "Max 5ms (AnalyserNode frequency evaluation)"
      tab_and_screen_check: "Max 1ms"
      av_correlation: "Max 2ms"
      serialization_buffer: "Max 2ms"
      total_active_compute: "170ms"
    reserved_idle_headroom: "330ms (66% main thread idle headroom)"
    adaptive_degradation:
      tier_1_frame_skip: "If cycle > 400ms, skip immediate next video frame; run audio/tab only"
      tier_2_throttle: "If 3 consecutive cycles > 400ms, throttle to 1 FPS and downscale canvas to 160x120"
      tier_3_recovery: "If 10 consecutive cycles < 120ms, restore 2 FPS and 320x240"
```

## 3. High-Level Component Data Flow & Ingestion Pipeline

```yaml
data_flow_architecture:
  phase_1_edge_capture:
    1_step: "Candidate camera and microphone streams are ingested into local browser memory."
    2_step: "Orchestrator ticks at 500ms intervals, drawing video frame to singleton offscreen canvas."
    3_step: "MediaPipe FaceDetector processes canvas frame, emitting face count, orientation, and mouth movement."
    4_step: "Web Audio AnalyserNode calculates frequency energy and RMS volume."
    5_step: "TabDetector listens to document.visibilityState changes."
    6_step: "ScreenShareDetector monitors MediaStreamTrack.onended."

  phase_2_cross_signal_correlation:
    1_step: "AVCorrelator evaluates 5-second sliding window of mouth movement XOR speech activity."
    2_step: "If sustained mismatch >= 5s detected, emits av_mismatch event with 0.6 confidence."

  phase_3_buffered_transmission:
    1_step: "Events are tagged with client timestamps and monotonically strictly increasing sequence numbers."
    2_step: "Events push to local FIFO EventBuffer."
    3_step: "WebSocket client dispatches 'detection:event' to server via authenticated connection."
    4_step: "If event severity >= medium, low-res (320x240) JPEG is captured and sent as 'evidence:snapshot'."

  phase_4_server_ingestion_and_risk_fusion:
    1_step: "WebSocket connection validates Origin header and authenticates via Sec-WebSocket-Protocol."
    2_step: "Token bucket rate limiter asserts frame conforms to rate limit (<= 20 burst, 5 sustained/sec)."
    3_step: "Payload validated against Zod schema (rejects unlisted event types, bounds sequenceNumber <= 2147483647)."
    4_step: "Idempotency Check: Server checks detection_events(session_id, sequence_number). If duplicate exists, ACK is re-sent and processing immediately HALTS."
    5_step: "Per-Session Serialization: Message enters per-session queue (concurrency = 1) to eliminate lost update races."
    6_step: "EventService persists record into PostgreSQL detection_events table."
    7_step: "RiskEngine is invoked with current session score, event type, confidence, and timestamps."
    8_step: "If score changed, risk_snapshots row is persisted and session.current_integrity_score updated."
    9_step: "Clean-Time Recovery: Heartbeat messages (every 15s) and session:end evaluate elapsed clean time."
    10_step: "Server transmits acknowledgment: { type: 'ack', sequenceNumber: N } back to client."

  phase_5_recruiter_audit:
    1_step: "Recruiter dashboard retrieves session summary via authenticated GET /api/sessions/:id."
    2_step: "Tenant Isolation: Query strictly verifies session.interview.recruiter_id == req.user.id."
    3_step: "Recruiter inspects score gauge, risk badge, and event timeline."
    4_step: "Clicking an event fetches stored snapshot via GET /api/evidence/:id/file with safe server UUID path."
    5_step: "Recruiter records final evaluation decision (Pass / Flag / Inconclusive) with qualitative notes."
```

## 4. Single Point of Failure (SPOF) Analysis & Mitigations

```yaml
spof_audit_and_resilience:
  spof_1_websocket_server_disconnect:
    failure_mode: "Candidate network disconnects or server restarts."
    impact: "Real-time telemetry stream ceases."
    mitigation: >
      Client-side EventBuffer queues up to 500 events offline. WebSocket client implements exponential backoff
      reconnection (1s, 2s, 4s, 8s max). Reconnection triggers automated replay of unacknowledged events.
      Database unique constraints on (session_id, sequence_number) across detection_events and evidence_items
      guarantee exactly-once idempotency with zero duplicate deductions.

  spof_2_client_mediapipe_initialization_failure:
    failure_mode: "WebGL disabled or WebAssembly fails to load on candidate browser."
    impact: "Face detection unavailable."
    mitigation: >
      Pre-interview system check verifies MediaPipe loading before interview consent. If failure occurs mid-interview,
      DetectorOrchestrator gracefully catches error and continues running TabDetector and ScreenShareDetector without crashing.

  spof_3_postgres_connection_exhaustion:
    failure_mode: "Burst of concurrent API queries exhausts database connections."
    impact: "HTTP 500 errors on dashboard and event drop."
    mitigation: >
      Prisma connection pool configured to pool_size = 5 for 2-vCPU deployment with 2s pool_timeout.
      Application async semaphore sheds load in-band with HTTP 503 / Retry-After: 1 when saturated.

  spof_4_filesystem_disk_saturation:
    failure_mode: "Evidence snapshots consume all available host disk space."
    impact: "Server write operations fail."
    mitigation: >
      Low-resolution 320x240 JPEG snapshots cap file size to <= 50 KB. Snapshots only captured on medium+ severity anomalies
      with max 30 snapshots/session quota. A 90-day retention cleanup task purges expired evidence files automatically.
```

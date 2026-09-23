# Production Operations, Telemetry & SRE — InterviewShield

> **Document Type:** LIVING Operations & Reliability Specification
> **System Name:** InterviewShield — Multimodal Interview Integrity & Evidence Platform
> **Architecture Standard:** Hybrid YAML Architecture per AGENTS.md Rule 6, Rule 20, Rule 23 & Rule 31
> **Universal Spec Anchors:** `spec_universal/system_design/06_observability_telemetry_and_reliability_engineering.md` & `07_deployment_operations_governance_and_finops.md`

## 1. Observability, Telemetry & Logging Standards

```yaml
observability_architecture:
  telemetry_standards:
    logging_library: "Pino v9 (Structured JSON output with zero-overhead async logging)"
    log_levels:
      debug: "Detector cycle durations, frame drop events, and heartbeat ping/pong latency"
      info: "Session start/end, candidate join, recruiter login, risk tier transitions, review submissions"
      warn: "Suppressed event deductions (cooldown), detection cycle latency > 400ms, event buffer backlog > 10"
      error: "WebSocket abnormal disconnects (non-1000/1001), database query failures, unhandled exceptions"

  w3c_distributed_tracing:
    header_propagation: "W3C Trace Context (traceparent / tracestate)"
    format: "00-${trace_id}-${span_id}-${trace_flags}"
    spans:
      - span_name: "ws.ingest_event"
        attributes: ["session.id", "event.type", "event.severity", "event.sequence_number"]
      - span_name: "risk.calculate"
        attributes: ["session.id", "score.before", "score.after", "risk.state", "calculation_duration_ms"]
      - span_name: "db.persist_snapshot"
        attributes: ["session.id", "db.system:postgresql", "db.operation:insert"]
      - span_name: "evidence.save_file"
        attributes: ["session.id", "evidence.id", "file.size_bytes", "storage.path"]

  red_and_use_metrics:
    rate:
      - metric: "http_requests_total{method, route, status}"
        description: "Rate of incoming HTTP requests per second"
      - metric: "ws_messages_ingested_total{session_id, event_type}"
        description: "Rate of ingested WebSocket telemetry frames"
    errors:
      - metric: "http_requests_errors_total{method, route, status=~'5..'}"
        description: "Rate of HTTP server 5xx errors"
      - metric: "ws_message_errors_total{session_id, reason}"
        description: "Rate of malformed, unauthorized, or dropped WS events"
    duration:
      - metric: "http_request_duration_seconds{quantile='0.5|0.95|0.99'}"
        description: "HTTP endpoint latency distribution"
      - metric: "risk_calc_duration_seconds{quantile='0.5|0.99'}"
        description: "Execution latency of deterministic risk engine"
    utilization:
      - metric: "process_cpu_usage_ratio"
        description: "Process CPU utilization ratio (0.0 to 1.0 per core)"
      - metric: "process_resident_memory_bytes"
        description: "Resident Set Size (RSS) memory consumption in bytes"
    saturation:
      - metric: "nodejs_eventloop_lag_seconds"
        description: "Node.js libuv event loop latency (target: < 0.050s)"
      - metric: "prisma_pool_wait_queue_length"
        description: "Number of queries waiting for an available DB connection in pool"
```

## 2. Multi-Burn-Rate SRE Alerting (PromQL Rules)

```yaml
multi_burn_rate_alerting:
  slo_definition:
    name: "WebSocket Event Ingestion & Session Availability"
    target: "99.9% success rate over 30-day rolling window"
    error_budget: "0.1% (0.001 failure ratio)"
    low_qps_guard_context: "Baseline 5 sessions = 10 ev/s; Peak 25 sessions = 50 ev/s. Statistical guards prevent spurious alerts on low volume."

  alert_rules:
    page_alert_1hour_burn_14x:
      alert: "InterviewShieldHighErrorRate1Hour"
      expr: >
        (
          sum(rate(ws_message_errors_total[1h]))
          /
          sum(rate(ws_messages_ingested_total[1h]))
        ) > (14.4 * 0.001)
        and
        (
          sum(rate(ws_message_errors_total[5m]))
          /
          sum(rate(ws_messages_ingested_total[5m]))
        ) > (14.4 * 0.001)
        and sum(increase(ws_messages_ingested_total[1h])) >= 50
        and sum(increase(ws_message_errors_total[5m])) >= 3
      for: "2m"
      severity: "critical (Page on-call engineer)"
      annotations:
        summary: "Critical WebSocket error burn rate (14.4x) consuming 2% budget in 1 hour"
        description: "Both 1h and 5m error rates exceed 1.44% with >= 50 total events and >= 3 errors. Immediate intervention required."

    ticket_alert_6hour_burn_6x:
      alert: "InterviewShieldElevatedErrorRate6Hour"
      expr: >
        (
          sum(rate(ws_message_errors_total[6h]))
          /
          sum(rate(ws_messages_ingested_total[6h]))
        ) > (6.0 * 0.001)
        and
        (
          sum(rate(ws_message_errors_total[30m]))
          /
          sum(rate(ws_messages_ingested_total[30m]))
        ) > (6.0 * 0.001)
        and sum(increase(ws_messages_ingested_total[6h])) >= 150
        and sum(increase(ws_message_errors_total[30m])) >= 5
      for: "15m"
      severity: "warning (File high-priority ticket)"
      annotations:
        summary: "Elevated WebSocket error burn rate (6.0x) consuming 5% budget in 6 hours"
        description: "Persistent error degradation across 6h and 30m windows. Schedule investigation."

    disconnect_surge_alert:
      alert: "InterviewShieldSessionDisconnectSurge"
      expr: >
        sum(rate(ws_abnormal_disconnects_total[5m])) > 0.5
        and sum(increase(ws_abnormal_disconnects_total[5m])) >= 5
      for: "1m"
      severity: "warning"
      annotations:
        summary: "Sudden surge in abnormal candidate WebSocket disconnects"
        description: "More than 5 abnormal socket closures in 5 minutes. Check network ingress or server memory."
```

## 3. 3-Tier Health Probes & Zero-502 Rolling Deploys

```yaml
health_probe_contracts:
  design_principle: "Decouple readiness from external dependencies to eliminate cascading fail-stop storms."

  tier_1_liveness_probe:
    endpoint: "GET /api/health/live"
    http_status: 200
    behavior: "Checks Node.js event loop health. Returns { status: 'alive', uptime: process.uptime() } if event loop lag < 100ms."
    initial_delay_seconds: 5
    period_seconds: 10
    timeout_seconds: 2
    failure_threshold: 3

  tier_2_readiness_probe:
    endpoint: "GET /api/health/ready"
    http_status: 200
    behavior: >
      Checks LOCAL process readiness strictly without querying PostgreSQL or performing filesystem I/O.
      Asserts:
      1. Server is listening and initialized.
      2. Server is NOT in graceful shutdown state (isShuttingDown == false).
      3. Process heap memory usage < 90% of max heap.
      Returns 200 { status: 'ready' } if healthy; returns 503 { status: 'draining' } during shutdown or memory exhaustion.
    period_seconds: 5
    timeout_seconds: 2
    failure_threshold: 2

  tier_3_startup_probe:
    endpoint: "GET /api/health/startup"
    http_status: 200
    behavior: >
      Executes on container startup ONLY.
      Verifies:
      1. PostgreSQL database connectivity via 'SELECT 1'.
      2. Prisma migrations are fully applied (no pending migration locks).
      3. Local evidence directory (./evidence) exists and has write permissions.
      Blocks container traffic until initialization completes.
    initial_delay_seconds: 2
    period_seconds: 5
    timeout_seconds: 5
    failure_threshold: 12 # Gives up to 60s for DB container to start

  deep_health_inspection_endpoint:
    endpoint: "GET /api/health/deep"
    auth: "Recruiter / Ops Bearer Token"
    behavior: "Returns comprehensive subsystem status: DB ping latency, connection pool utilization, disk free space, active WebSocket count."

  zero_downtime_rolling_deploy:
    pre_stop_hook: "sleep 15"
    termination_grace_period_seconds: 60
    graceful_shutdown_timeout_seconds: 30
    lifecycle_execution_sequence:
      1_step_ingress_deregistration: "Kubelet marks pod Terminating; Ingress/ALB stops routing new HTTP/WS connections."
      2_step_prestop_sleep: "preStop hook runs 'sleep 15' BEFORE SIGTERM. Pod continues serving existing in-flight requests while routing tables settle."
      3_step_sigterm_intercept: "Process receives SIGTERM; sets isShuttingDown = true (tier_2_readiness immediately returns 503)."
      4_step_stop_accepting_tcp: "HTTP server stops accepting new inbound TCP socket connections."
      5_step_ws_clean_drain: "WebSocket server broadcasts RFC 6455 close frame code 1001 ('Going Away') to all active candidate sessions with 5s drain allowance."
      6_step_inflight_request_drain: "Pending HTTP requests and queued risk engine events complete processing."
      7_step_prisma_pool_disconnect: "Prisma client closes all 5 PostgreSQL connections cleanly via $disconnect()."
      8_step_clean_exit: "Process exits with code 0 well before terminationGracePeriodSeconds (60s) expires."
```

## 4. Governance, FinOps, Dual-Phase Crypto-Shredding & Merkle Logs

```yaml
governance_and_finops:
  storage_lifecycle:
    retention_period: "90 days from session completion"
    daily_cleanup_cron:
      expression: "0 3 * * *" # Daily at 03:00 UTC
      action: "DELETE FROM evidence_items WHERE retention_expires_at < NOW() AND file_path IS NOT NULL;"
      filesystem_sweep: "Safely unlinks orphaned JPEG snapshots from ./evidence/{sessionId}/."

  dual_phase_crypto_shredding:
    architecture: >
      Per universal system design standards (spec_universal/system_design/07_deployment_operations_governance_and_finops.md Section 4),
      PII and evidence items are encrypted with per-session 256-bit AES-GCM data encryption keys (DEK).
    key_management:
      table: "session_encryption_keys (session_id, encrypted_dek, iv, auth_tag, created_at, destroyed_at)"
      master_key: "AES-256 Key Encryption Key (KEK) stored in secure environment variable or KMS"
    erasure_phases:
      phase_1_cryptographic_shredding:
        action: "Zeroize and permanently delete the session DEK record from session_encryption_keys."
        latency: "< 5ms (Instant mathematical erasure across all backups, replicas, and WAL logs)."
        guarantee: "All historical ciphertext becomes undecryptable noise even if database dumps are compromised."
      phase_2_physical_and_relational_erasure:
        action: "Hard delete JPEG snapshot files from filesystem; hard delete detection_events and risk_snapshots; scrub candidate PII."
        sql_mutation: "UPDATE interviews SET candidate_name = 'ERASED', candidate_email = 'erased@gdpr.local' WHERE id = :id;"
        evidence_removal: "fs.unlinkSync on all matching file paths with path containment verification."

  tamper_evident_merkle_audit_log:
    table: "audit_logs"
    schema:
      id: "UUID PK"
      sequence_number: "BIGINT AUTO_INCREMENT UNIQUE"
      previous_record_hash: "VARCHAR(64) NOT NULL (SHA-256 of prior log entry)"
      action: "VARCHAR(64) NOT NULL (e.g., 'CANDIDATE_DATA_ERASURE', 'RECRUITER_VERDICT_SUBMITTED')"
      operator_id: "UUID NOT NULL"
      timestamp: "TIMESTAMP WITH TIME ZONE NOT NULL"
      payload_hash: "VARCHAR(64) NOT NULL (SHA-256 of action details)"
      record_hash: "VARCHAR(64) NOT NULL (SHA-256(sequence + previous_hash + action + operator_id + timestamp + payload_hash))"
    guarantee: "Cryptographic hash chaining ensures any retroactive tampering or deletion is instantly detectable."

  gdpr_candidate_deletion_request:
    endpoint: "POST /api/governance/candidate-data-erasure"
    auth: "Master Recruiter / Admin JWT"
    zod_schema: "{ candidate_email: z.string().email(), confirmation: z.literal('PERMANENTLY_DELETE') }"
    execution_pipeline:
      1_step: "Authenticate caller and assert ADMIN role."
      2_step: "Execute Phase 1 Cryptographic Shredding on all matching sessions."
      3_step: "Execute Phase 2 Physical Snapshot and Relational Data Erasure."
      4_step: "Append entry to tamper-evident audit_logs with operator ID and timestamp."
      5_step: "Return HTTP 200 { status: 'erased', sessions_affected: count }."

  finops_cost_profile:
    single_host_deployment:
      compute: "1x Hetzner CX22 or 1x AWS t3.medium (2 vCPU, 4GB RAM) = ~$5 - $15/month"
      database: "Local Docker PostgreSQL 16 container with local NVMe volume = $0 additional"
      storage: "NVMe local storage (~1.0 MB physical storage per completed session) = Negligible"
      bandwidth: "Candidate JSON events (~1.5 KB/s) + sparse snapshots (250 KB/session) = Negligible (< $1/month)"
      total_monthly_infrastructure_cost: "< $20 / month for 1,000 interviews"
```

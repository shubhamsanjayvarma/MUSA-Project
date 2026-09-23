# Product Requirements Document (PRD) — InterviewShield

> **Document Type:** ANCHOR Product Specification
> **System Name:** InterviewShield — Multimodal Interview Integrity & Evidence Platform
> **Architecture Standard:** Hybrid YAML Architecture per AGENTS.md Rule 6, Rule 21 & Rule 31
> **Security & Reliability Status:** Fortified via Council of Subagents Adversarial Review

## 1. Product Summary & Strategic Intent

```yaml
product_metadata:
  product_name: "InterviewShield"
  domain: "AI/ML Behavioral Verification & Remote Interview Integrity"
  target_event: "MUSA CodeX 2026 Round 2 — Problem Statement CX0104 (The Interview Body Double)"
  team: "Harrington's Tech"
  lifecycle_state: "ANCHOR (Frozen for V1 Release)"
  one_sentence_synthesis: >
    InterviewShield captures client-side multimodal behavioral telemetry during remote technical interviews,
    calculates a deterministic and explainable integrity score, records timestamped event evidence,
    and empowers human recruiters to review objective signals rather than opaque algorithmic verdicts.
```

## 2. Target Personas & Current Alternatives

```yaml
personas_and_alternatives:
  target_personas:
    candidate:
      role: "Job Applicant / Interviewee"
      context: "Accessing interview via web browser on desktop/laptop"
      primary_goal: "Complete technical screen with minimum friction, clear consent, and zero privacy violations"
      friction_points: "Unexplained failures, intrusive monitoring, continuous video surveillance fears, unfair lockouts"
    recruiter:
      role: "Technical Recruiter / Hiring Manager"
      context: "Managing candidate evaluation pipelines and post-interview audits"
      primary_goal: "Verify session authenticity, inspect anomaly moments with proof, and make defensible hiring decisions"
      friction_points: "Interview proxies, proxy candidates, off-screen cheating, unverifiable black-box AI scores"

  current_alternatives:
    continuous_recording:
      description: "Full-session video/audio upload to cloud storage"
      deficiencies: "Excessive cloud storage costs, high bandwidth, severe GDPR/privacy violations, recruiter review fatigue"
    black_box_ai_proctoring:
      description: "Opaque ML classifiers emitting binary pass/fail cheating labels"
      deficiencies: "High false positives, unexplainable decisions, legal liability, bias against neurodivergent applicants"
    manual_proctoring:
      description: "Human proctor observing via webcam in real-time"
      deficiencies: "Unscalable, expensive, creates candidate anxiety, human proctor distraction"
```

## 3. Product Principles & Non-Negotiables

```yaml
product_principles:
  1_human_in_the_loop:
    rule: "AI flags. Humans review."
    mandate: "The system NEVER executes an automated disqualification or cheating verdict."
  2_moment_based_telemetry:
    rule: "Flag the moment, not the person."
    mandate: "Events are timestamped behavioral observations with duration and evidence, not moral assessments."
  3_explainable_over_accurate:
    rule: "Explainability takes precedence over black-box complexity."
    mandate: "Every score deduction must have a human-readable mathematical deduction and justification."
  4_privacy_by_design:
    rule: "Local edge processing with zero continuous media persistence."
    mandate: "Raw camera and microphone feeds never leave candidate memory; only low-res event snapshots and events transmit."
  5_honest_capability_bounds:
    rule: "Strict claim boundaries."
    mandate: "Never claim deepfake detection, voice biometrics, or unvalidated ML accuracy percentages."
  6_consent_gating_invariant:
    rule: "Strict consent prerequisite."
    mandate: "No session is valid or active without verified server consent; unconsented telemetry is rejected."
```

## 4. V1 Goals vs. Non-Goals

```yaml
scope_boundaries:
  v1_goals:
    - "Deliver a robust single-host architecture with sub-second WebSocket event ingestion"
    - "Client-side detection of face count, presence, orientation deviation, tab switches, audio silence, and screen-share drops"
    - "Heuristic audio-visual consistency checking between mouth bounding variance and speech activity"
    - "Deterministic 0-100 integrity scoring engine with configurable cooldowns and clean-time recovery"
    - "Recruiter dashboard with interactive score gauge, chronological timeline, evidence snapshots, and review controls"
    - "Cryptographic single-use join tokens (SHA-256 hashed at rest) and explicit timestamped consent recording"
    - "Session resumption resilience ensuring accidental disconnections do not permanently lock out valid candidates"

  v1_non_goals:
    - "Live real-time video streaming to recruiter (continuous WebRTC mesh)"
    - "Deepfake detection or generative video artifact classification"
    - "Voice biometrics, speaker verification, or audio transcription"
    - "Hardware virtual camera detection (OS-level driver inspection)"
    - "Dense 468-point 3D facial landmark mesh calculation"
    - "Multi-tenant enterprise organization billing or SSO/SAML integration"
    - "Mobile browser support (desktop Chrome/Edge only)"
    - "Automated candidate rejection or disqualification workflows"
```

## 5. Functional Requirements & Acceptance Criteria

```yaml
functional_requirements:
  candidate_lifecycle:
    FR_C01_join_token_auth:
      description: "Candidate authenticates via unique cryptographic join URL"
      acceptance_criteria:
        given: "A valid, unexpired join token in the URL"
        when: "Candidate opens the link in browser"
        then: "System validates token hash, establishes session record within transaction, and presents system check"
      edge_behavior: "Expired tokens return HTTP 410; re-joins of active sessions resume without duplicate sessions"

    FR_C02_system_precheck:
      description: "Automated hardware verification before interview entry"
      acceptance_criteria:
        given: "Candidate on system check screen"
        when: "Browser requests camera, microphone, and screen share permissions"
        then: "All streams are verified, MediaPipe loads into WebAssembly/WebGL, and proceed button activates"
      edge_behavior: "Missing hardware displays explicit empty state guidance to connect peripherals and rescan"

    FR_C03_explicit_consent:
      description: "Mandatory informed consent recording"
      acceptance_criteria:
        given: "Passed system check"
        when: "Candidate checks explicit opt-in box and clicks 'Begin Interview'"
        then: "Server persists consent_given = true with UTC timestamp before any monitoring loop starts"
      edge_behavior: "Monitoring loop physically remains inactive until server acknowledges consent"

    FR_C04_local_detection_loop:
      description: "2 FPS client-side signal sampling with adaptive throttle"
      acceptance_criteria:
        given: "Active interview session"
        when: "Orchestrator ticks every 500ms"
        then: "Frames are evaluated for face presence, orientation, audio activity, and tab visibility"
      edge_behavior: "If frame processing exceeds 400ms, subsequent frame capture is skipped to maintain UI responsiveness"

    FR_C05_event_buffering_and_recon:
      description: "Offline event resilience"
      acceptance_criteria:
        given: "Temporary WebSocket network drop"
        when: "Detectors emit events during disconnection"
        then: "Events buffer in FIFO queue with sequence numbers and replay on reconnection"
      edge_behavior: "Buffer capped at 500 events; server deduplicates on unique (session_id, sequence_number)"

  recruiter_lifecycle:
    FR_R01_interview_management:
      description: "Recruiter creates and manages interviews"
      acceptance_criteria:
        given: "Authenticated recruiter"
        when: "Submitting candidate details and title"
        then: "Server generates raw join token, stores SHA-256 hash in DB, and returns join URL"
      edge_behavior: "Rejects invalid email formats or past scheduled dates"

    FR_R02_session_telemetry_inspection:
      description: "Comprehensive session audit dashboard"
      acceptance_criteria:
        given: "Completed or active candidate session"
        when: "Recruiter accesses session detail view"
        then: "Integrity score gauge, categorical risk state, and event timeline render within 2 seconds"
      edge_behavior: "Empty sessions display clean zero-state without broken UI elements"

    FR_R03_evidence_snapshot_audit:
      description: "Inspection of event-triggered frame captures"
      acceptance_criteria:
        given: "Event with associated evidence record"
        when: "Recruiter clicks timeline event row"
        then: "Drawer expands displaying 320x240 JPEG snapshot, timestamp, and detector confidence"
      edge_behavior: "Missing snapshot displays explanatory placeholder without breaking view"

    FR_R04_human_review_decision:
      description: "Recruiter records final evaluation decision"
      acceptance_criteria:
        given: "Recruiter auditing session"
        when: "Selecting Pass, Flag, or Inconclusive with notes"
        then: "Server persists review record linked to session and recruiter ID"
      edge_behavior: "If decision is 'Flag', notes field requires minimum 10 characters"

  detection_signals_and_scoring_matrix:
    canonical_signals:
      - name: "face_absent"
        detector: "face_detector"
        trigger: "No face detected for >= 3 consecutive seconds (6 frames)"
        severity: "medium"
        weight: -5
        cooldown_seconds: 10
        capture_snapshot: true
      - name: "face_returned"
        detector: "face_detector"
        trigger: "Face re-detected after face_absent event"
        severity: "info"
        weight: 0
        cooldown_seconds: 0
        capture_snapshot: false
      - name: "multiple_faces"
        detector: "face_detector"
        trigger: ">= 2 faces detected in camera frame"
        severity: "high"
        weight: -15
        cooldown_seconds: 30
        capture_snapshot: true
      - name: "face_orientation_off"
        detector: "face_detector"
        trigger: "Bounding box center deviates > 30% from center for >= 5 seconds"
        severity: "low"
        weight: -3
        cooldown_seconds: 15
        capture_snapshot: true
      - name: "tab_hidden"
        detector: "tab_detector"
        trigger: "document.visibilityState changes to 'hidden'"
        severity: "high"
        weight: -10
        cooldown_seconds: 5
        capture_snapshot: false
      - name: "tab_visible"
        detector: "tab_detector"
        trigger: "document.visibilityState changes to 'visible'"
        severity: "info"
        weight: 0
        cooldown_seconds: 0
        capture_snapshot: false
      - name: "screen_share_stopped"
        detector: "screen_detector"
        trigger: "Screen share MediaStreamTrack emits 'ended' event"
        severity: "critical"
        weight: -20
        cooldown_seconds: 0
        capture_snapshot: false
      - name: "screen_share_started"
        detector: "screen_detector"
        trigger: "Screen share track successfully initiated"
        severity: "info"
        weight: 0
        cooldown_seconds: 0
        capture_snapshot: false
      - name: "av_mismatch"
        detector: "av_correlator"
        trigger: "Speech audio active without mouth movement (or vice versa) for >= 5 seconds"
        severity: "medium"
        weight: -8
        cooldown_seconds: 20
        capture_snapshot: true
      - name: "audio_silence_extended"
        detector: "audio_detector"
        trigger: "No speech-level audio detected for >= 30 consecutive seconds"
        severity: "low"
        weight: -2
        cooldown_seconds: 60
        capture_snapshot: false

  score_recovery_and_thresholds:
    initial_score: 100
    recovery_rate: "+2 points per clean minute"
    recovery_trigger_points:
      - "Evaluated on incoming session:heartbeat WebSocket frames (every 15s)"
      - "Evaluated deterministically upon session finalization (session:end)"
      - "Evaluated on score reads (GET /api/sessions/:id/risk)"
    recovery_ceiling: "Capped at peak_integrity_score (default 100)"
    risk_state_thresholds:
      normal: "80 - 100 (Green)"
      attention: "60 - 79 (Yellow)"
      suspicious: "40 - 59 (Orange)"
      high_risk: "0 - 39 (Red)"
```

## 6. Success Metrics & Performance SLIs

```yaml
success_metrics_and_slis:
  system_performance:
    detection_cycle_latency:
      target: "<= 500ms (170ms compute + 330ms idle)"
      measurement: "performance.now() per 2 FPS cycle"
    event_ingestion_latency:
      target: "< 1000ms"
      measurement: "server_timestamp minus client_timestamp"
    risk_calculation_duration:
      target: "< 50ms"
      measurement: "Pure function execution time in Node.js event processor"
    dashboard_load_time:
      target: "< 2000ms"
      measurement: "Browser DOMContentLoaded on interview list"

  product_efficacy:
    false_positive_resilience:
      target: "100% of temporary sneezing/water drinking absences (< 3s) ignored by debounce"
    auditability:
      target: "100% of score deductions accompanied by human-readable explanation"
    data_retention_compliance:
      target: "Zero evidence files retained beyond 90-day expiration window"
```

## 7. Assumptions, Technical Risks & Mitigation

```yaml
assumptions_and_risks:
  assumptions:
    - "Candidate runs modern Chromium-based browser supporting MediaPipe WebAssembly and WebGL"
    - "Candidate possesses functional webcam and microphone producing at least 720p at 15fps"
    - "Single-host deployment with PostgreSQL 16 is sufficient for hackathon judging loads (1-5 concurrent sessions)"

  risks_and_mitigations:
    risk_1_browser_hardware_variance:
      risk: "Low-end hardware causes high inference latency in MediaPipe FaceDetector"
      mitigation: "Pre-interview system check benchmarks inference speed; adaptive degradation throttles to 1 FPS / 160x120 if > 400ms"
    risk_2_network_jitter:
      risk: "Candidate WiFi instability drops WebSocket connection during critical moments"
      mitigation: "Client-side EventBuffer queues up to 500 events and replays with sequence numbers upon auto-reconnect"
    risk_3_false_accusations:
      risk: "Recruiter misinterprets attention flags as definitive cheating"
      mitigation: "UI explicitly labels scores as 'Behavioral Integrity Index' with prominent 'AI Flags, Humans Review' header"
```

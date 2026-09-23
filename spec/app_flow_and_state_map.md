# App Flow & State Map — InterviewShield

> **Document Type:** LIVING Interaction Specification
> **System Name:** InterviewShield — Multimodal Interview Integrity & Evidence Platform
> **Architecture Standard:** Hybrid YAML Architecture per AGENTS.md Rule 6, Rule 21 & Rule 31
> **Security & Reliability Status:** Fortified via Council of Subagents Adversarial Review

## 1. Route Inventory & Route Guard Hierarchy

```yaml
route_inventory:
  candidate_experience:
    - path: "/join/:token"
      component: "<JoinGatePage />"
      allowed_roles: ["Anonymous Candidate"]
      guards: ["TokenFormatGuard", "TokenExpiryGuard"]
      purpose: "Validates token and branches to system check or completed screen"

    - path: "/system-check/:sessionId"
      component: "<SystemCheckPage />"
      allowed_roles: ["Candidate with Valid Session"]
      guards: ["SessionActiveGuard", "PrerequisiteCheckGuard"]
      purpose: "Hardware permission validation (Camera, Mic, Screen Share, MediaPipe WebGL)"

    - path: "/consent/:sessionId"
      component: "<ConsentPage />"
      allowed_roles: ["Candidate Passed System Check"]
      guards: ["SystemCheckPassedGuard"]
      purpose: "Informed consent reading and explicit opt-in checkbox recording"

    - path: "/interview/:sessionId"
      component: "<InterviewPage />"
      allowed_roles: ["Candidate with Consent Given"]
      guards: ["ConsentGivenGuard", "SessionNotEndedGuard"]
      purpose: "Live interview interface, local video preview, status bar, detection loop"

    - path: "/completion/:sessionId"
      component: "<CompletionPage />"
      allowed_roles: ["Candidate with Finished Session"]
      guards: ["None"]
      purpose: "Confirmation of successful session completion and closure"

  recruiter_experience:
    - path: "/login"
      component: "<LoginPage />"
      allowed_roles: ["Anonymous Recruiter"]
      guards: ["RedirectIfAuthenticatedGuard"]
      purpose: "Recruiter credentials authentication and JWT acquisition"

    - path: "/dashboard"
      component: "<DashboardPage />"
      allowed_roles: ["Authenticated Recruiter"]
      guards: ["RequireJwtAuthGuard"]
      purpose: "High-level overview of scheduled, active, and completed interviews"

    - path: "/dashboard/:interviewId"
      component: "<SessionDetailPage />"
      allowed_roles: ["Authenticated Recruiter"]
      guards: ["RequireJwtAuthGuard", "InterviewOwnershipGuard"]
      purpose: "Deep-dive session inspection: score gauge, risk badge, event timeline, review submission"

    - path: "/dashboard/:interviewId/evidence/:eventId"
      component: "<EvidenceModal />"
      allowed_roles: ["Authenticated Recruiter"]
      guards: ["RequireJwtAuthGuard", "InterviewOwnershipGuard"]
      purpose: "Full-resolution view of event snapshot with detector metadata and confidence"
```

## 2. The Six Core UI States Across All 9 Screens

```yaml
screen_state_matrix:
  screen_1_join_gate_page:
    ideal_populated_state: "Branded InterviewShield welcome card showing interview title, recruiter organization, and 'Start Verification' CTA."
    loading_state: "Centered spinner with text: 'Verifying invitation token with security gateway...'"
    empty_state: "Zero-state card: 'No active assessment attached to this link. Check invitation email for updated URL.'"
    validation_state: "Inline warning: 'Malformed link. Join tokens must be 64-character hexadecimal strings.'"
    system_error_state: "Red alert card: 'Invitation expired (HTTP 410). Please contact recruiter to generate a new interview token.'"
    offline_state: "Amber warning: 'Internet connection required to validate interview access.'"

  screen_2_system_check_page:
    ideal_populated_state: "Green checkmarks on Camera, Microphone, Screen Share, and Browser compatibility. 'Continue to Consent' button enabled in accent blue."
    loading_state: "Pulsing skeleton chips for each hardware device test; animated spinner next to 'Benchmarking MediaPipe Face Detector...'"
    empty_state: "Peripheral disconnected card: 'No video or audio input devices detected. Please connect a webcam/microphone and click \"Rescan Hardware\".'"
    validation_state: "Inline warning banner: 'Screen sharing must share entire screen or application window to proceed.'"
    system_error_state: "Red alert box: 'Camera access denied by browser permissions. Please click the lock icon in the URL bar to enable camera access.'"
    offline_state: "Overlay banner: 'Network connection lost. Re-establishing link before testing hardware.'"

  screen_3_consent_page:
    ideal_populated_state: "Two-column consent disclosure card (What We Monitor vs What We Never Store) with active opt-in checkbox and 'Begin Interview' CTA."
    loading_state: "Skeleton loading bars over disclosure paragraphs while fetching organization retention policy."
    empty_state: "Notice card: 'Consent parameters already recorded for this session. Redirecting to live interview...'"
    validation_state: "Red hint below CTA: 'You must check the informed consent acknowledgment before proceeding.'"
    system_error_state: "Alert banner: 'Failed to record consent record on server. [Retry Consent Submission]'"
    offline_state: "Banner: 'Network unavailable. Consent cannot be recorded offline.'"

  screen_4_interview_page_candidate:
    ideal_populated_state: "Mirrored local camera preview in 16:9 box. Top status bar showing session timer, 'Monitoring Active' green indicator, and 'End Interview' button."
    loading_state: "Subtle spinner in top-right status bar indicating WebSocket connection establishment."
    empty_state: "Dark video card: 'Camera stream disconnected or shutter closed. Check physical camera toggle to restore feed.'"
    validation_state: "Toast banner if candidate switches tab: 'Notice: You navigated away from the interview tab.'"
    system_error_state: "Red badge on status bar: 'Detection Engine Error — Video stream interrupted. Attempting reconnection.'"
    offline_state: "Amber indicator: 'Offline: Events buffering locally (N queued). Reconnecting automatically...'"

  screen_5_completion_page:
    ideal_populated_state: "Clean confirmation card: 'Interview session completed successfully. All monitoring has ceased. You may now close this window.'"
    loading_state: "Submitting final session state with animated progress circle."
    empty_state: "Notice: 'No active session data to finalize.'"
    validation_state: "N/A"
    system_error_state: "Notice: 'Session finalized with local sync warning. Recruiter has been notified of completion.'"
    offline_state: "Notice: 'Session ended locally. Final telemetry will sync when connection returns.'"

  screen_6_login_page_recruiter:
    ideal_populated_state: "Minimalist login card with Email, Password inputs, and 'Sign In to Console' primary CTA."
    loading_state: "Button shows loading spinner; inputs disabled during bcrypt authentication handshake."
    empty_state: "Clear input fields with autofocus on email input."
    validation_state: "Inline validation: 'Please enter a valid email address' or 'Password is required.'"
    system_error_state: "Red banner above form: 'Invalid email or password (HTTP 401).'"
    offline_state: "Banner: 'Cannot authenticate while offline. Check internet connection.'"

  screen_7_recruiter_dashboard:
    ideal_populated_state: "Sortable data table of interviews showing Title, Candidate Name, Status, Scheduled Date, and Integrity Score pill badge."
    loading_state: "Table body rendered with 5 shimmering gray skeleton rows."
    empty_state: "Centered zero-state graphic with text: 'No interviews created yet. Click \"Create Interview\" to invite your first candidate.' with primary CTA."
    validation_state: "Create interview modal displays inline error: 'candidate_email must be a valid email address.'"
    system_error_state: "Red card at top of table: 'Failed to fetch interview roster. Server returned HTTP 500. [Retry Button]'"
    offline_state: "Gray banner: 'Working in offline mode. Displaying cached interview roster.'"

  screen_8_recruiter_session_detail:
    ideal_populated_state: "Left column: 0-100 Integrity Gauge with color-coded risk state. Center column: Chronological event timeline grouped by minute with clickable snapshot rows. Right column: Human Review submission panel."
    loading_state: "Circular skeleton for score gauge; shimmer timeline list with placeholder severity dots."
    empty_state: "Timeline displays: 'No anomaly events detected during this session. Candidate maintained full behavioral integrity.' Gauge stays at 100."
    validation_state: "Submit Review button disabled with hint: 'Notes are mandatory when selecting \"Flag for Scrutiny\".'"
    system_error_state: "Full-width alert: 'Session telemetry data unavailable. Database record may be corrupted or in progress.'"
    offline_state: "Timeline snapshot thumbnails disabled with 'Connect to network to load evidence assets.'"

  screen_9_evidence_modal:
    ideal_populated_state: "Modal dialog displaying 320x240 snapshot frame with timestamp, detector ID, confidence chip, and privacy blur toggle."
    loading_state: "Shimmer placeholder image box with 'Decrypting evidence asset...'"
    empty_state: "Card: 'No image snapshot associated with this telemetry event.'"
    validation_state: "N/A"
    system_error_state: "Red alert: 'Evidence asset missing or purged under 90-day retention schedule.'"
    offline_state: "Notice: 'Evidence images cannot be retrieved while offline.'"
```

## 3. Critical User Journey Walkthroughs

```yaml
user_journeys:
  journey_1_candidate_entry_to_interview:
    1_step: "Candidate clicks join link: https://interviewshield.dev/join/a1b2c3d4e5f6..."
    2_step: "JoinGatePage verifies token against /api/interviews/join, receiving sessionId and sessionToken."
    3_step: "Candidate transitions to /system-check/:sessionId. Browser requests getUserMedia and getDisplayMedia."
    4_step: "Canvas context verifies WebGL support and loads MediaPipe FaceDetector WASM binary."
    5_step: "Candidate clicks 'Continue to Consent' -> Navigates to /consent/:sessionId."
    6_step: "Candidate reads what is monitored vs not stored, checks explicit opt-in, clicks 'Begin Interview'."
    7_step: "Client sends 'session:consent' via WebSocket. Server commits session.consent_given = true."
    8_step: "Candidate arrives at /interview/:sessionId. DetectorOrchestrator starts 2 FPS detection loop."

  journey_2_anomaly_detection_and_recruiter_audit:
    1_step: "During interview, candidate switches browser tab for 4 seconds."
    2_step: "TabDetector catches document.visibilityState == 'hidden', emitting tab_hidden (severity: high, confidence: 1.0)."
    3_step: "EventBuffer transmits event via WSS to server. Server persists record to detection_events."
    4_step: "RiskEngine applies -10 point deduction. Score decreases 100 -> 90. RiskState remains NORMAL."
    5_step: "Two minutes later, an unauthorized second person leans into camera frame for 3 seconds."
    6_step: "FaceDetector detects 2 faces, emitting multiple_faces (severity: high, confidence: 0.92). Canvas snapshot is captured (320x240 JPEG)."
    7_step: "Client transmits detection event and evidence:snapshot. Server persists event and stores snapshot to disk."
    8_step: "RiskEngine applies -15 deduction: 90 -> 75. RiskState transitions to ATTENTION. RiskSnapshot persisted."
    9_step: "Recruiter loads /dashboard/:interviewId. Sees score gauge at 75 (yellow) with ATTENTION badge."
    10_step: "Recruiter clicks 'multiple_faces' row in timeline. Snapshot modal opens showing two faces with bounding boxes."
    11_step: "Recruiter selects 'Flag for Scrutiny', enters notes: 'Unidentified individual appeared at 10:24', and submits."
```

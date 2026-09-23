# Engineering Implementation Plan: InterviewShield

> **System Name:** InterviewShield — Multimodal Real-Time Interview Integrity & Body Double Detection Platform
> **Hackathon Track:** MUSA CodeX 2026 AI & ML Hackathon (Problem Statement CX0104: "The Interview Body Double")
> **Team:** Harrington's Tech (Shubham Varma, Pratik Yadav, Piyush Tiwari, Tarak Desai)
> **Compliance Standard:** Hybrid YAML Architecture per `.agents/AGENTS.md` Rule 6, Rule 8, Rule 12, Rule 15, Rule 20, Rule 21, Rule 23, Rule 27, Rule 30, Rule 31, and Rule 34.
> **Design Grounding:** `assets/Design (1).md`, `assets/general-team-settings-dashboard.tailwind-v4.Woblo.css`, `assets/general-team-settings-dashboard.shadcn.Woblo.css`, `assets/general-team-settings-dashboard.dtcg.Woblo.tokens.json`, `DESIGN.md`.
> **Source Grounding:** `spec/CORE/CodeX 2026 Presentation Sample.pptx.pdf`, `spec/prd.md`, `spec/hld_architecture.md`, `spec/backend_design_and_data_model.md`, `spec/operations_telemetry_and_sre.md`.

Granular, dependency-ordered execution milestones mapping all architectural specifications, presentation requirements, professional frontend design tokens from `assets/`, and detection pipelines into verified, zero-guesswork implementation tiers.

---

## 1. Safety Guardrails & Operational Invariants

Strict operational constraints governing all milestone execution activities per Rule 11, Rule 23, Rule 24, Rule 29, and Rule 30.

```yaml
safety_guardrails_and_operational_invariants:
  1_destructive_command_prohibition:
    mandate: "Zero destructive filesystem or database commands (rm -rf, Remove-Item -Force, DROP DATABASE, format)."
    enforcement: "Protected by .agents/scripts/destructive_command_guard.py via .agents/hooks.json."
  2_atomic_reversibility:
    mandate: "Every migration, configuration, and code deployment must provide an automated, deterministic rollback script."
    strategy: "Expand-Contract database DDL migrations with backward-compatible column aliasing and down-migration files."
  3_vcs_and_git_authorization:
    mandate: "All modifications remain strictly in local working directories. Commits, branch operations, and PRs require explicit user authorization (Rule 24)."
  4_foundation_immutability:
    mandate: "spec_universal/ and .agents/AGENTS.md are physically immutable and protected against commits by .githooks/pre-commit (Rule 30)."
  5_strict_type_and_linter_safety:
    mandate: "TypeScript strict mode (noUnusedLocals, TS6133 zero-unused imports per Rule 19); all JSX tests use .tsx extension (Rule 28)."
  6_no_force_commits:
    mandate: "Bypassing pre-commit hooks via --no-verify or --force is strictly prohibited under all circumstances (Rule 11)."
  7_ci_performance_headroom_rule:
    mandate: "Per Rule 15, performance tests must provide 3x-5x headroom over local speeds for CI runner stability."
    threshold_policy: "Assert execution times against generous upper bounds (e.g. 50ms local -> 150ms-250ms CI assert)."
  8_anti_monolithic_planning_mandate:
    mandate: "Monolithic execution plans covering entire milestones in one broad stroke are STRICTLY FORBIDDEN."
    rule: "For every subsection within each milestone, the agent MUST author a dedicated Sub-Implementation Plan and 7-Layer Architectural Plan with embedded 4-tier TDD before touching code."
  9_anti_generic_ai_design_mandate:
    mandate: "Strict compliance with assets/ design tokens and DESIGN.md across all candidate and recruiter views. Zero generic AI slop."
    rule: "Adhere to the professional design system in assets/ (OKLCH color space, subpixel 1px border rings, 11px-14px compact typography scale, Geist/Inter fonts, Radix primitives)."
  10_zero_raw_video_streaming_privacy_invariant:
    mandate: "Raw webcam frames and audio streams must NEVER be transmitted over network sockets or saved to disk."
    rule: "Edge AI inference runs in the candidate's browser (WebAssembly/WebGL). Only discrete telemetry events and sparse, downscaled violation snapshots (< 50KB) are transmitted."
```

> [!WARNING]
> ### CRITICAL EXECUTION GUARD: PROFESSIONAL FRONTEND STANDARDS & ANTI-GENERIC-AI CODEX (`assets/` & `DESIGN.md`)
> All frontend components across Candidate Gateways (Milestone 6) and the Recruiter Command Center (Milestone 7) must mirror the professional engineering quality cataloged in `assets/`. Engineers and subagents are **STRICTLY PROHIBITED** from using generic AI templates, purple gradient blobs, uncalibrated dark mode, or bloated oversized cards.

```yaml
frontend_design_bible_mistake_prevention_matrix:
  category_1_layout_mistakes:
    prohibited_generic_ai_slop:
      - "3-Column Identical Feature Cards: Repeating cards with identical heights, centered circle icons, and generic text."
      - "Floating 3D Glass Cubes/Spheres: Aimless isometric decorative shapes in hero sections without semantic purpose."
      - "Centered Hero Monotony: Centered H1 + subtitle + dual CTA button layout on every single view."
      - "Unconstrained Text Measure: Paragraphs spanning across full viewport width (> 75ch), causing severe eye strain."
    professional_assets_standard:
      - "Asymmetric Bento Grids: Variable-width inspection layouts (e.g., 2/3 live video monitor + 1/3 real-time integrity telemetry rail)."
      - "Functional Media & Real Telemetry: Replace decorative shapes with live SVG radial score gauges, audio decibel meters, and forensic landmark meshes."
      - "Left-Aligned Editorial Hierarchy: Anchor headlines with clear typographic contrast, monospace status indicators, and contextual metadata."
      - "Strict Reading Measure: Enforce max-width: 65ch (60-72 characters per line) on all body copy and instructions."

  category_2_color_and_surface_mistakes:
    prohibited_generic_ai_slop:
      - "Purple/Indigo Radial Glow: Blurry radial gradients (#6366F1 / #8B5CF6) centered behind hero cards."
      - "Pitch-Black Monoliths: Pure #000000 background without elevation layers, surface hierarchy, or borders."
      - "Vibrant Neon Overkill: Saturated primary colors (> 80% saturation) flooded across cards or backgrounds."
      - "Uncalibrated Dark Mode Inversion: Inverting white to black, creating eye-straining raw #FFFFFF on #000000."
    professional_assets_standard:
      - "OKLCH Surface Scale (from assets/): Calibrated OKLCH lightness ladder (Canvas oklch(0.1286 0 0) -> Card oklch(0.2221 0 0) -> Elevated oklch(0.3211 0 0))."
      - "Subpixel 1px Ring Outlines (from assets/): Replace blurry shadows with crisp subpixel borders: rgba(255, 255, 255, 0.14) 0px 0px 0px 1px."
      - "Tactical Semantic Accents: Normal Emerald (#10B981), Attention Amber (#F59E0B), Suspicious Orange (#F97316), High Risk Rose (#EF4444) restricted to <= 10% of viewport area."
      - "Calibrated Off-White Text Tiers: Primary text (#f8fafc / 95% opacity), secondary (#94a3b8 / 70%), tertiary muted (#64748b / 50%)."

  category_3_typography_and_scale_mistakes:
    prohibited_generic_ai_slop:
      - "AI Default Font Stacks: Defaulting to uncustomized Inter or Roboto without typographic intentionality."
      - "Massive Heading Text Bloat: 48px-64px hero titles on technical dashboards wasting critical screen space."
      - "Excessive Font Weights: Using 6+ different font weights on a single page, destroying visual harmony."
      - "Unproportional Heading Line-Heights: Headings with line-height exceeding 1.25, causing awkward multi-line spacing."
    professional_assets_standard:
      - "Compact Telemetry Typography (from assets/Design (1).md): xs: 11px (0.6875rem), sm: 12px (0.75rem), base: 13px (0.8125rem), lg: 14px (0.875rem), 2xl: 16px (1.0rem), 4xl: 20px (1.25rem)."
      - "Dual-Type Pairing: GeistSans / Inter for UI copy + Geist Mono / JetBrains Mono (with font-feature-settings: 'tnum', 'zero') for all timestamps, sequence counts, and confidence scores."
      - "Restricted 3-Weight Matrix: Regular (400) for body, Medium (500) for labels/UI badges, Semibold (600) for section titles."
      - "Tight Heading Line Heights: Heading line-height strictly between 1.05 and 1.15; body line-height between 1.45 and 1.55."

  category_4_animation_and_motion_mistakes:
    prohibited_generic_ai_slop:
      - "Scroll-Trigger Stagger Fatigue: Staggered fade-up animations on every card, text line, and element as the user scrolls."
      - "Layout-Shifting Transitions: Animating CSS height, width, top, left, margin, or padding, triggering CPU reflows."
      - "Unconstrained Particle Webs: Canvas background particles connected by trailing lines, consuming 100% CPU."
      - "Sluggish Durations: Transitions lasting > 400ms that make the interface feel sluggish and unresponsive."
    professional_assets_standard:
      - "Purposeful Entrances: Immediate render for all telemetry tables, inspection grids, and score badges; animate only radial gauge needles and toast transitions."
      - "Compositor-Only Transitions: Animate exclusively transform and opacity properties executed on the GPU compositor thread."
      - "Snappy Micro-Interactions: Button hover and active states execute within 150ms-200ms with cubic-bezier(0.16, 1, 0.3, 1)."
      - "Strict prefers-reduced-motion: Wrap all motion queries in @media (prefers-reduced-motion: reduce) to instantly disable non-essential motion."

  category_5_components_and_controls_mistakes:
    prohibited_generic_ai_slop:
      - "Browser Default Form Controls: Native unstyled select dropdowns, checkboxes, or radio buttons with OS blue focus rings."
      - "Trapless Modal Overlays: Dialogs failing to trap keyboard focus, lacking Esc key dismiss, or allowing background scroll."
      - "Blank Empty States: Presenting an empty table or list as an awkward blank white or black container."
      - "Abrupt Data Flashes: Switching instantly between loading spinner and full content without layout preservation, causing severe CLS."
    professional_assets_standard:
      - "Accessible Primitives (from assets/general-team-settings-dashboard.shadcn.Woblo.css): Custom Radix UI primitives conforming to WAI-ARIA 1.2."
      - "Focus-Trapped Modals: Enforce inert attribute on background siblings, cycle Tab within evidence snapshot dialog, dismiss on Esc, restore focus on close."
      - "Actionable Zero-States: Clear icon, descriptive headline, helpful explanation, and a prominent primary action (e.g. 'Generate Candidate Invite Link')."
      - "Geometry-Preserving Skeletons: Pulse skeletons matching exact container dimensions and layout geometries, guaranteeing CLS = 0.000."

  category_6_copywriting_and_content_mistakes:
    prohibited_generic_ai_slop:
      - "AI Buzzword Salads: 'Supercharge your hiring', 'Unlock the power of AI', 'Next-generation proctoring', 'Seamlessly verify'."
      - "Meaningless Metrics: Cards claiming '99.9% fraud eliminated' or '10x faster' without verifiable context or data."
      - "Latin Lorem Ipsum: Leaving 'Lorem ipsum dolor sit amet' anywhere in production, staging, or PR previews."
      - "Vague Error Messages: 'Something went wrong. Please try again later.'"
    professional_assets_standard:
      - "Domain-Specific Concrete Value: Exact interview telemetry: 'Integrity score 92/100 (Normal). 0 face swaps detected; 1 tab switch (3.2s).'"
      - "Verifiable Mathematical Proofs: Replace marketing fluff with formal queueing bounds and algorithm descriptions (e.g. 'MediaPipe BlazeFace 2 FPS loop, sliding 5s viseme-phoneme Pearson correlation r=0.88')."
      - "Production-Authentic Sample Data: Populate interfaces with realistic software engineering interview questions, candidate names, and recruiter verdicts."
      - "Actionable Error Diagnostics: State what failed, why it failed, and provide immediate recovery (e.g. 'Microphone permission denied. Click the camera icon in your browser address bar to allow audio access. [Retest Audio]')."
```

---

## 2. Graphify Knowledge Graph Search & Sync Strategy

Execution protocol enforcing Graphify as the primary knowledge base before and after each phase.

```yaml
graphify_operational_strategy:
  initial_search_protocol:
    directive: "STRICTLY avoid raw grep or unindexed file searches (Rule 5 & Rule 38). Use `graphify query` and `graphify explain`."
    core_query_anchors:
      - "spec/tech_stack.md"
      - "spec/hld_architecture.md"
      - "spec/backend_design_and_data_model.md"
      - "spec/prd.md"
      - "spec/app_flow_and_state_map.md"
      - "spec/ui_ux_design_brief.md"
      - "spec/operations_telemetry_and_sre.md"
      - "DESIGN.md"
      - "assets/Design (1).md"
  terminal_update_protocol:
    directive: "Upon completing any code modifications in any milestone subsection, execute `graphify update .` to synchronize AST nodes."
    verification: "Confirm updated node count and community partitions in graphify-out/manifest.json and GRAPH_REPORT.md."
```

---

## 3. Mandatory Sub-Implementation Plan & 7-Layer Architectural Framework

Every milestone subsection must have its own dedicated sub-implementation plan adhering to the 7-Layer System Design architecture with embedded 4-tier TDD before execution.

```yaml
sub_implementation_plan_contract:
  mandate: "NO MONOLITHIC EXECUTION. Every subsection requires an independent, isolated sub-plan file in `spec/subplans/`."
  target_file_pattern: "spec/subplans/M{MilestoneIndex}_{SubsectionIndex}_{Descriptor}.subplan.md"
  required_7layer_architectural_sections:
    layer_1_requirements_and_capacity:
      source_spec: "spec_universal/system_design/01_non_negotiable_rules_and_principles.md"
      requirements:
        - "Exact quantitative QPS, concurrency, ELU, and memory bounds (5 concurrent baseline -> 25 concurrent peak)."
        - "Single Point of Failure (SPOF) identification and SRE SLI/SLO/SLA latency budgets."
    layer_2_macro_architecture_and_archetype:
      source_spec: "spec_universal/system_design/04_system_archetypes_and_decision_matrices.md"
      requirements:
        - "Selected architectural archetype (Modular Monolith with In-Process Event Emitter, Client-Edge AI Inference)."
        - "Communication protocol choice (RFC 6455 WebSockets + HTTP/2 REST) and database selection matrix."
    layer_3_ingress_networking_and_data_tier:
      source_spec: "spec_universal/system_design/02_high_level_design_and_distributed_systems.md"
      requirements:
        - "Ingress gateway, reverse proxy, CORS whitelisting, WebSocket upgrade validation, and token protocol auth."
        - "In-memory session buffer, sequence deduplication, and transactional storage tier."
    layer_4_low_level_domain_modeling_and_concurrency:
      source_spec: "spec_universal/system_design/03_low_level_design_and_object_oriented_architecture.md"
      requirements:
        - "Tactical DDD aggregate root contracts (InterviewAggregate, EvidenceAggregate) and entity schemas."
        - "Secondary indexing, write amplification defense, optimistic locking (version column), and pool physics."
    layer_5_observability_telemetry_and_sre_alerting:
      source_spec: "spec_universal/system_design/06_observability_telemetry_and_reliability_engineering.md"
      requirements:
        - "RED/USE metrics, W3C distributed tracing with traceparent header propagation."
        - "Multi-burn-rate alerting PromQL rules with low-QPS sample volume statistical guards."
    layer_6_deployment_topology_dr_governance_and_finops:
      source_spec: "spec_universal/system_design/07_deployment_operations_governance_and_finops.md"
      requirements:
        - "Zero-502 deploy sequence (preStop 15s sleep BEFORE SIGTERM, terminationGracePeriodSeconds 60s, WS 1001 close frame)."
        - "Dual-phase crypto-shredding via session_encryption_keys table, tamper-evident Merkle audit log, and 90-day retention."
    layer_7_verification_and_embedded_4tier_tdd:
      source_spec: "spec_universal/system_design/05_system_design_verification_and_testing_playbook.md"
      requirements:
        - "Type 1: Space & Time Complexity Testing (Big-O scaling, performance.now() bounds, Rule 15 CI headroom)."
        - "Type 2: Operational Logic & Domain Invariants Testing (state machines, cooldowns, recovery limits)."
        - "Type 3: UI & Persona Integration Testing (6 core states, WebRTC/MediaStream lifecycles, WebSocket replay, assets/ token alignment)."
        - "Type 4: QA & STRIDE/OWASP Top 10 Security Hardening (IDOR, prototype pollution, path traversal, injection)."
```

---

## 4. Implementation Milestones (Hybrid YAML Schema)

Milestones are partitioned into distinct, modular subsections. Each subsection mandates a dedicated 7-layer sub-plan and embedded 4-tier TDD test suite.

```yaml
implementation_milestones:
  # =========================================================================
  # MILESTONE 0: FOUNDATION, TOOLCHAIN PINNING & ARCHITECTURAL BASELINES
  # =========================================================================
  - milestone_id: "M00_FOUNDATION_TOOLCHAIN_AND_BASELINES"
    phase_name: "Workspace Scaffolding, Toolchain Pinning & Design Token Engine"
    objective: "Scaffold npm monorepo workspaces (shared, server, client), pin Node.js/TypeScript toolchains, deploy PostgreSQL 16 container, and extract professional design tokens from assets/."
    designated_skills:
      - "ci-cd-and-automation"
      - "api-and-interface-design"
      - "security-and-hardening"
      - "test-driven-development"
    input_contracts:
      prerequisite_files:
        - "spec/tech_stack.md"
        - "spec/backend_design_and_data_model.md"
        - "spec/adr/ADR-001-monolithic-architecture.md"
        - "assets/Design (1).md"
        - "assets/general-team-settings-dashboard.tailwind-v4.Woblo.css"
        - "assets/general-team-settings-dashboard.shadcn.Woblo.css"
      required_context: "Node.js 20 LTS, npm 10+, Docker Engine 24+ with Compose v2 installed."
    subsections:
      - subsection_id: "M00.1"
        name: "Monorepo Workspace Directory Scaffolding & Toolchain Configuration"
        subplan_target: "spec/subplans/M00_1_monorepo_scaffolding.subplan.md"
      - subsection_id: "M00.2"
        name: "Docker Compose PostgreSQL 16 Infrastructure Deployment"
        subplan_target: "spec/subplans/M00_2_docker_compose_postgres.subplan.md"
      - subsection_id: "M00.3"
        name: "Git Pre-Commit Guardrails & Destructive Command Interception"
        subplan_target: "spec/subplans/M00_3_precommit_guardrails.subplan.md"
      - subsection_id: "M00.4"
        name: "Shared Contract Type Definitions & Zod Schemas"
        subplan_target: "spec/subplans/M00_4_shared_contracts.subplan.md"
      - subsection_id: "M00.5"
        name: "Professional Design System Token Extraction & Tailwind Theme Bridge"
        subplan_target: "spec/subplans/M00_5_design_token_engine.subplan.md"
    validation_gate:
      exit_criteria:
        - "npm run build --workspaces compiles cleanly with zero TypeScript errors or linter warnings."
        - "PostgreSQL 16 container reports healthy status on port 5432 via docker compose ps."
        - "Design token CSS variables (--color-brand-*, --text-11px, --shadow-subpixel) resolve cleanly in client workspace."

  # =========================================================================
  # MILESTONE 1: INGESTION GATEWAY & WEBSOCKET TELEMETRY BUS
  # =========================================================================
  - milestone_id: "M01_INGRESS_AND_WEBSOCKET_TELEMETRY"
    phase_name: "RFC 6455 WebSocket Ingestion, Sec-WebSocket-Protocol Auth & Rate Limiting"
    objective: "Deploy Express HTTP/2 server, Vite development reverse proxy, RFC 6455 WebSocket telemetry server with subprotocol authentication, sequence deduplication, and in-memory rate limiting."
    designated_skills:
      - "api-and-interface-design"
      - "security-and-hardening"
      - "performance-optimization"
      - "test-driven-development"
      - "cyber-security-frameworks"
    input_contracts:
      prerequisite_files:
        - "spec/hld_architecture.md"
        - "spec/adr/ADR-004-websocket-event-streaming.md"
        - "shared/src/ws-protocol.ts"
      required_context: "Node.js 20 LTS running; Express HTTP server listening on port 3001."
    subsections:
      - subsection_id: "M01.1"
        name: "Express HTTP Gateway & Vite Reverse Proxy Configuration"
        subplan_target: "spec/subplans/M01_1_express_gateway_vite_proxy.subplan.md"
      - subsection_id: "M01.2"
        name: "RFC 6455 WebSocket Server & Sec-WebSocket-Protocol Authentication"
        subplan_target: "spec/subplans/M01_2_websocket_server_auth.subplan.md"
      - subsection_id: "M01.3"
        name: "Sliding Token Bucket Rate Limiter & Message Size Guard"
        subplan_target: "spec/subplans/M01_3_rate_limiter_guards.subplan.md"
      - subsection_id: "M01.4"
        name: "Monotonic Sequence Deduplication & In-Memory Journal Buffer"
        subplan_target: "spec/subplans/M01_4_sequence_dedup_buffer.subplan.md"
      - subsection_id: "M01.5"
        name: "Heartbeat Liveness Ping/Pong & Clean Drain Lifecycle"
        subplan_target: "spec/subplans/M01_5_heartbeat_drain_lifecycle.subplan.md"
    validation_gate:
      exit_criteria:
        - "WebSocket server sustains 50 concurrent sessions ingesting 100 events/sec with p99 processing latency < 15ms."
        - "Unauthenticated WebSocket connection attempts (missing or forged token) terminated with HTTP 401 Unauthorized."
        - "100% of replayed sequence IDs detected and deduplicated without modifying integrity score."

  # =========================================================================
  # MILESTONE 2: RELATIONAL PERSISTENCE, POOL PHYSICS & CRYPTO-SHREDDING
  # =========================================================================
  - milestone_id: "M02_PERSISTENCE_AND_POOL_PHYSICS"
    phase_name: "PostgreSQL 16 Schema, Prisma Client, Pool Physics & Dual-Phase Crypto-Shredding"
    objective: "Deploy relational schema, SHA-256 join token hash indexing, 5-connection pool sizing on 2 vCPUs, session encryption key management, and tamper-evident Merkle audit log."
    designated_skills:
      - "backend-design-and-data-model"
      - "performance-optimization"
      - "security-and-hardening"
      - "test-driven-development"
    input_contracts:
      prerequisite_files:
        - "spec/backend_design_and_data_model.md"
        - "spec/operations_telemetry_and_sre.md"
        - "shared/src/events.ts"
      required_context: "PostgreSQL 16 running on localhost:5432."
    subsections:
      - subsection_id: "M02.1"
        name: "Prisma Relational Schema & Migration Generation"
        subplan_target: "spec/subplans/M02_1_prisma_schema_migrations.subplan.md"
      - subsection_id: "M02.2"
        name: "SHA-256 Join Token Hash Indexing & Timing-Safe Lookup"
        subplan_target: "spec/subplans/M02_2_token_hash_indexing.subplan.md"
      - subsection_id: "M02.3"
        name: "Prisma Connection Pool Physics (HikariCP Sizing on 2 vCPU)"
        subplan_target: "spec/subplans/M02_3_connection_pool_physics.subplan.md"
      - subsection_id: "M02.4"
        name: "Dual-Phase GDPR Crypto-Shredding Engine"
        subplan_target: "spec/subplans/M02_4_crypto_shredding_engine.subplan.md"
      - subsection_id: "M02.5"
        name: "Tamper-Evident SHA-256 Merkle Audit Log Service"
        subplan_target: "spec/subplans/M02_5_merkle_audit_log.subplan.md"
      - subsection_id: "M02.6"
        name: "Database Seeder & Demonstration Dataset"
        subplan_target: "spec/subplans/M02_6_database_seed_demo.subplan.md"
    validation_gate:
      exit_criteria:
        - "Prisma migrations apply cleanly; seed script populates demo recruiter in < 2 seconds."
        - "Connection pool limits active PostgreSQL connections strictly to <= 5 under 100 concurrent read queries."
        - "Zero plaintext join tokens present in database dumps (verified via SQL pattern search)."

  # =========================================================================
  # MILESTONE 3: CLIENT-SIDE VISUAL EDGE DETECTION PIPELINE
  # =========================================================================
  - milestone_id: "M03_CLIENT_VISUAL_DETECTION_PIPELINE"
    phase_name: "MediaPipe BlazeFace (2 FPS), Landmark Gaze Tracking & Face-Swap Artifact Heuristics"
    objective: "Implement browser-based client-side vision pipeline: 2 FPS MediaPipe FaceDetector loop within 500ms CPU budget, multi-face presence detection, gaze/eye tracking, and face-swap boundary heuristics."
    designated_skills:
      - "frontend-ui-engineering"
      - "performance-optimization"
      - "source-driven-development"
      - "test-driven-development"
    input_contracts:
      prerequisite_files:
        - "docs/DETECTION_SPEC.md"
        - "spec/hld_architecture.md"
        - "spec/adr/ADR-003-client-side-detection-privacy.md"
        - "shared/src/events.ts"
      required_context: "Vite client application running; webcam MediaStream available via browser API."
    subsections:
      - subsection_id: "M03.1"
        name: "MediaPipe Vision WASM Loader & Offscreen Canvas Subsystem"
        subplan_target: "spec/subplans/M03_1_mediapipe_wasm_loader.subplan.md"
      - subsection_id: "M03.2"
        name: "2 FPS Detection Loop & 500ms CPU Budget Allocator"
        subplan_target: "spec/subplans/M03_2_2fps_loop_budget_allocator.subplan.md"
      - subsection_id: "M03.3"
        name: "Face Absence & Multiple Faces Presence Detector"
        subplan_target: "spec/subplans/M03_3_face_presence_detector.subplan.md"
      - subsection_id: "M03.4"
        name: "Facial Landmark Mesh & Gaze/Eye Movement Tracker"
        subplan_target: "spec/subplans/M03_4_landmark_gaze_tracker.subplan.md"
      - subsection_id: "M03.5"
        name: "Face-Swap & Deepfake Edge Artifact Heuristic Analyzer"
        subplan_target: "spec/subplans/M03_5_faceswap_artifact_analyzer.subplan.md"
      - subsection_id: "M03.6"
        name: "Sparse Evidence JPEG Snapshot Extractor (< 50KB)"
        subplan_target: "spec/subplans/M03_6_sparse_snapshot_extractor.subplan.md"
    validation_gate:
      exit_criteria:
        - "Detection cycle executes in < 200ms on standard Intel i5 / Apple Silicon browsers, consuming < 15% CPU."
        - "Simulated camera occlusion triggers face_absent after exactly 3.0s debounce."
        - "Evidence snapshot file size verified <= 50KB with zero raw video buffer leaks outside the offscreen canvas."

  # =========================================================================
  # MILESTONE 4: AUDIO, SPEECH TRANSCRIPTION & LIP-SYNC AV CORRELATION
  # =========================================================================
  - milestone_id: "M04_AUDIO_SPEECH_AND_LIPSYNC_CORRELATION"
    phase_name: "Web Audio Analyser, Speech Transcription & Sliding AV Lip-Sync Correlator"
    objective: "Implement real-time audio pipeline: Web Audio AnalyserNode (RMS volume, speech frequency band), 10s silence detection, client speech recognition, and 5s sliding window lip-sync correlation."
    designated_skills:
      - "frontend-ui-engineering"
      - "performance-optimization"
      - "test-driven-development"
      - "source-driven-development"
    input_contracts:
      prerequisite_files:
        - "docs/DETECTION_SPEC.md"
        - "spec/hld_architecture.md"
        - "shared/src/events.ts"
      required_context: "Microphone MediaStream track initialized and active."
    subsections:
      - subsection_id: "M04.1"
        name: "Web Audio Context & FFT AnalyserNode Processing"
        subplan_target: "spec/subplans/M04_1_web_audio_analyser.subplan.md"
      - subsection_id: "M04.2"
        name: "Speech Activity Detector & 10-Second Silence Detector"
        subplan_target: "spec/subplans/M04_2_speech_silence_detector.subplan.md"
      - subsection_id: "M04.3"
        name: "Browser Speech-to-Text Transcription & NLP Keyword Guard"
        subplan_target: "spec/subplans/M04_3_speech_transcription_nlp.subplan.md"
      - subsection_id: "M04.4"
        name: "Facial Viseme Mouth Openness Metric Extractor"
        subplan_target: "spec/subplans/M04_4_mouth_viseme_extractor.subplan.md"
      - subsection_id: "M04.5"
        name: "Sliding 5-Second Viseme-Phoneme Lip-Sync Correlator"
        subplan_target: "spec/subplans/M04_5_lipsync_av_correlator.subplan.md"
      - subsection_id: "M04.6"
        name: "Tab & Screen Visibility Lifecycle Monitor"
        subplan_target: "spec/subplans/M04_6_tab_screen_monitor.subplan.md"
    validation_gate:
      exit_criteria:
        - "Lip-sync engine successfully detects 300ms audio-video desynchronization in synthetic test clips."
        - "10 seconds of background silence emits audio_silence_extended with severity INFO."
        - "Switching active browser tab emits tab_hidden within 50ms of visibility change."

  # =========================================================================
  # MILESTONE 5: MULTIMODAL DETERMINISTIC RISK FUSION ENGINE
  # =========================================================================
  - milestone_id: "M05_MULTIMODAL_RISK_FUSION_ENGINE"
    phase_name: "Pure Function Scoring, Canonical Weights, Cooldown Suppression & Score Recovery"
    objective: "Implement pure function risk calculation engine, canonical event weights (-2 to -15), cooldown timer suppression (15s to 60s), clean-time recovery (+2 pts/min), and human-readable explanation generator."
    designated_skills:
      - "test-driven-development"
      - "performance-optimization"
      - "debugging-and-error-recovery"
    input_contracts:
      prerequisite_files:
        - "docs/RISK_ENGINE.md"
        - "spec/prd.md"
        - "spec/adr/ADR-002-deterministic-scoring-engine.md"
        - "shared/src/risk.ts"
      required_context: "Clean TypeScript runtime; server test suite operational."
    subsections:
      - subsection_id: "M05.1"
        name: "Deterministic Risk Engine Core & Pure Function Kernel"
        subplan_target: "spec/subplans/M05_1_risk_engine_kernel.subplan.md"
      - subsection_id: "M05.2"
        name: "Canonical Event Weight Matrix & Severity Deduction Rules"
        subplan_target: "spec/subplans/M05_2_event_weight_matrix.subplan.md"
      - subsection_id: "M05.3"
        name: "Per-Event Cooldown Suppression Timer State Machine"
        subplan_target: "spec/subplans/M05_3_cooldown_timers.subplan.md"
      - subsection_id: "M05.4"
        name: "Clean-Time Score Recovery Engine (Passive Session Bug Fix)"
        subplan_target: "spec/subplans/M05_4_clean_time_recovery.subplan.md"
      - subsection_id: "M05.5"
        name: "Risk Tier Classification State Machine (Normal -> Attention -> Suspicious -> High Risk)"
        subplan_target: "spec/subplans/M05_5_risk_tier_state_machine.subplan.md"
      - subsection_id: "M05.6"
        name: "Human-Readable Natural Language Explanation Generator"
        subplan_target: "spec/subplans/M05_6_risk_explainer_generator.subplan.md"
    validation_gate:
      exit_criteria:
        - "100,000 sequential calculateRisk calls complete in < 150ms (O(1) time complexity)."
        - "All 30 unit test cases in docs/TEST_PLAN.md pass with 100% assertion accuracy."
        - "Passive clean sessions recover +2 points per clean minute on heartbeats without requiring non-info events."

  # =========================================================================
  # MILESTONE 6: CANDIDATE EXPERIENCE UI & ONBOARDING GATEWAYS
  # =========================================================================
  - milestone_id: "M06_CANDIDATE_EXPERIENCE_UI"
    phase_name: "Candidate Onboarding Flow, Device Checks, Inverted Consent & Active Interview View"
    objective: "Implement candidate user journeys across 5 dedicated screens (JoinGate, SystemCheck, ConsentPage, InterviewPage, CompletionPage) with inverted consent, hardware checks, and all 6 core UI states using assets/ design tokens."
    designated_skills:
      - "frontend-ui-engineering"
      - "a11y-debugging"
      - "design-taste-frontend"
      - "test-driven-development"
    input_contracts:
      prerequisite_files:
        - "assets/Design (1).md"
        - "assets/general-team-settings-dashboard.tailwind-v4.Woblo.css"
        - "DESIGN.md"
        - "spec/app_flow_and_state_map.md"
        - "spec/ui_ux_design_brief.md"
        - "client/src/detectors/orchestrator.ts"
      required_context: "Detector orchestrator operational; React 18 / Vite 5 client running."
    subsections:
      - subsection_id: "M06.1"
        name: "Candidate Layout, Dark Modern Theme & Design Token Integration"
        subplan_target: "spec/subplans/M06_1_candidate_layout_tokens.subplan.md"
      - subsection_id: "M06.2"
        name: "JoinGatePage: Join Token Verification & Media Permissions Prompt"
        subplan_target: "spec/subplans/M06_2_join_gate_page.subplan.md"
      - subsection_id: "M06.3"
        name: "SystemCheckPage: Live Webcam Mirror & Audio Meter Visualization"
        subplan_target: "spec/subplans/M06_3_system_check_page.subplan.md"
      - subsection_id: "M06.4"
        name: "ConsentPage: Inverted Affirmative Consent & Privacy Disclosure"
        subplan_target: "spec/subplans/M06_4_consent_page.subplan.md"
      - subsection_id: "M06.5"
        name: "InterviewPage: Unobtrusive Candidate Monitor & Question Interface"
        subplan_target: "spec/subplans/M06_5_interview_page.subplan.md"
      - subsection_id: "M06.6"
        name: "CompletionPage: Clean Device Teardown & Session Signoff"
        subplan_target: "spec/subplans/M06_6_completion_page.subplan.md"
    validation_gate:
      exit_criteria:
        - "Candidate onboarding flow operates smoothly across all 5 views with zero console errors."
        - "'Begin Interview' CTA remains strictly disabled until camera, mic, and affirmative consent checkbox pass."
        - "Zero camera or microphone indicator lights remain active after navigating to CompletionPage."

  # =========================================================================
  # MILESTONE 7: RECRUITER COMMAND CENTER & EVIDENCE REVIEW UI
  # =========================================================================
  - milestone_id: "M07_RECRUITER_COMMAND_CENTER"
    phase_name: "Recruiter Dashboard, SVG Radial Score Gauge, Event Timeline & Review Panel"
    objective: "Implement recruiter audit command center: InterviewList data table, real-time SVG radial score gauge, virtualized event timeline, evidence snapshot drawer, and Pass/Flag/Inconclusive review workflow following professional assets/ patterns."
    designated_skills:
      - "frontend-ui-engineering"
      - "high-end-visual-design"
      - "a11y-debugging"
      - "test-driven-development"
    input_contracts:
      prerequisite_files:
        - "assets/Design (1).md"
        - "assets/general-team-settings-dashboard.tailwind-v4.Woblo.css"
        - "assets/general-team-settings-dashboard.shadcn.Woblo.css"
        - "DESIGN.md"
        - "spec/ui_ux_design_brief.md"
        - "spec/app_flow_and_state_map.md"
        - "server/src/api/routes/interview.routes.ts"
      required_context: "Backend REST API and WebSocket operational; recruiter session authenticated."
    subsections:
      - subsection_id: "M07.1"
        name: "Recruiter Navigation Shell & InterviewList Data Table"
        subplan_target: "spec/subplans/M07_1_recruiter_table_view.subplan.md"
      - subsection_id: "M07.2"
        name: "IntegrityScoreCard: Real-Time Animated SVG Radial Score Gauge"
        subplan_target: "spec/subplans/M07_2_radial_score_gauge.subplan.md"
      - subsection_id: "M07.3"
        name: "EventTimeline: Virtualized Chronological Telemetry Feed"
        subplan_target: "spec/subplans/M07_3_event_timeline_virtualized.subplan.md"
      - subsection_id: "M07.4"
        name: "EvidenceViewer Modal: Cryptographic Snapshot Inspector"
        subplan_target: "spec/subplans/M07_4_evidence_viewer_modal.subplan.md"
      - subsection_id: "M07.5"
        name: "RecruiterReviewPanel: Human-in-the-Loop Verdict Submission"
        subplan_target: "spec/subplans/M07_5_recruiter_review_panel.subplan.md"
      - subsection_id: "M07.6"
        name: "Six Core UI State Audit across All Recruiter Screens"
        subplan_target: "spec/subplans/M07_6_recruiter_six_states.subplan.md"
    validation_gate:
      exit_criteria:
        - "Session audit view loads and displays timeline, score gauge, and candidate details in < 1.5 seconds."
        - "Review submission updates database record, invalidates cache, and sets read-only state."
        - "100% of interactive elements meet WCAG 2.2 AA contrast standards (>= 4.5:1 text, >= 3:1 UI boundaries)."

  # =========================================================================
  # MILESTONE 8: SRE OBSERVABILITY, PDF REPORT GENERATOR & DEMO HARDENING
  # =========================================================================
  - milestone_id: "M08_SRE_TELEMETRY_AND_PRODUCTION_HARDENING"
    phase_name: "Multi-Burn-Rate Alerting, Actionable PDF Report Generator & Demo Hardening"
    objective: "Implement PDF Actionable Report generator, deploy Google SRE dual-window PromQL alert rules, verify 3-tier health probes, test zero-502 deploy sequence, and execute all 16 robustness scenarios."
    designated_skills:
      - "observability-and-instrumentation"
      - "ci-cd-and-automation"
      - "verification-before-completion"
      - "cyber-security-frameworks"
      - "code-review-and-quality"
    input_contracts:
      prerequisite_files:
        - "spec/operations_telemetry_and_sre.md"
        - "docs/TEST_PLAN.md"
        - "docs/DEMO_SCRIPT.md"
      required_context: "Full stack operational locally; Docker containers healthy."
    subsections:
      - subsection_id: "M08.1"
        name: "Actionable PDF Report Generator (PDFKit / Puppeteer Engine)"
        subplan_target: "spec/subplans/M08_1_pdf_report_generator.subplan.md"
      - subsection_id: "M08.2"
        name: "Prometheus Multi-Window Multi-Burn-Rate Alerting Rules"
        subplan_target: "spec/subplans/M08_2_promql_alerting_rules.subplan.md"
      - subsection_id: "M08.3"
        name: "3-Tier Health Probes & Zero-502 Rolling Deploy Verification"
        subplan_target: "spec/subplans/M08_3_health_probes_rolling_deploy.subplan.md"
      - subsection_id: "M08.4"
        name: "Automated 16 Robustness Test Scenarios Execution"
        subplan_target: "spec/subplans/M08_4_robustness_scenarios.subplan.md"
      - subsection_id: "M08.5"
        name: "Post-Code Dead Code & Orphaned Symbol Sweep (Rule 31)"
        subplan_target: "spec/subplans/M08_5_dead_code_sweep.subplan.md"
      - subsection_id: "M08.6"
        name: "Graphify AST Knowledge Graph Terminal Synchronization"
        subplan_target: "spec/subplans/M08_6_graphify_terminal_sync.subplan.md"
    validation_gate:
      exit_criteria:
        - "PDF Actionable Report generates cleanly in < 1.2 seconds with embedded evidence snapshots and verification checklist."
        - "100% pass rate achieved across all 16 robustness test scenarios and automated test suites."
        - "Synthetic low-QPS faults produce zero false alerts; readiness probe returns 200 without issuing SQL queries."
        - "Graphify AST graph updated with 100% connected components and zero orphaned symbols."
```

---

## 5. Embedded 4-Tier Test-Driven Development (TDD) Harness

Every milestone subsection incorporates all four testing tiers mandated by Rule 8 and `spec_universal/tdd_4tier_testing_template.md`.

```yaml
tdd_4tier_execution_harness:
  tier_1_space_and_time_complexity:
    mandate: "Verify Big-O scaling, performance.now() upper bounds, and memory ceiling with Rule 15 CI headroom."
    test_suites:
      - file: "tests/performance/mediapipe_inference_budget.perf.test.ts"
        bound: "Client 2 FPS loop completes inference in < 200ms locally (< 400ms CI bound); heap allocation delta < 5MB over 3,600 cycles."
      - file: "tests/performance/risk_engine_execution.perf.test.ts"
        bound: "100,000 sequential calculateRisk calls complete in < 150ms locally (< 500ms CI bound); O(1) space and time complexity."
      - file: "tests/performance/ws_ingest_concurrency.perf.test.ts"
        bound: "WebSocket server processes 50 concurrent incoming telemetry frames in < 50ms locally (< 150ms CI bound)."
      - file: "tests/performance/timeline_virtualization.perf.test.tsx"
        bound: "EventTimeline renders 500 items in < 50ms locally (< 150ms CI bound) using DOM node recycling."
      - file: "tests/performance/db_join_token_hash_lookup.perf.test.ts"
        bound: "SHA-256 join_token_hash B-tree index lookup completes in < 5ms locally (< 20ms CI bound) across 10,000 seeded rows."

  tier_2_operational_logic_and_domain_invariants:
    mandate: "Verify functional correctness, aggregate invariants, and deterministic outcomes."
    test_suites:
      - file: "tests/unit/risk_engine_score_bounds.test.ts"
        assertion: "Score never drops below 0, never exceeds 100, and never recovers above peakScore."
      - file: "tests/unit/cooldown_suppression_window.test.ts"
        assertion: "Repeated violation events within active cooldown window log timeline warning with zero score deduction."
      - file: "tests/unit/passive_clean_time_recovery.test.ts"
        assertion: "Passive clean sessions recover +2 points per clean minute on session:heartbeat without incoming events."
      - file: "tests/unit/face_absence_debounce.test.ts"
        assertion: "Camera occlusion < 3.0s emits zero events; occlusion >= 3.0s emits face_absent with severity CRITICAL."
      - file: "tests/unit/lipsync_pearson_correlation.test.ts"
        assertion: "Mouth aperture vs audio RMS correlation r < 0.25 during active speech emits audio_video_mismatch."
      - file: "tests/unit/candidate_consent_gate.test.ts"
        assertion: "Session transition from ConsentPage to InterviewPage blocked until consent checkbox is strictly affirmative."

  tier_3_ui_and_integration_testing:
    mandate: "Verify 6 UI states, component lifecycles, route guards, and hardware integration bridges."
    test_suites:
      - file: "tests/integration/candidate_onboarding_lifecycle.test.tsx"
        assertion: "Candidate transitions smoothly through JoinGate -> SystemCheck -> Consent -> Interview -> Completion views."
      - file: "tests/integration/device_teardown_on_exit.test.tsx"
        assertion: "Navigating to CompletionPage explicitly stops all MediaStream audio/video tracks (track.stop())."
      - file: "tests/integration/ws_reconnect_buffer_replay.test.ts"
        assertion: "Client network interruption buffers up to 200 events in memory; reconnect flushes journal with zero event loss."
      - file: "tests/integration/recruiter_review_submission.test.tsx"
        assertion: "Review decision 'Flag' disables submit button until mandatory notes provided; successful submit locks session."
      - file: "tests/integration/pdf_report_generation.test.ts"
        assertion: "GET /api/sessions/:id/report returns valid application/pdf binary with embedded evidence snapshots."
      - file: "tests/integration/design_token_contrast_compliance.test.tsx"
        assertion: "All text and UI controls using assets/ tokens meet WCAG 2.2 AA (>= 4.5:1 text, >= 3:1 subpixel borders)."

  tier_4_qa_and_stride_security_hardening:
    mandate: "Verify adversarial resilience against STRIDE threats, OWASP Top 10 exploits, and race conditions."
    test_suites:
      - file: "tests/security/ws_subprotocol_auth.security.test.ts"
        assertion: "WebSocket connections lacking valid Sec-WebSocket-Protocol token rejected immediately (HTTP 401); URL tokens blocked."
      - file: "tests/security/timing_safe_join_token.security.test.ts"
        assertion: "Candidate join validation uses crypto.timingSafeEqual on SHA-256 hashes, eliminating timing side channels."
      - file: "tests/security/evidence_directory_traversal.security.test.ts"
        assertion: "Requests attempting path traversal (../../etc/passwd) rejected; evidence storage strictly contained in ./evidence/{sessionId}/."
      - file: "tests/security/recruiter_idor_isolation.security.test.ts"
        assertion: "Recruiter A attempting to access Recruiter B's interview session receives HTTP 404/403 with zero data disclosure."
      - file: "tests/security/zod_prototype_pollution.security.test.ts"
        assertion: "Inbound JSON payloads with '__proto__' or 'constructor' rejected by Zod schemas without prototype contamination."
      - file: "tests/security/crypto_shredding_gdpr.security.test.ts"
        assertion: "GDPR erasure permanently zeroizes session DEK in session_encryption_keys, making WAL and backups undecryptable."
```

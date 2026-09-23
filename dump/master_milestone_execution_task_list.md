# Master Milestone Execution Task List: GameOS

Granular, dependency-ordered execution roadmap mapping all 16 specification documents into verified, zero-guesswork implementation milestones.

## 1. Safety Guardrails & Operational Invariants

Strict operational constraints governing all milestone execution activities per Rule 11, Rule 23, Rule 24, Rule 29, and Rule 30.

```yaml
safety_guardrails_and_operational_invariants:
  1_destructive_command_prohibition:
    mandate: "Zero destructive filesystem or database commands (rm -rf, Remove-Item -Force, DROP DATABASE, format)."
    enforcement: "Protected by .agents/scripts/destructive_command_guard.py via .agents/hooks.json."
  2_atomic_reversibility:
    mandate: "Every migration, configuration, and code deployment must provide an automated, deterministic rollback script."
    strategy: "Expand-Contract database DDL migrations with backward-compatible column aliasing."
  3_vcs_and_git_authorization:
    mandate: "All modifications remain strictly in local working directories. Commits, branch operations, and PRs require explicit user authorization (Rule 24)."
  4_foundation_immutability:
    mandate: "spec_universal/ and .agents/AGENTS.md are physically immutable and protected against commits by .githooks/pre-commit (Rule 30)."
  5_strict_type_and_linter_safety:
    mandate: "TypeScript strict mode (noUnusedLocals, TS6133 zero-unused imports per Rule 19); all JSX tests use .tsx extension (Rule 28)."
  6_no_force_commits:
    mandate: "Bypassing pre-commit hooks via --no-verify or --force is strictly prohibited under all circumstances (Rule 11)."
  7_anti_monolithic_planning_mandate:
    mandate: "Monolithic execution plans covering entire milestones in one broad stroke are STRICTLY FORBIDDEN."
    rule: "For every subsection within each milestone, the agent MUST author a dedicated Sub-Implementation Plan and 7-Layer Architectural Plan with embedded 4-tier TDD before touching code."
  8_frontend_design_bible_compliance:
    mandate: "Strict compliance with spec_universal/frontend_design_bible.md across all frontend views and components."
    rule: "Zero tolerance for AI slop, purple radial glows, identical 3-column cards, uncalibrated dark mode, unstyled browser controls, or buzzword copy."
```

> [!WARNING]
> ### CRITICAL EXECUTION GUARD: STRICT ENFORCEMENT OF THE FRONTEND DESIGN BIBLE & ANTI-SLOP CODEX (`spec_universal/frontend_design_bible.md`)
> During the implementation of the frontend command center (`apps/web-dashboard`) across Milestone 7 and all persona interfaces, the agent and engineers are **STRICTLY PROHIBITED** from repeating any of the common amateur mistakes, AI slop tropes, or performance anti-patterns cataloged in `spec_universal/frontend_design_bible.md`.

```yaml
frontend_design_bible_mistake_prevention_matrix:
  category_1_layout_mistakes:
    prohibited_slop:
      - "3-Column Identical Feature Cards: Repeating cards with identical heights, centered circle icons, and generic text."
      - "Floating 3D Glass Cubes/Spheres: Aimless isometric decorative shapes in hero sections without semantic purpose."
      - "Centered Hero Monotony: Centered H1 + subtitle + dual CTA button layout on every single view."
      - "Unconstrained Text Measure: Paragraphs spanning across full viewport width (> 75ch), causing severe eye strain."
    mandatory_execution_standard:
      - "Asymmetric Bento Grids: Variable-width cards (2/3 + 1/3, 1/2 + 1/2) with varying content density."
      - "Functional Media & Real Telemetry: Replace decorative shapes with live interactive telemetry widgets, terminal snippets, or actual match logs."
      - "Left-Aligned Editorial Hierarchy: Anchor headlines with clear typographic contrast, eyebrow badges, and contextual metadata."
      - "Strict Reading Measure: Enforce max-width: 65ch (60-72 characters per line) on all body copy."

  category_2_color_and_surface_mistakes:
    prohibited_slop:
      - "Purple/Indigo Radial Glow: Blurry radial gradients (#6366F1 / #8B5CF6) centered behind the hero."
      - "Pitch-Black Monoliths: Pure #000000 background without elevation layers, surface hierarchy, or borders."
      - "Vibrant Neon Overkill: Saturated primary colors (> 80% saturation) flooded across cards or backgrounds."
      - "Uncalibrated Dark Mode Inversion: Inverting white to black, creating eye-straining raw #FFFFFF on #000000."
    mandatory_execution_standard:
      - "Directional Ambient Lighting: Subtle top-down directional linear gradients with opacity under 8% (rgba(255, 255, 255, 0.03))."
      - "5-Tier Calibrated Surface Ladder: Base (#07080a) -> Card (#0d0e11) -> Elevated (#131519) -> Hover (#181a20) -> Overlay (#1e2128)."
      - "Muted Tactical Brand Accents: Restrict accent colors (Laser Amber #f59e0b, Sage Cyan #06b6d4) to <= 10% of viewport area."
      - "Calibrated Off-White Text Tiers: Off-white primary text (#f4f4f6 / 92% opacity), muted secondary (#8a8f98 / 65%), subtle tertiary (#62666d / 45%)."

  category_3_typography_and_scale_mistakes:
    prohibited_slop:
      - "AI Default Font Stacks: Defaulting to uncustomized Inter or Roboto without typographic intentionality."
      - "Static Pixel Sizing: Hardcoding font sizes in px without viewport-aware fluid clamp scaling."
      - "Excessive Font Weights: Using 6+ different font weights on a single page, destroying visual harmony."
      - "Unproportional Heading Line-Heights: Headings with line-height exceeding 1.25, causing awkward multi-line spacing."
    mandatory_execution_standard:
      - "Intentional Dual-Type Pairing: Inter with stylistic alternates (calt, liga, ss03) for UI text + JetBrains Mono (tabular-nums) for telemetry and math proofs."
      - "Fluid Clamp Mathematics: Calculate font sizes using clamp() based on Major Third (1.25) or Perfect Fourth (1.333)."
      - "Restricted 3-Weight Matrix: Regular (400) for body, Medium (500) for labels/UI, Semibold/Bold (600/700) for headings."
      - "Tight Heading Line Heights: Heading line-height strictly between 1.05 and 1.15; body line-height between 1.5 and 1.6."

  category_4_animation_and_motion_mistakes:
    prohibited_slop:
      - "Scroll-Trigger Stagger Fatigue: Staggered fade-up animations on every card, text line, and element as the user scrolls."
      - "Layout-Shifting Transitions: Animating CSS height, width, top, left, margin, or padding, triggering CPU reflows."
      - "Unconstrained Particle Webs: Canvas background particles connected by trailing lines, consuming 100% CPU."
      - "Sluggish Durations: Transitions lasting > 400ms that make the interface feel sluggish and unresponsive."
    mandatory_execution_standard:
      - "Purposeful Entrances: Animate only critical hero focal points; keep data tables and metrics immediately rendered."
      - "Compositor-Only Transitions: Animate exclusively transform and opacity properties executed on the GPU compositor thread."
      - "Snappy Micro-Interactions: Button hover and active states execute within 150ms-200ms with cubic-bezier(0.16, 1, 0.3, 1)."
      - "Strict prefers-reduced-motion: Wrap all motion queries in @media (prefers-reduced-motion: reduce) to instantly disable non-essential motion."

  category_5_components_and_controls_mistakes:
    prohibited_slop:
      - "Browser Default Form Controls: Native unstyled select dropdowns, checkboxes, or radio buttons with OS blue focus rings."
      - "Trapless Modal Overlays: Dialogs failing to trap keyboard focus, lacking Esc key dismiss, or allowing background scroll."
      - "Blank Empty States: Presenting an empty table or list as an awkward blank white or black container."
      - "Abrupt Data Flashes: Switching instantly between loading spinner and full content without layout preservation, causing severe CLS."
    mandatory_execution_standard:
      - "Accessible Primitives: Custom accessible primitives built with Radix UI, conforming to WAI-ARIA 1.2 patterns."
      - "Focus-Trapped Modals: Enforce inert attribute on background siblings, cycle Tab within dialog, dismiss on Esc, restore focus on close."
      - "Actionable Zero-States: Clear icon, descriptive headline, helpful explanation, and a prominent primary action (e.g. 'Simulate New Balance Proposal')."
      - "Geometry-Preserving Skeletons: Pulse skeletons matching exact container dimensions and layout geometries, guaranteeing CLS = 0.000."

  category_6_copywriting_and_content_mistakes:
    prohibited_slop:
      - "AI Buzzword Salads: 'Supercharge your workflow', 'Unlock the power of AI', 'Next-generation platform', 'Seamlessly integrate'."
      - "Meaningless Metrics: Cards claiming '99.9% customer satisfaction' or '10x faster' without verifiable context or data."
      - "Latin Lorem Ipsum: Leaving 'Lorem ipsum dolor sit amet' anywhere in production, staging, or PR previews."
      - "Vague Error Messages: 'Something went wrong. Please try again later.'"
    mandatory_execution_standard:
      - "Domain-Specific Concrete Value: Exact live-ops metrics: '10,000 matches simulated in 109s via MFMC; wire ingestion CPU < 3.8%'."
      - "Verifiable Mathematical Proofs: Replace marketing fluff with formal queueing bounds (Kingman rho <= 0.80, Goetz 52 connections on 32 cores)."
      - "Production-Authentic Sample Data: Populate interfaces with realistic game telemetry, weapon IDs, player cohorts, and Perforce streams."
      - "Actionable Error Diagnostics: State what failed, why it failed, and provide immediate recovery (e.g. 'WebSocket connection lost. 42 events buffered in journal. [Reconnect & Flush]')."
```

## 2. Graphify Knowledge Graph Search & Sync Protocol

Execution protocol enforcing Graphify as the primary knowledge base before and after each phase.

```yaml
graphify_operational_protocol:
  initial_search_protocol:
    directive: "STRICTLY avoid raw grep or unindexed file searches (Rule 5 & Rule 38). Use `graphify query` and `graphify explain`."
    core_query_anchors:
      - "spec/tech_stack.md"
      - "spec/hld_architecture.md"
      - "spec/backend_design_and_data_model.md"
      - "spec/GameOS_Master_Software_Specification.md"
      - "spec/GameOS_ProdPad_Workflow_Specification.md"
      - "spec/enterprise_studio_integration.md"
  terminal_update_protocol:
    directive: "Upon completing any code modifications in any milestone subsection, execute `graphify update .` to synchronize AST nodes."
    verification: "Confirm updated node count and community partitions in graphify-out/manifest.json."
```

## 3. Mandatory Sub-Implementation Plan & 7-Layer Architectural Framework

Every milestone subsection must have its own dedicated sub-implementation plan adhering to the 7-Layer System Design architecture (Routing Guide `00_` through `07_`) with embedded 4-tier TDD before execution.

```yaml
sub_implementation_plan_contract:
  mandate: "NO MONOLITHIC EXECUTION. Every subsection requires an independent, isolated sub-plan file in `spec/subplans/`."
  target_file_pattern: "spec/subplans/M{MilestoneIndex}_{SubsectionIndex}_{Descriptor}.subplan.md"
  required_7layer_architectural_sections:
    layer_1_requirements_and_capacity:
      source_spec: "spec_universal/system_design/01_non_negotiable_rules_and_principles.md"
      requirements:
        - "Exact quantitative QPS, concurrency, and memory bounds."
        - "SPOF identification and SRE SLI/SLO/SLA latency budgets."
    layer_2_macro_architecture_and_archetype:
      source_spec: "spec_universal/system_design/04_system_archetypes_and_decision_matrices.md"
      requirements:
        - "Selected architectural archetype (CQRS, Event-Driven, Streaming, Microservice)."
        - "Communication protocol choice and database engine selection matrix."
    layer_3_ingress_networking_and_data_tier:
      source_spec: "spec_universal/system_design/02_high_level_design_and_distributed_systems.md"
      requirements:
        - "Ingress gateway, mTLS/SPIFFE, circuit breakers, and rate limiters."
        - "Caching hierarchy, sharding/partitioning, and CDC transactional outbox."
    layer_4_low_level_domain_modeling_and_concurrency:
      source_spec: "spec_universal/system_design/03_low_level_design_and_object_oriented_architecture.md"
      requirements:
        - "Tactical DDD aggregate root contracts and entity schemas."
        - "Secondary indexing, write amplification defense, and concurrency/fencing locks."
    layer_5_observability_telemetry_and_sre_alerting:
      source_spec: "spec_universal/system_design/06_observability_telemetry_and_reliability_engineering.md"
      requirements:
        - "RED/USE metrics, distributed tracing with Kafka/gRPC SpanLinks."
        - "Multi-burn-rate alerting PromQL rules with low-QPS sample volume guards."
    layer_6_deployment_topology_dr_governance_and_finops:
      source_spec: "spec_universal/system_design/07_deployment_operations_governance_and_finops.md"
      requirements:
        - "Canary/Drain rollout, Blue/Green DDL lock defense, cgroups CFS limits."
        - "Disaster recovery tier, Merkle audit logs, and GDPR crypto-shredding."
    layer_7_verification_and_embedded_4tier_tdd:
      source_spec: "spec_universal/system_design/05_system_design_verification_and_testing_playbook.md"
      requirements:
        - "Type 1: Space & Time Complexity Testing (Big-O scaling, performance.now() bounds)."
        - "Type 2: Operational Logic & Domain Invariants Testing."
        - "Type 3: UI & Persona Integration Testing."
        - "Type 4: QA & STRIDE/OWASP Top 10 Security Hardening."
```

## 4. Specification Document Dependency Matrix

Deterministic mapping of all 16 specification documents to their designated execution milestones.

```yaml
specification_document_dependency_matrix:
  layer_0_foundations_and_adrs:
    - doc_path: "spec/tech_stack.md"
      target_milestone: "M00_FOUNDATION_TOOLCHAIN_AND_BASELINES"
      subsections: ["M00.1", "M00.2", "M00.3"]
    - doc_path: "spec/adr/001_event_streaming_redpanda.md"
      target_milestone: "M00_FOUNDATION_TOOLCHAIN_AND_BASELINES"
      subsections: ["M00.2"]
    - doc_path: "spec/adr/002_graphrag_hybrid_topology.md"
      target_milestone: "M00_FOUNDATION_TOOLCHAIN_AND_BASELINES"
      subsections: ["M00.2"]
    - doc_path: "spec/adr/003_headless_simulation_rust.md"
      target_milestone: "M00_FOUNDATION_TOOLCHAIN_AND_BASELINES"
      subsections: ["M00.1"]
    - doc_path: "spec/adr/004_agones_delivery_drain_fleet.md"
      target_milestone: "M00_FOUNDATION_TOOLCHAIN_AND_BASELINES"
      subsections: ["M00.2"]
    - doc_path: "spec/GameOS_Corporate_Architecture_Report.md"
      target_milestone: "M00_FOUNDATION_TOOLCHAIN_AND_BASELINES"
      subsections: ["M00.2"]

  layer_1_ingress_and_streaming:
    - doc_path: "spec/hld_architecture.md"
      target_milestone: "M01_INGRESS_AFXDP_AND_STREAMING"
      subsections: ["M01.1", "M01.2", "M01.3", "M01.4", "M01.5", "M01.6"]
    - doc_path: "spec/prd.md"
      target_milestone: "M01_INGRESS_AFXDP_AND_STREAMING"
      subsections: ["M01.1", "M01.4"]

  layer_2_data_tier_and_pool_physics:
    - doc_path: "spec/backend_design_and_data_model.md"
      target_milestone: "M02_PERSISTENCE_AND_POOL_PHYSICS"
      subsections: ["M02.1", "M02.2", "M02.3", "M02.4", "M02.5", "M02.6"]

  layer_3_graphrag_and_ast_dag:
    - doc_path: "spec/GameOS_End_To_End_Architectural_Plan.md"
      target_milestone: "M03_GRAPHRAG_AND_AST_TOPOLOGY"
      subsections: ["M03.1", "M03.2", "M03.3", "M03.4", "M03.5", "M03.6"]
    - doc_path: "spec/adr/002_graphrag_hybrid_topology.md"
      target_milestone: "M03_GRAPHRAG_AND_AST_TOPOLOGY"
      subsections: ["M03.4", "M03.5", "M03.6"]

  layer_4_combat_simulation_physics:
    - doc_path: "spec/GameOS_Master_Software_Specification.md"
      target_milestone: "M04_RACK_SIMULATION_AND_PHYSICS"
      subsections: ["M04.1", "M04.2", "M04.3", "M04.4", "M04.5", "M04.6"]
    - doc_path: "spec/adr/003_headless_simulation_rust.md"
      target_milestone: "M04_RACK_SIMULATION_AND_PHYSICS"
      subsections: ["M04.1", "M04.5"]

  layer_5_decision_science_and_prioritization:
    - doc_path: "spec/GameOS_ProdPad_Workflow_Specification.md"
      target_milestone: "M05_PRODPAD_WORKFLOW_AND_PRIORITIZATION"
      subsections: ["M05.1", "M05.2", "M05.3", "M05.4", "M05.5"]

  layer_6_studio_integrations:
    - doc_path: "spec/enterprise_studio_integration.md"
      target_milestone: "M06_ENTERPRISE_STUDIO_TOOLCHAIN"
      subsections: ["M06.1", "M06.2", "M06.3", "M06.4", "M06.5", "M06.6"]
    - doc_path: "spec/adr/004_agones_delivery_drain_fleet.md"
      target_milestone: "M06_ENTERPRISE_STUDIO_TOOLCHAIN"
      subsections: ["M06.6"]

  layer_7_frontend_and_state_machine:
    - doc_path: "spec/frontend_core_design_system.md"
      target_milestone: "M07_FRONTEND_UI_AND_STATE_MACHINE"
      subsections: ["M07.1", "M07.2", "M07.5"]
    - doc_path: "spec/ui_ux_design_brief.md"
      target_milestone: "M07_FRONTEND_UI_AND_STATE_MACHINE"
      subsections: ["M07.1", "M07.2", "M07.5"]
    - doc_path: "spec/app_flow_and_state_map.md"
      target_milestone: "M07_FRONTEND_UI_AND_STATE_MACHINE"
      subsections: ["M07.2", "M07.3", "M07.4"]

  layer_8_sre_telemetry_and_master_hardening:
    - doc_path: "spec/implementation_plan.md"
      target_milestone: "M08_SRE_TELEMETRY_AND_PRODUCTION_HARDENING"
      subsections: ["M08.1", "M08.2", "M08.3", "M08.4"]
```

## 5. Granular Milestone Implementation Procedures & Subsection Decomposition

Milestones are partitioned into distinct, modular subsections. Each subsection mandates a dedicated 7-layer sub-plan and embedded 4-tier TDD test suite.

```yaml
master_execution_milestones:
  # =========================================================================
  # MILESTONE 0: FOUNDATION, TOOLCHAIN PINNING & ARCHITECTURAL BASELINES
  # =========================================================================
  - milestone_id: "M00_FOUNDATION_TOOLCHAIN_AND_BASELINES"
    phase_name: "Workspace Scaffolding, Toolchain Pinning & Multi-Service Local Mesh"
    objective: "Scaffold monorepo structure, pin all language toolchains, and launch containerized infrastructure mesh."
    designated_skills:
      - "ci-cd-and-automation"
      - "api-and-interface-design"
      - "security-and-hardening"
      - "test-driven-development"
    input_contracts:
      prerequisite_files:
        - "spec/tech_stack.md"
        - "spec/adr/001_event_streaming_redpanda.md"
        - "spec/adr/002_graphrag_hybrid_topology.md"
        - "spec/adr/003_headless_simulation_rust.md"
        - "spec/adr/004_agones_delivery_drain_fleet.md"
        - "spec/GameOS_Corporate_Architecture_Report.md"
      required_context: "Docker Desktop / Docker Engine 26+, Rustup 1.80.1, Node.js 20 LTS, pnpm 9, Python 3.11 with uv."
    subsections:
      - subsection_id: "M00.1"
        name: "Monorepo Directory Scaffolding & Toolchain Configuration"
        subplan_target: "spec/subplans/M00_1_monorepo_scaffolding.subplan.md"
        scope: "Initialize crates/rack-simulation, services/, apps/, Cargo.toml AVX-512 flags, pnpm-workspace.yaml, tsconfig strict mode, uv virtualenv."
      - subsection_id: "M00.2"
        name: "Docker Compose Infrastructure Mesh Deployment"
        subplan_target: "spec/subplans/M00_2_docker_compose_mesh.subplan.md"
        scope: "Deploy Redpanda v24.1 (3 nodes), Memgraph v2.16, Qdrant v1.10, PostgreSQL 16 / TimescaleDB v2.15, Redis 7.2 Sentinel, Envoy 1.30."
      - subsection_id: "M00.3"
        name: "Git Pre-Commit Guardrails & Automation Pipeline"
        subplan_target: "spec/subplans/M00_3_precommit_guardrails.subplan.md"
        scope: "Verify .githooks/pre-commit enforcement of Rule 29 & Rule 30, and .agents/hooks.json destructive command interception."
    validation_gate:
      exit_criteria:
        - "All 6 Docker containers (Redpanda, Memgraph, Qdrant, Postgres, Redis, Envoy) report healthy status via docker compose ps."
        - "Cargo workspace compiles cleanly with zero warnings under cargo check --workspace."
        - "Pre-commit hook terminates any staged modification targeting .agents/AGENTS.md or spec_universal/."

  # =========================================================================
  # MILESTONE 1: INGESTION GATEWAY & STREAMING TELEMETRY BUS
  # =========================================================================
  - milestone_id: "M01_INGRESS_AFXDP_AND_STREAMING"
    phase_name: "Attested Ingress, AF_XDP Zero-Copy DMA & Probabilistic Telemetry"
    objective: "Deploy PASETO v4 + SPIFFE attested Envoy gateway, AF_XDP zero-copy Cap'n Proto streaming, and streaming probabilistic data structures."
    designated_skills:
      - "api-and-interface-design"
      - "security-and-hardening"
      - "performance-optimization"
      - "test-driven-development"
      - "cyber-security-frameworks"
    input_contracts:
      prerequisite_files:
        - "spec/milestones/M00_foundation_verification.md"
        - "spec/hld_architecture.md"
        - "spec/prd.md"
      required_context: "Redpanda event bus reachable on port 9092; Redis Sentinel running on port 26379."
    subsections:
      - subsection_id: "M01.1"
        name: "Envoy Gateway SPIFFE X.509 mTLS & PASETO v4 Edge Attestation"
        subplan_target: "spec/subplans/M01_1_envoy_paseto_spiffe_attestation.subplan.md"
        scope: "Envoy Lua edge filter cryptographically validating PASETO v4 tokens bound to SPIFFE SAN client certs."
      - subsection_id: "M01.2"
        name: "Redis Sentinel Anti-Replay Filter & NTP Drift Compensator"
        subplan_target: "spec/subplans/M01_2_redis_anti_replay_filter.subplan.md"
        scope: "Sliding anti-replay filter with epoch-monotonic sequence IDs and dynamic 30s NTP drift compensation."
      - subsection_id: "M01.3"
        name: "Zstd Decompression Bomb Defense & Payload Validator"
        subplan_target: "spec/subplans/M01_3_zstd_bomb_defense.subplan.md"
        scope: "Decompression limits (max 1MB compressed, 5MB uncompressed, 10x ratio) aborting malicious payloads."
      - subsection_id: "M01.4"
        name: "Linux AF_XDP Zero-Copy DMA & Cap'n Proto Wire Ingestion"
        subplan_target: "spec/subplans/M01_4_afxdp_zero_copy_ingest.subplan.md"
        scope: "AF_XDP socket driver with thread-local bump arenas reducing wire CPU from 38% to < 3.8%."
      - subsection_id: "M01.5"
        name: "Streaming Probabilistic Data Structures (CMS, HLL++, t-Digest)"
        subplan_target: "spec/subplans/M01_5_streaming_probabilistic_sketches.subplan.md"
        scope: "Deploy Count-Min Sketch (224 KB), HyperLogLog++ (12 KB), and t-Digest (3.2 KB) for real-time telemetry."
      - subsection_id: "M01.6"
        name: "Kingman's Heavy-Traffic Queue Delay Regulator & CoDel AQM"
        subplan_target: "spec/subplans/M01_6_kingman_queue_regulator.subplan.md"
        scope: "Enforce hard rho <= 0.80 utilization cap with CoDel active queue management (target: 5ms, interval: 100ms)."
    validation_gate:
      exit_criteria:
        - "Sustained throughput >= 100,000 events/sec with p99 latency <= 15ms and < 3.8% wire ingestion CPU overhead."
        - "100% of unsigned, forged, or replayed telemetry packets rejected across multi-AZ Envoy nodes."
        - "Decompression bomb payloads exceeding 5MB or 10x ratio aborted immediately without process crash."

  # =========================================================================
  # MILESTONE 2: RELATIONAL PERSISTENCE, TIMESCALE HYPERTABLES & POOL PHYSICS
  # =========================================================================
  - milestone_id: "M02_PERSISTENCE_AND_POOL_PHYSICS"
    phase_name: "Tactical DDD Aggregates, TimescaleDB Hypertables & PgBouncer Pool Sizing"
    objective: "Deploy PostgreSQL/TimescaleDB schema, configure 52-connection PgBouncer pool on 32 cores, and implement atomic fencing token leases."
    designated_skills:
      - "backend-design-and-data-model"
      - "performance-optimization"
      - "security-and-hardening"
      - "test-driven-development"
    input_contracts:
      prerequisite_files:
        - "spec/milestones/M01_ingress_verification.md"
        - "spec/backend_design_and_data_model.md"
        - "spec/prd.md"
      required_context: "PostgreSQL 16 with TimescaleDB extension running on port 5432."
    subsections:
      - subsection_id: "M02.1"
        name: "Tactical DDD Aggregate Root Relational DDL"
        subplan_target: "spec/subplans/M02_1_ddd_relational_schema.subplan.md"
        scope: "PostgreSQL 16 DDL for studios, games, game_sessions, balance_patches, ticket_proposals, simulation_runs."
      - subsection_id: "M02.2"
        name: "TimescaleDB Composite Hypertables & Covering Indexes"
        subplan_target: "spec/subplans/M02_2_timescale_hypertables.subplan.md"
        scope: "Hypertables partitioned on (studio_id, gateway_received_at, 1-day chunks) with composite covering index."
      - subsection_id: "M02.3"
        name: "PgBouncer Connection Pool Physics (Goetz Formula on 32 Cores)"
        subplan_target: "spec/subplans/M02_3_pgbouncer_pool_physics.subplan.md"
        scope: "Configure 52-connection pool cap on 32 cores (2 * 32 - 12 = 52) to eliminate queue thrashing."
      - subsection_id: "M02.4"
        name: "Multi-Tenant Context Isolation & RLS Leakage Defense"
        subplan_target: "spec/subplans/M02_4_tenant_rls_isolation.subplan.md"
        scope: "Configure server_reset_query = DISCARD ALL and transaction-scoped set_config RLS."
      - subsection_id: "M02.5"
        name: "Atomic Fencing-Token Distributed Lease State Machine"
        subplan_target: "spec/subplans/M02_5_fencing_token_leases.subplan.md"
        scope: "Monotonic fencing token coordinator for simulation_job_state using SELECT ... FOR UPDATE SKIP LOCKED."
      - subsection_id: "M02.6"
        name: "Transactional Outbox & Debezium CDC Event Bus"
        subplan_target: "spec/subplans/M02_6_transactional_outbox_cdc.subplan.md"
        scope: "Outbox table and Debezium CDC connector streaming domain events into Redpanda partitions."
    validation_gate:
      exit_criteria:
        - "PostgreSQL connection count remains strictly <= 52 under 1,000 concurrent client requests."
        - "Zero tenant context leakage between multiplexed PgBouncer client transactions."
        - "Concurrent simulation workers claiming expired leases are cleanly serialized via monotonic fencing tokens."

  # =========================================================================
  # MILESTONE 3: GRAPHRAG KNOWLEDGE TOPOLOGY & AST CONDENSATION
  # =========================================================================
  - milestone_id: "M03_GRAPHRAG_AND_AST_TOPOLOGY"
    phase_name: "Unreal Commandlet Reflection, Redirector Aliasing & Tarjan's SCC DAG"
    objective: "Extract Unreal Engine C++ AST/Blueprint schemas into Memgraph, resolve active redirectors, and condense cyclic dependencies into a strict DAG."
    designated_skills:
      - "source-driven-development"
      - "performance-optimization"
      - "systematic-debugging"
      - "test-driven-development"
    input_contracts:
      prerequisite_files:
        - "spec/milestones/M02_persistence_verification.md"
        - "spec/adr/002_graphrag_hybrid_topology.md"
        - "spec/GameOS_End_To_End_Architectural_Plan.md"
      required_context: "Memgraph v2.16 running on port 7687; Qdrant v1.10 running on port 6333."
    subsections:
      - subsection_id: "M03.1"
        name: "Unreal Engine C++ & Blueprint Headless Schema Reflector"
        subplan_target: "spec/subplans/M03_1_unreal_ast_reflector.subplan.md"
        scope: "Headless extractor parsing UClass, FProperty, and UDataTable into Parquet manifests."
      - subsection_id: "M03.2"
        name: "Active INI Redirector Normalizer & Symbol Aliasing"
        subplan_target: "spec/subplans/M03_2_ini_redirector_normalizer.subplan.md"
        scope: "Parse Config/Default*.ini active redirectors into in-memory alias map to resolve legacy symbols."
      - subsection_id: "M03.3"
        name: "Memgraph Property Graph Ingestion & Relationship Modeling"
        subplan_target: "spec/subplans/M03_3_memgraph_graph_ingestion.subplan.md"
        scope: "Ingest AST graph into Memgraph establishing DEPENDS_ON, MODIFIES, and EXPOSES edges."
      - subsection_id: "M03.4"
        name: "Tarjan's Strongly Connected Components (SCC) Cycle Condensation"
        subplan_target: "spec/subplans/M03_4_tarjan_scc_condensation.subplan.md"
        scope: "Condense circular C++ / Blueprint dependency loops into composite virtual nodes in a strict DAG."
      - subsection_id: "M03.5"
        name: "Qdrant Scalar Quantization (SQ int8) & Disk-Backed HNSW"
        subplan_target: "spec/subplans/M03_5_qdrant_sq_quantization.subplan.md"
        scope: "Index code embeddings in Qdrant with SQ int8 (3.0x oversample), reducing RAM by 75%."
      - subsection_id: "M03.6"
        name: "Atomic Dual-Write Saga & BLAKE3 Merkle Cache Invalidation"
        subplan_target: "spec/subplans/M03_6_atomic_dual_write_saga.subplan.md"
        scope: "Two-phase saga between Memgraph and Qdrant with deterministic UUIDv7 and BLAKE3 cache invalidation."
    validation_gate:
      exit_criteria:
        - "Tarjan engine condenses 100,000 AST nodes in < 350ms with zero memory leaks."
        - "Unreal redirectors correctly alias renamed properties to canonical AST nodes in openCypher traversals."
        - "Qdrant vector search retains > 99.2% Recall@10 with 75% RAM reduction via SQ int8."

  # =========================================================================
  # MILESTONE 4: RACK HEADLESS COMBAT SIMULATION ENGINE
  # =========================================================================
  - milestone_id: "M04_RACK_SIMULATION_AND_PHYSICS"
    phase_name: "Multi-Fidelity Monte Carlo, Q32.32 Fixed-Point & AVX-512 BVH16"
    objective: "Implement headless combat simulation executing 10,000 matches in < 120s via Multi-Fidelity Monte Carlo and AVX-512 SIMD BVH16."
    designated_skills:
      - "performance-optimization"
      - "systematic-debugging"
      - "test-driven-development"
      - "code-review-and-quality"
    input_contracts:
      prerequisite_files:
        - "spec/milestones/M03_graphrag_verification.md"
        - "spec/GameOS_Master_Software_Specification.md"
        - "spec/adr/003_headless_simulation_rust.md"
      required_context: "Rust 1.80 toolchain with AVX-512 / portable SIMD support enabled."
    subsections:
      - subsection_id: "M04.1"
        name: "Deterministic Q32.32 Fixed-Point Arithmetic Kernel"
        subplan_target: "spec/subplans/M04_1_q32_fixed_point_kernel.subplan.md"
        scope: "Implement Rust physics kernel using fixed::types::I64F32 and cordic with #![deny(clippy::float_arithmetic)]."
      - subsection_id: "M04.2"
        name: "Multi-Fidelity Monte Carlo (MFMC) Variance Reduction Engine"
        subplan_target: "spec/subplans/M04_2_mfmc_variance_reduction.subplan.md"
        scope: "Couple 1,000 high-fidelity physics runs with 9,000 low-fidelity ODE runs (rho >= 0.98, 89.1% CPU reduction)."
      - subsection_id: "M04.3"
        name: "AVX-512 SIMD BVH16 Spatial Acceleration Node"
        subplan_target: "spec/subplans/M04_3_avx512_bvh16_spatial_node.subplan.md"
        scope: "Structure-of-Arrays 64-byte aligned SimdBvh16Node evaluating 16 bounding boxes in a single SIMD pass."
      - subsection_id: "M04.4"
        name: "Continuous Collision Detection (CCD) Swept Raycasting"
        subplan_target: "spec/subplans/M04_4_ccd_swept_raycasting.subplan.md"
        scope: "Swept capsule queries eliminating tunneling at 1200 m/s; distance-sorted hit registration."
      - subsection_id: "M04.5"
        name: "Rayon Parallel Static Chunking & Philox4x32 PRNG Streamer"
        subplan_target: "spec/subplans/M04_5_rayon_philox_prng.subplan.md"
        scope: "Parallel iterators with par_chunks_exact and counter-based Philox4x32 PRNG seed streams."
      - subsection_id: "M04.6"
        name: "Gunther's Universal Scalability Law (USL) Concurrency Throttler"
        subplan_target: "spec/subplans/M04_6_usl_concurrency_throttler.subplan.md"
        scope: "Enforce thread pool limit at 64 cores based on USL parameters (sigma=0.04, kappa=0.0008)."
    validation_gate:
      exit_criteria:
        - "10,000 combat encounters completed in <= 120 seconds on 16 vCPUs (89.1% CPU reduction via MFMC)."
        - "100% bit-exact cross-platform determinism across x86_64 and ARM64 architecture nodes."
        - "Zero projectile tunneling during high-velocity (1200 m/s) Railgun continuous swept raycasts."

  # =========================================================================
  # MILESTONE 5: DECISION SCIENCE, 10x10 PRIORITIZATION & PRODPAD WORKFLOW
  # =========================================================================
  - milestone_id: "M05_PRODPAD_WORKFLOW_AND_PRIORITIZATION"
    phase_name: "10x10 Prioritization Matrix, CoPilot AI Triage & Now-Next-Later Roadmaps"
    objective: "Implement ProdPad-adapted live-ops product management engine, 10x10 effort/impact scoring, and closed-loop community feedback triage."
    designated_skills:
      - "api-and-interface-design"
      - "source-driven-development"
      - "test-driven-development"
    input_contracts:
      prerequisite_files:
        - "spec/milestones/M04_simulation_verification.md"
        - "spec/GameOS_ProdPad_Workflow_Specification.md"
        - "spec/prd.md"
      required_context: "Node.js / TypeScript microservice runtime running; Qdrant vector search available."
    subsections:
      - subsection_id: "M05.1"
        name: "10x10 Effort vs. Impact Mathematical Scoring Matrix"
        subplan_target: "spec/subplans/M05_1_10x10_scoring_matrix.subplan.md"
        scope: "Multi-dimensional scoring engine classifying tickets into Quick Wins, Major Projects, Fill-Ins, Time Sinks."
      - subsection_id: "M05.2"
        name: "Multi-Source Community Sentiment Ingestion Pipeline"
        subplan_target: "spec/subplans/M05_2_community_sentiment_pipeline.subplan.md"
        scope: "Parse and cluster unstructured feedback from Steam reviews, Discord channels, and Reddit subreddits."
      - subsection_id: "M05.3"
        name: "CoPilot AI Proposal Synthesizer with Simulation Proofs"
        subplan_target: "spec/subplans/M05_3_copilot_proposal_synthesizer.subplan.md"
        scope: "Generate validated balance patch proposals linking friction clusters, balance parameters, and RACK proofs."
      - subsection_id: "M05.4"
        name: "Now-Next-Later Horizon State Machine & Certainty Gates"
        subplan_target: "spec/subplans/M05_4_now_next_later_horizons.subplan.md"
        scope: "State machine enforcing certainty thresholds (Now: 90-100%, Next: 60-80%, Later: 20-40%)."
      - subsection_id: "M05.5"
        name: "Closed-Loop Automated Community Feedback Notifier"
        subplan_target: "spec/subplans/M05_5_community_feedback_loop_closure.subplan.md"
        scope: "Automated webhook and bot notifications to players when linked ideas transition to shipped."
    validation_gate:
      exit_criteria:
        - "100% of candidate tickets correctly classified into 10x10 quadrants based on quantitative impact and effort scores."
        - "CoPilot AI generates valid ticket proposals with linked RACK simulation proofs and sentiment citations."
        - "Now-Next-Later state transitions enforce minimum certainty thresholds before allowing advancement to delivery."

  # =========================================================================
  # MILESTONE 6: ENTERPRISE STUDIO TOOLCHAIN & PERSONA INTEGRATION
  # =========================================================================
  - milestone_id: "M06_ENTERPRISE_STUDIO_TOOLCHAIN"
    phase_name: "Unreal C++, Unity C#, Perforce Gate, Jira ADF & Slack/Discord Bots"
    objective: "Deploy complete cross-persona enterprise integration suite for Designers, Coders, PMs, Community Managers, and SREs."
    designated_skills:
      - "ci-cd-and-automation"
      - "git-workflow-and-versioning"
      - "api-and-interface-design"
      - "test-driven-development"
    input_contracts:
      prerequisite_files:
        - "spec/milestones/M05_prodpad_verification.md"
        - "spec/enterprise_studio_integration.md"
        - "spec/adr/004_agones_delivery_drain_fleet.md"
      required_context: "Unreal Engine 5.4 Editor, Unity 2022 LTS, Perforce Helix Core server, and Jira Cloud sandbox available."
    subsections:
      - subsection_id: "M06.1"
        name: "Unreal Engine 5 C++ UGameOSLiveOpsSubsystem (< 5ms Hot-Reload)"
        subplan_target: "spec/subplans/M06_1_ue5_liveops_subsystem.subplan.md"
        scope: "C++ engine subsystem reloading balance tables mid-match in < 5ms without frame hitch."
      - subsection_id: "M06.2"
        name: "Unity C# GameOSLiveOpsManager Dynamic Loader"
        subplan_target: "spec/subplans/M06_2_unity_liveops_manager.subplan.md"
        scope: "C# ScriptableObject runtime reconciler applying balance updates with zero GC allocations."
      - subsection_id: "M06.3"
        name: "Perforce Helix Core Virtual Stream Broker & 3-Way INI Reconciler"
        subplan_target: "spec/subplans/M06_3_perforce_virtual_stream_broker.subplan.md"
        scope: "p4_gameos_gate.py broker auto-merging disjoint INI sections and isolating collisions."
      - subsection_id: "M06.4"
        name: "Jira Cloud REST v3 Atlassian Document Format (ADF) Exporter"
        subplan_target: "spec/subplans/M06_4_jira_adf_exporter.subplan.md"
        scope: "Export 70+ backlog items with structured ADF payloads, 10x10 scoring, and simulation proof attachments."
      - subsection_id: "M06.5"
        name: "Discord & Slack Community/Studio Bots with Block Kit Modals"
        subplan_target: "spec/subplans/M06_5_discord_slack_bots.subplan.md"
        scope: "Slash command bots (/gameos-sentiment, /gameos-simulate) and 1-click canary approval modals."
      - subsection_id: "M06.6"
        name: "Agones Sidecar Helm Chart & Two-Phase Fleet Barrier"
        subplan_target: "spec/subplans/M06_6_agones_sidecar_drain_fleet.subplan.md"
        scope: "Two-Phase barrier (Prepare -> Ack -> Commit with 99.5% quorum) and 33ms watchdog self-quarantine."
    validation_gate:
      exit_criteria:
        - "Unreal and Unity in-memory parameter reloads complete in < 5ms without frame drop or engine restart."
        - "Perforce broker cleanly auto-merges disjoint INI sections and safely blocks identical key collisions for Lead Designer review."
        - "Sidecar self-quarantine watchdog autonomically reverts config within 500ms on simulated 33ms frame-time hitch."

  # =========================================================================
  # MILESTONE 7: FRONTEND COMMAND CENTER & REAL-TIME STATE MACHINE
  # =========================================================================
  - milestone_id: "M07_FRONTEND_UI_AND_STATE_MACHINE"
    phase_name: "React 19 Command Center with Lamport Version Clocks & Offline Sync"
    objective: "Build production live-ops UI across all 6 core states with Lamport clocks preventing WebSocket race conditions."
    designated_skills:
      - "frontend-ui-engineering"
      - "21st-ui-build"
      - "test-driven-development"
    input_contracts:
      prerequisite_files:
        - "spec/milestones/M06_toolchain_verification.md"
        - "spec/frontend_core_design_system.md"
        - "spec/app_flow_and_state_map.md"
        - "spec/ui_ux_design_brief.md"
      required_context: "Node.js 20 LTS, Vite 5 / Next.js 15, Tailwind CSS, and Radix UI primitives initialized."
    subsections:
      - subsection_id: "M07.1"
        name: "Next.js 15 App Scaffolding & Dark Modern Token System"
        subplan_target: "spec/subplans/M07_1_nextjs_design_tokens.subplan.md"
        scope: "Scaffold application with CSS custom properties, Tailwind variables, and JetBrains Mono typography."
      - subsection_id: "M07.2"
        name: "6-State Core Lifecycle View Implementation across All Screens"
        subplan_target: "spec/subplans/M07_2_six_state_views.subplan.md"
        scope: "Build Ideal, Loading, Empty, Validation, Error, and Offline views for all primary screens."
      - subsection_id: "M07.3"
        name: "Zustand Optimistic Reconciler & Lamport Monotonic Version Clocks"
        subplan_target: "spec/subplans/M07_3_lamport_clock_reconciler.subplan.md"
        scope: "State store with monotonic Lamport clocks preventing WebSocket burst race conditions and stale clobbering."
      - subsection_id: "M07.4"
        name: "Deterministic 3-Phase Offline Synchronization Protocol"
        subplan_target: "spec/subplans/M07_4_three_phase_offline_sync.subplan.md"
        scope: "Implement Phase 1 (Freeze/Buffer), Phase 2 (Flush Journal), Phase 3 (Monotonic Rebase)."
      - subsection_id: "M07.5"
        name: "WCAG 2.2 AA Contrast & Accessibility Verification Suite"
        subplan_target: "spec/subplans/M07_5_wcag_a11y_verification.subplan.md"
        scope: "Automated a11y audit verifying >= 4.5:1 text contrast, >= 3:1 UI boundaries, and full keyboard navigation."
    validation_gate:
      exit_criteria:
        - "LCP <= 1.8s, INP <= 120ms, CLS <= 0.03 across all routes."
        - "Zero visual rubberbanding or stale state clobbering during high-frequency WebSocket bursts."
        - "100% of interactive elements meet WCAG 2.2 AA contrast (>= 4.5:1 text, >= 3:1 UI)."

  # =========================================================================
  # MILESTONE 8: SRE OBSERVABILITY, POOL PHYSICS & PRODUCTION HARDENING
  # =========================================================================
  - milestone_id: "M08_SRE_TELEMETRY_AND_PRODUCTION_HARDENING"
    phase_name: "Multi-Burn-Rate Alerting, PgBouncer Pool Multiplexing & Hypertable Partitioning"
    objective: "Configure PgBouncer 52-connection cap on 32 cores, deploy PromQL multi-burn-rate alerts, and implement atomic fencing token leases."
    designated_skills:
      - "observability-and-instrumentation"
      - "ci-cd-and-automation"
      - "test-driven-development"
      - "cyber-security-frameworks"
      - "code-review-and-quality"
    input_contracts:
      prerequisite_files:
        - "spec/milestones/M07_frontend_verification.md"
        - "spec/hld_architecture.md"
        - "spec/GameOS_Corporate_Architecture_Report.md"
      required_context: "Prometheus, Grafana, PgBouncer, and PostgreSQL with TimescaleDB running."
    subsections:
      - subsection_id: "M08.1"
        name: "Prometheus Multi-Window Multi-Burn-Rate Alerting Rules"
        subplan_target: "spec/subplans/M08_1_promql_burn_rate_alerts.subplan.md"
        scope: "PromQL multi-window burn rate alerts (14.4x Sev-1 1h/5m, 6x Sev-1 6h/30m, 1x Sev-2 3d/3h) with low-QPS guards."
      - subsection_id: "M08.2"
        name: "OpenTelemetry Distributed Tracing & W3C TraceContext Propagation"
        subplan_target: "spec/subplans/M08_2_opentelemetry_tracing.subplan.md"
        scope: "W3C TraceContext propagation across Envoy, Redpanda, Simulation Nodes, and PgBouncer."
      - subsection_id: "M08.3"
        name: "Master 4-Tier TDD Test Suite Execution & Chaos Verification"
        subplan_target: "spec/subplans/M08_3_master_tdd_chaos_verification.subplan.md"
        scope: "Execute all Type 1 (Complexity), Type 2 (Logic), Type 3 (UI/Integration), and Type 4 (STRIDE Security) tests."
      - subsection_id: "M08.4"
        name: "Graphify AST Knowledge Graph Terminal Synchronization"
        subplan_target: "spec/subplans/M08_4_graphify_terminal_sync.subplan.md"
        scope: "Execute graphify update . and verify 100% connected components in graphify-out/manifest.json."
    validation_gate:
      exit_criteria:
        - "PostgreSQL connection count remains <= 52 under 1,000 concurrent client requests."
        - "Synthetic low-QPS faults produce zero false Sev-1 pages."
        - "Lease stealing race conditions completely eliminated via monotonic fencing token validation."
        - "Graphify AST graph updated with 100% connected components and zero orphaned symbols."
```

## 6. Embedded 4-Tier Test-Driven Development (TDD) Harness

Every milestone subsection incorporates all four testing tiers mandated by Rule 8 and `spec_universal/tdd_4tier_testing_template.md`.

```yaml
tdd_4tier_execution_harness:
  tier_1_space_and_time_complexity:
    mandate: "Verify Big-O scaling, performance.now() upper bounds, and memory ceiling."
    test_suites:
      - file: "tests/performance/afxdp_zero_copy_throughput.perf.test.ts"
        bound: "100,000 events/sec sustained; wire CPU overhead < 3.8%; heap allocations = 0 via bump arena."
      - file: "tests/performance/tarjan_scc_scaling.perf.test.ts"
        bound: "100,000 AST nodes condensed into strict DAG in < 350ms; memory variance < 25MB."
      - file: "tests/performance/mfmc_variance_reduction.perf.test.rs"
        bound: "10,000 matches executed via MFMC in <= 120s on 16 vCPUs (89.1% CPU reduction, rho >= 0.98)."
      - file: "tests/performance/qdrant_sq_quantization.perf.test.ts"
        bound: "Scalar Quantization int8 reduces vector RAM to <= 0.75 KB/vector while preserving > 99.2% Recall@10."
      - file: "tests/performance/kingman_queue_backpressure.perf.test.ts"
        bound: "Enforces rho <= 0.80 utilization cap; CoDel drops buffer bloat latency from 850ms to < 5ms."

  tier_2_operational_logic_and_domain_invariants:
    mandate: "Verify functional correctness, aggregate invariants, and deterministic outcomes."
    test_suites:
      - file: "tests/unit/aggregate_root_boundaries.test.ts"
        assertion: "Aggregates reference external roots by ID only; single aggregate mutation per TX enforced."
      - file: "tests/unit/ccd_swept_raycast_penetration.test.rs"
        assertion: "High-velocity projectiles (1200 m/s) trigger swept capsule queries; hits sorted strictly by distance t and armor rating."
      - file: "tests/unit/simulation_q32_determinism.test.rs"
        assertion: "Philox4x32 counter PRNG and Q32.32 fixed-point math deliver 100% bit-exact parity across x86 and ARM."
      - file: "tests/unit/unreal_redirector_aliasing.test.ts"
        assertion: "Active redirector map canonicalizes legacy property names to C++ AST nodes in openCypher queries."
      - file: "tests/unit/prodpad_10x10_classification.test.ts"
        assertion: "Effort and impact scores cleanly partition proposals into Quick Wins, Major Projects, Fill-Ins, and Time Sinks."

  tier_3_ui_and_integration_testing:
    mandate: "Verify 6 UI states, component lifecycles, route guards, and persona integration bridges."
    test_suites:
      - file: "tests/integration/ui_state_transitions.test.tsx"
        assertion: "All views render Ideal, Loading, Empty, Validation, Error, and Offline states accurately."
      - file: "tests/integration/ue_liveops_in_memory_reload.test.cpp"
        assertion: "UGameOSLiveOpsSubsystem reloads balance parameters mid-match in < 5ms without frame hitch."
      - file: "tests/integration/perforce_ast_ini_reconciler.test.py"
        assertion: "Disjoint sections auto-merge cleanly; identical key collisions safely abort and trigger review ticket."
      - file: "tests/integration/jira_adf_export_bridge.test.ts"
        assertion: "Export dispatches valid Atlassian Document Format payload and returns 201 Created in <= 1200ms."
      - file: "tests/integration/agones_fleet_drain_barrier.test.ts"
        assertion: "Two-Phase barrier commits only upon 99.5% pod ACK; live player sessions drain to zero disconnects."

  tier_4_qa_and_stride_security_hardening:
    mandate: "Verify adversarial resilience against STRIDE threats, OWASP Top 10 exploits, and race conditions."
    test_suites:
      - file: "tests/security/paseto_spiffe_attestation.security.test.ts"
        assertion: "Telemetry packets lacking valid PASETO v4 token bound to SPIFFE client SAN rejected at gateway (HTTP 401)."
      - file: "tests/security/redis_anti_replay_filter.security.test.ts"
        assertion: "Replayed telemetry packets within 30s window across multiple Envoy nodes rejected via Redis Sentinel Lua filter (HTTP 409)."
      - file: "tests/security/decompression_bomb_defense.security.test.ts"
        assertion: "Payloads exceeding 1MB compressed, 5MB uncompressed, or 10x expansion ratio aborted immediately."
      - file: "tests/security/pgbouncer_rls_leak_prevention.security.test.ts"
        assertion: "DISCARD ALL on connection return and transaction-scoped set_config prevent cross-tenant IDOR leakage."
      - file: "tests/security/simulation_lease_stealing_race.security.test.ts"
        assertion: "Concurrent workers claiming expired leases are serialized via FOR UPDATE SKIP LOCKED and fencing tokens."
```

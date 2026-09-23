# Technical Design & Tech Stack PRD — InterviewShield

> **Document Type:** LIVING Technical Design Specification
> **System Name:** InterviewShield — Multimodal Interview Integrity Platform
> **Architecture Standard:** Hybrid YAML Architecture per AGENTS.md Rule 6, Rule 7, Rule 31 & spec_universal/tech_stack_prd_template.md

## 1. Overview & Architectural Scope

```yaml
technical_overview:
  project_name: "InterviewShield"
  architecture_archetype: "Archetype 1: Monolithic Real-Time Telemetry & Event Sinks"
  compute_profile: "I/O-bound WebSocket event ingestion with client-side edge inference"
  target_deployment: "Single-Host Docker Compose / Linux Host"
  one_sentence_synthesis: >
    InterviewShield couples a high-performance React 18 browser client running local MediaPipe vision tasks
    with a unified TypeScript/Node.js 20 LTS server driving concurrent WebSocket event ingestion, deterministic
    risk fusion, and PostgreSQL 16 persistence.
```

## 2. Selection Criteria & Evaluation Weights

```yaml
selection_criteria:
  performance_and_latency:
    weight: 0.30
    criterion: "Sub-50ms server processing, zero frame drops in 2 FPS client loop, low memory footprint"
  maintainability_and_type_safety:
    weight: 0.25
    criterion: "End-to-end TypeScript types shared across client, server, and WebSocket protocol contracts"
  ecosystem_maturity:
    weight: 0.20
    criterion: "Production-tested libraries with high GitHub activity, stable LTS releases, and no deprecation notices"
  operational_simplicity:
    weight: 0.15
    criterion: "Zero distributed queue overhead (Kafka/RabbitMQ avoided for MVP), single process simplicity"
  licensing_and_compliance:
    weight: 0.10
    criterion: "Permissive licenses (MIT, Apache 2.0, BSD-3) allowing commercial distribution and auditing"
```

## 3. Technology Stack Breakdown & Matrix

```yaml
tech_stack_matrix:
  frontend_tier:
    language:
      decision: "TypeScript"
      version: "5.3.3"
      rationale: "Strict static typing eliminates runtime null references in high-frequency event loops"
      source: "https://www.typescriptlang.org/"
    framework:
      decision: "React"
      version: "18.2.0"
      rationale: "Concurrent rendering, battle-tested ecosystem, zero-leak virtual DOM diffing"
      alternatives_evaluated:
        - "Vue 3: Smaller footprint, but smaller ecosystem for MediaPipe task bindings"
        - "Svelte 4: Excellent compile-time reactivity, but less familiar for hackathon judging panels"
    build_tool:
      decision: "Vite"
      version: "5.1.4"
      rationale: "Sub-second HMR, native ES module transforms, lightweight production bundles"
      source: "https://vitejs.dev/"
    routing:
      decision: "React Router DOM"
      version: "6.22.1"
      rationale: "Declarative route guards, nested layouts for recruiter vs candidate experiences"
    styling_system:
      decision: "Vanilla CSS Modules + CSS Custom Properties"
      rationale: "Zero CSS-in-JS runtime overhead, perfect alignment with DESIGN.md token contracts"
    face_vision_runtime:
      decision: "@mediapipe/tasks-vision"
      version: "0.10.11"
      rationale: "Official Google Vision task running client-side via WebAssembly/WebGL with short-range face detection"
      alternatives_evaluated:
        - "face-api.js (TensorFlow.js): Abandoned upstream, 10x larger model size, slow initialization"
        - "tracking.js: Outdated Haar cascade heuristics, severe false positives in low light"
    audio_analysis:
      decision: "Native Web Audio API (AnalyserNode)"
      rationale: "Built into modern browsers, zero npm dependency footprint, hardware-accelerated FFT"

  backend_tier:
    runtime:
      decision: "Node.js LTS"
      version: "20.11.1"
      rationale: "Asynchronous event-driven I/O ideal for concurrent WebSockets, identical language to frontend"
      alternatives_evaluated:
        - "Go (Golang): Superior concurrency, but loses TypeScript shared types and increases code overhead"
        - "Python (FastAPI): Great for ML training, but slower WebSocket connection handling and dual-language repo"
    http_framework:
      decision: "Express.js"
      version: "4.18.2"
      rationale: "Minimal, predictable HTTP pipeline, universal middleware ecosystem"
    websocket_engine:
      decision: "ws"
      version: "8.16.0"
      rationale: "High-performance RFC 6455 compliant WebSocket implementation with zero Socket.IO bloat"
      alternatives_evaluated:
        - "Socket.IO: Introduces custom heartbeat protocol, polling fallbacks, and proprietary client libraries"
        - "uWebSockets.js: Extremely fast C++ bindings, but native compile friction across OS targets"
    data_validation:
      decision: "Zod"
      version: "3.22.4"
      rationale: "Composing runtime schema validation with automatic TypeScript type inference"
    logging_and_telemetry:
      decision: "Pino"
      version: "8.19.0"
      rationale: "Extremely fast, structured JSON logging with low CPU overhead"

  persistence_and_orm:
    database_engine:
      decision: "PostgreSQL"
      version: "16.2-alpine"
      rationale: "Strict relational integrity, ACID transactions, robust JSONB support for detector payloads"
      alternatives_evaluated:
        - "MongoDB: Document flexibility, but lacks strict relational foreign keys and transaction guarantees"
        - "SQLite: Zero network overhead, but lacks concurrent write locking and production scaling"
    orm_and_migrations:
      decision: "Prisma ORM"
      version: "5.10.2"
      rationale: "Declarative schema modeling, type-safe query generation, automated versioned migrations"
    evidence_storage:
      decision: "Local Filesystem with Abstracted Storage Interface"
      rationale: "Zero latency for MVP hackathon demo; interface permits seamless swap to S3/GCS post-MVP"

  devops_and_tooling:
    package_manager:
      decision: "npm Workspaces"
      version: "10.2.4"
      rationale: "Built into Node.js 20, zero installation hurdles for evaluators, seamless monorepo linking"
    testing_framework:
      decision: "Vitest + Supertest"
      version: "Vitest 1.3.1, Supertest 6.3.4"
      rationale: "Native TypeScript execution, blazing fast watch mode, shared config with Vite"
    containerization:
      decision: "Docker + Docker Compose"
      version: "Compose v2"
      rationale: "Single-command reproducible environment (`docker compose up`) encapsulating PostgreSQL and services"
```

## 4. Package Dependency Lock & Version Pinning Policy

```yaml
version_pinning_policy:
  enforcement_rule: "Strict exact pinning in package.json (no ^ or ~ wildcards on core dependencies)"
  registry_guard: "All artifacts resolved strictly through registry.npmjs.org; zero git/tarball references"
  cve_scanning: "Pre-commit hook and CI run 'npm audit --audit-level=high' to block vulnerable packages"
```

## 5. Architectural Decision Log (ADR Cross-Reference)

```yaml
adr_index:
  - id: "ADR-001"
    title: "Monolithic Architecture over Microservices"
    status: "Accepted"
    file: "spec/adr/ADR-001-monolithic-architecture.md"
  - id: "ADR-002"
    title: "Deterministic Rule-Based Risk Engine over Opaque ML"
    status: "Accepted"
    file: "spec/adr/ADR-002-deterministic-scoring-engine.md"
  - id: "ADR-003"
    title: "Client-Side Edge Inference for Privacy and Cost"
    status: "Accepted"
    file: "spec/adr/ADR-003-client-side-detection-privacy.md"
  - id: "ADR-004"
    title: "Raw WebSocket Protocol with Client Sequence Buffering"
    status: "Accepted"
    file: "spec/adr/ADR-004-websocket-event-streaming.md"
```

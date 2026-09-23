# Project Specifications (`spec/`) — InterviewShield

> **Document Type:** Specification Suite Index & Navigation Matrix
> **System Name:** InterviewShield — Multimodal Interview Integrity & Evidence Platform
> **Architecture Standard:** Rule 30 & Rule 31 Phase-to-Spec Routing Matrix

```yaml
specification_suite_index:
  canonical_design_system:
    file: "DESIGN.md"
    description: "Root design system: design tokens, typography, semantic risk colors, anti-slop codex, and WCAG 2.2 AA contracts."
    lifecycle_type: "ANCHOR"

  phase_1_product_definition:
    file: "spec/prd.md"
    title: "01. Product Requirements Document (PRD)"
    description: "Problem statement, user personas, non-goals, functional requirements, and acceptance criteria."
    lifecycle_type: "ANCHOR"

  phase_2_tech_stack_selection:
    baseline_file: "spec/tech_stack.md"
    title: "02. Technical Design & Tech Stack PRD"
    description: "Technology selection, runtime bounds, exact version pinning, and ecosystem evaluation."
    lifecycle_type: "LIVING"
    adrs:
      - file: "spec/adr/ADR-001-monolithic-architecture.md"
        title: "ADR-001: Monolithic Architecture over Microservices"
      - file: "spec/adr/ADR-002-deterministic-scoring-engine.md"
        title: "ADR-002: Deterministic Rule-Based Risk Engine over Opaque ML"
      - file: "spec/adr/ADR-003-client-side-detection-privacy.md"
        title: "ADR-003: Client-Side Edge Inference for Privacy and Scalability"
      - file: "spec/adr/ADR-004-websocket-event-streaming.md"
        title: "ADR-004: Raw WebSocket Protocol with Client Sequence Buffering"

  phase_3_macro_system_architecture:
    file: "spec/hld_architecture.md"
    title: "03. High-Level Design (HLD) & Macro System Architecture"
    description: "System topology, ingress proxies, capacity math (QPS/storage/RAM), data flow, and SPOF mitigations."
    lifecycle_type: "LIVING"

  phase_4_user_journeys_and_state:
    file: "spec/app_flow_and_state_map.md"
    title: "04. App Flow & State Map"
    description: "Route inventory, route guards, detailed screen contracts across all 6 core UI states, and user journeys."
    lifecycle_type: "LIVING"

  phase_5_visual_system_design:
    file: "spec/ui_ux_design_brief.md"
    title: "05. UI/UX Design Brief"
    description: "Visual direction, design tokens, typography scale, component specs, and WCAG 2.2 AA accessibility."
    lifecycle_type: "ANCHOR"

  phase_6_domain_modeling_persistence:
    file: "spec/backend_design_and_data_model.md"
    title: "06. Backend Design & Data Model"
    description: "Tactical DDD aggregate roots, YAML/SQL relational schemas, secondary index math, pool physics, and RBAC matrix."
    lifecycle_type: "LIVING"

  phase_7_master_execution_task_list:
    file: "spec/master_milestone_execution_task_list.md"
    title: "07. Master Milestone Execution Task List"
    description: "Granular dependency-ordered execution roadmap mapping all 11 PPT slides and specifications into 48 verified subsections across M00-M08."
    lifecycle_type: "LIVING"

  phase_7_engineering_implementation_plan:
    file: "spec/implementation_plan.md"
    title: "07b. Engineering Implementation Plan"
    description: "Milestones M00-M08 with Hybrid YAML schema, embedded 4-tier TDD, rollback plans, and designated skill mappings."
    lifecycle_type: "LIVING"

  phase_8_production_operations_sre:
    file: "spec/operations_telemetry_and_sre.md"
    title: "08. Production Operations, Telemetry & SRE"
    description: "Multi-burn-rate PromQL alerting, RED/USE metrics, W3C distributed tracing, 3-tier health probes, zero-502 rolling deploys, and GDPR."
    lifecycle_type: "LIVING"

  cross_phase_standards:
    file: "spec/authoritative_references_and_standards.md"
    title: "09. Authoritative References & Standards"
    description: "Industry literature grounding: OWASP ASVS 4.0, W3C WCAG 2.2, Azure Well-Architected Framework, Microsoft Patterns."
    lifecycle_type: "ANCHOR"
```

# Authoritative References & Standards — InterviewShield

> **Document Type:** ANCHOR Standards & Frameworks Specification
> **System Name:** InterviewShield — Multimodal Interview Integrity & Evidence Platform
> **Architecture Standard:** Hybrid YAML Architecture per AGENTS.md Rule 6 & Rule 31

## 1. Engineering Framework Baseline

```yaml
authoritative_frameworks:
  application_security:
    standard: "OWASP Application Security Verification Standard (ASVS) 4.0 Level 2"
    citations:
      - standard_id: "ASVS-V2-Authentication"
        application: "Bcrypt cost factor 12, generic 401 response messages, 24h JWT expiration."
      - standard_id: "ASVS-V3-Session-Management"
        application: "Session tokens scoped exclusively to session ID, WSS heartbeat timeouts."
      - standard_id: "ASVS-V4-Access-Control"
        application: "Server-side tenancy enforcement (WHERE recruiter_id = jwt.sub) preventing IDOR."
      - standard_id: "ASVS-V5-Validation-Sanitization"
        application: "Zod runtime schema parsing on all HTTP and WebSocket payloads."
      - standard_id: "ASVS-V13-API-Security"
        application: "JSON schema verification, strict Content-Type headers, rate-limiting."

  accessibility_and_ergonomics:
    standard: "W3C Web Content Accessibility Guidelines (WCAG) 2.2 Level AA"
    citations:
      - standard_id: "WCAG-1.4.3-Contrast"
        application: "Text contrast >= 4.5:1 against dark slate canvas across all components."
      - standard_id: "WCAG-2.1.1-Keyboard"
        application: "All interactive controls reachable via Tab/Enter/Space without pointer."
      - standard_id: "WCAG-2.4.7-Focus-Visible"
        application: "High-contrast 2px focus ring indicator on all interactive DOM nodes."
      - standard_id: "WCAG-2.5.8-Target-Size"
        application: "Minimum 44x44px bounding box on all touch and pointer targets."
      - standard_id: "WCAG-2.2.2-Pause-Stop-Hide"
        application: "Honoring prefers-reduced-motion for gauge and drawer transitions."

  cloud_architecture_and_reliability:
    standard: "Microsoft Azure Well-Architected Framework & Google SRE Principles"
    citations:
      - standard_id: "Reliability-SRE-MultiBurnRate"
        application: "Multi-window multi-burn-rate PromQL alerting on WebSocket message ingestion."
      - standard_id: "Operational-Excellence-Probes"
        application: "3-tier health probes (Liveness, Readiness, Startup) and 15s preStop hooks."
      - standard_id: "Security-Data-At-Rest"
        application: "Encrypted PostgreSQL volumes and UUID-based filesystem isolation."
      - standard_id: "Cost-Optimization-FinOps"
        application: "Local client inference eliminating cloud GPU clusters and high bandwidth bills."
```

## 2. Universal Standards Cross-Reference Matrix

```yaml
cross_reference_matrix:
  spec_universal_references:
    - universal_file: "spec_universal/tdd_4tier_testing_template.md"
      binding: "Directly embedded into spec/implementation_plan.md and test suites."
    - universal_file: "spec_universal/frontend_design_bible.md"
      binding: "Bound via root DESIGN.md and spec/ui_ux_design_brief.md token hierarchies."
    - universal_file: "spec_universal/system_design/01_non_negotiable_rules_and_principles.md"
      binding: "Guided capacity math, QPS estimation, and latency budgets in spec/hld_architecture.md."
    - universal_file: "spec_universal/system_design/03_low_level_design_and_object_oriented_architecture.md"
      binding: "Guided aggregate roots and pool math in spec/backend_design_and_data_model.md."
    - universal_file: "spec_universal/system_design/06_observability_telemetry_and_reliability_engineering.md"
      binding: "Guided PromQL multi-burn-rate alerts in spec/operations_telemetry_and_sre.md."
```

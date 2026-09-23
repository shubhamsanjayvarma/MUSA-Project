# UI/UX Design Brief — InterviewShield

> **Document Type:** ANCHOR Visual System Specification
> **System Name:** InterviewShield — Multimodal Interview Integrity & Evidence Platform
> **Architecture Standard:** Hybrid YAML Architecture per AGENTS.md Rule 6, Rule 31 & Rule 34

## 1. Visual Direction & Aesthetic Mandate

```yaml
visual_direction:
  aesthetic_governor: "minimalist-ui"
  brand_tone_adjectives:
    - "Utilitarian"
    - "Transparent"
    - "Objective"
  experience_archetype: "Mission-critical analytical dashboard / High-legibility technical workstation"
  design_principles:
    1_zero_ambient_distraction: "Every visual element serves an operational verification purpose. No decorative background blobs or floating mockups."
    2_objective_color_signaling: "Colors strictly encode semantic state: Green (Normal), Yellow (Attention), Orange (Suspicious), Red (High Risk)."
    3_monospace_telemetry_primacy: "All timestamps, sequence numbers, confidence values, and mathematical deductions render in monospace typography."
    4_layout_stability_under_streaming: "Zero Cumulative Layout Shift (CLS <= 0.01). Fixed height containers for timeline and gauges to prevent stream jitter."
```

## 2. Token Architecture & Color Semantics

```yaml
token_architecture:
  surface_hierarchy:
    canvas_root: "var(--color-slate-950) (#090d16) — Deep navy background creating natural contrast"
    panel_surface: "var(--color-slate-900) (#0f172a) — Distinct card background with 1px border"
    elevated_surface: "var(--color-slate-850) (#141e33) — Interactive rows and modal containers"
    border_subtle: "var(--color-slate-800) (#1e293b) — Boundary division between components"
    border_focus: "var(--color-blue-500) (#3b82f6) — 2px high-visibility accessibility ring"

  typography_tokens:
    font_sans: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    font_mono: "'JetBrains Mono', 'Fira Code', Menlo, monospace"
    hierarchy:
      h1_screen_title: { size: "24px", weight: 600, line_height: "32px", tracking: "-0.02em" }
      h2_section_header: { size: "18px", weight: 600, line_height: "24px", tracking: "-0.01em" }
      h3_card_title: { size: "14px", weight: 600, line_height: "20px", tracking: "0" }
      body_regular: { size: "14px", weight: 400, line_height: "20px", color: "var(--color-slate-200)" }
      body_muted: { size: "13px", weight: 400, line_height: "18px", color: "var(--color-slate-400)" }
      telemetry_code: { size: "12px", weight: 500, line_height: "16px", font: "mono" }
      score_display_large: { size: "48px", weight: 700, line_height: "52px", font: "mono" }

  risk_and_severity_palette:
    normal_tier:
      fg: "#34d399"
      bg: "rgba(16, 185, 129, 0.12)"
      border: "rgba(16, 185, 129, 0.3)"
      label: "NORMAL (80-100)"
    attention_tier:
      fg: "#fbbf24"
      bg: "rgba(245, 158, 11, 0.12)"
      border: "rgba(245, 158, 11, 0.3)"
      label: "ATTENTION (60-79)"
    suspicious_tier:
      fg: "#fb923c"
      bg: "rgba(249, 115, 22, 0.12)"
      border: "rgba(249, 115, 22, 0.3)"
      label: "SUSPICIOUS (40-59)"
    high_risk_tier:
      fg: "#fb7185"
      bg: "rgba(244, 63, 94, 0.12)"
      border: "rgba(244, 63, 94, 0.3)"
      label: "HIGH RISK (0-39)"
```

## 3. Component Interaction Specifications

```yaml
component_specifications:
  candidate_camera_preview:
    container: "Aspect ratio 16:9, max-width 640px, centered horizontally"
    border: "1px solid var(--color-slate-800) with rounded-lg (8px)"
    mirroring: "transform: scaleX(-1) applied to video element for natural candidate self-view"
    status_overlay: "Top-left chip rendering live status dot and active duration timer"

  integrity_score_gauge:
    container: "280px x 180px fixed dimension card"
    gauge_type: "Radial semi-circle SVG progress arc"
    numeric_display: "48px JetBrains Mono centered with color matching active risk tier"
    badge: "Pill chip directly below score displaying uppercase risk state"
    animation: "CSS stroke-dashoffset transition over 400ms cubic-bezier(0.16, 1, 0.3, 1)"

  chronological_event_timeline:
    container: "Scrollable vertical list with sticky minute group headers"
    row_layout: "Fixed height 48px row displaying: [Severity Dot] [HH:MM:SS] [Event Name] [Confidence Chip] [Arrow CTA]"
    hover_interaction: "Background tint shifts to slate-850; cursor pointer"
    expand_behavior: "Clicking row reveals inline evidence drawer with 320x240 snapshot thumbnail and JSON payload"

  review_decision_controls:
    layout: "Horizontal button group with segmented pill indicators"
    options:
      - id: "pass"
        label: "Pass Interview"
        active_class: "bg-emerald-500/20 text-emerald-400 border-emerald-500"
      - id: "flag"
        label: "Flag for Review"
        active_class: "bg-amber-500/20 text-amber-400 border-amber-500"
      - id: "inconclusive"
        label: "Inconclusive"
        active_class: "bg-slate-500/20 text-slate-400 border-slate-500"
    notes_textarea: "Full-width textarea with placeholder 'Provide detailed context for your review decision...'"
```

## 4. Accessibility (WCAG 2.2 Level AA) & Ergonomic Contract

```yaml
accessibility_and_responsive_contract:
  contrast_verification:
    body_text_on_canvas: "Slate-200 (#e2e8f0) on Slate-950 (#090d16) = 13.8:1 (Exceeds 4.5:1 requirement)"
    muted_text_on_canvas: "Slate-400 (#94a3b8) on Slate-950 (#090d16) = 6.2:1 (Exceeds 4.5:1 requirement)"
    risk_badges: "All risk tier badge text meets minimum 4.5:1 contrast against badge background"

  keyboard_and_focus:
    tab_navigation: "Strict logical DOM tab index matching visual reading order"
    focus_ring: "2px solid var(--color-blue-500) with 2px offset on all interactive buttons, inputs, and rows"
    modal_dialogs: "Focus trapped inside evidence viewer modal until Escape or Close button pressed"

  motion_and_responsive_bounds:
    reduced_motion: "@media (prefers-reduced-motion: reduce) disables all gauge transitions and drawer animations"
    touch_targets: "All interactive controls satisfy minimum 44px x 44px hit-box requirements"
    breakpoint_adaptations:
      desktop_ge_1024px: "Two-column side-by-side dashboard (Gauge/Info left, Timeline/Review right)"
      mobile_lt_640px: "Single-column stacked layout with collapsible timeline sections"
```

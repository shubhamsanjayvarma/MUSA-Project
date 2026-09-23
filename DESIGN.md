# InterviewShield — Canonical Design System & Token Specifications

> **System Purpose:** Design System, Primitive Tokens, Semantic Mappings, Component Specifications, and Anti-Slop Ergonomics for InterviewShield.
> **Design Assets Anchor:** `assets/Design (1).md`, `assets/general-team-settings-dashboard.tailwind-v4.Woblo.css`, `assets/general-team-settings-dashboard.shadcn.Woblo.css`, `assets/general-team-settings-dashboard.dtcg.Woblo.tokens.json`.
> **Compliance:** WCAG 2.2 Level AA, Rule 34 Zero-Primitive Ingestion Invariant, Hybrid YAML Architecture.

## 1. Executive Aesthetic Architecture

```yaml
design_direction:
  aesthetic_governor: "minimalist-ui"
  visual_tone:
    - "Clean, high-density editorial telemetry"
    - "Calm, objective assessment environment"
    - "High-legibility monospace signals with zero ambient visual noise"
  anti_generic_ai_rules:
    - "Zero purple radial glows or decorative gradient blobs"
    - "Zero isometric floating mockups or generic marketing icons"
    - "Zero monotonous 3-column AI template card layouts"
    - "Zero low-contrast disabled text (< 4.5:1 ratio)"
    - "Zero layout shifts (CLS = 0.000) during streaming data or frame ingestion"
  core_layout_principles:
    density: "Compact professional interface optimized for multi-signal inspection"
    viewport_support:
      mobile: "< 640px"
      tablet: "640px - 1024px"
      desktop: ">= 1024px"
```

## 2. Primitive & Semantic Design Tokens

```yaml
design_tokens:
  oklch_primitive_palette:
    brand:
      50: "oklch(0.9665 0.023 220.7)"
      100: "oklch(0.9347 0.0366 235.5)"
      200: "oklch(0.8944 0.0572 240.5)"
      300: "oklch(0.8236 0.0944 245.4)"
      400: "oklch(0.7173 0.1522 251.0)"
      500: "oklch(0.6292 0.1525 251.0)"
      600: "oklch(0.5206 0.1401 251.0)"
      700: "oklch(0.4216 0.1257 251.9)"
      800: "oklch(0.3250 0.1111 256.0)"
      900: "oklch(0.2285 0.0954 260.4)"
      950: "oklch(0.1372 0.0736 263.5)"
    neutral:
      50: "oklch(0.9702 0 0)"
      100: "oklch(0.9401 0 0)"
      200: "oklch(0.9006 0 0)"
      300: "oklch(0.8297 0 0)"
      400: "oklch(0.7412 0 0)"
      500: "oklch(0.6301 0 0)"
      600: "oklch(0.5208 0 0)"
      700: "oklch(0.4202 0 0)"
      800: "oklch(0.3211 0 0)"
      900: "oklch(0.2221 0 0)"
      950: "oklch(0.1286 0 0)"

  hex_palette:
    slate_950: "#090d16"
    slate_900: "#0f172a"
    slate_850: "#141e33"
    slate_800: "#1e293b"
    slate_700: "#334155"
    slate_600: "#475569"
    slate_400: "#94a3b8"
    slate_200: "#e2e8f0"
    slate_50: "#f8fafc"
    emerald_500: "#10b981"
    emerald_400: "#34d399"
    amber_500: "#f59e0b"
    amber_400: "#fbbf24"
    orange_500: "#f97316"
    orange_400: "#fb923c"
    rose_500: "#f43f5e"
    rose_400: "#fb7185"
    blue_600: "#2563eb"
    blue_500: "#3b82f6"
    blue_400: "#60a5fa"

  semantic_tokens:
    surface:
      canvas: "var(--color-slate-950)"
      card_default: "var(--color-slate-900)"
      card_elevated: "var(--color-slate-850)"
      overlay: "rgba(9, 13, 22, 0.85)"
      border_subpixel: "rgba(255, 255, 255, 0.14) 0px 0px 0px 1px"
      border_subtle: "var(--color-slate-800)"
      border_strong: "var(--color-slate-700)"
    text:
      primary: "var(--color-slate-50)"
      secondary: "var(--color-slate-400)"
      muted: "var(--color-slate-600)"
      inverse: "var(--color-slate-950)"
    telemetry_risk_state:
      normal:
        foreground: "var(--color-emerald-400)"
        surface: "rgba(16, 185, 129, 0.12)"
        border: "rgba(16, 185, 129, 0.3)"
      attention:
        foreground: "var(--color-amber-400)"
        surface: "rgba(245, 158, 11, 0.12)"
        border: "rgba(245, 158, 11, 0.3)"
      suspicious:
        foreground: "var(--color-orange-400)"
        surface: "rgba(249, 115, 22, 0.12)"
        border: "rgba(249, 115, 22, 0.3)"
      high_risk:
        foreground: "var(--color-rose-400)"
        surface: "rgba(244, 63, 94, 0.12)"
        border: "rgba(244, 63, 94, 0.3)"
    event_severity:
      info: "var(--color-slate-400)"
      low: "var(--color-blue-400)"
      medium: "var(--color-amber-400)"
      high: "var(--color-orange-400)"
      critical: "var(--color-rose-400)"

  typography:
    font_families:
      sans: "'GeistSans', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
      mono: "'Geist Mono', 'JetBrains Mono', 'Fira Code', Menlo, monospace"
    scale:
      text_11px:
        size: "0.6875rem" # 11px
        line_height: "1rem"
        letter_spacing: "0.01em"
      text_12px:
        size: "0.75rem" # 12px
        line_height: "1.125rem"
        letter_spacing: "0.005em"
      text_13px:
        size: "0.8125rem" # 13px (Base table density)
        line_height: "1.25rem"
        letter_spacing: "0"
      text_14px:
        size: "0.875rem" # 14px
        line_height: "1.375rem"
        letter_spacing: "-0.01em"
      text_16px:
        size: "1.0rem" # 16px
        line_height: "1.5rem"
        letter_spacing: "-0.015em"
      text_20px:
        size: "1.25rem" # 20px
        line_height: "1.75rem"
        letter_spacing: "-0.02em"
      gauge_value:
        size: "48px"
        line_height: "52px"
        letter_spacing: "-0.04em"
        font_family: "mono"

  geometry_and_elevation:
    spacing_scale_px:
      space_1: 4
      space_2: 8
      space_3: 12
      space_4: 16
      space_5: 20
      space_6: 24
      space_8: 32
      space_10: 40
      space_12: 48
    radii_px:
      subtle: 4
      standard: 6 # 0.375rem
      elevated: 8 # 0.5rem
      pill: 9999
    shadows:
      subpixel_border: "rgba(255, 255, 255, 0.14) 0px 0px 0px 1px"
      elevation_md: "rgba(0, 0, 0, 0.24) 0px 0px 3px -1px, rgba(0, 0, 0, 0.16) 0px 0px 0.5px 0px, rgba(0, 0, 0, 0.36) -0.5px 2px 3px -2px"
      focus_ring: "0 0 0 2px var(--color-slate-950), 0 0 0 4px var(--color-blue-500)"
```

## 3. Component Interaction Contracts & Accessibility Standards

```yaml
component_contracts:
  integrity_score_gauge:
    element: "<IntegrityScoreCard />"
    bounding_box: "280px x 180px fixed container to prevent CLS"
    states:
      score_render: "Real-time CSS variable interpolation: stroke-dashoffset transition 400ms cubic-bezier(0.16, 1, 0.3, 1)"
      state_badge: "High-contrast semantic pill badge rendering NORMAL | ATTENTION | SUSPICIOUS | HIGH_RISK"
    a11y:
      role: "region"
      aria_label: "Candidate Integrity Score Gauge"
      aria_live: "polite"

  event_timeline:
    element: "<EventTimeline />"
    virtualization_threshold: "Virtualize with fixed item height (48px) when event count > 50"
    layout: "Two-column grid: timestamp/severity left (120px fixed monospace), explanation and badge right"
    expandable_drawer: "Clicking row reveals structured JSON payload and captured evidence snapshot"

  evidence_viewer:
    element: "<EvidenceViewer />"
    dimensions: "320px x 240px container with 4:3 aspect ratio"
    privacy_blur: "Configurable recruiter toggle with unblur on hover/focus"
    image_specs: "Format: image/jpeg, max-size: 50KB, alt attribute: '[Timestamp] Anomaly Frame Snapshot'"

  review_control_panel:
    element: "<ReviewPanel />"
    button_group:
      - id: "pass_btn"
        label: "Pass Session"
        color: "emerald"
      - id: "flag_btn"
        label: "Flag for Scrutiny"
        color: "amber"
      - id: "inconclusive_btn"
        label: "Inconclusive"
        color: "slate"
    required_field: "Review notes required if decision is 'flag' (min length: 10 chars)"

accessibility_wcag_aa_checklist:
  contrast_ratio: "Minimum 4.5:1 for body and badge text; minimum 3:1 for graphical UI components and subpixel borders"
  focus_ring_management: "Strict focus visible indicator on all interactive buttons, inputs, and timeline rows"
  motion_budget: "@media (prefers-reduced-motion: reduce) overrides all transitions to 0ms duration"
  touch_targets: "All buttons and clickable chips meet 44px x 44px hit-box minimum"
  screen_readers: "Aria live regions announce risk state transitions and connection dropouts"
```

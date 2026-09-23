# ADR-002: Deterministic Rule-Based Risk Engine over Opaque ML

> **Status:** Accepted
> **Context:** Scoring and anomaly evaluation methodology for InterviewShield.

```yaml
adr_record:
  adr_id: "ADR-002"
  title: "Deterministic Rule-Based Risk Engine over Opaque ML"
  status: "Accepted"
  date: "2026-09-23"
  decision_makers:
    - "System Architect"
    - "AI Ethics Reviewer"

  context_and_problem_statement: >
    Interview integrity systems often use machine learning classifiers to predict 'cheating probability'.
    However, black-box ML scoring produces opaque verdicts, unpredictable false positives, hallucinations,
    legal compliance liabilities, and non-reproducible test failures. The scoring system must produce
    defensible, explainable results for recruiters.

  options_considered:
    option_1_ml_neural_classifier:
      description: "Train a neural network or random forest on temporal event vectors to output a 0-1 cheating probability."
      pros:
        - "Can discover non-linear combinations of signals"
      cons:
        - "Zero explainability: cannot provide human-readable math for why a candidate scored 65 vs 80"
        - "Training data scarcity: synthetic cheating datasets do not generalize to real interview behavior"
        - "High inference overhead and non-deterministic behavior across runs"
        - "Violates Product Principle 3: Explainable over accurate"

    option_2_deterministic_weighted_state_machine:
      description: "Pure mathematical function with configurable weights, confidence scaling, event cooldowns, and clean-time recovery."
      pros:
        - "100% deterministic and reproducible across all unit and integration tests"
        - "Every score deduction produces an exact human-readable narrative string"
        - "Pure function signature: calculateRisk(state, event, config) -> result with zero side effects"
        - "Sub-millisecond execution time (< 1ms)"
        - "Configurable thresholds and weights via JSON/YAML config"
      cons:
        - "Complex non-linear combinations require explicit rule modeling"

  decision_outcome:
    chosen_option: "Option 2: Deterministic Weighted State Machine"
    rationale: >
      A deterministic rule-based engine grounds every score change in empirical mathematics:
      actualDeduction = weight * confidence. Cooldowns prevent oscillating penalties, and clean-time
      recovery ensures accidental brief tab switches do not permanently destroy a candidate's session.

  consequences:
    positive:
      - "Recruiters can see exactly which event, timestamp, and confidence caused each point drop"
      - "Auditors can verify that identical event sequences produce identical score trajectories"
      - "Zero GPU or heavy ML runtime required on backend"
    negative:
      - "Weights must be calibrated manually by domain experts rather than learned automatically"

  revisit_triggers:
    - "Empirical dataset of 10,000+ audited interview sessions becomes available for supervised calibration"
```

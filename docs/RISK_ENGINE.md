# InterviewShield — Risk Engine Specification

> **Project**: InterviewShield — MUSA CodeX 2026 Round 2
> **Team**: Harrington's Tech
> **Version**: 1.0 — MVP

---

## 1. Core Principles

The risk engine is the server-side module that fuses detection events into an integrity score with explainable reasoning. It follows these non-negotiable principles:

1. **Deterministic** — given the same sequence of events and configuration, the engine always produces the same score. No randomness, no ML.
2. **Explainable** — every score change has a human-readable reason. No black-box verdicts.
3. **Configurable** — all weights, thresholds, and cooldowns are defined in configuration, not hard-coded.
4. **Pure function** — the core calculation has no side effects, no database access. Fully unit-testable.
5. **Advisory only** — the score is an input to human review, never an automated decision.

---

## 2. Scoring Model

### Initial Score
Every session starts with an integrity score of **100** (full integrity, no anomalies).

### Score Direction
Events **deduct** from the score. The score decreases as anomalies accumulate. Clean behavior allows partial recovery.

### Score Bounds
Score is always clamped to **[0, 100]**. It can never go negative or exceed 100.

---

## 3. Event Weights

Each detection event type has a configured **weight** (negative value representing the deduction) and a **cooldown** period (minimum time before the same event type can deduct again).

| Event Type | Weight (deduction) | Severity | Cooldown (s) | Rationale |
|---|---|---|---|---|
| `face_absent` | -5 | medium | 10 | Temporary absence is common (sneezing, reaching for water) |
| `multiple_faces` | -15 | high | 30 | Strong indicator of another person present |
| `tab_hidden` | -10 | high | 5 | Switching tabs during interview is notable |
| `screen_share_stopped` | -20 | critical | 0 (none) | Revoking screen share is the strongest signal |
| `face_orientation_off` | -3 | low | 15 | Looking away briefly is normal; sustained is notable |
| `av_mismatch` | -8 | medium | 20 | Audio-visual inconsistency is a moderate signal |
| `audio_silence_extended` | -2 | low | 60 | Long silence is weakly suspicious |

### Weight Adjustment by Confidence
The actual deduction is scaled by the event's confidence value:

```
actualDeduction = weight × confidence
```

Example: `face_absent` with confidence 0.8 → deduction = -5 × 0.8 = -4

### Configuration Type

```typescript
interface RiskWeightConfig {
  weights: Record<string, number>;
  cooldowns: Record<string, number>;
  recoveryRate: number;        // points recovered per clean minute
  initialScore: number;        // starting score (default: 100)
  thresholds: RiskStateThresholds;
}

interface RiskStateThresholds {
  normal: number;      // score >= this → normal (default: 80)
  attention: number;   // score >= this → attention (default: 60)
  suspicious: number;  // score >= this → suspicious (default: 40)
  // Below suspicious threshold → high_risk
}
```

### Default Configuration

```typescript
const DEFAULT_RISK_CONFIG: RiskWeightConfig = {
  weights: {
    face_absent: -5,
    multiple_faces: -15,
    tab_hidden: -10,
    screen_share_stopped: -20,
    face_orientation_off: -3,
    av_mismatch: -8,
    audio_silence_extended: -2,
  },
  cooldowns: {
    face_absent: 10,
    multiple_faces: 30,
    tab_hidden: 5,
    screen_share_stopped: 0,
    face_orientation_off: 15,
    av_mismatch: 20,
    audio_silence_extended: 60,
  },
  recoveryRate: 2,       // +2 points per clean minute
  initialScore: 100,
  thresholds: {
    normal: 80,
    attention: 60,
    suspicious: 40,
  },
};
```

---

## 4. Risk States

The integrity score maps to a categorical risk state for quick visual assessment.

| State | Score Range | Color | Icon | Meaning |
|-------|------------|-------|------|---------|
| `normal` | 80–100 | 🟢 Green | ✓ | No significant concerns |
| `attention` | 60–79 | 🟡 Yellow | ⚠ | Some anomalies detected, worth reviewing |
| `suspicious` | 40–59 | 🟠 Orange | ⚠⚠ | Multiple or sustained anomalies |
| `high_risk` | 0–39 | 🔴 Red | ✕ | Significant integrity concerns, review recommended |

### State Transition Rules
- Transitions are purely derived from the score — there are no separate state transition rules
- The risk state is recalculated after every score change
- State changes are recorded in risk snapshots for timeline display

---

## 5. Score Recovery

To avoid a situation where a single early anomaly permanently ruins the score, the engine allows **partial recovery** during sustained periods of normal behavior.

### Recovery Rules
1. Recovery accrues at `recoveryRate` points per minute of clean behavior (no anomaly events)
2. Recovery is applied when a new event arrives (calculated based on elapsed clean time)
3. Recovery is **capped** — the score cannot recover above the session's **peak score** (highest score after recovery was last applied)
4. Recovery only applies if there are no anomaly events in the recovery window

### Recovery Calculation

```
cleanDurationMinutes = (currentTime - lastAnomalyTime) / 60000
recoveryPoints = floor(cleanDurationMinutes) × recoveryRate
recoveredScore = min(currentScore + recoveryPoints, peakScore)
```

### Example Timeline

```
Time  Event             Score  Recovery  State
0:00  Session start     100    —         normal
1:30  tab_hidden        90     —         normal
1:35  tab_visible       90     —         normal
3:30  (2 min clean)     92     +2        normal
4:00  multiple_faces    77     —         attention
4:05  face_returned     77     —         attention
6:00  (2 min clean)     79     +2        attention
8:00  (2 min clean)     81     +2        normal
8:30  tab_hidden        71     —         attention
8:32  tab_visible       71     —         attention
9:00  screen_share_stop 51     —         suspicious
```

---

## 6. Cooldown System

Cooldowns prevent the same event type from causing rapid repeated deductions, which would unfairly penalize temporary or oscillating conditions.

### Cooldown Logic

```
function isInCooldown(eventType, lastEventTimes, cooldowns):
  lastFired = lastEventTimes[eventType]
  if lastFired is null:
    return false
  elapsed = currentTime - lastFired
  return elapsed < (cooldowns[eventType] * 1000)
```

### Cooldown Behavior
- If an event fires during cooldown, it is still **recorded** in the database (for timeline completeness) but does **not** affect the score
- The `score_before` and `score_after` fields on the event record will be equal when cooldown suppresses the deduction
- Info-severity events (`face_returned`, `tab_visible`, etc.) do not have cooldowns because they don't affect the score

---

## 7. Core Calculation Function

The risk engine is implemented as a **pure function** with no side effects.

```typescript
interface RiskCalculationInput {
  currentScore: number;
  peakScore: number;
  lastAnomalyTimestamp: number | null;
  lastEventTimes: Record<string, number>;  // eventType → last timestamp
  newEvent: DetectionEvent;
  currentTimestamp: number;
  config: RiskWeightConfig;
}

interface RiskCalculationResult {
  score: number;
  previousScore: number;
  state: RiskState;
  previousState: RiskState;
  changed: boolean;
  explanation: string;
  deductionApplied: number;
  recoveryApplied: number;
  cooldownActive: boolean;
  updatedLastEventTimes: Record<string, number>;
  updatedLastAnomalyTimestamp: number | null;
  updatedPeakScore: number;
}

type RiskState = 'normal' | 'attention' | 'suspicious' | 'high_risk';
```

### Algorithm (pseudocode)

```
function calculateRisk(input: RiskCalculationInput): RiskCalculationResult {
  let { currentScore, peakScore, lastAnomalyTimestamp, lastEventTimes,
        newEvent, currentTimestamp, config } = input

  const previousScore = currentScore
  const previousState = getState(currentScore, config.thresholds)
  let deductionApplied = 0
  let recoveryApplied = 0
  let cooldownActive = false

  // 1. Skip info-severity events (they don't affect score)
  if (newEvent.severity === 'info') {
    return {
      score: currentScore,
      previousScore,
      state: previousState,
      previousState,
      changed: false,
      explanation: `Informational event: ${newEvent.eventType}`,
      deductionApplied: 0,
      recoveryApplied: 0,
      cooldownActive: false,
      updatedLastEventTimes: lastEventTimes,
      updatedLastAnomalyTimestamp: lastAnomalyTimestamp,
      updatedPeakScore: peakScore,
    }
  }

  // 2. Apply recovery for elapsed clean time
  if (lastAnomalyTimestamp !== null) {
    const cleanMs = currentTimestamp - lastAnomalyTimestamp
    const cleanMinutes = Math.floor(cleanMs / 60000)
    if (cleanMinutes > 0) {
      recoveryApplied = cleanMinutes * config.recoveryRate
      currentScore = Math.min(currentScore + recoveryApplied, peakScore)
    }
  }

  // 3. Check cooldown
  const weight = config.weights[newEvent.eventType]
  if (weight === undefined) {
    // Unknown event type — log warning, do not crash
    return unchanged result with warning
  }

  if (isInCooldown(newEvent.eventType, lastEventTimes, config.cooldowns, currentTimestamp)) {
    cooldownActive = true
    // Record event but do not deduct
  } else {
    // 4. Apply deduction
    deductionApplied = weight * newEvent.confidence
    currentScore = Math.max(0, Math.min(100, currentScore + deductionApplied))

    // 5. Update tracking
    lastEventTimes[newEvent.eventType] = currentTimestamp
    lastAnomalyTimestamp = currentTimestamp
  }

  // 6. Update peak score (only increases via recovery)
  if (currentScore > peakScore) {
    peakScore = currentScore
  }

  // 7. Determine new state
  const newState = getState(currentScore, config.thresholds)

  // 8. Generate explanation
  const explanation = generateExplanation(
    previousScore, currentScore, newEvent, newState, previousState,
    deductionApplied, recoveryApplied, cooldownActive
  )

  return {
    score: Math.round(currentScore),
    previousScore: Math.round(previousScore),
    state: newState,
    previousState,
    changed: Math.round(currentScore) !== Math.round(previousScore),
    explanation,
    deductionApplied,
    recoveryApplied,
    cooldownActive,
    updatedLastEventTimes: { ...lastEventTimes },
    updatedLastAnomalyTimestamp: lastAnomalyTimestamp,
    updatedPeakScore: peakScore,
  }
}

function getState(score: number, thresholds: RiskStateThresholds): RiskState {
  if (score >= thresholds.normal) return 'normal'
  if (score >= thresholds.attention) return 'attention'
  if (score >= thresholds.suspicious) return 'suspicious'
  return 'high_risk'
}
```

---

## 8. Explanation Generator

Every score change must produce a human-readable explanation. These explanations appear in the recruiter's event timeline and session detail views.

### Explanation Templates

```typescript
function generateExplanation(
  prevScore: number,
  newScore: number,
  event: DetectionEvent,
  newState: RiskState,
  prevState: RiskState,
  deduction: number,
  recovery: number,
  cooldownActive: boolean,
): string {
  const parts: string[] = []
  const timestamp = formatTime(event.timestamp)

  if (cooldownActive) {
    parts.push(
      `${EVENT_LABELS[event.eventType]} detected at ${timestamp}, ` +
      `but deduction suppressed (cooldown active). Score unchanged at ${newScore}.`
    )
    return parts.join(' ')
  }

  if (recovery > 0) {
    parts.push(`+${recovery} recovery from clean behavior.`)
  }

  if (deduction !== 0) {
    parts.push(
      `Integrity score changed from ${prevScore} to ${newScore} ` +
      `(${deduction > 0 ? '+' : ''}${Math.round(deduction)}): ` +
      `${EVENT_DESCRIPTIONS[event.eventType]} at ${timestamp}.`
    )
  }

  if (newState !== prevState) {
    parts.push(`Risk state changed: ${prevState} → ${newState}.`)
  } else {
    parts.push(`Current risk state: ${newState.toUpperCase()}.`)
  }

  return parts.join(' ')
}

const EVENT_LABELS: Record<string, string> = {
  face_absent: 'Face absent',
  multiple_faces: 'Multiple faces',
  tab_hidden: 'Tab switch',
  screen_share_stopped: 'Screen share stopped',
  face_orientation_off: 'Face turned away',
  av_mismatch: 'Audio-visual mismatch',
  audio_silence_extended: 'Extended silence',
}

const EVENT_DESCRIPTIONS: Record<string, string> = {
  face_absent: 'No face detected in camera',
  multiple_faces: 'Multiple faces detected in frame',
  tab_hidden: 'Candidate switched away from interview tab',
  screen_share_stopped: 'Screen sharing was stopped',
  face_orientation_off: 'Candidate appeared to look away from camera',
  av_mismatch: 'Audio activity did not match visible mouth movement',
  audio_silence_extended: 'No speech detected for an extended period',
}
```

### Example Explanations

```
"Integrity score changed from 100 to 90 (-10): Candidate switched away from 
interview tab at 14:23:07. Current risk state: NORMAL."

"+2 recovery from clean behavior. Integrity score changed from 77 to 64 (-15): 
Multiple faces detected in frame at 14:28:42. Risk state changed: attention → attention."

"Integrity score changed from 64 to 44 (-20): Screen sharing was stopped at 
14:30:15. Risk state changed: attention → suspicious."

"Face absent detected at 14:31:00, but deduction suppressed (cooldown active). 
Score unchanged at 44."
```

---

## 9. Integration with Event Processor

The risk engine is called by the server's event processor after each detection event is persisted.

### Flow

```
WebSocket message received
        ↓
Event validated (Zod schema)
        ↓
Event persisted to detection_events table
        ↓
Risk engine called:
  calculateRisk({
    currentScore: session.current_integrity_score,
    peakScore: session.peak_integrity_score,
    lastAnomalyTimestamp: session.metadata.lastAnomalyTimestamp,
    lastEventTimes: session.metadata.lastEventTimes,
    newEvent: detectionEvent,
    currentTimestamp: Date.now(),
    config: riskConfig,
  })
        ↓
If result.changed:
  - Persist risk_snapshot
  - Update session.current_integrity_score
  - Update session.current_risk_state
  - Update session.peak_integrity_score
  - Update session.metadata (lastEventTimes, lastAnomalyTimestamp)
        ↓
Update detection_event with score_before and score_after
```

---

## 10. Testing Requirements

The risk engine must be thoroughly unit-tested because it is the core business logic of the system.

### Required Test Cases

| Test Case | Input | Expected Output |
|-----------|-------|-----------------|
| Initial score | No events | Score = 100, state = normal |
| Single face_absent | 1 event, confidence 1.0 | Score = 95, state = normal |
| Single screen_share_stopped | 1 event, confidence 1.0 | Score = 80, state = normal |
| Multiple events accumulate | face_absent + tab_hidden | Score = 85 |
| Score hits zero floor | Enough events to push below 0 | Score = 0, state = high_risk |
| Score never exceeds 100 | Recovery after initial score | Score ≤ 100 |
| Cooldown suppresses deduction | Same event type within cooldown | Score unchanged |
| Cooldown expires | Same event type after cooldown | Score deducted again |
| Recovery after clean period | 2 minutes no anomaly | Score increases by recoveryRate × 2 |
| Recovery capped at peak | Recovery cannot exceed peak score | Score ≤ peakScore |
| Confidence scaling | face_absent with confidence 0.5 | Deduction = -2.5 (not -5) |
| Unknown event type | Unregistered event type | No crash, warning logged, score unchanged |
| Info events skip scoring | face_returned (info) | Score unchanged |
| State transitions | Score drops from 81 to 75 | State: normal → attention |
| Explanation generated | Any score change | Non-empty string with score, event, state |
| Deterministic | Same inputs repeated | Identical outputs |

---

## 11. Limitations

| Limitation | Impact | Mitigation |
|---|---|---|
| Weights are manually tuned, not empirically validated | Score thresholds may not perfectly calibrate to "suspicious" behavior | Weights are configurable; documented as tunable |
| Recovery model is simple | May over-recover or under-recover in edge cases | Conservative recovery rate (2/min); capped at peak |
| No temporal pattern detection | Cannot detect sophisticated patterns (e.g., regular 5-minute tab switches) | Post-MVP enhancement; sliding window analysis |
| No cross-session analysis | Each session scored independently | Post-MVP enhancement |
| Single event type correlation only | Risk engine doesn't combine event types (e.g., tab_hidden + multiple_faces simultaneous = extra suspicious) | Post-MVP enhancement; event combination rules |

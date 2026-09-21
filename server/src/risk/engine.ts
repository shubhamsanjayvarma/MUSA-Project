import {
  DetectionEvent,
  RiskState,
  RiskWeightConfig,
  RiskStateThresholds,
  DEFAULT_RISK_CONFIG,
} from '@interviewshield/shared';

export interface RiskCalculationInput {
  currentScore: number;
  peakScore: number;
  lastAnomalyTimestamp: number | null;
  lastEventTimes: Record<string, number>;
  newEvent: DetectionEvent;
  currentTimestamp: number;
  config?: RiskWeightConfig;
}

export interface RiskCalculationResult {
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

export const getRiskState = (score: number, thresholds: RiskStateThresholds): RiskState => {
  if (score >= thresholds.normal) return 'normal';
  if (score >= thresholds.attention) return 'attention';
  if (score >= thresholds.suspicious) return 'suspicious';
  return 'high_risk';
};

const EVENT_DESCRIPTIONS: Record<string, string> = {
  face_absent: 'No face detected in camera',
  face_returned: 'Face returned to camera frame',
  multiple_faces: 'Multiple faces detected in frame',
  face_orientation_off: 'Candidate appeared to look away from camera',
  tab_hidden: 'Candidate switched away from interview tab',
  tab_visible: 'Candidate returned to interview tab',
  screen_share_stopped: 'Screen sharing was stopped',
  screen_share_started: 'Screen sharing initiated',
  av_mismatch: 'Audio activity did not match visible mouth movement',
  audio_silence_extended: 'No speech detected for an extended period',
  audio_activity_detected: 'Speech audio activity detected',
};

const EVENT_LABELS: Record<string, string> = {
  face_absent: 'Face absence',
  face_returned: 'Face return',
  multiple_faces: 'Multiple faces',
  face_orientation_off: 'Face orientation deviation',
  tab_hidden: 'Tab switch',
  tab_visible: 'Tab focus restored',
  screen_share_stopped: 'Screen share revocation',
  screen_share_started: 'Screen share start',
  av_mismatch: 'Audio-visual mismatch',
  audio_silence_extended: 'Extended silence',
  audio_activity_detected: 'Audio activity',
};

export const formatTime = (timestamp: number): string => {
  return new Date(timestamp).toLocaleTimeString();
};

export const generateExplanation = (
  prevScore: number,
  newScore: number,
  event: DetectionEvent,
  newState: RiskState,
  prevState: RiskState,
  deduction: number,
  recovery: number,
  cooldownActive: boolean
): string => {
  const parts: string[] = [];
  const timeStr = formatTime(event.timestamp);
  const label = EVENT_LABELS[event.eventType] || event.eventType;
  const description = EVENT_DESCRIPTIONS[event.eventType] || event.eventType;

  if (cooldownActive) {
    return `${label} detected at ${timeStr}, but deduction suppressed (cooldown active). Score unchanged at ${newScore}.`;
  }

  if (recovery > 0) {
    parts.push(`+${recovery} recovery from clean behavior.`);
  }

  if (deduction !== 0) {
    const changeSign = deduction > 0 ? '+' : '';
    parts.push(
      `Integrity score changed from ${prevScore} to ${newScore} (${changeSign}${Math.round(deduction)}): ${description} at ${timeStr}.`
    );
  } else {
    parts.push(`Event: ${description} at ${timeStr}. Score remains ${newScore}.`);
  }

  if (newState !== prevState) {
    parts.push(`Risk state changed: ${prevState.toUpperCase()} → ${newState.toUpperCase()}.`);
  } else {
    parts.push(`Current risk state: ${newState.toUpperCase()}.`);
  }

  return parts.join(' ');
};

export function calculateRisk(input: RiskCalculationInput): RiskCalculationResult {
  const config = input.config || DEFAULT_RISK_CONFIG;
  let currentScore = input.currentScore;
  let peakScore = input.peakScore;
  let lastAnomalyTimestamp = input.lastAnomalyTimestamp;
  const lastEventTimes = { ...input.lastEventTimes };
  const { newEvent, currentTimestamp } = input;

  const previousScore = currentScore;
  const previousState = getRiskState(currentScore, config.thresholds);
  let deductionApplied = 0;
  let recoveryApplied = 0;
  let cooldownActive = false;

  // 1. Skip info-severity events (they do not deduct from score)
  if (newEvent.severity === 'info') {
    return {
      score: Math.round(currentScore),
      previousScore: Math.round(previousScore),
      state: previousState,
      previousState,
      changed: false,
      explanation: `Informational event: ${EVENT_DESCRIPTIONS[newEvent.eventType] || newEvent.eventType} at ${formatTime(newEvent.timestamp)}.`,
      deductionApplied: 0,
      recoveryApplied: 0,
      cooldownActive: false,
      updatedLastEventTimes: lastEventTimes,
      updatedLastAnomalyTimestamp: lastAnomalyTimestamp,
      updatedPeakScore: peakScore,
    };
  }

  // 2. Apply recovery for elapsed clean behavior minutes
  if (lastAnomalyTimestamp !== null && currentTimestamp > lastAnomalyTimestamp) {
    const cleanMs = currentTimestamp - lastAnomalyTimestamp;
    const cleanMinutes = Math.floor(cleanMs / 60000);
    if (cleanMinutes > 0) {
      recoveryApplied = cleanMinutes * config.recoveryRate;
      currentScore = Math.min(currentScore + recoveryApplied, peakScore);
    }
  }

  // 3. Check configured weight
  const baseWeight = config.weights[newEvent.eventType];
  if (baseWeight === undefined) {
    // Unregistered event type: do not mutate score
    return {
      score: Math.round(currentScore),
      previousScore: Math.round(previousScore),
      state: previousState,
      previousState,
      changed: false,
      explanation: `Unrecognized event type '${newEvent.eventType}'. Score unchanged.`,
      deductionApplied: 0,
      recoveryApplied: 0,
      cooldownActive: false,
      updatedLastEventTimes: lastEventTimes,
      updatedLastAnomalyTimestamp: lastAnomalyTimestamp,
      updatedPeakScore: peakScore,
    };
  }

  // 4. Check cooldown
  const cooldownSeconds = config.cooldowns[newEvent.eventType] || 0;
  const lastFired = lastEventTimes[newEvent.eventType];
  if (lastFired && currentTimestamp - lastFired < cooldownSeconds * 1000) {
    cooldownActive = true;
  } else {
    // 5. Apply deduction scaled by confidence
    const confidence = Math.max(0, Math.min(1, newEvent.confidence ?? 1.0));
    deductionApplied = baseWeight * confidence;
    currentScore = Math.max(0, Math.min(100, currentScore + deductionApplied));

    lastEventTimes[newEvent.eventType] = currentTimestamp;
    lastAnomalyTimestamp = currentTimestamp;
  }

  // 6. Update peak score if currentScore recovered higher than peakScore
  if (currentScore > peakScore) {
    peakScore = currentScore;
  }

  const newState = getRiskState(currentScore, config.thresholds);
  const changed = Math.round(currentScore) !== Math.round(previousScore);

  const explanation = generateExplanation(
    Math.round(previousScore),
    Math.round(currentScore),
    newEvent,
    newState,
    previousState,
    deductionApplied,
    recoveryApplied,
    cooldownActive
  );

  return {
    score: Math.round(currentScore),
    previousScore: Math.round(previousScore),
    state: newState,
    previousState,
    changed,
    explanation,
    deductionApplied,
    recoveryApplied,
    cooldownActive,
    updatedLastEventTimes: lastEventTimes,
    updatedLastAnomalyTimestamp: lastAnomalyTimestamp,
    updatedPeakScore: peakScore,
  };
}

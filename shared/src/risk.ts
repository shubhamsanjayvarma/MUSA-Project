/**
 * Shared Risk Engine types and configurations.
 * Source of truth: docs/RISK_ENGINE.md
 */

export type RiskState = 'normal' | 'attention' | 'suspicious' | 'high_risk';

export interface RiskStateThresholds {
  normal: number;      // score >= this -> normal (default: 80)
  attention: number;   // score >= this -> attention (default: 60)
  suspicious: number;  // score >= this -> suspicious (default: 40)
}

export interface RiskWeightConfig {
  weights: Record<string, number>;
  cooldowns: Record<string, number>;
  recoveryRate: number;        // points recovered per clean minute (default: 2)
  initialScore: number;        // starting score (default: 100)
  thresholds: RiskStateThresholds;
}

export interface RiskCalculationResult {
  score: number;
  state: RiskState;
  scoreChanged: boolean;
  explanation: string;
  cooldownActive?: boolean;
}

export const DEFAULT_RISK_CONFIG: RiskWeightConfig = {
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
  recoveryRate: 2,
  initialScore: 100,
  thresholds: {
    normal: 80,
    attention: 60,
    suspicious: 40,
  },
};

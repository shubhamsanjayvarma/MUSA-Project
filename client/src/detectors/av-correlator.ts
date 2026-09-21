/**
 * Audio-Visual Correlator
 * Conservative heuristic cross-detector correlating speech activity and facial motion.
 * NOT lip-sync verification, NOT deepfake detection, NOT voice biometrics.
 * Source of truth: docs/DETECTION_SPEC.md §8
 */

import { DetectionEvent, EVENT_TYPES } from '@interviewshield/shared';
import { Detector, DetectorConfig, DetectorInput } from './detector.js';
import { FaceDetector } from './face-detector.js';
import { AudioDetector } from './audio-detector.js';

export interface AVCorrelatorConfig {
  correlationWindowMs?: number; // default: 5000ms
  mismatchThresholdMs?: number; // default: 5000ms
  cooldownMs?: number; // default: 20000ms
}

export class AVCorrelator implements Detector {
  readonly id = 'av_correlator';
  private active = false;

  private correlationWindowMs = 5000;
  private mismatchThresholdMs = 5000;
  private cooldownMs = 20000;

  private faceDetector: FaceDetector | null = null;
  private audioDetector: AudioDetector | null = null;

  private mismatchStartTime: number | null = null;
  private lastMismatchFiredAt = 0;

  constructor(faceDetector?: FaceDetector | null, audioDetector?: AudioDetector | null) {
    if (faceDetector) this.faceDetector = faceDetector;
    if (audioDetector) this.audioDetector = audioDetector;
  }

  setDetectors(faceDetector: FaceDetector, audioDetector: AudioDetector): void {
    this.faceDetector = faceDetector;
    this.audioDetector = audioDetector;
  }

  async initialize(config?: DetectorConfig): Promise<void> {
    if (config) {
      if (typeof config.correlationWindowMs === 'number') {
        this.correlationWindowMs = config.correlationWindowMs;
      }
      if (typeof config.mismatchThresholdMs === 'number') {
        this.mismatchThresholdMs = config.mismatchThresholdMs;
      }
      if (typeof config.cooldownMs === 'number') {
        this.cooldownMs = config.cooldownMs;
      }
    }

    this.mismatchStartTime = null;
    this.lastMismatchFiredAt = 0;
    this.active = true;
  }

  detect(_input: DetectorInput): DetectionEvent[] {
    if (!this.active || !this.faceDetector || !this.audioDetector) return [];

    const now = Date.now();
    const events: DetectionEvent[] = [];

    const isSpeaking = this.audioDetector.isSpeechLikely;
    const isMouthMoving = this.faceDetector.isMouthMoving;

    // Condition: candidate audio is active but mouth motion is not observed
    const isMismatch = isSpeaking && !isMouthMoving;

    if (isMismatch) {
      if (this.mismatchStartTime === null) {
        this.mismatchStartTime = now;
      } else {
        const mismatchDurationMs = now - this.mismatchStartTime;

        if (
          mismatchDurationMs >= this.mismatchThresholdMs &&
          now - this.lastMismatchFiredAt >= this.cooldownMs
        ) {
          this.lastMismatchFiredAt = now;
          events.push({
            eventType: EVENT_TYPES.AV_MISMATCH,
            detectorId: this.id,
            timestamp: now,
            severity: 'medium',
            confidence: 0.6,
            payload: {
              audioActive: true,
              mouthMoving: false,
              mismatchType: 'audio_without_mouth',
              windowDurationMs: this.correlationWindowMs,
              mismatchDurationMs,
            },
          });
        }
      }
    } else {
      this.mismatchStartTime = null;
    }

    return events;
  }

  dispose(): void {
    this.faceDetector = null;
    this.audioDetector = null;
    this.mismatchStartTime = null;
    this.active = false;
  }

  get isActive(): boolean {
    return this.active;
  }

  /**
   * Helper to simulate mismatch in tests
   */
  simulateMismatch(durationMs: number = 5500): DetectionEvent[] {
    const now = Date.now();
    return [
      {
        eventType: EVENT_TYPES.AV_MISMATCH,
        detectorId: this.id,
        timestamp: now,
        severity: 'medium',
        confidence: 0.6,
        payload: {
          audioActive: true,
          mouthMoving: false,
          mismatchType: 'audio_without_mouth',
          windowDurationMs: this.correlationWindowMs,
          mismatchDurationMs: durationMs,
        },
      },
    ];
  }
}

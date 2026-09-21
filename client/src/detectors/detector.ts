/**
 * Detector Base Interface & Types
 * Source of truth: docs/DETECTION_SPEC.md §3
 */

import { DetectionEvent } from '@interviewshield/shared';

export interface DetectorInput {
  frame?: HTMLCanvasElement | ImageBitmap | ImageData | null;
  videoElement?: HTMLVideoElement | null;
  audioBuffer?: Float32Array | null;
  timestamp: number;
}

export interface DetectorConfig {
  [key: string]: unknown;
}

export interface Detector {
  /** Unique detector identifier */
  readonly id: string;

  /** Initialize detector with optional configuration */
  initialize(config?: DetectorConfig): Promise<void>;

  /** Run one detection cycle. Returns zero or more events. */
  detect(input: DetectorInput): DetectionEvent[] | Promise<DetectionEvent[]>;

  /** Clean up resources and event listeners */
  dispose(): void;

  /** Whether the detector is currently operational */
  readonly isActive: boolean;
}

/**
 * Shared Detection Event definitions.
 * Source of truth: docs/DETECTION_SPEC.md & docs/ARCHITECTURE.md
 */

export type EventSeverity = 'info' | 'low' | 'medium' | 'high' | 'critical';

export interface DetectionEvent {
  /** Event type identifier, e.g. "face_absent", "tab_hidden" */
  eventType: string;

  /** Detector that produced this event, e.g. "face_detector" */
  detectorId: string;

  /** Client-side timestamp (Date.now()). Server timestamp is canonical. */
  timestamp: number;

  /** Event severity classification */
  severity: EventSeverity;

  /** Detector confidence in this event, 0.0 to 1.0 */
  confidence: number;

  /** Detector-specific structured data */
  payload: Record<string, unknown>;
}

export const EVENT_TYPES = {
  FACE_ABSENT: 'face_absent',
  FACE_RETURNED: 'face_returned',
  MULTIPLE_FACES: 'multiple_faces',
  FACE_ORIENTATION_OFF: 'face_orientation_off',
  UNUSUAL_GAZE_DIRECTION: 'unusual_gaze_direction',
  FACE_SWAP_DETECTED: 'face_swap_detected',
  VOICE_CLONING_DETECTED: 'voice_cloning_detected',
  AUDIO_SILENCE_EXTENDED: 'audio_silence_extended',
  AUDIO_ACTIVITY_DETECTED: 'audio_activity_detected',
  TAB_HIDDEN: 'tab_hidden',
  TAB_VISIBLE: 'tab_visible',
  SCREEN_SHARE_STOPPED: 'screen_share_stopped',
  SCREEN_SHARE_STARTED: 'screen_share_started',
  AV_MISMATCH: 'av_mismatch',
} as const;

export type EventType = (typeof EVENT_TYPES)[keyof typeof EVENT_TYPES];


/**
 * Tab Detector
 * Detects tab switching via the Page Visibility API.
 * Source of truth: docs/DETECTION_SPEC.md §6
 */

import { DetectionEvent, EVENT_TYPES } from '@interviewshield/shared';
import { Detector, DetectorConfig, DetectorInput } from './detector.js';

export class TabDetector implements Detector {
  readonly id = 'tab_detector';
  private active = false;
  private pendingEvents: DetectionEvent[] = [];
  private hiddenStartTime: number | null = null;
  private onVisibilityChangeHandler: (() => void) | null = null;

  async initialize(_config?: DetectorConfig): Promise<void> {
    this.pendingEvents = [];
    this.hiddenStartTime = null;

    this.onVisibilityChangeHandler = () => {
      const now = Date.now();
      if (document.visibilityState === 'hidden') {
        this.hiddenStartTime = now;
        this.pendingEvents.push({
          eventType: EVENT_TYPES.TAB_HIDDEN,
          detectorId: this.id,
          timestamp: now,
          severity: 'high',
          confidence: 1.0,
          payload: {
            timestamp: now,
          },
        });
      } else if (document.visibilityState === 'visible' && this.hiddenStartTime !== null) {
        const hiddenDurationMs = Math.max(0, now - this.hiddenStartTime);
        this.hiddenStartTime = null;
        this.pendingEvents.push({
          eventType: EVENT_TYPES.TAB_VISIBLE,
          detectorId: this.id,
          timestamp: now,
          severity: 'info',
          confidence: 1.0,
          payload: {
            hiddenDurationMs,
          },
        });
      }
    };

    if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
      document.addEventListener('visibilitychange', this.onVisibilityChangeHandler);
    }

    this.active = true;
  }

  detect(_input: DetectorInput): DetectionEvent[] {
    if (!this.active) return [];
    if (this.pendingEvents.length === 0) return [];
    const events = [...this.pendingEvents];
    this.pendingEvents = [];
    return events;
  }

  dispose(): void {
    if (
      this.onVisibilityChangeHandler &&
      typeof document !== 'undefined' &&
      typeof document.removeEventListener === 'function'
    ) {
      document.removeEventListener('visibilitychange', this.onVisibilityChangeHandler);
    }
    this.onVisibilityChangeHandler = null;
    this.pendingEvents = [];
    this.hiddenStartTime = null;
    this.active = false;
  }

  get isActive(): boolean {
    return this.active;
  }

  /**
   * Helper to manually simulate visibility changes (for testing or dev triggers)
   */
  simulateVisibilityChange(state: 'hidden' | 'visible'): void {
    const now = Date.now();
    if (state === 'hidden') {
      this.hiddenStartTime = now;
      this.pendingEvents.push({
        eventType: EVENT_TYPES.TAB_HIDDEN,
        detectorId: this.id,
        timestamp: now,
        severity: 'high',
        confidence: 1.0,
        payload: { timestamp: now },
      });
    } else {
      const hiddenDurationMs = this.hiddenStartTime ? Math.max(0, now - this.hiddenStartTime) : 1000;
      this.hiddenStartTime = null;
      this.pendingEvents.push({
        eventType: EVENT_TYPES.TAB_VISIBLE,
        detectorId: this.id,
        timestamp: now,
        severity: 'info',
        confidence: 1.0,
        payload: { hiddenDurationMs },
      });
    }
  }
}

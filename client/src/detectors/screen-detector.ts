/**
 * Screen Share Detector
 * Tracks screen sharing lifecycle and detects revocation.
 * Source of truth: docs/DETECTION_SPEC.md §7
 */

import { DetectionEvent, EVENT_TYPES } from '@interviewshield/shared';
import { Detector, DetectorConfig, DetectorInput } from './detector.js';
import { mediaManager } from '../services/media-manager.js';

export class ScreenShareDetector implements Detector {
  readonly id = 'screen_detector';
  private active = false;
  private pendingEvents: DetectionEvent[] = [];
  private currentTrack: MediaStreamTrack | null = null;
  private isScreenActive = false;
  private startedAt = 0;

  private onTrackEndedHandler: (() => void) | null = null;
  private onTrackMuteHandler: (() => void) | null = null;

  async initialize(_config?: DetectorConfig): Promise<void> {
    this.pendingEvents = [];
    this.currentTrack = null;
    this.isScreenActive = false;
    this.startedAt = 0;

    this.onTrackEndedHandler = () => {
      this.handleScreenStopped('ended');
    };

    this.onTrackMuteHandler = () => {
      this.handleScreenStopped('muted');
    };

    // Check if initial screen stream already exists in mediaManager
    const existingStream = mediaManager.getScreenStream();
    if (existingStream && existingStream.active) {
      this.attachTrack(existingStream.getVideoTracks()[0]);
    }

    this.active = true;
  }

  private attachTrack(track: MediaStreamTrack | undefined): void {
    if (!track) return;
    this.detachTrack();

    this.currentTrack = track;
    this.isScreenActive = track.readyState === 'live';
    this.startedAt = Date.now();

    if (this.onTrackEndedHandler) {
      track.addEventListener('ended', this.onTrackEndedHandler);
    }
    if (this.onTrackMuteHandler) {
      track.addEventListener('mute', this.onTrackMuteHandler);
    }

    if (this.isScreenActive) {
      this.pendingEvents.push({
        eventType: EVENT_TYPES.SCREEN_SHARE_STARTED,
        detectorId: this.id,
        timestamp: this.startedAt,
        severity: 'info',
        confidence: 1.0,
        payload: {
          trackId: track.id,
          label: track.label || 'screen',
        },
      });
    }
  }

  private detachTrack(): void {
    if (this.currentTrack) {
      if (this.onTrackEndedHandler) {
        this.currentTrack.removeEventListener('ended', this.onTrackEndedHandler);
      }
      if (this.onTrackMuteHandler) {
        this.currentTrack.removeEventListener('mute', this.onTrackMuteHandler);
      }
      this.currentTrack = null;
    }
  }

  private handleScreenStopped(reason: string): void {
    if (!this.isScreenActive) return;
    this.isScreenActive = false;
    const now = Date.now();
    const durationMs = this.startedAt > 0 ? Math.max(0, now - this.startedAt) : 0;

    this.pendingEvents.push({
      eventType: EVENT_TYPES.SCREEN_SHARE_STOPPED,
      detectorId: this.id,
      timestamp: now,
      severity: 'critical',
      confidence: 1.0,
      payload: {
        reason,
        trackId: this.currentTrack?.id || 'unknown',
        durationMs,
      },
    });
  }

  detect(_input?: DetectorInput): DetectionEvent[] {
    if (!this.active) return [];

    // Periodic check to detect newly acquired screen stream if not attached yet
    const stream = mediaManager.getScreenStream();
    if (stream && stream.active) {
      const track = stream.getVideoTracks()[0];
      if (track && track !== this.currentTrack && track.readyState === 'live') {
        this.attachTrack(track);
      }
    } else if (this.currentTrack && this.isScreenActive && (!stream || !stream.active)) {
      this.handleScreenStopped('stream_inactive');
    }

    if (this.pendingEvents.length === 0) return [];
    const events = [...this.pendingEvents];
    this.pendingEvents = [];
    return events;
  }

  dispose(): void {
    this.detachTrack();
    this.onTrackEndedHandler = null;
    this.onTrackMuteHandler = null;
    this.pendingEvents = [];
    this.isScreenActive = false;
    this.active = false;
  }

  get isActive(): boolean {
    return this.active;
  }

  get isSharing(): boolean {
    return this.isScreenActive;
  }

  /**
   * Helper to simulate screen share events in automated test environments
   */
  simulateScreenChange(state: 'started' | 'stopped'): void {
    const now = Date.now();
    if (state === 'started') {
      this.isScreenActive = true;
      this.startedAt = now;
      this.pendingEvents.push({
        eventType: EVENT_TYPES.SCREEN_SHARE_STARTED,
        detectorId: this.id,
        timestamp: now,
        severity: 'info',
        confidence: 1.0,
        payload: { trackId: 'simulated-screen-track' },
      });
    } else {
      this.isScreenActive = false;
      this.pendingEvents.push({
        eventType: EVENT_TYPES.SCREEN_SHARE_STOPPED,
        detectorId: this.id,
        timestamp: now,
        severity: 'critical',
        confidence: 1.0,
        payload: { reason: 'simulated_ended', durationMs: 15000 },
      });
    }
  }
}

/**
 * Audio Activity Detector
 * Local-only speech activity and extended silence detector using Web Audio API.
 * Does NOT perform speaker identification, voice biometrics, or raw audio transmission.
 * Source of truth: docs/DETECTION_SPEC.md §5
 */

import { DetectionEvent, EVENT_TYPES } from '@interviewshield/shared';
import { Detector, DetectorConfig, DetectorInput } from './detector.js';
import { mediaManager } from '../services/media-manager.js';

export interface AudioDetectorConfig {
  speechVolumeThreshold?: number; // RMS amplitude (0.0 - 1.0), default: 0.02
  silenceThresholdSeconds?: number; // seconds of silence before firing event, default: 30
  cooldownSeconds?: number; // cooldown between extended silence events, default: 60
}

export class AudioDetector implements Detector {
  readonly id = 'audio_detector';
  private active = false;

  private speechVolumeThreshold = 0.02;
  private silenceThresholdSeconds = 30;
  private cooldownSeconds = 60;

  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private dataArray: Uint8Array | null = null;

  private lastSpeechTimestamp = Date.now();
  private lastSilenceEventFiredAt = 0;
  private currentSpeechState = false;
  private wasSpeaking = false;

  async initialize(config?: DetectorConfig): Promise<void> {
    if (config) {
      if (typeof config.speechVolumeThreshold === 'number') {
        this.speechVolumeThreshold = config.speechVolumeThreshold;
      }
      if (typeof config.silenceThresholdSeconds === 'number') {
        this.silenceThresholdSeconds = config.silenceThresholdSeconds;
      }
      if (typeof config.cooldownSeconds === 'number') {
        this.cooldownSeconds = config.cooldownSeconds;
      }
    }

    this.lastSpeechTimestamp = Date.now();
    this.lastSilenceEventFiredAt = 0;
    this.currentSpeechState = false;
    this.wasSpeaking = false;

    // Check if AudioContext is supported in current environment
    if (typeof window !== 'undefined' && (window.AudioContext || (window as any).webkitAudioContext)) {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        this.audioCtx = new AudioContextClass();
        this.analyser = this.audioCtx.createAnalyser();
        this.analyser.fftSize = 512;
        this.analyser.smoothingTimeConstant = 0.4;
        this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);

        const cameraStream = mediaManager.getCameraStream();
        if (cameraStream && cameraStream.getAudioTracks().length > 0) {
          this.attachStream(cameraStream);
        }
      } catch (err) {
        console.warn('[AudioDetector] Could not initialize Web Audio API context:', err);
      }
    }

    this.active = true;
  }

  attachStream(stream: MediaStream): void {
    if (!this.audioCtx || !this.analyser) return;
    try {
      if (this.sourceNode) {
        this.sourceNode.disconnect();
      }
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length > 0 && audioTracks[0].readyState === 'live') {
        this.sourceNode = this.audioCtx.createMediaStreamSource(stream);
        this.sourceNode.connect(this.analyser);
      }
    } catch (err) {
      console.warn('[AudioDetector] Error attaching audio stream:', err);
    }
  }

  detect(input?: DetectorInput): DetectionEvent[] {
    if (!this.active) return [];
    const now = input?.timestamp || Date.now();
    const events: DetectionEvent[] = [];

    // Check if audio context was suspended by browser autoplay policy
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }

    // Attach stream if not yet attached
    if (!this.sourceNode) {
      const stream = mediaManager.getCameraStream();
      if (stream && stream.getAudioTracks().length > 0) {
        this.attachStream(stream);
      }
    }

    let isSpeechNow = this.currentSpeechState;
    let volume = 0;

    if (this.analyser && this.dataArray) {
      this.analyser.getByteTimeDomainData(this.dataArray as any);
      let sumSquares = 0;
      for (let i = 0; i < this.dataArray.length; i++) {
        const normalized = (this.dataArray[i] - 128) / 128;
        sumSquares += normalized * normalized;
      }
      volume = Math.sqrt(sumSquares / this.dataArray.length);
      isSpeechNow = volume > this.speechVolumeThreshold;
      this.currentSpeechState = isSpeechNow;
    }

    if (isSpeechNow) {
      this.lastSpeechTimestamp = now;
      if (!this.wasSpeaking) {
        this.wasSpeaking = true;
        const confidence = Math.min(1.0, Math.max(0.5, volume / (this.speechVolumeThreshold * 2)));
        events.push({
          eventType: EVENT_TYPES.AUDIO_ACTIVITY_DETECTED,
          detectorId: this.id,
          timestamp: now,
          severity: 'info',
          confidence: Number(confidence.toFixed(2)),
          payload: {
            averageVolume: volume,
            isSpeechLikely: true,
          },
        });
      }
    } else {
      this.wasSpeaking = false;
      if (this.lastSpeechTimestamp > now) {
        this.lastSpeechTimestamp = now;
      }
      const silenceDurationMs = now - this.lastSpeechTimestamp;
      const thresholdMs = this.silenceThresholdSeconds * 1000;
      const cooldownMs = this.cooldownSeconds * 1000;

      if (
        silenceDurationMs >= thresholdMs &&
        now - this.lastSilenceEventFiredAt >= cooldownMs
      ) {
        this.lastSilenceEventFiredAt = now;
        events.push({
          eventType: EVENT_TYPES.AUDIO_SILENCE_EXTENDED,
          detectorId: this.id,
          timestamp: now,
          severity: 'low',
          confidence: 0.7,
          payload: {
            silenceDurationMs,
            lastSpeechTimestamp: this.lastSpeechTimestamp,
          },
        });
      }
    }

    return events;
  }

  dispose(): void {
    if (this.sourceNode) {
      try {
        this.sourceNode.disconnect();
      } catch (e) {}
      this.sourceNode = null;
    }
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      try {
        this.audioCtx.close();
      } catch (e) {}
      this.audioCtx = null;
    }
    this.analyser = null;
    this.dataArray = null;
    this.currentSpeechState = false;
    this.wasSpeaking = false;
    this.lastSpeechTimestamp = 0;
    this.lastSilenceEventFiredAt = 0;
    this.active = false;
  }

  get isActive(): boolean {
    return this.active;
  }

  get isSpeechLikely(): boolean {
    return this.currentSpeechState;
  }

  /**
   * Helper to simulate audio states in test environments
   */
  simulateSpeechState(speaking: boolean): DetectionEvent[] {
    this.currentSpeechState = speaking;
    const now = Date.now();
    const events: DetectionEvent[] = [];
    if (speaking) {
      this.lastSpeechTimestamp = now;
      if (!this.wasSpeaking) {
        this.wasSpeaking = true;
        events.push({
          eventType: EVENT_TYPES.AUDIO_ACTIVITY_DETECTED,
          detectorId: this.id,
          timestamp: now,
          severity: 'info',
          confidence: 0.85,
          payload: {
            averageVolume: 0.05,
            isSpeechLikely: true,
          },
        });
      }
    } else {
      this.wasSpeaking = false;
    }
    return events;
  }

  /**
   * Helper to set silence state for subsequent detect cycles
   */
  triggerSilence(durationMs?: number): void {
    const duration = durationMs ?? (this.silenceThresholdSeconds * 1000 + 1000);
    const now = Date.now();
    this.currentSpeechState = false;
    this.wasSpeaking = false;
    this.lastSpeechTimestamp = now - duration;
    this.lastSilenceEventFiredAt = 0;
  }

  /**
   * Helper to simulate extended silence in test environments
   */
  simulateSilence(durationMs?: number, resetCooldown: boolean = true): DetectionEvent[] {
    const duration = durationMs ?? (this.silenceThresholdSeconds * 1000 + 1000);
    const now = Date.now();
    this.currentSpeechState = false;
    this.wasSpeaking = false;
    this.lastSpeechTimestamp = now - duration;
    if (resetCooldown) {
      this.lastSilenceEventFiredAt = 0;
    }
    return this.detect({ timestamp: now });
  }
}

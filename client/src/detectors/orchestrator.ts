/**
 * Detection Orchestrator
 * Coordinates detectors, runs the 2 fps detection cycle, and dispatches events.
 * Source of truth: docs/DETECTION_SPEC.md §9
 */

import { DetectionEvent } from '@interviewshield/shared';
import { Detector, DetectorInput } from './detector.js';

export type DetectorHealth = 'ACTIVE' | 'DEGRADED' | 'FAILED' | 'DISABLED';

export interface OrchestratorOptions {
  intervalMs?: number; // default: 500ms (2 fps)
  onEvents?: (events: DetectionEvent[]) => void;
  onEvidence?: (event: DetectionEvent, snapshotDataUrl: string) => void;
  videoElement?: HTMLVideoElement | null;
}

export function captureEvidenceSnapshot(
  videoOrCanvas: HTMLVideoElement | HTMLCanvasElement | null
): string | null {
  if (!videoOrCanvas || typeof document === 'undefined') return null;
  try {
    const targetCanvas = document.createElement('canvas');
    targetCanvas.width = 320;
    targetCanvas.height = 240;
    const ctx = targetCanvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(videoOrCanvas, 0, 0, 320, 240);
    return targetCanvas.toDataURL('image/jpeg', 0.6);
  } catch {
    return null;
  }
}

export class DetectorOrchestrator {
  private detectors: Detector[] = [];
  private intervalId: any = null;
  private isRunning = false;
  private readonly intervalMs: number;
  private onEventsCallback?: (events: DetectionEvent[]) => void;
  private onEvidenceCallback?: (event: DetectionEvent, snapshotDataUrl: string) => void;
  private videoElement: HTMLVideoElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private healthState: Map<string, DetectorHealth> = new Map();

  constructor(options?: OrchestratorOptions) {
    this.intervalMs = options?.intervalMs ?? 500;
    this.onEventsCallback = options?.onEvents;
    this.onEvidenceCallback = options?.onEvidence;
    this.videoElement = options?.videoElement ?? null;

    if (typeof document !== 'undefined') {
      this.canvas = document.createElement('canvas');
      this.canvas.width = 640;
      this.canvas.height = 480;
      this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
    }
  }

  registerDetector(detector: Detector): void {
    this.detectors.push(detector);
  }

  setVideoElement(video: HTMLVideoElement | null): void {
    this.videoElement = video;
  }

  setOnEvents(callback: (events: DetectionEvent[]) => void): void {
    this.onEventsCallback = callback;
  }

  async initializeAll(): Promise<void> {
    await Promise.all(
      this.detectors.map(async (d) => {
        try {
          await d.initialize();
        } catch (err) {
          console.error(`[Orchestrator] Failed to initialize detector ${d.id}:`, err);
        }
      })
    );
  }

  captureFrame(): HTMLCanvasElement | null {
    if (!this.videoElement || !this.canvas || !this.ctx) return null;
    if (this.videoElement.readyState < 2) return null; // HAVE_CURRENT_DATA

    try {
      this.ctx.drawImage(
        this.videoElement,
        0,
        0,
        this.canvas.width,
        this.canvas.height
      );
      return this.canvas;
    } catch {
      return null;
    }
  }

  async runCycle(): Promise<DetectionEvent[]> {
    const cycleEvents: DetectionEvent[] = [];
    const timestamp = Date.now();
    const frame = this.captureFrame();

    const input: DetectorInput = {
      frame,
      videoElement: this.videoElement,
      timestamp,
    };

    for (const detector of this.detectors) {
      if (!detector.isActive) {
        this.healthState.set(detector.id, 'DISABLED');
        continue;
      }
      try {
        const events = await Promise.resolve(detector.detect(input));
        if (events && events.length > 0) {
          cycleEvents.push(...events);
        }
        if (this.healthState.get(detector.id) === 'FAILED') {
          this.healthState.set(detector.id, 'DEGRADED');
        } else {
          this.healthState.set(detector.id, 'ACTIVE');
        }
      } catch (err) {
        this.healthState.set(detector.id, 'FAILED');
        console.error(`[Orchestrator] Detector ${detector.id} threw error in detect cycle:`, err);
      }
    }

    if (cycleEvents.length > 0) {
      if (this.onEventsCallback) {
        this.onEventsCallback(cycleEvents);
      }

      if (this.onEvidenceCallback) {
        const evidenceEligibleTypes = [
          'face_absent',
          'multiple_faces',
          'face_orientation_off',
          'av_mismatch',
          'face_swap_detected',
          'unusual_gaze_direction',
        ];
        for (const ev of cycleEvents) {
          if (evidenceEligibleTypes.includes(ev.eventType)) {
            const snapshot = this.captureSnapshot();
            if (snapshot) {
              this.onEvidenceCallback(ev, snapshot);
            }
          }
        }
      }
    }

    return cycleEvents;
  }

  captureSnapshot(): string | null {
    return captureEvidenceSnapshot(this.canvas || this.videoElement);
  }

  getDetector<T extends Detector>(id: string): T | undefined {
    return this.detectors.find((d) => d.id === id) as T | undefined;
  }

  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;

    this.intervalId = setInterval(async () => {
      if (!this.isRunning) return;
      await this.runCycle();
    }, this.intervalMs);
  }

  stop(): void {
    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  dispose(): void {
    this.stop();
    for (const detector of this.detectors) {
      try {
        detector.dispose();
      } catch (err) {
        console.error(`[Orchestrator] Failed to dispose detector ${detector.id}:`, err);
      }
    }
    this.detectors = [];
    this.healthState.clear();
    this.videoElement = null;
    this.canvas = null;
    this.ctx = null;
  }

  getDetectorHealth(id: string): DetectorHealth {
    const detector = this.detectors.find((d) => d.id === id);
    if (!detector || !detector.isActive) return 'DISABLED';
    return this.healthState.get(id) || 'ACTIVE';
  }

  getAllHealth(): Record<string, DetectorHealth> {
    const result: Record<string, DetectorHealth> = {};
    for (const d of this.detectors) {
      result[d.id] = this.getDetectorHealth(d.id);
    }
    return result;
  }

  get running(): boolean {
    return this.isRunning;
  }
}

/**
 * Face Detector
 * Powered by @mediapipe/tasks-vision Short-Range BlazeFace.
 * Source of truth: docs/DETECTION_SPEC.md §4
 */

import { DetectionEvent, EVENT_TYPES } from '@interviewshield/shared';
import { Detector, DetectorConfig, DetectorInput } from './detector.js';

export interface FaceDetectorOptions {
  minDetectionConfidence?: number;
  absenceThresholdSeconds?: number;
  orientationDeviationThreshold?: number;
}

export class FaceDetector implements Detector {
  readonly id = 'face_detector';
  private active = false;
  private isModelLoaded = false;
  private mpFaceDetector: any = null;

  private minDetectionConfidence = 0.5;
  private absenceThresholdSeconds = 3;
  private orientationDeviationThreshold = 0.3;

  private lastFaceSeenTimestamp: number = Date.now();
  private absentEventFired = false;
  private lastMultipleFacesFiredAt = 0;
  private lastOrientationOffFiredAt = 0;
  private orientationOffStartTime: number | null = null;

  async initialize(config?: DetectorConfig): Promise<void> {
    if (config) {
      if (typeof config.minDetectionConfidence === 'number') {
        this.minDetectionConfidence = config.minDetectionConfidence;
      }
      if (typeof config.absenceThresholdSeconds === 'number') {
        this.absenceThresholdSeconds = config.absenceThresholdSeconds;
      }
      if (typeof config.orientationDeviationThreshold === 'number') {
        this.orientationDeviationThreshold = config.orientationDeviationThreshold;
      }
    }

    this.lastFaceSeenTimestamp = Date.now();
    this.absentEventFired = false;
    this.lastMultipleFacesFiredAt = 0;
    this.lastOrientationOffFiredAt = 0;
    this.orientationOffStartTime = null;

    if (typeof window === 'undefined' || typeof document === 'undefined') {
      // Node.js / headless test environment without DOM
      this.active = true;
      return;
    }

    try {
      // Dynamic import to support environments where MediaPipe WASM is not present
      const { FaceDetector: MpDetector, FilesetResolver } = await import(
        '@mediapipe/tasks-vision'
      );

      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
      );

      this.mpFaceDetector = await MpDetector.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite',
          delegate: 'GPU',
        },
        runningMode: 'IMAGE',
        minDetectionConfidence: this.minDetectionConfidence,
      });

      this.isModelLoaded = true;
    } catch (err) {
      console.warn(
        '[FaceDetector] MediaPipe tasks-vision could not be initialized. Gracefully degrading.',
        err
      );
      this.isModelLoaded = false;
    }

    this.active = true;
  }

  detect(input: DetectorInput): DetectionEvent[] {
    if (!this.active) return [];
    const now = input.timestamp || Date.now();
    const events: DetectionEvent[] = [];

    let detections: Array<{
      score: number;
      boundingBox?: { originX: number; originY: number; width: number; height: number };
    }> = [];

    if (this.isModelLoaded && this.mpFaceDetector) {
      try {
        const sourceElement = input.frame || input.videoElement;
        // In simulation or when sourceElement is provided
        const result = this.mpFaceDetector.detect(sourceElement || {});
        if (result && Array.isArray(result.detections)) {
          detections = result.detections.map((d: any) => ({
            score: d.categories?.[0]?.score ?? 0.8,
            boundingBox: d.boundingBox,
          }));
        }
      } catch (err) {
        console.warn('[FaceDetector] Error running inference cycle:', err);
      }
    }

    const faceCount = detections.length;

    if (faceCount === 0) {
      const absenceMs = now - this.lastFaceSeenTimestamp;
      const thresholdMs = this.absenceThresholdSeconds * 1000;

      if (absenceMs >= thresholdMs && !this.absentEventFired) {
        this.absentEventFired = true;
        events.push({
          eventType: EVENT_TYPES.FACE_ABSENT,
          detectorId: this.id,
          timestamp: now,
          severity: 'medium',
          confidence: 0.9,
          payload: {
            faceCount: 0,
            absenceDurationMs: absenceMs,
            lastSeenTimestamp: this.lastFaceSeenTimestamp,
          },
        });
      }
      this.orientationOffStartTime = null;
    } else {
      // Face is present
      if (this.absentEventFired) {
        const absenceMs = now - this.lastFaceSeenTimestamp;
        this.absentEventFired = false;
        events.push({
          eventType: EVENT_TYPES.FACE_RETURNED,
          detectorId: this.id,
          timestamp: now,
          severity: 'info',
          confidence: detections[0].score,
          payload: {
            faceCount,
            absenceDurationMs: absenceMs,
            detectionScore: detections[0].score,
          },
        });
      }
      this.lastFaceSeenTimestamp = now;

      // Check multiple faces
      if (faceCount > 1) {
        const cooldownMs = 30000;
        if (now - this.lastMultipleFacesFiredAt >= cooldownMs) {
          this.lastMultipleFacesFiredAt = now;
          const scores = detections.map((d) => d.score);
          const minConfidence = Math.min(...scores);
          events.push({
            eventType: EVENT_TYPES.MULTIPLE_FACES,
            detectorId: this.id,
            timestamp: now,
            severity: 'high',
            confidence: minConfidence,
            payload: {
              faceCount,
              detectionScores: scores,
              boundingBoxes: detections.map((d) => d.boundingBox),
            },
          });
        }
      }

      // Check face orientation deviation
      const primaryBox = detections[0].boundingBox;
      if (primaryBox && input.frame && 'width' in input.frame && 'height' in input.frame) {
        const frameW = (input.frame as HTMLCanvasElement).width || 640;
        const frameH = (input.frame as HTMLCanvasElement).height || 480;

        const centerX = (primaryBox.originX + primaryBox.width / 2) / frameW;
        const centerY = (primaryBox.originY + primaryBox.height / 2) / frameH;

        const devX = Math.abs(centerX - 0.5);
        const devY = Math.abs(centerY - 0.5);

        if (devX > this.orientationDeviationThreshold || devY > this.orientationDeviationThreshold) {
          if (!this.orientationOffStartTime) {
            this.orientationOffStartTime = now;
          } else if (now - this.orientationOffStartTime >= 5000) {
            const cooldownMs = 15000;
            if (now - this.lastOrientationOffFiredAt >= cooldownMs) {
              this.lastOrientationOffFiredAt = now;
              events.push({
                eventType: EVENT_TYPES.FACE_ORIENTATION_OFF,
                detectorId: this.id,
                timestamp: now,
                severity: 'low',
                confidence: 0.7,
                payload: {
                  deviationX: devX,
                  deviationY: devY,
                  durationMs: now - this.orientationOffStartTime,
                },
              });
            }
          }
        } else {
          this.orientationOffStartTime = null;
        }
      }
    }

    return events;
  }

  dispose(): void {
    if (this.mpFaceDetector && typeof this.mpFaceDetector.close === 'function') {
      try {
        this.mpFaceDetector.close();
      } catch (e) {
        // ignore cleanup error
      }
    }
    this.mpFaceDetector = null;
    this.isModelLoaded = false;
    this.active = false;
  }

  get isActive(): boolean {
    return this.active;
  }

  /**
   * Test helper to simulate detection outcomes without camera
   */
  simulateDetection(faceCount: number, score: number = 0.95): DetectionEvent[] {
    const fakeDetections = Array.from({ length: faceCount }, () => ({
      score,
      boundingBox: { originX: 200, originY: 150, width: 240, height: 240 },
    }));

    // Temporarily inject detections
    const prevLoaded = this.isModelLoaded;
    const prevDetector = this.mpFaceDetector;
    this.isModelLoaded = true;
    this.mpFaceDetector = {
      detect: () => ({ detections: fakeDetections }),
    };

    const events = this.detect({ timestamp: Date.now() });

    this.isModelLoaded = prevLoaded;
    this.mpFaceDetector = prevDetector;
    return events;
  }
}

# InterviewShield — Detection Specification

> **Project**: InterviewShield — MUSA CodeX 2026 Round 2
> **Team**: Harrington's Tech
> **Version**: 1.0 — MVP

---

## 1. Detection Architecture Overview

All detection runs **client-side** in the candidate's browser. The server never receives raw video or audio. Each detector is an independent module that:

1. Accepts a specific media source (video frame, audio buffer, or browser API)
2. Processes the source locally
3. Emits zero or more structured `DetectionEvent` objects
4. Includes a confidence value for every event

### Detection Pipeline

```
Detection Loop (every 500ms = 2 fps)
├── Capture video frame → canvas
│   └── FaceDetector.detect(frame)
│       └── → face_absent | face_returned | multiple_faces | face_orientation_off
│
├── Sample audio buffer
│   └── AudioDetector.analyze(buffer)
│       └── → audio_silence_extended | audio_activity_detected
│
├── Check browser state
│   ├── TabDetector.check()
│   │   └── → tab_hidden | tab_visible
│   └── ScreenShareDetector.check()
│       └── → screen_share_stopped | screen_share_started
│
└── Cross-detector correlation
    └── AVCorrelator.correlate(faceResult, audioResult)
        └── → av_mismatch
```

---

## 2. Shared Detection Event Interface

Every detector emits events conforming to this interface. This is the **contract** between detectors and the event pipeline.

```typescript
// shared/src/events.ts

interface DetectionEvent {
  /** Event type identifier, e.g. "face_absent", "tab_hidden" */
  eventType: string;

  /** Detector that produced this event, e.g. "face_detector" */
  detectorId: string;

  /** Client-side timestamp (Date.now()). Server timestamp is canonical. */
  timestamp: number;

  /** Event severity classification */
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';

  /** Detector confidence in this event, 0.0 to 1.0 */
  confidence: number;

  /** Detector-specific structured data */
  payload: Record<string, unknown>;
}
```

### Event Type Registry

| Event Type | Detector | Severity | Description |
|------------|----------|----------|-------------|
| `face_absent` | face_detector | medium | No face detected for ≥3 seconds |
| `face_returned` | face_detector | info | Face re-detected after absence |
| `multiple_faces` | face_detector | high | More than 1 face in frame |
| `face_orientation_off` | face_detector | low | Face bounding box significantly off-center |
| `audio_silence_extended` | audio_detector | low | No speech-level audio for ≥30 seconds |
| `audio_activity_detected` | audio_detector | info | Speech-level audio detected (informational) |
| `tab_hidden` | tab_detector | high | Candidate switched away from interview tab |
| `tab_visible` | tab_detector | info | Candidate returned to interview tab |
| `screen_share_stopped` | screen_detector | critical | Screen share was revoked or ended |
| `screen_share_started` | screen_detector | info | Screen share initiated |
| `av_mismatch` | av_correlator | medium | Audio activity does not match mouth movement |

---

## 3. Detector Interface

All detectors implement this interface pattern:

```typescript
interface Detector {
  /** Unique detector identifier */
  readonly id: string;

  /** Initialize detector with configuration */
  initialize(config: DetectorConfig): Promise<void>;

  /** Run one detection cycle. Returns zero or more events. */
  detect(input: DetectorInput): DetectionEvent[];

  /** Clean up resources */
  dispose(): void;

  /** Whether the detector is currently operational */
  readonly isActive: boolean;
}
```

---

## 4. Face Detector

### Purpose
Detects face presence, count, and basic orientation using MediaPipe Face Detector running in the candidate's browser.

### Technology
- **Model**: `@mediapipe/tasks-vision` — `FaceDetector` task
- **Model variant**: Short-range (optimized for faces close to camera, i.e., webcam use case)
- **Execution**: WebAssembly / WebGL (automatic selection by MediaPipe)

### Input
- Video frame captured from `<canvas>` element at 2 fps
- Canvas source: candidate's camera stream via `getUserMedia`

### Configuration

```typescript
interface FaceDetectorConfig {
  /** Minimum confidence score to accept a detection. Default: 0.5 */
  minDetectionConfidence: number;

  /** Seconds of no face before firing face_absent. Default: 3 */
  absenceThresholdSeconds: number;

  /** Bounding box center deviation threshold for orientation. Default: 0.3 (30% of frame) */
  orientationDeviationThreshold: number;

  /** Whether mouth movement tracking is enabled. Default: true */
  trackMouthMovement: boolean;
}
```

### Events Emitted

#### `face_absent`
- **Trigger**: No face detected for `absenceThresholdSeconds` consecutive seconds
- **Severity**: `medium`
- **Confidence**: Based on how many consecutive frames had no detection (higher = more confident)
- **Debounce**: Does not fire again until face returns and re-disappears
- **Payload**:
```json
{
  "faceCount": 0,
  "absenceDurationMs": 3500,
  "lastSeenTimestamp": 1695200000000
}
```

#### `face_returned`
- **Trigger**: Face re-detected after a `face_absent` event
- **Severity**: `info`
- **Confidence**: from MediaPipe detection score
- **Payload**:
```json
{
  "faceCount": 1,
  "absenceDurationMs": 5200,
  "detectionScore": 0.94
}
```

#### `multiple_faces`
- **Trigger**: More than 1 face detected in the frame
- **Severity**: `high`
- **Confidence**: minimum detection score across all detected faces
- **Debounce**: Does not fire again within 30 seconds
- **Payload**:
```json
{
  "faceCount": 2,
  "detectionScores": [0.92, 0.78],
  "boundingBoxes": [
    { "x": 0.2, "y": 0.1, "width": 0.3, "height": 0.4 },
    { "x": 0.6, "y": 0.15, "width": 0.25, "height": 0.35 }
  ]
}
```

#### `face_orientation_off`
- **Trigger**: Primary face bounding box center deviates from frame center by more than `orientationDeviationThreshold` for ≥5 seconds
- **Severity**: `low`
- **Confidence**: 0.5–0.8 (heuristic based on bounding box position, not true head pose)
- **Debounce**: Does not fire again within 15 seconds
- **Payload**:
```json
{
  "deviationX": 0.35,
  "deviationY": 0.1,
  "durationMs": 5500,
  "boundingBox": { "x": 0.55, "y": 0.1, "width": 0.3, "height": 0.4 }
}
```

### Mouth Movement Tracking

The face detector also tracks whether the candidate's mouth is moving, used by the AV Correlator. This is derived from bounding box height variation in the lower portion of the detected face region.

**Approach**: Compare the lower 30% of the face bounding box between consecutive frames. If the region changes significantly (pixel difference above threshold), classify as "mouth moving."

**Limitation**: This is a rough heuristic, not true lip tracking. Clearly documented and labeled.

```typescript
interface MouthMovementState {
  isMoving: boolean;
  movementScore: number;  // 0.0 (still) to 1.0 (active movement)
  lastUpdated: number;
}
```

### Performance Considerations
- MediaPipe Face Detector inference: ~50–150ms per frame (hardware dependent)
- At 2 fps, this leaves ~350–450ms headroom per cycle
- If detection takes >400ms, skip the next cycle to avoid backpressure
- Pre-interview system check should warn if detection latency > 300ms

---

## 5. Audio Detector

### Purpose
Detects speech activity (whether someone is speaking) using the Web Audio API. Does NOT perform voice biometrics, speaker verification, or deepfake detection.

### Technology
- **API**: Web Audio API (`AudioContext`, `AnalyserNode`)
- **Source**: Candidate's microphone stream via `getUserMedia`
- **Analysis**: `getFloatFrequencyData()` for frequency spectrum, RMS volume calculation

### Input
- Audio stream connected to `AnalyserNode`
- Sampled at each detection cycle (2 fps)

### Configuration

```typescript
interface AudioDetectorConfig {
  /** RMS volume threshold to classify as speech. Default: -50 dBFS */
  speechVolumeThreshold: number;

  /** Frequency range for speech detection (Hz). Default: [85, 3000] */
  speechFrequencyRange: [number, number];

  /** Seconds of silence before firing extended silence. Default: 30 */
  silenceThresholdSeconds: number;

  /** FFT size for analysis. Default: 2048 */
  fftSize: number;
}
```

### Events Emitted

#### `audio_silence_extended`
- **Trigger**: No speech-level audio for `silenceThresholdSeconds` consecutive seconds
- **Severity**: `low`
- **Confidence**: 0.7 (audio silence is definitive, but silence itself is not necessarily suspicious)
- **Debounce**: Does not fire again within 60 seconds
- **Payload**:
```json
{
  "silenceDurationMs": 32000,
  "averageVolume": -72.5,
  "lastSpeechTimestamp": 1695200000000
}
```

#### `audio_activity_detected`
- **Trigger**: Speech-level audio detected (informational, primarily consumed by AV Correlator)
- **Severity**: `info`
- **Confidence**: based on how clearly the signal exceeds speech threshold
- **Note**: This event is generated frequently and is NOT sent to the server individually. It is consumed by the AV Correlator locally.
- **Payload**:
```json
{
  "averageVolume": -35.2,
  "peakFrequency": 220,
  "isSpeechLikely": true
}
```

### Speech Detection Heuristic

```
For each audio sample:
  1. Compute RMS volume across frequency bins
  2. Check if volume exceeds speechVolumeThreshold
  3. Check if peak energy is within speechFrequencyRange
  4. If both conditions met → isSpeechLikely = true
```

This is intentionally simple. We do not claim voice analysis or speaker verification.

---

## 6. Tab Detector

### Purpose
Detects when the candidate switches away from the interview browser tab.

### Technology
- **API**: Page Visibility API (`document.visibilitychange`)
- **Supplementary**: `window.blur` / `window.focus` events

### Input
- Browser event listeners (event-driven, not polled)

### Events Emitted

#### `tab_hidden`
- **Trigger**: `document.visibilityState` changes to `"hidden"`
- **Severity**: `high`
- **Confidence**: `1.0` (API is definitive)
- **Payload**:
```json
{
  "timestamp": 1695200000000
}
```

#### `tab_visible`
- **Trigger**: `document.visibilityState` changes to `"visible"` after being hidden
- **Severity**: `info`
- **Confidence**: `1.0`
- **Payload**:
```json
{
  "hiddenDurationMs": 4200
}
```

### Limitations
- Cannot detect which tab/application the candidate switched to
- Cannot detect multiple monitor usage
- Cannot detect browser-in-browser scenarios
- These limitations are inherent to the browser security model and are documented honestly

---

## 7. Screen Share Detector

### Purpose
Detects when the candidate's screen share is started, stopped, or interrupted.

### Technology
- **API**: Screen Capture API (`getDisplayMedia`)
- **Events**: `MediaStreamTrack.onended`, `MediaStreamTrack.onmute`

### Input
- `MediaStreamTrack` from the `getDisplayMedia()` call during system check

### Events Emitted

#### `screen_share_stopped`
- **Trigger**: Screen share track `ended` event fires (candidate revoked sharing or closed shared window)
- **Severity**: `critical`
- **Confidence**: `1.0` (API is definitive)
- **Payload**:
```json
{
  "reason": "ended",
  "trackId": "screen-track-1",
  "durationMs": 180000
}
```

#### `screen_share_started`
- **Trigger**: Screen share successfully initiated (during system check or re-initiation)
- **Severity**: `info`
- **Confidence**: `1.0`
- **Payload**:
```json
{
  "trackId": "screen-track-1",
  "displaySurface": "monitor"
}
```

### Limitations
- Cannot detect what is displayed on the shared screen (content analysis not possible from the sharing side)
- Cannot detect if only a specific window vs. entire screen is shared (though `displaySurface` in the track settings provides some info)
- Cannot detect second monitor content
- Screen share requires an explicit user click; cannot be auto-started

---

## 8. Audio-Visual Correlator

### Purpose
Detects inconsistencies between mouth movement and audio activity. This is a **heuristic** cross-detector module, not a scientifically validated lip-sync detector.

### Technology
- Pure JavaScript logic
- Consumes output from Face Detector (mouth movement state) and Audio Detector (speech activity state)

### Input
- `MouthMovementState` from Face Detector
- `AudioActivityState` from Audio Detector
- Sliding time window (default: 5 seconds)

### Configuration

```typescript
interface AVCorrelatorConfig {
  /** Time window to evaluate consistency (ms). Default: 5000 */
  correlationWindowMs: number;

  /** Minimum duration of mismatch to trigger event (ms). Default: 5000 */
  mismatchThresholdMs: number;

  /** Cooldown between av_mismatch events (ms). Default: 20000 */
  cooldownMs: number;
}
```

### Events Emitted

#### `av_mismatch`
- **Trigger**: Within the correlation window, one of these sustained mismatch conditions is met:
  - Audio is active (speech detected) but mouth is NOT moving, for ≥ `mismatchThresholdMs`
  - Mouth IS moving but no audio detected, for ≥ `mismatchThresholdMs`
- **Severity**: `medium`
- **Confidence**: `0.5–0.7` (explicitly lower confidence — this is a heuristic)
- **Debounce**: Does not fire again within `cooldownMs`
- **Payload**:
```json
{
  "audioActive": true,
  "mouthMoving": false,
  "mismatchType": "audio_without_mouth",
  "windowDurationMs": 5000,
  "mismatchDurationMs": 5200
}
```

### Correlation Logic (pseudocode)

```
maintain sliding window of (timestamp, audioActive, mouthMoving) samples

for each detection cycle:
  add current sample to window
  remove samples older than correlationWindowMs

  mismatchSamples = samples where (audioActive XOR mouthMoving)
  mismatchDuration = total duration of mismatch samples

  if mismatchDuration >= mismatchThresholdMs AND not in cooldown:
    emit av_mismatch event
    start cooldown timer
```

### Honest Labeling

This module is explicitly labeled as a **heuristic audio-visual consistency check**. It is NOT:
- Lip-sync verification
- Deepfake detection
- Voice identity verification

The confidence values are intentionally conservative (0.5–0.7) to reflect the heuristic nature.

---

## 9. Detection Orchestrator

### Purpose
Manages the detection loop, coordinates all detectors, and feeds events to the Event Buffer.

### Responsibilities
1. Initialize all detectors with their configurations
2. Run the main detection loop at the configured interval
3. Capture video frames for the Face Detector
4. Collect events from all detectors each cycle
5. Handle detector failures gracefully (one failing detector does not stop others)
6. Forward events to the Event Buffer

### Detection Loop

```typescript
class DetectorOrchestrator {
  private detectors: Detector[];
  private intervalId: number | null = null;
  private readonly intervalMs = 500; // 2 fps

  async runCycle(): Promise<DetectionEvent[]> {
    const events: DetectionEvent[] = [];
    const frame = this.captureFrame(); // canvas.toImageBitmap()

    for (const detector of this.detectors) {
      try {
        if (!detector.isActive) continue;
        const detectorEvents = detector.detect({ frame, timestamp: Date.now() });
        events.push(...detectorEvents);
      } catch (error) {
        // Log error, do NOT stop other detectors
        logger.error(`Detector ${detector.id} failed`, error);
      }
    }

    return events;
  }

  start(): void {
    this.intervalId = window.setInterval(async () => {
      const startTime = performance.now();
      const events = await this.runCycle();

      if (events.length > 0) {
        this.eventBuffer.enqueue(events);
      }

      const elapsed = performance.now() - startTime;
      if (elapsed > 400) {
        logger.warn(`Detection cycle took ${elapsed}ms, may skip next`);
      }
    }, this.intervalMs);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.detectors.forEach(d => d.dispose());
  }
}
```

### Graceful Degradation
- If `FaceDetector` fails to initialize (e.g., model download failed), log error and continue with other detectors
- If `AudioDetector` fails (mic permission revoked), disable audio-related events and AV Correlator
- If `ScreenShareDetector` has no track (permission not granted), skip but record that screen share was not active
- The interview should continue even if individual detectors fail

---

## 10. Event Buffer

### Purpose
Queues detection events for reliable delivery to the server via WebSocket. Handles network interruptions by buffering events locally.

### Design

```typescript
class EventBuffer {
  private queue: QueuedEvent[] = [];
  private nextSequenceNumber = 1;
  private acknowledgedUpTo = 0;

  /** Add events to the buffer */
  enqueue(events: DetectionEvent[]): void {
    for (const event of events) {
      this.queue.push({
        sequenceNumber: this.nextSequenceNumber++,
        event,
        sentAt: null,
        acknowledged: false,
      });
    }
    this.flush();
  }

  /** Send un-sent events via WebSocket */
  flush(): void {
    if (!this.wsClient.isConnected) return;

    for (const item of this.queue) {
      if (!item.acknowledged && (!item.sentAt || this.shouldRetry(item))) {
        this.wsClient.send({
          type: 'detection:event',
          sequenceNumber: item.sequenceNumber,
          payload: item.event,
        });
        item.sentAt = Date.now();
      }
    }
  }

  /** Handle server acknowledgment */
  acknowledge(sequenceNumber: number): void {
    const item = this.queue.find(q => q.sequenceNumber === sequenceNumber);
    if (item) {
      item.acknowledged = true;
    }
    // Prune acknowledged events from the front of the queue
    while (this.queue.length > 0 && this.queue[0].acknowledged) {
      this.queue.shift();
    }
  }

  /** On reconnection, replay un-acknowledged events */
  replayUnacknowledged(): void {
    for (const item of this.queue) {
      if (!item.acknowledged) {
        item.sentAt = null; // Force re-send
      }
    }
    this.flush();
  }
}
```

### Buffer Limits
- Maximum buffer size: 500 events (~4 minutes at worst case)
- If buffer is full, oldest un-sent events are dropped (with a logged warning)
- Server deduplicates by `(sessionId, sequenceNumber)` unique index

---

## 11. Evidence Snapshot Capture

### When to Capture
Evidence snapshots are captured on the client side **at the moment of medium+ severity detection events**. Not all events warrant a snapshot.

| Event Type | Capture Snapshot? |
|------------|------------------|
| `face_absent` | Yes — capture the frame showing no face |
| `face_returned` | No |
| `multiple_faces` | Yes — capture the frame showing multiple faces |
| `face_orientation_off` | Yes — capture the frame showing off-center face |
| `tab_hidden` | No (nothing to capture — tab is hidden) |
| `tab_visible` | No |
| `screen_share_stopped` | No |
| `screen_share_started` | No |
| `av_mismatch` | Yes — capture the frame for visual context |
| `audio_silence_extended` | No |

### Capture Method

```typescript
function captureSnapshot(canvas: HTMLCanvasElement): string {
  // Resize to low-res for privacy
  const targetCanvas = document.createElement('canvas');
  targetCanvas.width = 320;
  targetCanvas.height = 240;
  const ctx = targetCanvas.getContext('2d')!;
  ctx.drawImage(canvas, 0, 0, 320, 240);

  // Convert to JPEG, quality 60%
  return targetCanvas.toDataURL('image/jpeg', 0.6);
}
```

### Delivery
Snapshots are sent as a separate WebSocket message linked to the detection event by sequence number:

```json
{
  "type": "evidence:snapshot",
  "sequenceNumber": 42,
  "payload": {
    "eventSequenceNumber": 41,
    "imageDataUrl": "data:image/jpeg;base64,..."
  }
}
```

### Size Constraint
- 320×240 JPEG at quality 60% ≈ 15–30 KB per snapshot
- At worst case (event every 3 seconds), ~10 KB/s bandwidth for evidence
- This is negligible compared to WebSocket overhead

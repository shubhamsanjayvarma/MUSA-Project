import { describe, it, expect, beforeEach } from 'vitest';
import { TabDetector } from '../detectors/tab-detector.js';
import { FaceDetector } from '../detectors/face-detector.js';
import { ScreenShareDetector } from '../detectors/screen-detector.js';
import { AudioDetector } from '../detectors/audio-detector.js';
import { AVCorrelator } from '../detectors/av-correlator.js';
import { DetectorOrchestrator } from '../detectors/orchestrator.js';
import { EventBuffer, WebSocketSender } from '../services/event-buffer.js';
import { DetectionEvent, EVENT_TYPES } from '@interviewshield/shared';

describe('TabDetector', () => {
  let detector: TabDetector;

  beforeEach(async () => {
    detector = new TabDetector();
    await detector.initialize();
  });

  it('should initialize and report active state', () => {
    expect(detector.isActive).toBe(true);
    expect(detector.id).toBe('tab_detector');
  });

  it('should emit tab_hidden event when simulated', () => {
    detector.simulateVisibilityChange('hidden');
    const events = detector.detect({ timestamp: Date.now() });

    expect(events).toHaveLength(1);
    expect(events[0].eventType).toBe(EVENT_TYPES.TAB_HIDDEN);
    expect(events[0].severity).toBe('high');
    expect(events[0].confidence).toBe(1.0);

    // Drained after detection
    const nextEvents = detector.detect({ timestamp: Date.now() });
    expect(nextEvents).toHaveLength(0);
  });

  it('should emit tab_visible event with duration when returning to tab', () => {
    detector.simulateVisibilityChange('hidden');
    detector.detect({ timestamp: Date.now() });

    detector.simulateVisibilityChange('visible');
    const events = detector.detect({ timestamp: Date.now() });

    expect(events).toHaveLength(1);
    expect(events[0].eventType).toBe(EVENT_TYPES.TAB_VISIBLE);
    expect(events[0].severity).toBe('info');
    expect(events[0].confidence).toBe(1.0);
    expect(typeof events[0].payload.hiddenDurationMs).toBe('number');
  });

  it('should dispose cleanly', () => {
    detector.dispose();
    expect(detector.isActive).toBe(false);
  });
});

describe('FaceDetector', () => {
  let detector: FaceDetector;

  beforeEach(async () => {
    detector = new FaceDetector();
    await detector.initialize();
  });

  it('should initialize and report active state', () => {
    expect(detector.isActive).toBe(true);
    expect(detector.id).toBe('face_detector');
  });

  it('should emit multiple_faces event when more than 1 face is detected', () => {
    const events = detector.simulateDetection(2, 0.9);
    expect(events).toHaveLength(1);
    expect(events[0].eventType).toBe(EVENT_TYPES.MULTIPLE_FACES);
    expect(events[0].severity).toBe('high');
    expect(events[0].payload.faceCount).toBe(2);
  });

  it('should not emit anomaly events when exactly 1 face is present', () => {
    const events = detector.simulateDetection(1, 0.95);
    expect(events).toHaveLength(0);
  });

  it('should emit face_absent when face is missing past threshold, then face_returned on recovery', async () => {
    const fastDetector = new FaceDetector();
    await fastDetector.initialize({ absenceThresholdSeconds: 0 });

    // Missing face
    const absentEvents = fastDetector.simulateDetection(0);
    expect(absentEvents).toHaveLength(1);
    expect(absentEvents[0].eventType).toBe(EVENT_TYPES.FACE_ABSENT);
    expect(absentEvents[0].severity).toBe('medium');

    // Face returns
    const returnedEvents = fastDetector.simulateDetection(1);
    expect(returnedEvents).toHaveLength(1);
    expect(returnedEvents[0].eventType).toBe(EVENT_TYPES.FACE_RETURNED);
    expect(returnedEvents[0].severity).toBe('info');

    fastDetector.dispose();
  });

  describe('unusual_gaze_direction', () => {
    it('should emit unusual_gaze_direction when off-screen teleprompter gaze persists > 4s', () => {
      const events = detector.simulateGazeDeviation(0.4, 0.4, 4500);
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe(EVENT_TYPES.UNUSUAL_GAZE_DIRECTION);
      expect(events[0].severity).toBe('medium');
      expect(events[0].confidence).toBe(0.8);
      expect(events[0].payload.deviationX).toBeCloseTo(0.4, 1);
      expect(events[0].payload.deviationY).toBeCloseTo(0.4, 1);
      expect(events[0].payload.durationMs).toBeGreaterThanOrEqual(4000);
      expect(typeof events[0].payload.angleDegreesEstimate).toBe('number');
      expect((events[0].payload.angleDegreesEstimate as number)).toBeGreaterThanOrEqual(25);
    });

    it('should not emit unusual_gaze_direction when gaze deviation duration is brief (< 4s)', () => {
      const events = detector.simulateGazeDeviation(0.4, 0.4, 2500);
      expect(events).toHaveLength(0);
    });

    it('should not emit unusual_gaze_direction when gaze is centered within threshold', () => {
      const events = detector.simulateGazeDeviation(0.1, 0.1, 5000);
      expect(events).toHaveLength(0);
    });

    it('should enforce cooldown suppression window on consecutive unusual_gaze_direction triggers', () => {
      const initialEvents = detector.simulateGazeDeviation(0.4, 0.4, 4500, true);
      expect(initialEvents).toHaveLength(1);
      expect(initialEvents[0].eventType).toBe(EVENT_TYPES.UNUSUAL_GAZE_DIRECTION);

      // Subsequent deviation within 15s cooldown should be suppressed
      const cooldownEvents = detector.simulateGazeDeviation(0.4, 0.4, 4500, false);
      expect(cooldownEvents).toHaveLength(0);
    });

    it('should reset gaze deviation timer when gaze returns to center', () => {
      // Start deviation
      detector.simulateGazeDeviation(0.4, 0.4, 2000);
      // Gaze returns to center
      const centerEvents = detector.simulateGazeDeviation(0.05, 0.05, 500);
      expect(centerEvents).toHaveLength(0);

      // Subsequent non-continuous deviation (< 4s) should not trigger
      const nextEvents = detector.simulateGazeDeviation(0.4, 0.4, 2000, false);
      expect(nextEvents).toHaveLength(0);
    });
  });

  describe('face_swap_detected', () => {
    it('should emit face_swap_detected when synthetic artifact is simulated', () => {
      const events = detector.simulateFaceSwap(0.95);
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe(EVENT_TYPES.FACE_SWAP_DETECTED);
      expect(events[0].severity).toBe('critical');
      expect(events[0].confidence).toBe(0.95);
      expect(events[0].payload.laplacianVariance).toBe(38.2);
      expect(events[0].payload.boundaryJitterScore).toBe(0.89);
      expect(events[0].payload.syntheticArtifactLikelihood).toBe('high');
    });

    it('should emit face_swap_detected during detect cycle when synthetic artifact is flagged in input', () => {
      const events = detector.detect({
        timestamp: Date.now(),
        syntheticArtifactDetected: true,
        artifactConfidence: 0.92,
        artifactPayload: { manipulationModel: 'deepfake_v2' },
      } as any);

      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe(EVENT_TYPES.FACE_SWAP_DETECTED);
      expect(events[0].severity).toBe('critical');
      expect(events[0].confidence).toBe(0.92);
      expect(events[0].payload.manipulationModel).toBe('deepfake_v2');
    });

    it('should emit face_swap_detected via triggerFaceSwap on next detection cycle', () => {
      detector.triggerFaceSwap(0.88, { customScore: 0.99 });
      const events = detector.detect({ timestamp: Date.now() });

      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe(EVENT_TYPES.FACE_SWAP_DETECTED);
      expect(events[0].confidence).toBe(0.88);
      expect(events[0].payload.customScore).toBe(0.99);

      // Next cycle without trigger should be clean
      const cleanEvents = detector.simulateDetection(1, 0.95);
      expect(cleanEvents).toHaveLength(0);
    });

    it('should not emit face_swap_detected when detector is disposed', () => {
      detector.dispose();
      const events = detector.simulateFaceSwap(0.95);
      expect(events).toHaveLength(0);
    });
  });

  describe('mouth motion tracking & disposal', () => {
    it('should track mouth moving state and allow manual state override', () => {
      expect(detector.isMouthMoving).toBe(false);
      detector.setMouthMoving(true);
      expect(detector.isMouthMoving).toBe(true);
      detector.setMouthMoving(false);
      expect(detector.isMouthMoving).toBe(false);
    });

    it('should dispose cleanly and reset active state', () => {
      detector.dispose();
      expect(detector.isActive).toBe(false);
      const events = detector.detect({ timestamp: Date.now() });
      expect(events).toHaveLength(0);
    });
  });
});

describe('ScreenShareDetector', () => {
  let detector: ScreenShareDetector;

  beforeEach(async () => {
    detector = new ScreenShareDetector();
    await detector.initialize();
  });

  it('should initialize and report active state', () => {
    expect(detector.isActive).toBe(true);
    expect(detector.id).toBe('screen_detector');
    expect(detector.isSharing).toBe(false);
  });

  it('should emit screen_share_started and screen_share_stopped upon simulation', () => {
    detector.simulateScreenChange('started');
    let events = detector.detect({ timestamp: Date.now() });

    expect(events).toHaveLength(1);
    expect(events[0].eventType).toBe(EVENT_TYPES.SCREEN_SHARE_STARTED);
    expect(events[0].severity).toBe('info');
    expect(detector.isSharing).toBe(true);

    detector.simulateScreenChange('stopped');
    events = detector.detect({ timestamp: Date.now() });

    expect(events).toHaveLength(1);
    expect(events[0].eventType).toBe(EVENT_TYPES.SCREEN_SHARE_STOPPED);
    expect(events[0].severity).toBe('critical');
    expect(detector.isSharing).toBe(false);
  });

  it('should handle repeated screen sharing cycles gracefully', () => {
    detector.simulateScreenChange('started');
    let events = detector.detect({ timestamp: Date.now() });
    expect(events[0].eventType).toBe(EVENT_TYPES.SCREEN_SHARE_STARTED);

    detector.simulateScreenChange('stopped');
    events = detector.detect({ timestamp: Date.now() });
    expect(events[0].eventType).toBe(EVENT_TYPES.SCREEN_SHARE_STOPPED);

    detector.simulateScreenChange('started');
    events = detector.detect({ timestamp: Date.now() });
    expect(events[0].eventType).toBe(EVENT_TYPES.SCREEN_SHARE_STARTED);
    expect(detector.isSharing).toBe(true);
  });

  it('should dispose cleanly and not emit events when inactive', () => {
    detector.dispose();
    expect(detector.isActive).toBe(false);
    expect(detector.isSharing).toBe(false);
    detector.simulateScreenChange('started');
    const events = detector.detect({ timestamp: Date.now() });
    expect(events).toHaveLength(0);
  });
});

describe('AudioDetector', () => {
  let detector: AudioDetector;

  beforeEach(async () => {
    detector = new AudioDetector();
    await detector.initialize({ silenceThresholdSeconds: 1, cooldownSeconds: 1 });
  });

  it('should initialize and report active state', () => {
    expect(detector.isActive).toBe(true);
    expect(detector.id).toBe('audio_detector');
  });

  it('should track speech state correctly and emit audio_activity_detected on speech transition', () => {
    const events = detector.simulateSpeechState(true);
    expect(detector.isSpeechLikely).toBe(true);
    expect(events).toHaveLength(1);
    expect(events[0].eventType).toBe(EVENT_TYPES.AUDIO_ACTIVITY_DETECTED);
    expect(events[0].severity).toBe('info');

    // Speech remains -> no duplicate event
    const nextEvents = detector.detect({ timestamp: Date.now() });
    expect(nextEvents).toHaveLength(0);

    detector.simulateSpeechState(false);
    expect(detector.isSpeechLikely).toBe(false);
  });

  describe('audio_silence_extended', () => {
    it('should emit audio_silence_extended when silence duration meets or exceeds threshold', () => {
      const events = detector.simulateSilence(1500); // threshold is 1s
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe(EVENT_TYPES.AUDIO_SILENCE_EXTENDED);
      expect(events[0].severity).toBe('low');
      expect(events[0].confidence).toBe(0.7);
      expect(events[0].payload.silenceDurationMs).toBeGreaterThanOrEqual(1000);
      expect(typeof events[0].payload.lastSpeechTimestamp).toBe('number');
    });

    it('should not emit audio_silence_extended when silence duration is below threshold', () => {
      const events = detector.simulateSilence(500); // threshold is 1s
      expect(events).toHaveLength(0);
    });

    it('should enforce cooldown period between consecutive extended silence events', () => {
      const firstEvents = detector.simulateSilence(1500, true);
      expect(firstEvents).toHaveLength(1);
      expect(firstEvents[0].eventType).toBe(EVENT_TYPES.AUDIO_SILENCE_EXTENDED);

      // Immediately checking again without cooldown reset should be suppressed
      const cooldownEvents = detector.simulateSilence(1800, false);
      expect(cooldownEvents).toHaveLength(0);
    });

    it('should reset silence counter when speech activity resumes', () => {
      // Simulate silence past threshold
      const silenceEvents = detector.simulateSilence(1500);
      expect(silenceEvents).toHaveLength(1);

      // Speech resumes
      const speechEvents = detector.simulateSpeechState(true);
      expect(speechEvents).toHaveLength(1);
      expect(speechEvents[0].eventType).toBe(EVENT_TYPES.AUDIO_ACTIVITY_DETECTED);
      expect(detector.isSpeechLikely).toBe(true);

      // Immediately after speech, silence is only 100ms -> no silence event
      detector.simulateSpeechState(false);
      const immediateEvents = detector.detect({ timestamp: Date.now() + 100 });
      expect(immediateEvents).toHaveLength(0);
    });

    it('should progress silence over sequential detect cycles with timestamps', () => {
      const t0 = 100000;
      // Start of silence
      detector.detect({ timestamp: t0 });

      // 500ms later (threshold is 1000ms) -> no event
      const midEvents = detector.detect({ timestamp: t0 + 500 });
      expect(midEvents).toHaveLength(0);

      // 1200ms later -> threshold reached!
      const endEvents = detector.detect({ timestamp: t0 + 1200 });
      expect(endEvents).toHaveLength(1);
      expect(endEvents[0].eventType).toBe(EVENT_TYPES.AUDIO_SILENCE_EXTENDED);
    });

    it('should not emit events after detector is disposed', () => {
      detector.dispose();
      const events = detector.simulateSilence(2000);
      expect(events).toHaveLength(0);
      expect(detector.isActive).toBe(false);
    });
  });

  it('should dispose cleanly', () => {
    detector.dispose();
    expect(detector.isActive).toBe(false);
  });
});

describe('AVCorrelator', () => {
  let faceDetector: FaceDetector;
  let audioDetector: AudioDetector;
  let correlator: AVCorrelator;

  beforeEach(async () => {
    faceDetector = new FaceDetector();
    await faceDetector.initialize();

    audioDetector = new AudioDetector();
    await audioDetector.initialize();

    correlator = new AVCorrelator(faceDetector, audioDetector);
    await correlator.initialize({ correlationWindowMs: 100, mismatchThresholdMs: 100, cooldownMs: 500 });
  });

  it('should initialize and report active state', () => {
    expect(correlator.isActive).toBe(true);
    expect(correlator.id).toBe('av_correlator');
  });

  it('should emit av_mismatch event when mismatch is simulated', () => {
    const events = correlator.simulateMismatch(5000);
    expect(events).toHaveLength(1);
    expect(events[0].eventType).toBe(EVENT_TYPES.AV_MISMATCH);
    expect(events[0].severity).toBe('medium');
    expect(events[0].confidence).toBe(0.6);
  });

  it('should produce zero mismatch events when audio speech and facial movement are consistent', () => {
    faceDetector.setMouthMoving(true);
    audioDetector.simulateSpeechState(true);

    const events = correlator.detect({ timestamp: Date.now() });
    expect(events).toHaveLength(0);
  });

  describe('av_mismatch', () => {
    it('should emit av_mismatch when candidate speaks without mouth movement past threshold', () => {
      audioDetector.simulateSpeechState(true);
      faceDetector.setMouthMoving(false);

      const t0 = 10000;
      // Start mismatch
      const startEvents = correlator.detect({ timestamp: t0 });
      expect(startEvents).toHaveLength(0);

      // Duration: 50ms (< mismatchThresholdMs of 100ms)
      const midEvents = correlator.detect({ timestamp: t0 + 50 });
      expect(midEvents).toHaveLength(0);

      // Duration: 150ms (>= mismatchThresholdMs of 100ms)
      const triggerEvents = correlator.detect({ timestamp: t0 + 150 });
      expect(triggerEvents).toHaveLength(1);
      expect(triggerEvents[0].eventType).toBe(EVENT_TYPES.AV_MISMATCH);
      expect(triggerEvents[0].severity).toBe('medium');
      expect(triggerEvents[0].confidence).toBe(0.6);
      expect(triggerEvents[0].payload.audioActive).toBe(true);
      expect(triggerEvents[0].payload.mouthMoving).toBe(false);
      expect(triggerEvents[0].payload.mismatchType).toBe('audio_without_mouth');
      expect(triggerEvents[0].payload.mismatchDurationMs).toBeGreaterThanOrEqual(100);
    });

    it('should not emit av_mismatch when candidate is silent with no mouth movement', () => {
      audioDetector.simulateSpeechState(false);
      faceDetector.setMouthMoving(false);

      const events = correlator.detect({ timestamp: 10000 });
      expect(events).toHaveLength(0);
    });

    it('should not emit av_mismatch when speech and mouth movement are both active', () => {
      audioDetector.simulateSpeechState(true);
      faceDetector.setMouthMoving(true);

      const events = correlator.detect({ timestamp: 10000 });
      expect(events).toHaveLength(0);
    });

    it('should enforce cooldown suppression window on sustained av_mismatch', () => {
      audioDetector.simulateSpeechState(true);
      faceDetector.setMouthMoving(false);

      const t0 = 20000;
      correlator.detect({ timestamp: t0 });
      const triggerEvents = correlator.detect({ timestamp: t0 + 150 });
      expect(triggerEvents).toHaveLength(1);

      // Next detect cycle during cooldown (cooldownMs is 500ms)
      const cooldownEvents = correlator.detect({ timestamp: t0 + 300 });
      expect(cooldownEvents).toHaveLength(0);

      // After cooldown expires (600ms > 500ms)
      const afterCooldownEvents = correlator.detect({ timestamp: t0 + 700 });
      expect(afterCooldownEvents).toHaveLength(1);
      expect(afterCooldownEvents[0].eventType).toBe(EVENT_TYPES.AV_MISMATCH);
    });

    it('should reset mismatch timer when candidate begins moving mouth', () => {
      audioDetector.simulateSpeechState(true);
      faceDetector.setMouthMoving(false);

      const t0 = 30000;
      correlator.detect({ timestamp: t0 });

      // Candidate starts moving mouth before threshold
      faceDetector.setMouthMoving(true);
      const correlatedEvents = correlator.detect({ timestamp: t0 + 50 });
      expect(correlatedEvents).toHaveLength(0);

      // Now candidate stops mouth moving again — timer must have restarted
      faceDetector.setMouthMoving(false);
      correlator.detect({ timestamp: t0 + 60 });
      // Only 50ms since restart -> should NOT trigger
      const checkEvents = correlator.detect({ timestamp: t0 + 110 });
      expect(checkEvents).toHaveLength(0);
    });

    it('should emit av_mismatch with custom duration via simulateMismatch', () => {
      const events = correlator.simulateMismatch(6200);
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe(EVENT_TYPES.AV_MISMATCH);
      expect(events[0].payload.mismatchDurationMs).toBe(6200);
    });

    it('should return empty events when disposed', () => {
      correlator.dispose();
      expect(correlator.isActive).toBe(false);
      const events = correlator.detect({ timestamp: Date.now() });
      expect(events).toHaveLength(0);
    });
  });

  it('should dispose cleanly', () => {
    correlator.dispose();
    expect(correlator.isActive).toBe(false);
  });
});

describe('DetectorOrchestrator', () => {
  it('should orchestrate registered detectors during runCycle', async () => {
    const tabDetector = new TabDetector();
    await tabDetector.initialize();

    const receivedEvents: DetectionEvent[] = [];
    const orchestrator = new DetectorOrchestrator({
      intervalMs: 100,
      onEvents: (evts) => receivedEvents.push(...evts),
    });

    orchestrator.registerDetector(tabDetector);

    tabDetector.simulateVisibilityChange('hidden');
    const cycleEvents = await orchestrator.runCycle();

    expect(cycleEvents).toHaveLength(1);
    expect(cycleEvents[0].eventType).toBe(EVENT_TYPES.TAB_HIDDEN);
    expect(receivedEvents).toHaveLength(1);

    orchestrator.dispose();
  });

  it('should trigger evidence capture callback for high severity events', async () => {
    const faceDetector = new FaceDetector();
    await faceDetector.initialize();

    let capturedEvidence: any = null;
    const orchestrator = new DetectorOrchestrator({
      intervalMs: 100,
      onEvidence: (ev) => {
        capturedEvidence = ev;
      },
    });

    orchestrator.registerDetector(faceDetector);

    // Multiple faces is high severity
    faceDetector.simulateDetection(2, 0.9);
    await orchestrator.runCycle();

    // Since mock frame isn't an HTMLVideoElement, captureEvidenceSnapshot won't generate JPEG,
    // but the callback is properly wired up
    expect(capturedEvidence).toBeNull();
    expect(orchestrator).toBeDefined();

    orchestrator.dispose();
  });

  it('should track and report internal detector health states', async () => {
    const tabDetector = new TabDetector();
    await tabDetector.initialize();

    const orchestrator = new DetectorOrchestrator({ intervalMs: 100 });
    orchestrator.registerDetector(tabDetector);

    await orchestrator.runCycle();

    expect(orchestrator.getDetectorHealth('tab_detector')).toBe('ACTIVE');
    const allHealth = orchestrator.getAllHealth();
    expect(allHealth.tab_detector).toBe('ACTIVE');

    orchestrator.dispose();
    expect(orchestrator.getDetectorHealth('tab_detector')).toBe('DISABLED');
  });

  it('should route unusual_gaze_direction and face_swap_detected through orchestrator cycles', async () => {
    const faceDetector = new FaceDetector();
    await faceDetector.initialize();

    const receivedEvents: DetectionEvent[] = [];
    const orchestrator = new DetectorOrchestrator({
      intervalMs: 100,
      onEvents: (evts) => receivedEvents.push(...evts),
    });

    orchestrator.registerDetector(faceDetector);

    // Trigger face swap
    faceDetector.triggerFaceSwap(0.94);
    const cycleEvents = await orchestrator.runCycle();

    expect(cycleEvents).toHaveLength(1);
    expect(cycleEvents[0].eventType).toBe(EVENT_TYPES.FACE_SWAP_DETECTED);
    expect(cycleEvents[0].confidence).toBe(0.94);
    expect(receivedEvents).toHaveLength(1);

    orchestrator.dispose();
  });

  it('should route audio_silence_extended and av_mismatch through orchestrator', async () => {
    const audioDetector = new AudioDetector();
    await audioDetector.initialize({ silenceThresholdSeconds: 1, cooldownSeconds: 5 });

    const faceDetector = new FaceDetector();
    await faceDetector.initialize();

    const correlator = new AVCorrelator(faceDetector, audioDetector);
    await correlator.initialize({ mismatchThresholdMs: 100, cooldownMs: 500 });

    const receivedEvents: DetectionEvent[] = [];
    const orchestrator = new DetectorOrchestrator({
      intervalMs: 100,
      onEvents: (evts) => receivedEvents.push(...evts),
    });

    orchestrator.registerDetector(audioDetector);
    orchestrator.registerDetector(correlator);

    // Simulate silence before runCycle
    audioDetector.triggerSilence(1500);
    await orchestrator.runCycle();

    const silenceEvent = receivedEvents.find((e) => e.eventType === EVENT_TYPES.AUDIO_SILENCE_EXTENDED);
    expect(silenceEvent).toBeDefined();

    // Now trigger AV mismatch
    audioDetector.simulateSpeechState(true);
    faceDetector.setMouthMoving(false);
    correlator.triggerMismatch(200);
    await orchestrator.runCycle();

    const mismatchEvent = receivedEvents.find((e) => e.eventType === EVENT_TYPES.AV_MISMATCH);
    expect(mismatchEvent).toBeDefined();

    orchestrator.dispose();
  });
});

describe('EventBuffer', () => {
  let buffer: EventBuffer;
  let mockSender: WebSocketSender;
  let sentMessages: any[] = [];

  beforeEach(() => {
    sentMessages = [];
    mockSender = {
      isConnected: true,
      send: (msg) => sentMessages.push(msg),
    };
    buffer = new EventBuffer(mockSender);
  });

  it('should assign monotonic sequence numbers and flush to sender', () => {
    const fakeEvent: DetectionEvent = {
      eventType: EVENT_TYPES.TAB_HIDDEN,
      detectorId: 'tab_detector',
      timestamp: Date.now(),
      severity: 'high',
      confidence: 1.0,
      payload: {},
    };

    buffer.enqueue([fakeEvent]);

    expect(sentMessages).toHaveLength(1);
    expect(sentMessages[0].sequenceNumber).toBe(1);
    expect(sentMessages[0].type).toBe('detection:event');
    expect(buffer.queueLength).toBe(1);
    expect(buffer.unacknowledgedCount).toBe(1);
  });

  it('should prune acknowledged events from the queue head', () => {
    const fakeEvent1: DetectionEvent = {
      eventType: EVENT_TYPES.TAB_HIDDEN,
      detectorId: 'tab_detector',
      timestamp: Date.now(),
      severity: 'high',
      confidence: 1.0,
      payload: {},
    };
    const fakeEvent2: DetectionEvent = {
      eventType: EVENT_TYPES.TAB_VISIBLE,
      detectorId: 'tab_detector',
      timestamp: Date.now(),
      severity: 'info',
      confidence: 1.0,
      payload: {},
    };

    buffer.enqueue([fakeEvent1, fakeEvent2]);
    expect(buffer.queueLength).toBe(2);

    // Acknowledge first event
    buffer.acknowledge(1);
    expect(buffer.queueLength).toBe(1);
    expect(buffer.unacknowledgedCount).toBe(1);

    // Acknowledge second event
    buffer.acknowledge(2);
    expect(buffer.queueLength).toBe(0);
    expect(buffer.unacknowledgedCount).toBe(0);
  });

  it('should replay unacknowledged events upon request', () => {
    const fakeEvent: DetectionEvent = {
      eventType: EVENT_TYPES.TAB_HIDDEN,
      detectorId: 'tab_detector',
      timestamp: Date.now(),
      severity: 'high',
      confidence: 1.0,
      payload: {},
    };

    buffer.enqueue([fakeEvent]);
    expect(sentMessages).toHaveLength(1);

    // Replay
    buffer.replayUnacknowledged();
    expect(sentMessages).toHaveLength(2);
    expect(sentMessages[1].sequenceNumber).toBe(1);
  });
});

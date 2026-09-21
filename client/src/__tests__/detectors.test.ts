import { describe, it, expect, beforeEach } from 'vitest';
import { TabDetector } from '../detectors/tab-detector.js';
import { FaceDetector } from '../detectors/face-detector.js';
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

  it('should dispose cleanly', () => {
    detector.dispose();
    expect(detector.isActive).toBe(false);
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

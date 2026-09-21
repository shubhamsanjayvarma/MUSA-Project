import { describe, it, expect } from 'vitest';
import { calculateRisk, getRiskState } from './engine.js';
import { DetectionEvent, DEFAULT_RISK_CONFIG } from '@interviewshield/shared';

describe('Risk Engine Unit Tests', () => {
  const now = 1700000000000;

  const makeEvent = (
    eventType: string,
    severity: 'info' | 'low' | 'medium' | 'high' | 'critical',
    confidence = 1.0,
    timestamp = now
  ): DetectionEvent => ({
    eventType,
    detectorId: 'test_detector',
    timestamp,
    severity,
    confidence,
    payload: {},
  });

  it('should initialize with normal state at score 100', () => {
    expect(getRiskState(100, DEFAULT_RISK_CONFIG.thresholds)).toBe('normal');
    expect(getRiskState(80, DEFAULT_RISK_CONFIG.thresholds)).toBe('normal');
    expect(getRiskState(79, DEFAULT_RISK_CONFIG.thresholds)).toBe('attention');
    expect(getRiskState(60, DEFAULT_RISK_CONFIG.thresholds)).toBe('attention');
    expect(getRiskState(59, DEFAULT_RISK_CONFIG.thresholds)).toBe('suspicious');
    expect(getRiskState(40, DEFAULT_RISK_CONFIG.thresholds)).toBe('suspicious');
    expect(getRiskState(39, DEFAULT_RISK_CONFIG.thresholds)).toBe('high_risk');
    expect(getRiskState(0, DEFAULT_RISK_CONFIG.thresholds)).toBe('high_risk');
  });

  it('should deduct 5 points for face_absent at 1.0 confidence', () => {
    const result = calculateRisk({
      currentScore: 100,
      peakScore: 100,
      lastAnomalyTimestamp: null,
      lastEventTimes: {},
      newEvent: makeEvent('face_absent', 'medium', 1.0),
      currentTimestamp: now,
    });

    expect(result.score).toBe(95);
    expect(result.state).toBe('normal');
    expect(result.changed).toBe(true);
    expect(result.deductionApplied).toBe(-5);
    expect(result.cooldownActive).toBe(false);
    expect(result.explanation).toContain('Integrity score changed from 100 to 95 (-5)');
  });

  it('should scale deduction by confidence (0.5 confidence -> -2.5 rounded)', () => {
    const result = calculateRisk({
      currentScore: 100,
      peakScore: 100,
      lastAnomalyTimestamp: null,
      lastEventTimes: {},
      newEvent: makeEvent('face_absent', 'medium', 0.5),
      currentTimestamp: now,
    });

    // -5 * 0.5 = -2.5 => 100 - 2.5 = 97.5 => rounded to 98
    expect(result.score).toBe(98);
    expect(result.deductionApplied).toBe(-2.5);
  });

  it('should deduct 20 points for screen_share_stopped', () => {
    const result = calculateRisk({
      currentScore: 100,
      peakScore: 100,
      lastAnomalyTimestamp: null,
      lastEventTimes: {},
      newEvent: makeEvent('screen_share_stopped', 'critical', 1.0),
      currentTimestamp: now,
    });

    expect(result.score).toBe(80);
    expect(result.state).toBe('normal');
    expect(result.deductionApplied).toBe(-20);
  });

  it('should not deduct for info severity events', () => {
    const result = calculateRisk({
      currentScore: 90,
      peakScore: 100,
      lastAnomalyTimestamp: now - 30000,
      lastEventTimes: { tab_hidden: now - 30000 },
      newEvent: makeEvent('tab_visible', 'info', 1.0),
      currentTimestamp: now,
    });

    expect(result.score).toBe(90);
    expect(result.changed).toBe(false);
    expect(result.deductionApplied).toBe(0);
    expect(result.explanation).toContain('Informational event');
  });

  it('should suppress deduction when event fires within cooldown period', () => {
    // tab_hidden cooldown is 5s
    const firstResult = calculateRisk({
      currentScore: 100,
      peakScore: 100,
      lastAnomalyTimestamp: null,
      lastEventTimes: {},
      newEvent: makeEvent('tab_hidden', 'high', 1.0, now),
      currentTimestamp: now,
    });
    expect(firstResult.score).toBe(90);

    // 2 seconds later (within 5s cooldown)
    const secondResult = calculateRisk({
      currentScore: firstResult.score,
      peakScore: firstResult.updatedPeakScore,
      lastAnomalyTimestamp: firstResult.updatedLastAnomalyTimestamp,
      lastEventTimes: firstResult.updatedLastEventTimes,
      newEvent: makeEvent('tab_hidden', 'high', 1.0, now + 2000),
      currentTimestamp: now + 2000,
    });

    expect(secondResult.score).toBe(90);
    expect(secondResult.cooldownActive).toBe(true);
    expect(secondResult.changed).toBe(false);
    expect(secondResult.explanation).toContain('cooldown active');
  });

  it('should deduct again when event fires after cooldown period expires', () => {
    // tab_hidden cooldown is 5s. 6 seconds later:
    const result = calculateRisk({
      currentScore: 90,
      peakScore: 100,
      lastAnomalyTimestamp: now,
      lastEventTimes: { tab_hidden: now },
      newEvent: makeEvent('tab_hidden', 'high', 1.0, now + 6000),
      currentTimestamp: now + 6000,
    });

    expect(result.score).toBe(80);
    expect(result.cooldownActive).toBe(false);
    expect(result.changed).toBe(true);
  });

  it('should apply clean-time recovery (+2 points per minute of clean behavior)', () => {
    // 2 full minutes (120,000ms) clean time before new event
    const twoMinutes = 120000;
    const result = calculateRisk({
      currentScore: 70,
      peakScore: 80,
      lastAnomalyTimestamp: now,
      lastEventTimes: { multiple_faces: now },
      newEvent: makeEvent('face_absent', 'medium', 1.0, now + twoMinutes),
      currentTimestamp: now + twoMinutes,
    });

    // 70 + (2 min * 2 recovery) = 74. Then face_absent (-5) = 69.
    expect(result.recoveryApplied).toBe(4);
    expect(result.score).toBe(69);
    expect(result.explanation).toContain('+4 recovery from clean behavior');
  });

  it('should bound score floor at 0 and transition to high_risk', () => {
    const result = calculateRisk({
      currentScore: 5,
      peakScore: 100,
      lastAnomalyTimestamp: now,
      lastEventTimes: {},
      newEvent: makeEvent('screen_share_stopped', 'critical', 1.0, now + 1000),
      currentTimestamp: now + 1000,
    });

    expect(result.score).toBe(0);
    expect(result.state).toBe('high_risk');
  });

  it('should handle unrecognized event types gracefully without error', () => {
    const result = calculateRisk({
      currentScore: 85,
      peakScore: 100,
      lastAnomalyTimestamp: now,
      lastEventTimes: {},
      newEvent: makeEvent('unknown_synthetic_event', 'low', 1.0),
      currentTimestamp: now,
    });

    expect(result.score).toBe(85);
    expect(result.changed).toBe(false);
    expect(result.explanation).toContain('Unrecognized event type');
  });

  it('should be strictly deterministic', () => {
    const input = {
      currentScore: 85,
      peakScore: 90,
      lastAnomalyTimestamp: now - 30000,
      lastEventTimes: { face_absent: now - 30000 },
      newEvent: makeEvent('multiple_faces', 'high', 0.9, now),
      currentTimestamp: now,
    };

    const res1 = calculateRisk(input);
    const res2 = calculateRisk(input);

    expect(res1).toEqual(res2);
  });
});

import { z } from 'zod';
import { prisma } from '../db/client.js';
import { DetectionEvent, EventSeverity } from '@interviewshield/shared';
import { calculateRisk, evaluateCleanRecovery, RiskCalculationResult } from '../risk/engine.js';
import { logger } from '../app.js';
import { recordEventIngested, recordRiskScore, recordEventLatency } from '../telemetry/metrics.js';

export const detectionEventSchema = z.object({
  eventType: z.string().min(1),
  detectorId: z.string().min(1),
  timestamp: z.number(),
  severity: z.enum(['info', 'low', 'medium', 'high', 'critical']),
  confidence: z.number().min(0).max(1),
  payload: z.record(z.unknown()).default({}),
});

export interface ProcessEventResult {
  savedEventId: string;
  sequenceNumber: number;
  scoreBefore: number;
  scoreAfter: number;
  riskState: string;
  scoreChanged: boolean;
  explanation: string;
}

export class EventService {
  async processEvent(
    sessionId: string,
    sequenceNumber: number,
    rawEvent: DetectionEvent
  ): Promise<ProcessEventResult> {
    // Prototype pollution defense
    if (['__proto__', 'constructor', 'prototype'].includes(rawEvent?.eventType)) {
      throw new Error('Invalid eventType: prototype property name not allowed');
    }

    if (rawEvent?.payload && typeof rawEvent.payload === 'object') {
      const payloadKeys = Object.getOwnPropertyNames(rawEvent.payload);
      if (payloadKeys.some((k) => k === '__proto__' || k === 'constructor' || k === 'prototype')) {
        throw new Error('Prototype pollution attempt detected in payload');
      }
    }

    // Oversized payload defense (max 32KB for detection event payload)
    if (rawEvent?.payload && JSON.stringify(rawEvent.payload).length > 32768) {
      throw new Error('Payload exceeds maximum allowed size of 32KB');
    }

    // 1. Validate incoming event schema
    const parseResult = detectionEventSchema.safeParse(rawEvent);
    if (!parseResult.success) {
      throw new Error(`Invalid detection event schema: ${parseResult.error.message}`);
    }
    const event = parseResult.data as DetectionEvent;

    // 2. Fetch current session and metadata
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new Error(`Session ${sessionId} not found for event ingestion`);
    }

    const metadata = (session.metadata as Record<string, unknown>) || {};
    const lastEventTimes = (metadata.lastEventTimes as Record<string, number>) || {};
    const lastAnomalyTimestamp =
      typeof metadata.lastAnomalyTimestamp === 'number'
        ? metadata.lastAnomalyTimestamp
        : null;

    // 3. Calculate risk deduction & state
    const currentTimestamp =
      typeof event.timestamp === 'number' && event.timestamp > 0
        ? event.timestamp
        : Date.now();
    const riskResult: RiskCalculationResult = calculateRisk({
      currentScore: session.currentIntegrityScore,
      peakScore: session.peakIntegrityScore,
      lastAnomalyTimestamp,
      lastEventTimes,
      newEvent: event,
      currentTimestamp,
    });

    // 4. Persist detection event to database (upsert/handle dedup by sessionId + sequenceNumber)
    let savedEvent;
    try {
      savedEvent = await prisma.detectionEvent.create({
        data: {
          sessionId,
          sequenceNumber,
          eventType: event.eventType,
          detectorId: event.detectorId,
          clientTimestamp: new Date(event.timestamp),
          serverTimestamp: new Date(currentTimestamp),
          severity: event.severity,
          confidence: event.confidence,
          payload: event.payload as any,
          scoreBefore: riskResult.previousScore,
          scoreAfter: riskResult.score,
        },
      });

      // Telemetry: record ingested event, risk score, and event latency
      recordEventIngested(event.eventType, event.severity);
      recordRiskScore(riskResult.score);
      recordEventLatency(Math.max(0, currentTimestamp - event.timestamp));
    } catch (err: unknown) {
      // Check if duplicate sequenceNumber
      const prismaError = err as { code?: string };
      if (prismaError.code === 'P2002') {
        logger.warn({ sessionId, sequenceNumber }, 'Duplicate sequence number ignored');
        return {
          savedEventId: 'duplicate',
          sequenceNumber,
          scoreBefore: session.currentIntegrityScore,
          scoreAfter: session.currentIntegrityScore,
          riskState: session.currentRiskState,
          scoreChanged: false,
          explanation: 'Duplicate event sequence ignored',
        };
      }
      throw err;
    }

    // 5. If score or state changed, persist risk snapshot and update session
    if (riskResult.changed) {
      await prisma.riskSnapshot.create({
        data: {
          sessionId,
          timestamp: new Date(currentTimestamp),
          integrityScore: riskResult.score,
          riskState: riskResult.state,
          explanation: riskResult.explanation,
          contributingEventId: savedEvent.id,
        },
      });

      await prisma.session.update({
        where: { id: sessionId },
        data: {
          currentIntegrityScore: riskResult.score,
          currentRiskState: riskResult.state,
          peakIntegrityScore: riskResult.updatedPeakScore,
          eventSequenceNumber: Math.max(session.eventSequenceNumber, sequenceNumber),
          metadata: {
            ...metadata,
            lastAnomalyTimestamp: riskResult.updatedLastAnomalyTimestamp,
            lastEventTimes: riskResult.updatedLastEventTimes,
          },
        },
      });
    } else {
      // Just update last sequence number if higher
      if (sequenceNumber > session.eventSequenceNumber) {
        await prisma.session.update({
          where: { id: sessionId },
          data: {
            eventSequenceNumber: sequenceNumber,
          },
        });
      }
    }

    return {
      savedEventId: savedEvent.id,
      sequenceNumber,
      scoreBefore: riskResult.previousScore,
      scoreAfter: riskResult.score,
      riskState: riskResult.state,
      scoreChanged: riskResult.changed,
      explanation: riskResult.explanation,
    };
  }

  async checkCleanRecovery(
    sessionId: string,
    currentTimestamp: number = Date.now()
  ): Promise<{
    scoreBefore: number;
    scoreAfter: number;
    riskState: string;
    scoreChanged: boolean;
    explanation: string;
  }> {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const metadata = (session.metadata as Record<string, unknown>) || {};
    const lastAnomalyTimestamp =
      typeof metadata.lastAnomalyTimestamp === 'number'
        ? metadata.lastAnomalyTimestamp
        : null;

    const recoveryResult = evaluateCleanRecovery(
      session.currentIntegrityScore,
      session.peakIntegrityScore,
      lastAnomalyTimestamp,
      currentTimestamp
    );

    if (recoveryResult.changed) {
      await prisma.riskSnapshot.create({
        data: {
          sessionId,
          timestamp: new Date(currentTimestamp),
          integrityScore: recoveryResult.score,
          riskState: recoveryResult.state,
          explanation: recoveryResult.explanation,
        },
      });

      await prisma.session.update({
        where: { id: sessionId },
        data: {
          currentIntegrityScore: recoveryResult.score,
          currentRiskState: recoveryResult.state,
          peakIntegrityScore: recoveryResult.updatedPeakScore,
          metadata: {
            ...metadata,
            lastAnomalyTimestamp: recoveryResult.updatedLastAnomalyTimestamp,
          },
        },
      });
    }

    return {
      scoreBefore: recoveryResult.previousScore,
      scoreAfter: recoveryResult.score,
      riskState: recoveryResult.state,
      scoreChanged: recoveryResult.changed,
      explanation: recoveryResult.explanation,
    };
  }
}

export const eventService = new EventService();

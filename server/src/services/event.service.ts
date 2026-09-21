import { z } from 'zod';
import { prisma } from '../db/client.js';
import { DetectionEvent, EventSeverity } from '@interviewshield/shared';
import { calculateRisk, RiskCalculationResult } from '../risk/engine.js';
import { logger } from '../app.js';

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
    const currentTimestamp = Date.now();
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
}

export const eventService = new EventService();

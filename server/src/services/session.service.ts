import path from 'path';
import fs from 'fs';
import { prisma } from '../db/client.js';
import { AuthUser } from '../api/middleware/auth.js';
import { config } from '../config.js';

export class SessionService {
  private async checkAccess(sessionId: string, requester: AuthUser) {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { interview: true },
    });

    if (!session) {
      return { status: 404 as const, code: 'NOT_FOUND', message: 'Session not found', session: null };
    }

    if (requester.role === 'recruiter') {
      if (session.interview.recruiterId !== requester.id) {
        return { status: 404 as const, code: 'NOT_FOUND', message: 'Session not found', session: null };
      }
    } else if (requester.role === 'candidate') {
      if (session.id !== requester.id) {
        return { status: 403 as const, code: 'FORBIDDEN', message: 'Access denied to this session', session: null };
      }
    }

    return { status: 200 as const, session };
  }

  async getSessionById(sessionId: string, requester: AuthUser) {
    const access = await this.checkAccess(sessionId, requester);
    if (access.status !== 200 || !access.session) {
      return { status: access.status, code: access.code, message: access.message };
    }
    const session = access.session;

    // Format duration
    const end = session.endedAt || new Date();
    const durationMs = Math.max(0, end.getTime() - session.startedAt.getTime());
    const totalSeconds = Math.floor(durationMs / 1000);
    const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
    const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
    const seconds = String(totalSeconds % 60).padStart(2, '0');
    const duration = `${hours}:${minutes}:${seconds}`;

    return {
      status: 200,
      data: {
        id: session.id,
        interviewId: session.interviewId,
        interviewTitle: session.interview.title,
        candidateName: session.interview.candidateName,
        candidateEmail: session.interview.candidateEmail,
        startedAt: session.startedAt.toISOString(),
        endedAt: session.endedAt ? session.endedAt.toISOString() : null,
        consentGiven: session.consentGiven,
        consentGivenAt: session.consentGivenAt ? session.consentGivenAt.toISOString() : null,
        systemCheckPassed: session.systemCheckPassed,
        currentIntegrityScore: session.currentIntegrityScore,
        currentRiskState: session.currentRiskState,
        eventCount: session.eventSequenceNumber,
        duration,
      },
    };
  }

  async updateSession(
    sessionId: string,
    updates: {
      consentGiven?: boolean;
      systemCheckPassed?: boolean;
      systemCheckDetails?: Record<string, unknown>;
      ended?: boolean;
      endReason?: string;
    },
    requester: AuthUser
  ) {
    const access = await this.checkAccess(sessionId, requester);
    if (access.status !== 200 || !access.session) {
      return { status: access.status, code: access.code, message: access.message };
    }
    const session = access.session;

    const currentMetadata = (session.metadata as Record<string, unknown>) || {};
    const newMetadata = { ...currentMetadata };

    const dataToUpdate: any = {};

    if (updates.consentGiven !== undefined) {
      dataToUpdate.consentGiven = updates.consentGiven;
      if (updates.consentGiven) {
        dataToUpdate.consentGivenAt = new Date();
      }
    }

    if (updates.systemCheckPassed !== undefined) {
      dataToUpdate.systemCheckPassed = updates.systemCheckPassed;
    }

    if (updates.systemCheckDetails) {
      newMetadata.systemCheckDetails = updates.systemCheckDetails;
    }

    if (updates.ended) {
      dataToUpdate.endedAt = new Date();
      if (updates.endReason) {
        newMetadata.endReason = updates.endReason;
      }
    }

    dataToUpdate.metadata = newMetadata;

    const updated = await prisma.session.update({
      where: { id: sessionId },
      data: dataToUpdate,
      include: { interview: true },
    });

    if (updates.ended) {
      await prisma.interview.update({
        where: { id: session.interviewId },
        data: { status: 'completed' },
      });
    }

    return {
      status: 200,
      data: {
        id: updated.id,
        interviewId: updated.interviewId,
        startedAt: updated.startedAt.toISOString(),
        endedAt: updated.endedAt ? updated.endedAt.toISOString() : null,
        consentGiven: updated.consentGiven,
        consentGivenAt: updated.consentGivenAt ? updated.consentGivenAt.toISOString() : null,
        systemCheckPassed: updated.systemCheckPassed,
        currentIntegrityScore: updated.currentIntegrityScore,
        currentRiskState: updated.currentRiskState,
      },
    };
  }

  async getEvents(
    sessionId: string,
    requester: AuthUser,
    query: {
      page?: number;
      pageSize?: number;
      eventType?: string;
      severity?: string;
      minConfidence?: number;
    }
  ) {
    const access = await this.checkAccess(sessionId, requester);
    if (access.status !== 200) {
      return { status: access.status, code: access.code, message: access.message };
    }

    const page = Math.max(1, Number(query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || 50));
    const skip = (page - 1) * pageSize;

    const where: any = { sessionId };
    if (query.eventType) {
      where.eventType = query.eventType;
    }
    if (query.severity) {
      where.severity = query.severity;
    }
    if (query.minConfidence !== undefined) {
      where.confidence = { gte: Number(query.minConfidence) };
    }

    const [events, total] = await Promise.all([
      prisma.detectionEvent.findMany({
        where,
        orderBy: { sequenceNumber: 'asc' },
        skip,
        take: pageSize,
        include: {
          evidenceItems: {
            select: { id: true },
          },
        },
      }),
      prisma.detectionEvent.count({ where }),
    ]);

    const totalPages = Math.ceil(total / pageSize) || 1;

    return {
      status: 200,
      data: events.map((e) => ({
        id: e.id,
        sequenceNumber: e.sequenceNumber,
        eventType: e.eventType,
        detectorId: e.detectorId,
        clientTimestamp: e.clientTimestamp.toISOString(),
        serverTimestamp: e.serverTimestamp.toISOString(),
        severity: e.severity,
        confidence: e.confidence,
        payload: e.payload,
        scoreBefore: e.scoreBefore,
        scoreAfter: e.scoreAfter,
        hasEvidence: e.evidenceItems.length > 0,
      })),
      meta: {
        page,
        pageSize,
        total,
        totalPages,
      },
    };
  }

  async getTimeline(sessionId: string, requester: AuthUser) {
    const access = await this.checkAccess(sessionId, requester);
    if (access.status !== 200) {
      return { status: access.status, code: access.code, message: access.message };
    }

    const session = access.session!;

    const [events, snapshots] = await Promise.all([
      prisma.detectionEvent.findMany({
        where: { sessionId },
        orderBy: { serverTimestamp: 'asc' },
      }),
      prisma.riskSnapshot.findMany({
        where: { sessionId },
        orderBy: { timestamp: 'asc' },
      }),
    ]);

    return {
      status: 200,
      data: {
        sessionId: session.id,
        startedAt: session.startedAt.toISOString(),
        endedAt: session.endedAt ? session.endedAt.toISOString() : null,
        currentIntegrityScore: session.currentIntegrityScore,
        currentRiskState: session.currentRiskState,
        events: events.map((e) => ({
          id: e.id,
          sequenceNumber: e.sequenceNumber,
          eventType: e.eventType,
          detectorId: e.detectorId,
          timestamp: e.serverTimestamp.toISOString(),
          severity: e.severity,
          confidence: e.confidence,
          scoreBefore: e.scoreBefore,
          scoreAfter: e.scoreAfter,
        })),
        snapshots: snapshots.map((s) => ({
          id: s.id,
          timestamp: s.timestamp.toISOString(),
          integrityScore: s.integrityScore,
          riskState: s.riskState,
          explanation: s.explanation,
          contributingEventId: s.contributingEventId,
        })),
      },
    };
  }

  async getRisk(sessionId: string, requester: AuthUser) {
    const access = await this.checkAccess(sessionId, requester);
    if (access.status !== 200) {
      return { status: access.status, code: access.code, message: access.message };
    }

    const session = access.session!;

    const [latestSnapshot, events] = await Promise.all([
      prisma.riskSnapshot.findFirst({
        where: { sessionId },
        orderBy: { timestamp: 'desc' },
      }),
      prisma.detectionEvent.findMany({
        where: { sessionId },
        select: { severity: true, eventType: true },
      }),
    ]);

    const bySeverity: Record<string, number> = {};
    const byType: Record<string, number> = {};
    for (const ev of events) {
      bySeverity[ev.severity] = (bySeverity[ev.severity] || 0) + 1;
      byType[ev.eventType] = (byType[ev.eventType] || 0) + 1;
    }

    return {
      status: 200,
      data: {
        integrityScore: session.currentIntegrityScore,
        riskState: session.currentRiskState,
        explanation: latestSnapshot?.explanation || 'Initial session integrity score.',
        lastUpdated: (latestSnapshot?.timestamp || session.startedAt).toISOString(),
        eventSummary: {
          total: events.length,
          bySeverity,
          byType,
        },
      },
    };
  }

  async getRiskHistory(sessionId: string, requester: AuthUser) {
    const access = await this.checkAccess(sessionId, requester);
    if (access.status !== 200) {
      return { status: access.status, code: access.code, message: access.message };
    }

    const snapshots = await prisma.riskSnapshot.findMany({
      where: { sessionId },
      orderBy: { timestamp: 'asc' },
    });

    return {
      status: 200,
      data: snapshots.map((s) => ({
        id: s.id,
        timestamp: s.timestamp.toISOString(),
        integrityScore: s.integrityScore,
        riskState: s.riskState,
        explanation: s.explanation,
      })),
    };
  }

  async getEvidenceItems(sessionId: string, requester: AuthUser) {
    const access = await this.checkAccess(sessionId, requester);
    if (access.status !== 200) {
      return { status: access.status, code: access.code, message: access.message };
    }

    const items = await prisma.evidenceItem.findMany({
      where: { sessionId },
      orderBy: { timestamp: 'desc' },
    });

    return {
      status: 200,
      data: items.map((item) => ({
        id: item.id,
        sessionId: item.sessionId,
        eventId: item.eventId,
        evidenceType: item.evidenceType,
        timestamp: item.timestamp.toISOString(),
        fileSizeBytes: item.fileSizeBytes,
        metadata: item.metadata,
        downloadUrl: `/api/evidence/${item.id}/file`,
      })),
    };
  }

  async getEvidenceFile(evidenceId: string, requester: AuthUser) {
    const item = await prisma.evidenceItem.findUnique({
      where: { id: evidenceId },
      include: {
        session: {
          include: { interview: true },
        },
      },
    });

    if (!item || !item.filePath) {
      return { status: 404 as const, code: 'NOT_FOUND', message: 'Evidence file not found' };
    }

    if (requester.role === 'recruiter') {
      if (item.session.interview.recruiterId !== requester.id) {
        return { status: 404 as const, code: 'NOT_FOUND', message: 'Evidence not found' };
      }
    } else if (requester.role === 'candidate') {
      if (item.sessionId !== requester.id) {
        return { status: 403 as const, code: 'FORBIDDEN', message: 'Access denied' };
      }
    }

    // Security: path traversal check
    const baseDir = path.resolve(config.EVIDENCE_STORAGE_PATH);
    const resolvedPath = path.resolve(item.filePath);
    if (!resolvedPath.startsWith(baseDir)) {
      return { status: 403 as const, code: 'FORBIDDEN', message: 'Invalid file path' };
    }

    if (!fs.existsSync(resolvedPath)) {
      return { status: 404 as const, code: 'NOT_FOUND', message: 'File missing from storage' };
    }

    return {
      status: 200 as const,
      filePath: resolvedPath,
      mimeType: (item.metadata as any)?.mimeType || 'image/jpeg',
    };
  }

  async submitReview(
    sessionId: string,
    reviewData: { decision: string; notes?: string },
    requester: AuthUser
  ) {
    if (requester.role !== 'recruiter') {
      return { status: 403, code: 'FORBIDDEN', message: 'Only recruiters can submit human reviews' };
    }

    const validDecisions = ['pass', 'flag', 'inconclusive'];
    const normalizedDecision = (reviewData.decision || '').toLowerCase().trim();
    if (!validDecisions.includes(normalizedDecision)) {
      return {
        status: 400,
        code: 'VALIDATION_ERROR',
        message: `Invalid decision. Allowed values: ${validDecisions.join(', ')}`,
      };
    }

    const access = await this.checkAccess(sessionId, requester);
    if (access.status !== 200) {
      return { status: access.status, code: access.code, message: access.message };
    }

    const existingReview = await prisma.recruiterReview.findUnique({
      where: { sessionId },
    });

    let review;
    if (existingReview) {
      review = await prisma.recruiterReview.update({
        where: { sessionId },
        data: {
          decision: normalizedDecision,
          notes: reviewData.notes || '',
          reviewedAt: new Date(),
          recruiterId: requester.id,
        },
      });
    } else {
      review = await prisma.recruiterReview.create({
        data: {
          sessionId,
          recruiterId: requester.id,
          decision: normalizedDecision,
          notes: reviewData.notes || '',
          reviewedAt: new Date(),
        },
      });
    }

    return {
      status: existingReview ? 200 : 201,
      data: {
        id: review.id,
        sessionId: review.sessionId,
        recruiterId: review.recruiterId,
        decision: review.decision,
        notes: review.notes,
        reviewedAt: review.reviewedAt.toISOString(),
      },
    };
  }

  async getReview(sessionId: string, requester: AuthUser) {
    const access = await this.checkAccess(sessionId, requester);
    if (access.status !== 200) {
      return { status: access.status, code: access.code, message: access.message };
    }

    const review = await prisma.recruiterReview.findUnique({
      where: { sessionId },
    });

    if (!review) {
      return { status: 404, code: 'NOT_FOUND', message: 'No review submitted for this session yet' };
    }

    return {
      status: 200,
      data: {
        id: review.id,
        sessionId: review.sessionId,
        recruiterId: review.recruiterId,
        decision: review.decision,
        notes: review.notes,
        reviewedAt: review.reviewedAt.toISOString(),
      },
    };
  }
}

export const sessionService = new SessionService();

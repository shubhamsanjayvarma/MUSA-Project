import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { prisma } from '../db/client.js';
import { config } from '../config.js';

export interface CreateInterviewInput {
  title: string;
  candidateName: string;
  candidateEmail: string;
  scheduledAt?: string;
}

export interface ListInterviewsOptions {
  page?: number;
  pageSize?: number;
  status?: string;
}

export interface JoinInterviewResult {
  sessionId: string;
  interviewId: string;
  interviewTitle: string;
  wsUrl: string;
  sessionToken: string;
}

export class InterviewService {
  async createInterview(recruiterId: string, input: CreateInterviewInput) {
    const joinToken = crypto.randomBytes(32).toString('hex');

    const scheduledDate = input.scheduledAt ? new Date(input.scheduledAt) : null;
    const baseDate = scheduledDate && scheduledDate > new Date() ? scheduledDate : new Date();
    // Default expiration: 48 hours
    const tokenExpiresAt = new Date(baseDate.getTime() + 48 * 60 * 60 * 1000);

    const interview = await prisma.interview.create({
      data: {
        recruiterId,
        title: input.title.trim(),
        candidateName: input.candidateName.trim(),
        candidateEmail: input.candidateEmail.toLowerCase().trim(),
        joinToken,
        tokenExpiresAt,
        status: 'pending',
        scheduledAt: scheduledDate,
      },
    });

    return {
      id: interview.id,
      title: interview.title,
      candidateName: interview.candidateName,
      candidateEmail: interview.candidateEmail,
      joinToken: interview.joinToken,
      joinUrl: `${config.CLIENT_URL}/join/${interview.joinToken}`,
      tokenExpiresAt: interview.tokenExpiresAt.toISOString(),
      status: interview.status,
      scheduledAt: interview.scheduledAt ? interview.scheduledAt.toISOString() : null,
      createdAt: interview.createdAt.toISOString(),
    };
  }

  async listInterviews(recruiterId: string, options: ListInterviewsOptions = {}) {
    const page = Math.max(1, options.page || 1);
    const pageSize = Math.min(100, Math.max(1, options.pageSize || 20));
    const skip = (page - 1) * pageSize;

    const where: { recruiterId: string; status?: string } = { recruiterId };
    if (options.status) {
      where.status = options.status;
    }

    const [interviews, total] = await Promise.all([
      prisma.interview.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
        include: {
          sessions: {
            orderBy: { startedAt: 'desc' },
            take: 1,
            include: { review: true },
          },
        },
      }),
      prisma.interview.count({ where }),
    ]);

    const formatted = (interviews as any[]).map((interview: any) => {
      const latest = interview.sessions[0];
      return {
        id: interview.id,
        title: interview.title,
        candidateName: interview.candidateName,
        candidateEmail: interview.candidateEmail,
        joinToken: interview.joinToken,
        joinUrl: `${config.CLIENT_URL}/join/${interview.joinToken}`,
        status: interview.status,
        scheduledAt: interview.scheduledAt ? interview.scheduledAt.toISOString() : null,
        latestSession: latest
          ? {
              id: latest.id,
              integrityScore: latest.currentIntegrityScore,
              riskState: latest.currentRiskState,
              startedAt: latest.startedAt.toISOString(),
              endedAt: latest.endedAt ? latest.endedAt.toISOString() : null,
              reviewDecision: latest.review ? latest.review.decision : null,
            }
          : null,
        createdAt: interview.createdAt.toISOString(),
      };
    });

    return {
      data: formatted,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize) || 1,
      },
    };
  }

  async getInterviewById(recruiterId: string, interviewId: string) {
    const interview = await prisma.interview.findFirst({
      where: {
        id: interviewId,
        recruiterId,
      },
      include: {
        sessions: {
          orderBy: { startedAt: 'desc' },
        },
      },
    });

    if (!interview) {
      return null;
    }

    return {
      id: interview.id,
      title: interview.title,
      candidateName: interview.candidateName,
      candidateEmail: interview.candidateEmail,
      joinToken: interview.joinToken,
      joinUrl: `${config.CLIENT_URL}/join/${interview.joinToken}`,
      tokenExpiresAt: interview.tokenExpiresAt.toISOString(),
      status: interview.status,
      scheduledAt: interview.scheduledAt ? interview.scheduledAt.toISOString() : null,
      sessions: (interview.sessions as any[]).map((s: any) => ({
        id: s.id,
        startedAt: s.startedAt.toISOString(),
        endedAt: s.endedAt ? s.endedAt.toISOString() : null,
        integrityScore: s.currentIntegrityScore,
        riskState: s.currentRiskState,
        eventCount: s.eventSequenceNumber,
      })),
      createdAt: interview.createdAt.toISOString(),
    };
  }

  async joinInterview(joinToken: string) {
    const interview = await prisma.interview.findUnique({
      where: { joinToken },
    });

    if (!interview) {
      return { status: 404, code: 'NOT_FOUND', message: 'Invalid join token' };
    }

    if (new Date() > interview.tokenExpiresAt) {
      return { status: 410, code: 'TOKEN_EXPIRED', message: 'Join token has expired' };
    }

    if (interview.status !== 'pending' && interview.status !== 'active') {
      return {
        status: 409,
        code: 'CONFLICT',
        message: `Interview is in '${interview.status}' status and cannot be joined`,
      };
    }

    const session = await prisma.session.create({
      data: {
        interviewId: interview.id,
        startedAt: new Date(),
        currentIntegrityScore: 100,
        currentRiskState: 'normal',
        peakIntegrityScore: 100,
        eventSequenceNumber: 0,
        metadata: {},
      },
    });

    if (interview.status === 'pending') {
      await prisma.interview.update({
        where: { id: interview.id },
        data: { status: 'active' },
      });
    }

    const sessionToken = jwt.sign(
      {
        sub: session.id,
        role: 'candidate',
        interviewId: interview.id,
      },
      config.JWT_SECRET,
      { expiresIn: '24h' }
    );

    const wsUrl = `ws://localhost:${config.PORT}/ws/session/${session.id}`;

    return {
      status: 201,
      data: {
        sessionId: session.id,
        interviewId: interview.id,
        interviewTitle: interview.title,
        wsUrl,
        sessionToken,
      },
    };
  }
}

export const interviewService = new InterviewService();

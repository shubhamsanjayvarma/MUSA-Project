import { prisma } from '../db/client.js';
import { AuthUser } from '../api/middleware/auth.js';

export class SessionService {
  async getSessionById(sessionId: string, requester: AuthUser) {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        interview: true,
      },
    });

    if (!session) {
      return { status: 404, code: 'NOT_FOUND', message: 'Session not found' };
    }

    // Check authorization:
    if (requester.role === 'recruiter') {
      if (session.interview.recruiterId !== requester.id) {
        return { status: 404, code: 'NOT_FOUND', message: 'Session not found' };
      }
    } else if (requester.role === 'candidate') {
      if (session.id !== requester.id) {
        return { status: 403, code: 'FORBIDDEN', message: 'Access denied to this session' };
      }
    }

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
}

export const sessionService = new SessionService();

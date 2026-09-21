import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcrypt';
import { app } from '../app.js';
import { prisma } from '../db/client.js';

describe('InterviewShield API Integration Tests', () => {
  let demoRecruiterToken = '';
  let demoRecruiterId = '';
  let otherRecruiterToken = '';
  let otherRecruiterId = '';
  let createdInterviewId = '';
  let createdJoinToken = '';
  let createdSessionId = '';
  let candidateSessionToken = '';

  beforeAll(async () => {
    // Ensure clean test recruiters exist
    const demoPasswordHash = await bcrypt.hash('demo123', 10);
    const demoRecruiter = await prisma.recruiter.upsert({
      where: { email: 'recruiter@demo.interviewshield.dev' },
      update: { passwordHash: demoPasswordHash },
      create: {
        email: 'recruiter@demo.interviewshield.dev',
        name: 'Demo Recruiter',
        passwordHash: demoPasswordHash,
      },
    });
    demoRecruiterId = demoRecruiter.id;

    const otherRecruiter = await prisma.recruiter.upsert({
      where: { email: 'other@demo.interviewshield.dev' },
      update: { passwordHash: demoPasswordHash },
      create: {
        email: 'other@demo.interviewshield.dev',
        name: 'Other Recruiter',
        passwordHash: demoPasswordHash,
      },
    });
    otherRecruiterId = otherRecruiter.id;
  });

  afterAll(async () => {
    // Clean up created test data
    if (createdSessionId) {
      await prisma.session.deleteMany({ where: { id: createdSessionId } });
    }
    if (createdInterviewId) {
      await prisma.interview.deleteMany({ where: { id: createdInterviewId } });
    }
    await prisma.$disconnect();
  });

  describe('AUTH: POST /api/auth/login', () => {
    it('should login successfully with valid credentials and return JWT', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'recruiter@demo.interviewshield.dev',
          password: 'demo123',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.recruiter.email).toBe('recruiter@demo.interviewshield.dev');
      expect(res.body.data.recruiter.id).toBe(demoRecruiterId);
      expect(res.body.data.recruiter.passwordHash).toBeUndefined();

      demoRecruiterToken = res.body.data.token;
    });

    it('should reject login with invalid password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'recruiter@demo.interviewshield.dev',
          password: 'wrongpassword',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should reject login with nonexistent recruiter', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'demo123',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should obtain a token for the other recruiter for multi-tenancy tests', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'other@demo.interviewshield.dev',
          password: 'demo123',
        });

      expect(res.status).toBe(200);
      otherRecruiterToken = res.body.data.token;
    });
  });

  describe('INTERVIEW: POST /api/interviews & GET /api/interviews', () => {
    it('should allow authenticated recruiter to create an interview with secure join token', async () => {
      const res = await request(app)
        .post('/api/interviews')
        .set('Authorization', `Bearer ${demoRecruiterToken}`)
        .send({
          title: 'Senior Systems Engineer Interview',
          candidateName: 'Alex Smith',
          candidateEmail: 'alex.smith@example.com',
          scheduledAt: new Date(Date.now() + 86400000).toISOString(),
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.title).toBe('Senior Systems Engineer Interview');
      expect(res.body.data.candidateName).toBe('Alex Smith');
      expect(res.body.data.joinToken).toBeDefined();
      expect(res.body.data.joinToken.length).toBe(64); // 32 bytes hex
      expect(res.body.data.joinUrl).toContain(`/join/${res.body.data.joinToken}`);
      expect(res.body.data.status).toBe('pending');

      createdInterviewId = res.body.data.id;
      createdJoinToken = res.body.data.joinToken;
    });

    it('should reject interview creation without authentication', async () => {
      const res = await request(app)
        .post('/api/interviews')
        .send({
          title: 'Unauthorized Interview',
          candidateName: 'Hacker',
          candidateEmail: 'hacker@example.com',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should allow recruiter to list only their own interviews', async () => {
      const res = await request(app)
        .get('/api/interviews')
        .set('Authorization', `Bearer ${demoRecruiterToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      const found = res.body.data.some((i: { id: string }) => i.id === createdInterviewId);
      expect(found).toBe(true);
    });

    it('should not allow another recruiter to see the first recruiter interview', async () => {
      // Look up with another recruiter token
      const res = await request(app)
        .get(`/api/interviews/${createdInterviewId}`)
        .set('Authorization', `Bearer ${otherRecruiterToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('JOIN: POST /api/interviews/join', () => {
    it('should allow candidate to join with valid token, creating session', async () => {
      const res = await request(app)
        .post('/api/interviews/join')
        .send({
          joinToken: createdJoinToken,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.sessionId).toBeDefined();
      expect(res.body.data.interviewId).toBe(createdInterviewId);
      expect(res.body.data.interviewTitle).toBe('Senior Systems Engineer Interview');
      expect(res.body.data.sessionToken).toBeDefined();
      expect(res.body.data.wsUrl).toContain(res.body.data.sessionId);

      createdSessionId = res.body.data.sessionId;
      candidateSessionToken = res.body.data.sessionToken;

      // Verify interview status transitioned to active in database
      const interviewInDb = await prisma.interview.findUnique({
        where: { id: createdInterviewId },
      });
      expect(interviewInDb?.status).toBe('active');
    });

    it('should reject join with invalid token', async () => {
      const res = await request(app)
        .post('/api/interviews/join')
        .send({
          joinToken: 'invalid-nonexistent-token-1234567890',
        });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('should reject join with expired token', async () => {
      // Create an expired interview
      const expiredInterview = await prisma.interview.create({
        data: {
          recruiterId: demoRecruiterId,
          title: 'Expired Interview',
          candidateName: 'Late Candidate',
          candidateEmail: 'late@example.com',
          joinToken: 'expired-token-1234567890abcdef1234567890abcdef',
          tokenExpiresAt: new Date(Date.now() - 3600000), // 1 hour ago
          status: 'pending',
        },
      });

      const res = await request(app)
        .post('/api/interviews/join')
        .send({
          joinToken: expiredInterview.joinToken,
        });

      expect(res.status).toBe(410);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('TOKEN_EXPIRED');

      await prisma.interview.delete({ where: { id: expiredInterview.id } });
    });

    it('should reject join when interview is cancelled', async () => {
      // Create a cancelled interview
      const cancelledInterview = await prisma.interview.create({
        data: {
          recruiterId: demoRecruiterId,
          title: 'Cancelled Interview',
          candidateName: 'Cancelled Candidate',
          candidateEmail: 'cancelled@example.com',
          joinToken: 'cancelled-token-1234567890abcdef1234567890abcdef',
          tokenExpiresAt: new Date(Date.now() + 3600000),
          status: 'cancelled',
        },
      });

      const res = await request(app)
        .post('/api/interviews/join')
        .send({
          joinToken: cancelledInterview.joinToken,
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('CONFLICT');

      await prisma.interview.delete({ where: { id: cancelledInterview.id } });
    });
  });

  describe('SESSION: GET /api/sessions/:id', () => {
    it('should allow candidate to look up their own session using session token', async () => {
      const res = await request(app)
        .get(`/api/sessions/${createdSessionId}`)
        .set('Authorization', `Bearer ${candidateSessionToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(createdSessionId);
      expect(res.body.data.interviewId).toBe(createdInterviewId);
      expect(res.body.data.interviewTitle).toBe('Senior Systems Engineer Interview');
      expect(res.body.data.currentIntegrityScore).toBe(100);
      expect(res.body.data.currentRiskState).toBe('normal');
      expect(res.body.data.consentGiven).toBe(false);
      expect(res.body.data.systemCheckPassed).toBe(false);
      expect(res.body.data.duration).toBeDefined();
    });

    it('should allow the interview recruiter to look up the session', async () => {
      const res = await request(app)
        .get(`/api/sessions/${createdSessionId}`)
        .set('Authorization', `Bearer ${demoRecruiterToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(createdSessionId);
    });

    it('should reject lookup without any token', async () => {
      const res = await request(app)
        .get(`/api/sessions/${createdSessionId}`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should reject lookup by a different recruiter', async () => {
      const res = await request(app)
        .get(`/api/sessions/${createdSessionId}`)
        .set('Authorization', `Bearer ${otherRecruiterToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });
});

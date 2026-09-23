import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import http from 'http';
import WebSocket from 'ws';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import path from 'path';
import fs from 'fs';
import { app } from '../app.js';
import { setupWebSocketServer } from '../ws/server.js';
import { prisma } from '../db/client.js';
import { config } from '../config.js';
import { eventService } from '../services/event.service.js';
import { sessionService } from '../services/session.service.js';
import { WSServerMessage } from '@interviewshield/shared';

describe('STRIDE & OWASP Security & Penetration Testing Suite', () => {
  let wsServer: http.Server;
  let wsPort: number;

  // Recruiter A (Attacker / Tenant A)
  let recruiterAId = '';
  let recruiterAToken = '';
  let interviewAId = '';
  let sessionAId = '';
  let candidateAToken = '';

  // Recruiter B (Target / Tenant B)
  let recruiterBId = '';
  let recruiterBToken = '';
  let interviewBId = '';
  let sessionBId = '';
  let candidateBToken = '';
  let evidenceBId = '';
  let maliciousPathEvidenceId = '';
  let testEvidenceFilePath = '';

  beforeAll(async () => {
    const passwordHash = await bcrypt.hash('SecPass123!', 10);

    // 1. Setup Recruiter A
    const recruiterA = await prisma.recruiter.upsert({
      where: { email: 'recruiter-a@security.interviewshield.dev' },
      update: { passwordHash },
      create: {
        email: 'recruiter-a@security.interviewshield.dev',
        name: 'Recruiter A (Attacker)',
        passwordHash,
      },
    });
    recruiterAId = recruiterA.id;

    // Login Recruiter A
    const loginARes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'recruiter-a@security.interviewshield.dev', password: 'SecPass123!' });
    recruiterAToken = loginARes.body.data.token;

    // Interview & Session A
    const interviewA = await prisma.interview.create({
      data: {
        recruiterId: recruiterAId,
        title: 'Recruiter A Private Interview',
        candidateName: 'Candidate Alpha',
        candidateEmail: 'alpha@candidate.test',
        joinToken: `sec-join-a-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
        tokenExpiresAt: new Date(Date.now() + 86400000),
        status: 'active',
      },
    });
    interviewAId = interviewA.id;

    const sessionA = await prisma.session.create({
      data: {
        interviewId: interviewA.id,
        startedAt: new Date(),
        currentIntegrityScore: 100,
        currentRiskState: 'normal',
        peakIntegrityScore: 100,
        eventSequenceNumber: 0,
        metadata: {},
      },
    });
    sessionAId = sessionA.id;

    candidateAToken = jwt.sign(
      { sub: sessionA.id, role: 'candidate', interviewId: interviewA.id },
      config.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // 2. Setup Recruiter B
    const recruiterB = await prisma.recruiter.upsert({
      where: { email: 'recruiter-b@security.interviewshield.dev' },
      update: { passwordHash },
      create: {
        email: 'recruiter-b@security.interviewshield.dev',
        name: 'Recruiter B (Target)',
        passwordHash,
      },
    });
    recruiterBId = recruiterB.id;

    // Login Recruiter B
    const loginBRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'recruiter-b@security.interviewshield.dev', password: 'SecPass123!' });
    recruiterBToken = loginBRes.body.data.token;

    // Interview & Session B
    const interviewB = await prisma.interview.create({
      data: {
        recruiterId: recruiterBId,
        title: 'Recruiter B Confidential Interview',
        candidateName: 'Candidate Beta',
        candidateEmail: 'beta@candidate.test',
        joinToken: `sec-join-b-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
        tokenExpiresAt: new Date(Date.now() + 86400000),
        status: 'active',
      },
    });
    interviewBId = interviewB.id;

    const sessionB = await prisma.session.create({
      data: {
        interviewId: interviewB.id,
        startedAt: new Date(),
        currentIntegrityScore: 85,
        currentRiskState: 'attention',
        peakIntegrityScore: 100,
        eventSequenceNumber: 1,
        metadata: { sensitiveInterviewNotes: 'Top secret candidate data' },
      },
    });
    sessionBId = sessionB.id;

    candidateBToken = jwt.sign(
      { sub: sessionB.id, role: 'candidate', interviewId: interviewB.id },
      config.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Seed detection event for Session B
    const eventB = await prisma.detectionEvent.create({
      data: {
        sessionId: sessionB.id,
        sequenceNumber: 1,
        eventType: 'tab_hidden',
        detectorId: 'tab_detector',
        clientTimestamp: new Date(),
        serverTimestamp: new Date(),
        severity: 'medium',
        confidence: 0.9,
        payload: { confidentialTab: 'https://internal-eval.secret.org' },
        scoreBefore: 100,
        scoreAfter: 85,
      },
    });

    // Seed risk snapshot for Session B
    await prisma.riskSnapshot.create({
      data: {
        sessionId: sessionB.id,
        integrityScore: 85,
        riskState: 'attention',
        explanation: 'Candidate switched tabs away from interview display',
        contributingEventId: eventB.id,
      },
    });

    // Seed recruiter review for Session B
    await prisma.recruiterReview.create({
      data: {
        sessionId: sessionB.id,
        recruiterId: recruiterBId,
        decision: 'flag',
        notes: 'Strict review: Candidate visited prohibited internal tab.',
        reviewedAt: new Date(),
      },
    });

    // Prepare legitimate test evidence file for Session B
    const storageDir = path.resolve(config.EVIDENCE_STORAGE_PATH, sessionB.id);
    await fs.promises.mkdir(storageDir, { recursive: true });
    testEvidenceFilePath = path.join(storageDir, 'legitimate_evidence.jpg');
    await fs.promises.writeFile(testEvidenceFilePath, Buffer.from('JPEG_MOCK_DATA_TENANT_B_EVIDENCE'));

    const evidenceB = await prisma.evidenceItem.create({
      data: {
        sessionId: sessionB.id,
        eventId: eventB.id,
        evidenceType: 'snapshot',
        timestamp: new Date(),
        filePath: testEvidenceFilePath,
        fileSizeBytes: 32,
        metadata: { mimeType: 'image/jpeg' },
        retentionExpiresAt: new Date(Date.now() + 86400000 * 30),
      },
    });
    evidenceBId = evidenceB.id;

    // Seed malicious evidence item pointing outside storage directory (for path traversal boundary test)
    const maliciousEvidence = await prisma.evidenceItem.create({
      data: {
        sessionId: sessionB.id,
        evidenceType: 'snapshot',
        timestamp: new Date(),
        filePath: path.resolve(config.EVIDENCE_STORAGE_PATH, '../../package.json'),
        fileSizeBytes: 100,
        metadata: { mimeType: 'text/plain' },
        retentionExpiresAt: new Date(Date.now() + 86400000 * 30),
      },
    });
    maliciousPathEvidenceId = maliciousEvidence.id;

    // 3. Start HTTP + WS server on an ephemeral port
    wsServer = http.createServer(app);
    setupWebSocketServer(wsServer);

    await new Promise<void>((resolve) => {
      wsServer.listen(0, () => {
        const addr = wsServer.address() as { port: number };
        wsPort = addr.port;
        resolve();
      });
    });
  });

  afterAll(async () => {
    // 1. Close WebSocket server
    if (wsServer) {
      await new Promise<void>((resolve) => wsServer.close(() => resolve()));
    }

    // 2. Clean up test evidence on disk
    try {
      if (testEvidenceFilePath && fs.existsSync(testEvidenceFilePath)) {
        await fs.promises.unlink(testEvidenceFilePath);
      }
      const dirB = path.resolve(config.EVIDENCE_STORAGE_PATH, sessionBId);
      if (fs.existsSync(dirB)) {
        await fs.promises.rmdir(dirB);
      }
    } catch {
      // Ignore disk cleanup failures
    }

    // 3. Clean up database records in dependency order
    const sessionIds = [sessionAId, sessionBId].filter(Boolean);
    if (sessionIds.length > 0) {
      await prisma.recruiterReview.deleteMany({ where: { sessionId: { in: sessionIds } } });
      await prisma.evidenceItem.deleteMany({ where: { sessionId: { in: sessionIds } } });
      await prisma.riskSnapshot.deleteMany({ where: { sessionId: { in: sessionIds } } });
      await prisma.detectionEvent.deleteMany({ where: { sessionId: { in: sessionIds } } });
      await prisma.session.deleteMany({ where: { id: { in: sessionIds } } });
    }

    const interviewIds = [interviewAId, interviewBId].filter(Boolean);
    if (interviewIds.length > 0) {
      await prisma.interview.deleteMany({ where: { id: { in: interviewIds } } });
    }

    const recruiterIds = [recruiterAId, recruiterBId].filter(Boolean);
    if (recruiterIds.length > 0) {
      // Find any remaining interviews tied to these test recruiters
      const remainingInterviews = await prisma.interview.findMany({
        where: { recruiterId: { in: recruiterIds } },
        select: { id: true },
      });
      if (remainingInterviews.length > 0) {
        const remInterviewIds = remainingInterviews.map((i) => i.id);
        const remSessions = await prisma.session.findMany({
          where: { interviewId: { in: remInterviewIds } },
          select: { id: true },
        });
        const remSessionIds = remSessions.map((s) => s.id);
        if (remSessionIds.length > 0) {
          await prisma.recruiterReview.deleteMany({ where: { sessionId: { in: remSessionIds } } });
          await prisma.evidenceItem.deleteMany({ where: { sessionId: { in: remSessionIds } } });
          await prisma.riskSnapshot.deleteMany({ where: { sessionId: { in: remSessionIds } } });
          await prisma.detectionEvent.deleteMany({ where: { sessionId: { in: remSessionIds } } });
          await prisma.session.deleteMany({ where: { id: { in: remSessionIds } } });
        }
        await prisma.interview.deleteMany({ where: { id: { in: remInterviewIds } } });
      }
      await prisma.recruiter.deleteMany({ where: { id: { in: recruiterIds } } });
    }

    await prisma.$disconnect();
  });

  // =========================================================================
  // VULN-01: Malformed detection event payload fuzzing, oversized payload rejection, prototype pollution
  // =========================================================================
  describe('VULN-01: Malformed Detection Event Payload Fuzzing, Oversized Payloads & Prototype Pollution [OWASP A03 / STRIDE: Tampering & DoS]', () => {
    it('should reject malformed detection events missing required fields', async () => {
      // Missing eventType
      await expect(
        eventService.processEvent(sessionAId, 101, {
          eventType: '',
          detectorId: 'tab_detector',
          timestamp: Date.now(),
          severity: 'high',
          confidence: 1.0,
          payload: {},
        })
      ).rejects.toThrow(/Invalid detection event schema/i);

      // Missing detectorId
      await expect(
        eventService.processEvent(sessionAId, 102, {
          eventType: 'tab_hidden',
          detectorId: '',
          timestamp: Date.now(),
          severity: 'high',
          confidence: 1.0,
          payload: {},
        })
      ).rejects.toThrow(/Invalid detection event schema/i);
    });

    it('should reject fuzzed invalid types for detection event fields', async () => {
      // Type mismatch: numeric eventType
      await expect(
        eventService.processEvent(sessionAId, 103, {
          eventType: 12345 as any,
          detectorId: 'tab_detector',
          timestamp: Date.now(),
          severity: 'high',
          confidence: 1.0,
          payload: {},
        })
      ).rejects.toThrow(/Invalid detection event schema/i);

      // Type mismatch: string timestamp
      await expect(
        eventService.processEvent(sessionAId, 104, {
          eventType: 'tab_hidden',
          detectorId: 'tab_detector',
          timestamp: '2026-09-23T12:00:00Z' as any,
          severity: 'high',
          confidence: 1.0,
          payload: {},
        })
      ).rejects.toThrow(/Invalid detection event schema/i);
    });

    it('should reject out-of-range confidence scores (< 0.0 or > 1.0)', async () => {
      // Confidence > 1.0
      await expect(
        eventService.processEvent(sessionAId, 105, {
          eventType: 'tab_hidden',
          detectorId: 'tab_detector',
          timestamp: Date.now(),
          severity: 'high',
          confidence: 1.99,
          payload: {},
        })
      ).rejects.toThrow(/Invalid detection event schema/i);

      // Confidence < 0.0
      await expect(
        eventService.processEvent(sessionAId, 106, {
          eventType: 'tab_hidden',
          detectorId: 'tab_detector',
          timestamp: Date.now(),
          severity: 'high',
          confidence: -0.5,
          payload: {},
        })
      ).rejects.toThrow(/Invalid detection event schema/i);
    });

    it('should reject invalid event severity enumerations', async () => {
      await expect(
        eventService.processEvent(sessionAId, 107, {
          eventType: 'tab_hidden',
          detectorId: 'tab_detector',
          timestamp: Date.now(),
          severity: 'disastrous' as any,
          confidence: 0.8,
          payload: {},
        })
      ).rejects.toThrow(/Invalid detection event schema/i);
    });

    it('should reject oversized detection event payload exceeding maximum size limit', async () => {
      // 40KB payload exceeding 32KB limit
      const oversizedPayload: Record<string, string> = {};
      for (let i = 0; i < 400; i++) {
        oversizedPayload[`key_${i}`] = 'A'.repeat(100);
      }

      await expect(
        eventService.processEvent(sessionAId, 108, {
          eventType: 'tab_hidden',
          detectorId: 'tab_detector',
          timestamp: Date.now(),
          severity: 'high',
          confidence: 1.0,
          payload: oversizedPayload,
        })
      ).rejects.toThrow(/Payload exceeds maximum allowed size/i);
    });

    it('should reject oversized evidence snapshots over WebSocket (> 50KB limit) with EVIDENCE_TOO_LARGE', async () => {
      const wsUrl = `ws://localhost:${wsPort}/ws/session/${sessionAId}?token=${candidateAToken}`;
      const ws = new WebSocket(wsUrl);
      ws.on('error', () => {});

      // 55 KB dummy binary buffer (> 50KB = 51200 bytes limit)
      const oversizedBuffer = Buffer.alloc(55 * 1024, 0x41);
      const base64Data = oversizedBuffer.toString('base64');

      let receivedErrorMsg: WSServerMessage | null = null;

      await new Promise<void>((resolve) => {
        ws.on('message', (data) => {
          const msg = JSON.parse(data.toString()) as WSServerMessage;
          if (msg.type === 'session:joined' || msg.type === 'session:confirmed') {
            ws.send(
              JSON.stringify({
                type: 'evidence:snapshot',
                sequenceNumber: 109,
                timestamp: Date.now(),
                payload: {
                  imageDataUrl: `data:image/jpeg;base64,${base64Data}`,
                  capturedAt: Date.now(),
                },
              })
            );
          }
          if (msg.type === 'error' && (msg as any).payload?.code === 'EVIDENCE_TOO_LARGE') {
            receivedErrorMsg = msg;
            resolve();
          }
        });

        setTimeout(() => resolve(), 4000);
      });

      ws.close();

      expect(receivedErrorMsg).not.toBeNull();
      expect((receivedErrorMsg as any)?.payload?.code).toBe('EVIDENCE_TOO_LARGE');
    });

    it('should reject oversized WebSocket raw frame (> 128KB) with PAYLOAD_TOO_LARGE', async () => {
      const wsUrl = `ws://localhost:${wsPort}/ws/session/${sessionAId}?token=${candidateAToken}`;
      const ws = new WebSocket(wsUrl);
      ws.on('error', () => {});

      let receivedErrorMsg: WSServerMessage | null = null;

      await new Promise<void>((resolve) => {
        ws.on('open', () => {
          // Send 140KB raw string message exceeding 128KB (131072 bytes) limit
          const hugeMessage = JSON.stringify({
            type: 'ping',
            padding: 'x'.repeat(140000),
          });
          ws.send(hugeMessage);
        });

        ws.on('message', (data) => {
          const msg = JSON.parse(data.toString()) as WSServerMessage;
          if (msg.type === 'error' && (msg as any).payload?.code === 'PAYLOAD_TOO_LARGE') {
            receivedErrorMsg = msg;
            resolve();
          }
        });

        setTimeout(() => resolve(), 4000);
      });

      ws.close();

      expect(receivedErrorMsg).not.toBeNull();
      expect((receivedErrorMsg as any)?.payload?.code).toBe('PAYLOAD_TOO_LARGE');
    });

    it('should reject malformed non-JSON WebSocket frame with MALFORMED_MESSAGE', async () => {
      const wsUrl = `ws://localhost:${wsPort}/ws/session/${sessionAId}?token=${candidateAToken}`;
      const ws = new WebSocket(wsUrl);
      ws.on('error', () => {});

      let receivedErrorMsg: WSServerMessage | null = null;

      await new Promise<void>((resolve) => {
        ws.on('open', () => {
          ws.send('{malformed: json: invalid! ][');
        });

        ws.on('message', (data) => {
          const msg = JSON.parse(data.toString()) as WSServerMessage;
          if (msg.type === 'error' && (msg as any).payload?.code === 'MALFORMED_MESSAGE') {
            receivedErrorMsg = msg;
            resolve();
          }
        });

        setTimeout(() => resolve(), 3000);
      });

      ws.close();

      expect(receivedErrorMsg).not.toBeNull();
      expect((receivedErrorMsg as any)?.payload?.code).toBe('MALFORMED_MESSAGE');
    });

    it('should reject prototype pollution attempts (__proto__, constructor, prototype) and preserve Object prototype integrity', async () => {
      // Craft malicious prototype pollution payload
      const evilPayload = JSON.parse(
        '{"__proto__": {"polluted": true, "isAdmin": true}, "constructor": {"prototype": {"polluted": true}}}'
      );

      await expect(
        eventService.processEvent(sessionAId, 110, {
          eventType: 'tab_hidden',
          detectorId: 'tab_detector',
          timestamp: Date.now(),
          severity: 'high',
          confidence: 1.0,
          payload: evilPayload,
        })
      ).rejects.toThrow(/Prototype pollution attempt detected in payload/i);

      // Verify Object.prototype is unpolluted
      expect(({} as any).polluted).toBeUndefined();
      expect(({} as any).isAdmin).toBeUndefined();
      expect(Object.prototype.hasOwnProperty('polluted')).toBe(false);
      expect(Object.prototype.hasOwnProperty('isAdmin')).toBe(false);
    });

    it('should reject prototype property names used as eventType (__proto__, constructor, prototype)', async () => {
      await expect(
        eventService.processEvent(sessionAId, 111, {
          eventType: '__proto__',
          detectorId: 'tab_detector',
          timestamp: Date.now(),
          severity: 'high',
          confidence: 1.0,
          payload: {},
        })
      ).rejects.toThrow(/prototype property name not allowed/i);

      await expect(
        eventService.processEvent(sessionAId, 112, {
          eventType: 'constructor',
          detectorId: 'tab_detector',
          timestamp: Date.now(),
          severity: 'high',
          confidence: 1.0,
          payload: {},
        })
      ).rejects.toThrow(/prototype property name not allowed/i);

      // Verify Object prototype remains pristine
      expect(({} as any).polluted).toBeUndefined();
    });
  });

  // =========================================================================
  // VULN-02: IDOR cross-recruiter session isolation
  // =========================================================================
  describe('VULN-02: IDOR Cross-Recruiter Session Isolation [OWASP A01: Broken Access Control / STRIDE: Information Disclosure & Elevation of Privilege]', () => {
    it('should prevent Recruiter A from retrieving Recruiter B session details (GET /api/sessions/:id -> 404)', async () => {
      const res = await request(app)
        .get(`/api/sessions/${sessionBId}`)
        .set('Authorization', `Bearer ${recruiterAToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('should prevent Recruiter A from modifying Recruiter B session (PATCH /api/sessions/:id -> 404)', async () => {
      const res = await request(app)
        .patch(`/api/sessions/${sessionBId}`)
        .set('Authorization', `Bearer ${recruiterAToken}`)
        .send({ ended: true, endReason: 'Malicious termination' });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('should prevent Recruiter A from listing Recruiter B detection events (GET /api/sessions/:id/events -> 404)', async () => {
      const res = await request(app)
        .get(`/api/sessions/${sessionBId}/events`)
        .set('Authorization', `Bearer ${recruiterAToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('should prevent Recruiter A from accessing Recruiter B timeline (GET /api/sessions/:id/timeline -> 404)', async () => {
      const res = await request(app)
        .get(`/api/sessions/${sessionBId}/timeline`)
        .set('Authorization', `Bearer ${recruiterAToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('should prevent Recruiter A from viewing Recruiter B risk summary (GET /api/sessions/:id/risk -> 404)', async () => {
      const res = await request(app)
        .get(`/api/sessions/${sessionBId}/risk`)
        .set('Authorization', `Bearer ${recruiterAToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('should prevent Recruiter A from viewing Recruiter B risk history (GET /api/sessions/:id/risk/history -> 404)', async () => {
      const res = await request(app)
        .get(`/api/sessions/${sessionBId}/risk/history`)
        .set('Authorization', `Bearer ${recruiterAToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('should prevent Recruiter A from listing Recruiter B evidence metadata (GET /api/sessions/:id/evidence -> 404)', async () => {
      const res = await request(app)
        .get(`/api/sessions/${sessionBId}/evidence`)
        .set('Authorization', `Bearer ${recruiterAToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('should prevent Recruiter A from downloading Recruiter B evidence file (GET /api/evidence/:id/file -> 404)', async () => {
      const res = await request(app)
        .get(`/api/evidence/${evidenceBId}/file`)
        .set('Authorization', `Bearer ${recruiterAToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('should prevent Recruiter A from viewing Recruiter B human review (GET /api/sessions/:id/review -> 404)', async () => {
      const res = await request(app)
        .get(`/api/sessions/${sessionBId}/review`)
        .set('Authorization', `Bearer ${recruiterAToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('should prevent Recruiter A from submitting review on Recruiter B session (POST /api/sessions/:id/review -> 404)', async () => {
      const res = await request(app)
        .post(`/api/sessions/${sessionBId}/review`)
        .set('Authorization', `Bearer ${recruiterAToken}`)
        .send({ decision: 'pass', notes: 'Tampered review by Recruiter A' });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('should prevent Recruiter A from downloading Recruiter B session audit report (GET /api/sessions/:id/report -> 404)', async () => {
      const res = await request(app)
        .get(`/api/sessions/${sessionBId}/report`)
        .set('Authorization', `Bearer ${recruiterAToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('should prevent Recruiter A from initiating GDPR crypto-shredding on Recruiter B session (POST /api/sessions/:id/shred -> 404)', async () => {
      const res = await request(app)
        .post(`/api/sessions/${sessionBId}/shred`)
        .set('Authorization', `Bearer ${recruiterAToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('should prevent Recruiter A from viewing Recruiter B interview record (GET /api/interviews/:id -> 404)', async () => {
      const res = await request(app)
        .get(`/api/interviews/${interviewBId}`)
        .set('Authorization', `Bearer ${recruiterAToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('should terminate WebSocket connection if Recruiter A attempts connecting to Recruiter B session (close code 4003 Forbidden)', async () => {
      const wsUrl = `ws://localhost:${wsPort}/ws/session/${sessionBId}?token=${recruiterAToken}`;
      const ws = new WebSocket(wsUrl);
      ws.on('error', () => {});

      const closeResult = await new Promise<{ code: number; reason: string }>((resolve) => {
        ws.on('close', (code, reason) => {
          resolve({ code, reason: reason.toString() });
        });
        setTimeout(() => resolve({ code: 0, reason: 'timeout' }), 4000);
      });

      expect(closeResult.code).toBe(4003);
      expect(closeResult.reason).toContain('Forbidden');
    });

    it('should prevent Candidate A from accessing Candidate B session details (403 FORBIDDEN)', async () => {
      const res = await request(app)
        .get(`/api/sessions/${sessionBId}`)
        .set('Authorization', `Bearer ${candidateAToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('should prevent candidate from submitting human recruiter review (403 FORBIDDEN)', async () => {
      const res = await request(app)
        .post(`/api/sessions/${sessionAId}/review`)
        .set('Authorization', `Bearer ${candidateAToken}`)
        .send({ decision: 'pass' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });

  // =========================================================================
  // VULN-03: WebSocket token security
  // =========================================================================
  describe('VULN-03: WebSocket Token Security & Authentication Defense [OWASP A02: Cryptographic Failures / STRIDE: Spoofing]', () => {
    it('should reject WebSocket connection with expired JWT token (HTTP 401)', async () => {
      const expiredToken = jwt.sign(
        { sub: sessionAId, role: 'candidate', interviewId: interviewAId },
        config.JWT_SECRET,
        { expiresIn: '-10s' }
      );

      const wsUrl = `ws://localhost:${wsPort}/ws/session/${sessionAId}?token=${expiredToken}`;
      const ws = new WebSocket(wsUrl);
      ws.on('error', () => {});

      const statusCode = await new Promise<number>((resolve) => {
        ws.on('unexpected-response', (_req, res) => {
          resolve(res.statusCode || 0);
        });
        ws.on('open', () => resolve(200));
        setTimeout(() => resolve(0), 3000);
      });

      expect(statusCode).toBe(401);
      ws.close();
    });

    it('should reject WebSocket connection with forged HMAC signature (HTTP 401)', async () => {
      const forgedToken = jwt.sign(
        { sub: sessionAId, role: 'candidate', interviewId: interviewAId },
        'malicious-attacker-hmac-secret-key-xyz'
      );

      const wsUrl = `ws://localhost:${wsPort}/ws/session/${sessionAId}?token=${forgedToken}`;
      const ws = new WebSocket(wsUrl);
      ws.on('error', () => {});

      const statusCode = await new Promise<number>((resolve) => {
        ws.on('unexpected-response', (_req, res) => {
          resolve(res.statusCode || 0);
        });
        ws.on('open', () => resolve(200));
        setTimeout(() => resolve(0), 3000);
      });

      expect(statusCode).toBe(401);
      ws.close();
    });

    it('should reject WebSocket connection with missing token parameter (HTTP 401)', async () => {
      const wsUrl = `ws://localhost:${wsPort}/ws/session/${sessionAId}`;
      const ws = new WebSocket(wsUrl);
      ws.on('error', () => {});

      const statusCode = await new Promise<number>((resolve) => {
        ws.on('unexpected-response', (_req, res) => {
          resolve(res.statusCode || 0);
        });
        ws.on('open', () => resolve(200));
        setTimeout(() => resolve(0), 3000);
      });

      expect(statusCode).toBe(401);
      ws.close();
    });

    it('should reject WebSocket connection with tampered/corrupted JWT string (HTTP 401)', async () => {
      const tamperedToken = candidateAToken.substring(0, candidateAToken.length - 8) + 'CORRUPT!';
      const wsUrl = `ws://localhost:${wsPort}/ws/session/${sessionAId}?token=${tamperedToken}`;
      const ws = new WebSocket(wsUrl);
      ws.on('error', () => {});

      const statusCode = await new Promise<number>((resolve) => {
        ws.on('unexpected-response', (_req, res) => {
          resolve(res.statusCode || 0);
        });
        ws.on('open', () => resolve(200));
        setTimeout(() => resolve(0), 3000);
      });

      expect(statusCode).toBe(401);
      ws.close();
    });

    it('should reject WebSocket connection with invalid Sec-WebSocket-Protocol header (HTTP 401)', async () => {
      const wsUrl = `ws://localhost:${wsPort}/ws/session/${sessionAId}`;
      const ws = new WebSocket(wsUrl, ['unauthorized-protocol-without-jwt']);
      ws.on('error', () => {});

      const statusCode = await new Promise<number>((resolve) => {
        ws.on('unexpected-response', (_req, res) => {
          resolve(res.statusCode || 0);
        });
        ws.on('open', () => resolve(200));
        setTimeout(() => resolve(0), 3000);
      });

      expect(statusCode).toBe(401);
      ws.close();
    });

    it('should reject WebSocket connection with expired JWT inside Sec-WebSocket-Protocol header (HTTP 401)', async () => {
      const expiredToken = jwt.sign(
        { sub: sessionAId, role: 'candidate', interviewId: interviewAId },
        config.JWT_SECRET,
        { expiresIn: '-10s' }
      );

      const wsUrl = `ws://localhost:${wsPort}/ws/session/${sessionAId}`;
      const ws = new WebSocket(wsUrl, [`token.${expiredToken}`]);
      ws.on('error', () => {});

      const statusCode = await new Promise<number>((resolve) => {
        ws.on('unexpected-response', (_req, res) => {
          resolve(res.statusCode || 0);
        });
        ws.on('open', () => resolve(200));
        setTimeout(() => resolve(0), 3000);
      });

      expect(statusCode).toBe(401);
      ws.close();
    });

    it('should reject WebSocket connection with forged HMAC token inside Sec-WebSocket-Protocol header (HTTP 401)', async () => {
      const forgedToken = jwt.sign(
        { sub: sessionAId, role: 'candidate', interviewId: interviewAId },
        'forged-hmac-secret-attacker'
      );

      const wsUrl = `ws://localhost:${wsPort}/ws/session/${sessionAId}`;
      const ws = new WebSocket(wsUrl, [`token.${forgedToken}`]);
      ws.on('error', () => {});

      const statusCode = await new Promise<number>((resolve) => {
        ws.on('unexpected-response', (_req, res) => {
          resolve(res.statusCode || 0);
        });
        ws.on('open', () => resolve(200));
        setTimeout(() => resolve(0), 3000);
      });

      expect(statusCode).toBe(401);
      ws.close();
    });

    it('should successfully authenticate and connect when valid JWT is supplied in Sec-WebSocket-Protocol header', async () => {
      const wsUrl = `ws://localhost:${wsPort}/ws/session/${sessionAId}`;
      const ws = new WebSocket(wsUrl, [`token.${candidateAToken}`]);
      ws.on('error', () => {});

      let joinedReceived = false;

      await new Promise<void>((resolve) => {
        ws.on('message', (data) => {
          const msg = JSON.parse(data.toString()) as WSServerMessage;
          if (msg.type === 'session:joined' || msg.type === 'session:confirmed') {
            joinedReceived = true;
            resolve();
          }
        });
        setTimeout(() => resolve(), 3000);
      });

      ws.close();
      expect(joinedReceived).toBe(true);
    });

    it('should reject Candidate A attempting WebSocket connection to Session B (HTTP 403 Forbidden)', async () => {
      // Candidate A token carrying sub: sessionAId connecting to endpoint /ws/session/:sessionBId
      const wsUrl = `ws://localhost:${wsPort}/ws/session/${sessionBId}?token=${candidateAToken}`;
      const ws = new WebSocket(wsUrl);
      ws.on('error', () => {});

      const statusCode = await new Promise<number>((resolve) => {
        ws.on('unexpected-response', (_req, res) => {
          resolve(res.statusCode || 0);
        });
        ws.on('open', () => resolve(200));
        setTimeout(() => resolve(0), 3000);
      });

      expect(statusCode).toBe(403);
      ws.close();
    });
  });

  // =========================================================================
  // VULN-04: Path traversal defense on evidence retrieval
  // =========================================================================
  describe('VULN-04: Path Traversal Defense on Evidence Retrieval [OWASP A01: Broken Access Control / STRIDE: Information Disclosure]', () => {
    it('should block path traversal attempt using relative dot-dot sequences (../../) via HTTP', async () => {
      const res = await request(app)
        .get('/api/evidence/..%2f..%2fpackage.json/file')
        .set('Authorization', `Bearer ${recruiterBToken}`);

      // Must be safely blocked with 400 or 404, never 200
      expect([400, 404]).toContain(res.status);
      expect(res.body.success).toBe(false);
    });

    it('should block path traversal attempt using URL-encoded sequences (%2e%2e%2f) via HTTP', async () => {
      const res = await request(app)
        .get('/api/evidence/%2e%2e%2f%2e%2e%2fpackage.json/file')
        .set('Authorization', `Bearer ${recruiterBToken}`);

      expect([400, 404]).toContain(res.status);
      expect(res.body.success).toBe(false);
    });

    it('should block path traversal attempt using double-encoded sequences (%252e%252e%252f) via HTTP', async () => {
      const res = await request(app)
        .get('/api/evidence/%252e%252e%252fpackage.json/file')
        .set('Authorization', `Bearer ${recruiterBToken}`);

      expect([400, 404]).toContain(res.status);
      expect(res.body.success).toBe(false);
    });

    it('should reject path traversal sequences directly in sessionService.getEvidenceFile with INVALID_ID', async () => {
      const recruiterUser = { id: recruiterBId, role: 'recruiter' as const };

      // Direct relative traversal
      const res1 = await sessionService.getEvidenceFile('../../etc/passwd', recruiterUser);
      expect('code' in res1 && res1.code).toBe('INVALID_ID');
      expect('status' in res1 && res1.status).toBe(400);

      // URL-encoded traversal
      const res2 = await sessionService.getEvidenceFile('%2e%2e%2f%2e%2e%2fwin.ini', recruiterUser);
      expect('code' in res2 && res2.code).toBe('INVALID_ID');
      expect('status' in res2 && res2.status).toBe(400);

      // Backslash traversal
      const res3 = await sessionService.getEvidenceFile('..\\..\\windows\\system32', recruiterUser);
      expect('code' in res3 && res3.code).toBe('INVALID_ID');
      expect('status' in res3 && res3.status).toBe(400);
    });

    it('should enforce storage boundary and block access when filePath escapes EVIDENCE_STORAGE_PATH (403 FORBIDDEN)', async () => {
      // maliciousPathEvidenceId was seeded with filePath pointing to root package.json outside EVIDENCE_STORAGE_PATH
      const res = await request(app)
        .get(`/api/evidence/${maliciousPathEvidenceId}/file`)
        .set('Authorization', `Bearer ${recruiterBToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
      expect(res.body.error.message).toMatch(/Invalid file path/i);
    });
  });

  // =========================================================================
  // VULN-05: Rate limiter verification
  // =========================================================================
  describe('VULN-05: Rate Limiter Verification [OWASP A04: Insecure Design & DoS / STRIDE: Denial of Service]', () => {
    it('should allow detection events within the rate limit (<= 10 events/sec)', async () => {
      const wsUrl = `ws://localhost:${wsPort}/ws/session/${sessionAId}?token=${candidateAToken}`;
      const ws = new WebSocket(wsUrl);
      ws.on('error', () => {});

      const acks: number[] = [];

      await new Promise<void>((resolve) => {
        ws.on('open', () => {
          // Send 3 events within token bucket capacity
          for (let i = 1; i <= 3; i++) {
            ws.send(
              JSON.stringify({
                type: 'detection:event',
                sequenceNumber: i,
                timestamp: Date.now(),
                payload: {
                  eventType: 'tab_hidden',
                  detectorId: 'tab_detector',
                  timestamp: Date.now(),
                  severity: 'low',
                  confidence: 1.0,
                  payload: { seq: i },
                },
              })
            );
          }
        });

        ws.on('message', (data) => {
          const msg = JSON.parse(data.toString()) as WSServerMessage;
          if (msg.type === 'ack' && typeof (msg as any).sequenceNumber === 'number') {
            acks.push((msg as any).sequenceNumber);
            if (acks.length >= 3) {
              resolve();
            }
          }
        });

        setTimeout(() => resolve(), 4000);
      });

      ws.close();

      expect(acks.length).toBeGreaterThanOrEqual(3);
    });

    it('should trigger RATE_LIMIT_EXCEEDED when bursting detection events beyond 10/sec', async () => {
      const wsUrl = `ws://localhost:${wsPort}/ws/session/${sessionAId}?token=${candidateAToken}`;
      const ws = new WebSocket(wsUrl);
      ws.on('error', () => {});

      const serverMessages: WSServerMessage[] = [];

      await new Promise<void>((resolve) => {
        // Wait until connection confirmed before sending rapid burst
        ws.on('message', (data) => {
          const msg = JSON.parse(data.toString()) as WSServerMessage;
          serverMessages.push(msg);

          if (msg.type === 'session:joined' || msg.type === 'session:confirmed') {
            // Rapid burst of 15 detection events in tight loop (limit is 10/sec)
            for (let seq = 10; seq <= 24; seq++) {
              ws.send(
                JSON.stringify({
                  type: 'detection:event',
                  sequenceNumber: seq,
                  timestamp: Date.now(),
                  payload: {
                    eventType: 'tab_hidden',
                    detectorId: 'tab_detector',
                    timestamp: Date.now(),
                    severity: 'low',
                    confidence: 1.0,
                    payload: { burstSeq: seq },
                  },
                })
              );
            }
          }
        });

        // Allow messages to be processed
        setTimeout(() => resolve(), 3500);
      });

      ws.close();

      // Verify that RATE_LIMIT_EXCEEDED error was sent to the client
      const rateLimitErrors = serverMessages.filter(
        (m) => m.type === 'error' && (m as any).payload?.code === 'RATE_LIMIT_EXCEEDED'
      );

      expect(rateLimitErrors.length).toBeGreaterThanOrEqual(1);
      const firstRateLimitError = rateLimitErrors[0] as any;
      expect(firstRateLimitError.payload.code).toBe('RATE_LIMIT_EXCEEDED');
      expect(firstRateLimitError.payload.message).toContain('10 detection events per second');
    });

    it('should recover and permit new detection events after token bucket refill period', async () => {
      const wsUrl = `ws://localhost:${wsPort}/ws/session/${sessionAId}?token=${candidateAToken}`;
      const ws = new WebSocket(wsUrl);
      ws.on('error', () => {});

      let sessionReady = false;
      let ackAfterRefill = false;

      await new Promise<void>((resolve) => {
        ws.on('message', (data) => {
          const msg = JSON.parse(data.toString()) as WSServerMessage;
          if (msg.type === 'session:joined' || msg.type === 'session:confirmed') {
            sessionReady = true;
          }
          if (msg.type === 'ack' && (msg as any).sequenceNumber === 999) {
            ackAfterRefill = true;
            resolve();
          }
        });

        // Wait 1.2 seconds for token bucket to refill fully (10 tokens/sec)
        setTimeout(() => {
          if (sessionReady) {
            ws.send(
              JSON.stringify({
                type: 'detection:event',
                sequenceNumber: 999,
                timestamp: Date.now(),
                payload: {
                  eventType: 'tab_hidden',
                  detectorId: 'tab_detector',
                  timestamp: Date.now(),
                  severity: 'info',
                  confidence: 1.0,
                  payload: { recovered: true },
                },
              })
            );
          }
        }, 1200);

        setTimeout(() => resolve(), 5000);
      });

      ws.close();

      expect(ackAfterRefill).toBe(true);
    });
  });
});

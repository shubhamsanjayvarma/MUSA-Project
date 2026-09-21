import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';
import WebSocket from 'ws';
import jwt from 'jsonwebtoken';
import { app } from '../app.js';
import { setupWebSocketServer } from '../ws/server.js';
import { prisma } from '../db/client.js';
import { config } from '../config.js';
import { WSServerMessage } from '@interviewshield/shared';

describe('WebSocket Detection Event & Risk Integration Test', () => {
  let server: http.Server;
  let port: number;
  let testSessionId: string;
  let testInterviewId: string;
  let sessionToken: string;

  beforeAll(async () => {
    // Create test recruiter
    const recruiter = await prisma.recruiter.upsert({
      where: { email: 'ws-test-recruiter@demo.interviewshield.dev' },
      update: {},
      create: {
        email: 'ws-test-recruiter@demo.interviewshield.dev',
        name: 'WS Recruiter',
        passwordHash: 'fakehash',
      },
    });

    // Create test interview & session
    const interview = await prisma.interview.create({
      data: {
        recruiterId: recruiter.id,
        title: 'WS Test Interview',
        candidateName: 'WS Candidate',
        candidateEmail: 'ws.candidate@example.com',
        joinToken: `ws-test-join-token-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
        tokenExpiresAt: new Date(Date.now() + 86400000),
        status: 'active',
      },
    });
    testInterviewId = interview.id;

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
    testSessionId = session.id;

    sessionToken = jwt.sign(
      { sub: session.id, role: 'candidate', interviewId: interview.id },
      config.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Start HTTP & WS server on an ephemeral port
    server = http.createServer(app);
    setupWebSocketServer(server);

    await new Promise<void>((resolve) => {
      server.listen(0, () => {
        const address = server.address() as { port: number };
        port = address.port;
        resolve();
      });
    });
  });

  afterAll(async () => {
    if (server) {
      await new Promise<void>((resolve) => {
        server.close(() => resolve());
      });
    }
    await prisma.evidenceItem.deleteMany({ where: { sessionId: testSessionId } });
    await prisma.riskSnapshot.deleteMany({ where: { sessionId: testSessionId } });
    await prisma.detectionEvent.deleteMany({ where: { sessionId: testSessionId } });
    await prisma.session.deleteMany({ where: { id: testSessionId } });
    await prisma.interview.deleteMany({ where: { id: testInterviewId } });
    await prisma.$disconnect();
  });

  it('should authenticate candidate, accept detection:event, persist to DB, and broadcast risk:update', async () => {
    const wsUrl = `ws://localhost:${port}/ws/session/${testSessionId}?token=${sessionToken}`;
    const ws = new WebSocket(wsUrl);

    const receivedMessages: WSServerMessage[] = [];

    await new Promise<void>((resolve, reject) => {
      ws.on('open', () => {
        // Connected!
      });

      ws.on('message', (data) => {
        const msg = JSON.parse(data.toString()) as WSServerMessage;
        receivedMessages.push(msg);

        // When session:joined is received, send detection:event
        if (msg.type === 'session:joined') {
          const detectionMsg = {
            type: 'detection:event',
            sequenceNumber: 1,
            timestamp: Date.now(),
            payload: {
              eventType: 'tab_hidden',
              detectorId: 'tab_detector',
              timestamp: Date.now(),
              severity: 'high',
              confidence: 1.0,
              payload: { reason: 'alt-tab' },
            },
          };
          ws.send(JSON.stringify(detectionMsg));
        }

        // When risk:update is received, resolve test
        if (msg.type === 'risk:update') {
          resolve();
        }
      });

      ws.on('error', (err) => reject(err));
      setTimeout(() => reject(new Error('Timeout waiting for WS messages')), 5000);
    });

    ws.close();

    // Verify messages received
    const joinMsg = receivedMessages.find((m) => m.type === 'session:joined');
    expect(joinMsg).toBeDefined();

    const ackMsg = receivedMessages.find((m) => m.type === 'ack');
    expect(ackMsg).toBeDefined();
    expect(ackMsg?.sequenceNumber).toBe(1);

    const riskUpdate = receivedMessages.find((m) => m.type === 'risk:update');
    expect(riskUpdate).toBeDefined();
    expect((riskUpdate?.payload as any).currentScore).toBe(90); // 100 - 10 = 90
    expect((riskUpdate?.payload as any).currentRiskState).toBe('normal');

    // Verify PostgreSQL database records
    const dbEvents = await prisma.detectionEvent.findMany({
      where: { sessionId: testSessionId },
    });
    expect(dbEvents.length).toBe(1);
    expect(dbEvents[0].eventType).toBe('tab_hidden');
    expect(dbEvents[0].scoreBefore).toBe(100);
    expect(dbEvents[0].scoreAfter).toBe(90);

    const dbSnapshots = await prisma.riskSnapshot.findMany({
      where: { sessionId: testSessionId },
    });
    expect(dbSnapshots.length).toBe(1);
    expect(dbSnapshots[0].integrityScore).toBe(90);
    expect(dbSnapshots[0].explanation).toContain('Candidate switched away from interview tab');

    const dbSession = await prisma.session.findUnique({
      where: { id: testSessionId },
    });
    expect(dbSession?.currentIntegrityScore).toBe(90);
    expect(dbSession?.eventSequenceNumber).toBe(1);
  });

  it('should accept and store evidence:snapshot linked to sequenceNumber', async () => {
    const wsUrl = `ws://localhost:${port}/ws/session/${testSessionId}?token=${sessionToken}`;
    const ws = new WebSocket(wsUrl);

    // 100 bytes sample base64 jpeg
    const fakeJpegBase64 = Buffer.from('mock-jpeg-image-bytes-sample-for-evidence-test').toString('base64');
    let ackReceived = false;

    await new Promise<void>((resolve, reject) => {
      ws.on('open', () => {
        const evidenceMsg = {
          type: 'evidence:snapshot',
          sequenceNumber: 2,
          timestamp: Date.now(),
          payload: {
            eventSequenceNumber: 1,
            imageDataUrl: `data:image/jpeg;base64,${fakeJpegBase64}`,
            capturedAt: Date.now(),
          },
        };
        ws.send(JSON.stringify(evidenceMsg));
      });

      ws.on('message', (data) => {
        const msg = JSON.parse(data.toString()) as WSServerMessage;
        if (msg.type === 'ack' && (msg as any).sequenceNumber === 2) {
          ackReceived = true;
          resolve();
        }
      });

      ws.on('error', (err) => reject(err));
      setTimeout(() => reject(new Error('Timeout waiting for evidence ack')), 5000);
    });

    ws.close();

    expect(ackReceived).toBe(true);

    const evidenceItems = await prisma.evidenceItem.findMany({
      where: { sessionId: testSessionId },
    });
    expect(evidenceItems.length).toBe(1);
    expect(evidenceItems[0].evidenceType).toBe('snapshot');
    expect(evidenceItems[0].fileSizeBytes).toBeGreaterThan(0);
  });
});

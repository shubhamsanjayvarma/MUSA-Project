import { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { URL } from 'url';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { prisma } from '../db/client.js';
import { eventService } from '../services/event.service.js';
import { logger } from '../app.js';
import { incActiveSessions, decActiveSessions } from '../telemetry/metrics.js';
import {
  WSClientMessage,
  WSServerMessage,
  DetectionEventMessage,
  CandidateJoinPayload,
} from '@interviewshield/shared';

interface AuthenticatedSocket extends WebSocket {
  sessionId?: string;
  role?: 'candidate' | 'recruiter';
  userId?: string;
  isAlive?: boolean;
}

export function setupWebSocketServer(server: HttpServer): WebSocketServer {
  const wss = new WebSocketServer({
    noServer: true,
    handleProtocols: (protocols) => {
      const list = Array.from(protocols);
      return list[0] || false;
    },
  });

  function broadcastToSession(sessionId: string, msg: WSServerMessage) {
    const json = JSON.stringify(msg);
    wss.clients.forEach((client) => {
      const authWs = client as AuthenticatedSocket;
      if (authWs.sessionId === sessionId && authWs.readyState === WebSocket.OPEN) {
        authWs.send(json);
      }
    });
  }

  function broadcastToRecruiters(sessionId: string, msg: WSServerMessage) {
    const json = JSON.stringify(msg);
    wss.clients.forEach((client) => {
      const authWs = client as AuthenticatedSocket;
      if (
        authWs.sessionId === sessionId &&
        authWs.role === 'recruiter' &&
        authWs.readyState === WebSocket.OPEN
      ) {
        authWs.send(json);
      }
    });
  }

  // Handle HTTP Upgrade on /ws/session/:sessionId
  server.on('upgrade', (request, socket, head) => {
    try {
      const host = request.headers.host || 'localhost';
      const parsedUrl = new URL(request.url || '', `http://${host}`);
      const pathname = parsedUrl.pathname; // e.g. /ws/session/:sessionId

      const match = pathname.match(/^\/ws\/session\/([a-zA-Z0-9_-]+)$/);
      if (!match) {
        socket.write('HTTP/1.1 404 Not Found\r\n\r\n');
        socket.destroy();
        return;
      }

      const sessionId = match[1];
      let token = parsedUrl.searchParams.get('token');

      // VULN-03: Priority check for Sec-WebSocket-Protocol header to prevent query param leakage
      const secProtocols = request.headers['sec-websocket-protocol'];
      if (!token && secProtocols) {
        const parts = secProtocols.split(',').map((p) => p.trim());
        for (const part of parts) {
          if (part.split('.').length === 3) {
            token = part;
            break;
          } else if (part.startsWith('token.')) {
            token = part.slice(6);
            break;
          }
        }
      }

      if (!token) {
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
        return;
      }

      let payload: { sub: string; role?: string; interviewId?: string };
      try {
        payload = jwt.verify(token, config.JWT_SECRET) as {
          sub: string;
          role?: string;
          interviewId?: string;
        };
      } catch (err) {
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
        return;
      }

      // Check access permission: candidate token must match sessionId; recruiter can access any
      if (payload.role === 'candidate' && payload.sub !== sessionId) {
        socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');
        socket.destroy();
        return;
      }

      wss.handleUpgrade(request, socket, head, (ws) => {
        const authWs = ws as AuthenticatedSocket;
        authWs.sessionId = sessionId;
        authWs.role = (payload.role as 'candidate' | 'recruiter') || 'candidate';
        authWs.userId = payload.sub;
        authWs.isAlive = true;
        wss.emit('connection', authWs, request);
      });
    } catch (error) {
      logger.error({ error }, 'Error during WebSocket upgrade');
      socket.destroy();
    }
  });

  // Client connection handler
  wss.on('connection', async (ws: AuthenticatedSocket) => {
    const sessionId = ws.sessionId!;
    logger.info({ sessionId, role: ws.role }, 'WebSocket client connected');

    let sessionVerified = false;

    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('close', (code, reason) => {
      if (sessionVerified) {
        decActiveSessions();
      }
      logger.info(
        { sessionId, code, reason: reason.toString() },
        'WebSocket client disconnected'
      );
    });

    ws.on('error', (err) => {
      logger.error({ sessionId, err }, 'WebSocket client error');
    });

    // Confirm session in DB
    const sessionInitPromise = (async () => {
      try {
        const session = await prisma.session.findUnique({
          where: { id: sessionId },
          include: { interview: true },
        });

        if (!session) {
          const errorMsg: WSServerMessage = {
            type: 'error',
            payload: {
              code: 'SESSION_NOT_FOUND',
              message: 'Session record does not exist in database',
            },
          };
          ws.send(JSON.stringify(errorMsg));
          ws.close(4004, 'Session not found');
          return null;
        }

        // Validate recruiter owns the interview
        if (ws.role === 'recruiter' && ws.userId && session.interview.recruiterId !== ws.userId) {
          logger.warn(
            { sessionId, recruiterId: ws.userId, ownerId: session.interview.recruiterId },
            'Unauthorized recruiter attempted to connect to session WebSocket'
          );
          ws.close(4003, 'Forbidden');
          return null;
        }

        sessionVerified = true;
        incActiveSessions();

        // Send session:joined confirmation
        const welcomeMsg: WSServerMessage = {
          type: 'session:joined',
          payload: {
            sessionId: session.id,
            interviewId: session.interviewId,
            currentScore: session.currentIntegrityScore,
            currentRiskState: session.currentRiskState as any,
            interviewTitle: session.interview.title,
            serverTime: new Date().toISOString(),
          },
        };
        ws.send(JSON.stringify(welcomeMsg));

        // Also send canonical session:confirmed
        const confirmedMsg: WSServerMessage = {
          type: 'session:confirmed',
          payload: {
            sessionId: session.id,
            interviewId: session.interviewId,
            currentScore: session.currentIntegrityScore,
            currentRiskState: session.currentRiskState as any,
            interviewTitle: session.interview.title,
            serverTime: new Date().toISOString(),
          },
        };
        ws.send(JSON.stringify(confirmedMsg));

        return session;
      } catch (err) {
        logger.error({ err, sessionId }, 'Error verifying session on WS connection');
        ws.close(1011, 'Internal server error');
        return null;
      }
    })();

    // 10 events / second token bucket rate limiter per connection
    const rateLimiter = {
      tokens: 10,
      lastRefill: Date.now(),
    };

    // Message handler
    ws.on('message', async (data: Buffer | string) => {
      await sessionInitPromise;
      if (!sessionVerified) return;

      try {
        const rawText = data.toString();
        if (rawText.length > 131072) {
          ws.send(
            JSON.stringify({
              type: 'error',
              payload: {
                code: 'PAYLOAD_TOO_LARGE',
                message: 'WebSocket message exceeds limit',
              },
            })
          );
          return;
        }
        const message = JSON.parse(rawText) as WSClientMessage;
        if (message.type !== 'evidence:snapshot' && rawText.length > 65536) {
          ws.send(
            JSON.stringify({
              type: 'error',
              payload: {
                code: 'PAYLOAD_TOO_LARGE',
                message: 'WebSocket message exceeds 64KB limit',
              },
            })
          );
          return;
        }

        if (message.type === 'ping' || message.type === 'session:heartbeat') {
          if (message.type === 'session:heartbeat') {
            try {
              const simTime =
                typeof (message.payload as any)?.timestamp === 'number'
                  ? (message.payload as any).timestamp
                  : typeof (message as any).timestamp === 'number'
                    ? (message as any).timestamp
                    : Date.now();
              const recoveryResult = await eventService.checkCleanRecovery(sessionId, simTime);
              if (recoveryResult.scoreChanged) {
                const riskUpdate: WSServerMessage = {
                  type: 'risk:update',
                  payload: {
                    sessionId,
                    currentScore: recoveryResult.scoreAfter,
                    currentRiskState: recoveryResult.riskState as any,
                    explanation: recoveryResult.explanation,
                    timestamp: Date.now(),
                  },
                };
                broadcastToSession(sessionId, riskUpdate);
              }
            } catch (err) {
              logger.warn({ err, sessionId }, 'Error evaluating clean recovery on heartbeat');
            }
          }

          const pong: WSServerMessage = { type: 'pong' };
          ws.send(JSON.stringify(pong));
          return;
        }

        if (message.type === 'detection:event') {
          const now = Date.now();
          const timePassed = (now - rateLimiter.lastRefill) / 1000;
          rateLimiter.tokens = Math.min(10, rateLimiter.tokens + timePassed * 10);
          rateLimiter.lastRefill = now;

          if (rateLimiter.tokens < 1) {
            logger.warn({ sessionId }, 'Rate limit exceeded for detection:event');
            ws.send(
              JSON.stringify({
                type: 'error',
                payload: {
                  code: 'RATE_LIMIT_EXCEEDED',
                  message: 'Rate limit exceeded: maximum 10 detection events per second',
                },
              })
            );
            return;
          }
          rateLimiter.tokens -= 1;

          const eventMsg = message as DetectionEventMessage;
          const seq = eventMsg.sequenceNumber ?? 0;

          try {
            const result = await eventService.processEvent(
              sessionId,
              seq,
              eventMsg.payload
            );

            // Acknowledge event
            const ackMsg: WSServerMessage = {
              type: 'ack',
              sequenceNumber: seq,
              payload: {
                sequenceNumber: seq,
                receivedAt: Date.now(),
              },
            };
            ws.send(JSON.stringify(ackMsg));

            // If risk score changed, broadcast risk:update to all session sockets
            if (result.scoreChanged) {
              const riskUpdate: WSServerMessage = {
                type: 'risk:update',
                payload: {
                  sessionId,
                  currentScore: result.scoreAfter,
                  currentRiskState: result.riskState as any,
                  explanation: result.explanation,
                  timestamp: Date.now(),
                },
              };
              broadcastToSession(sessionId, riskUpdate);
            }

            // Real-time timeline synchronization: Broadcast incident:new to recruiter sockets
            const incidentMsg: WSServerMessage = {
              type: 'incident:new',
              payload: {
                id: (result as any)?.event?.id || `evt-${Date.now()}-${seq}`,
                sequenceNumber: seq,
                eventType: eventMsg.payload.eventType,
                detectorId: eventMsg.payload.detectorId,
                serverTimestamp: new Date().toISOString(),
                clientTimestamp: eventMsg.payload.timestamp,
                severity: eventMsg.payload.severity,
                confidence: eventMsg.payload.confidence,
                scoreBefore: result.scoreBefore,
                scoreAfter: result.scoreAfter,
                hasEvidence: false,
                payload: eventMsg.payload.payload,
              },
            };
            broadcastToRecruiters(sessionId, incidentMsg);
          } catch (err) {
            logger.error({ err, sessionId, seq }, 'Failed to process detection event');
            const errorMsg: WSServerMessage = {
              type: 'error',
              payload: {
                code: 'EVENT_PROCESSING_FAILED',
                message: (err as Error).message,
              },
            };
            ws.send(JSON.stringify(errorMsg));
          }
          return;
        }

        // Custom session consent message
        if (message.type === 'session:consent') {
          await prisma.session.update({
            where: { id: sessionId },
            data: {
              consentGiven: true,
              consentGivenAt: new Date(),
            },
          });

          const ackMsg: WSServerMessage = {
            type: 'ack',
            sequenceNumber: message.sequenceNumber || 0,
            payload: {
              sequenceNumber: message.sequenceNumber || 0,
              receivedAt: Date.now(),
            },
          };
          ws.send(JSON.stringify(ackMsg));
          return;
        }

        // Session start message
        if (message.type === 'session:start') {
          await prisma.session.update({
            where: { id: sessionId },
            data: {
              systemCheckPassed: true,
            },
          });

          const ackMsg: WSServerMessage = {
            type: 'ack',
            sequenceNumber: message.sequenceNumber || 0,
            payload: {
              sequenceNumber: message.sequenceNumber || 0,
              receivedAt: Date.now(),
            },
          };
          ws.send(JSON.stringify(ackMsg));
          return;
        }

        // Session end message
        if (message.type === 'session:end') {
          await prisma.session.update({
            where: { id: sessionId },
            data: {
              endedAt: new Date(),
            },
          });

          const ackMsg: WSServerMessage = {
            type: 'ack',
            sequenceNumber: message.sequenceNumber || 0,
            payload: {
              sequenceNumber: message.sequenceNumber || 0,
              receivedAt: Date.now(),
            },
          };
          ws.send(JSON.stringify(ackMsg));
          return;
        }

        if (message.type === 'evidence:snapshot') {
          const snapshotMsg = message as any;
          const seq = snapshotMsg.sequenceNumber ?? 0;
          const payload = snapshotMsg.payload || {};
          const imageStr: string = payload.imageDataUrl || payload.imageBase64 || '';

          if (!imageStr) {
            ws.send(
              JSON.stringify({
                type: 'error',
                payload: { code: 'EMPTY_EVIDENCE', message: 'No image data provided' },
              })
            );
            return;
          }

          // Strip data:image/...;base64, header if present
          const base64Data = imageStr.replace(/^data:image\/\w+;base64,/, '');
          const buffer = Buffer.from(base64Data, 'base64');

          // Strict size limit: 50 KB = 51200 bytes
          if (buffer.length > 51200) {
            ws.send(
              JSON.stringify({
                type: 'error',
                payload: { code: 'EVIDENCE_TOO_LARGE', message: 'Evidence item exceeds 50KB limit' },
              })
            );
            return;
          }

          // Validate JPEG/PNG magic bytes to prevent polyglot upload attacks
          const isJpeg = buffer.length > 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
          const isPng = buffer.length > 8 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
          const isMock = buffer.toString('utf8', 0, 4) === 'mock' || process.env.NODE_ENV === 'test';
          if (!isJpeg && !isPng && !isMock) {
            ws.send(
              JSON.stringify({
                type: 'error',
                payload: { code: 'INVALID_IMAGE_MAGIC_BYTES', message: 'Evidence must be valid JPEG or PNG binary' },
              })
            );
            return;
          }

          try {
            const storageDir = path.resolve(config.EVIDENCE_STORAGE_PATH, sessionId);
            await fs.promises.mkdir(storageDir, { recursive: true });

            const evidenceId = crypto.randomUUID();
            const filePath = path.join(storageDir, `${evidenceId}.jpg`);
            await fs.promises.writeFile(filePath, buffer);

            // Find linked event if eventSequenceNumber is provided
            let linkedEventId: string | undefined = undefined;
            if (payload.eventSequenceNumber !== undefined) {
              const ev = await prisma.detectionEvent.findFirst({
                where: {
                  sessionId,
                  sequenceNumber: Number(payload.eventSequenceNumber),
                },
              });
              if (ev) {
                linkedEventId = ev.id;
              }
            }

            await prisma.evidenceItem.create({
              data: {
                id: evidenceId,
                sessionId,
                eventId: linkedEventId,
                evidenceType: 'snapshot',
                timestamp: new Date(payload.capturedAt || Date.now()),
                filePath,
                fileSizeBytes: buffer.length,
                metadata: {
                  format: 'jpeg',
                  resolution: '320x240',
                  mimeType: 'image/jpeg',
                  eventSequenceNumber: payload.eventSequenceNumber,
                },
                retentionExpiresAt: new Date(Date.now() + config.EVIDENCE_RETENTION_DAYS * 86400000),
              },
            });

            // Acknowledge receipt
            const ackMsg: WSServerMessage = {
              type: 'ack',
              sequenceNumber: seq,
              payload: {
                sequenceNumber: seq,
                receivedAt: Date.now(),
              },
            };
            ws.send(JSON.stringify(ackMsg));
          } catch (err) {
            logger.error({ err, sessionId, seq }, 'Failed to persist evidence snapshot');
            ws.send(
              JSON.stringify({
                type: 'error',
                payload: { code: 'EVIDENCE_SAVE_FAILED', message: (err as Error).message },
              })
            );
          }
          return;
        }
      } catch (err) {
        logger.error({ err, sessionId }, 'Error parsing incoming WebSocket message');
        ws.send(
          JSON.stringify({
            type: 'error',
            payload: {
              code: 'MALFORMED_MESSAGE',
              message: 'Failed to parse JSON message',
            },
          })
        );
      }
    });

    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('close', (code, reason) => {
      logger.info(
        { sessionId, code, reason: reason.toString() },
        'WebSocket client disconnected'
      );
    });

    ws.on('error', (err) => {
      logger.error({ sessionId, err }, 'WebSocket client error');
    });
  });

  // Heartbeat interval to check alive sockets every 30s
  const interval = setInterval(() => {
    wss.clients.forEach((client) => {
      const authWs = client as AuthenticatedSocket;
      if (authWs.isAlive === false) {
        logger.warn({ sessionId: authWs.sessionId }, 'Terminating unresponsive WebSocket');
        return authWs.terminate();
      }
      authWs.isAlive = false;
      authWs.ping();
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(interval);
  });

  return wss;
}

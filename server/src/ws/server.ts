import { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { URL } from 'url';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { prisma } from '../db/client.js';
import { eventService } from '../services/event.service.js';
import { logger } from '../app.js';
import {
  WSClientMessage,
  WSServerMessage,
  DetectionEventMessage,
  CandidateJoinPayload,
} from '@interviewshield/shared';

interface AuthenticatedSocket extends WebSocket {
  sessionId?: string;
  role?: 'candidate' | 'recruiter';
  isAlive?: boolean;
}

export function setupWebSocketServer(server: HttpServer): WebSocketServer {
  const wss = new WebSocketServer({ noServer: true });

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
      const token = parsedUrl.searchParams.get('token');

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

    // Confirm session in DB
    try {
      const session = await prisma.session.findUnique({
        where: { id: sessionId },
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
        return;
      }

      // Send session:joined confirmation
      const welcomeMsg: WSServerMessage = {
        type: 'session:joined',
        payload: {
          sessionId: session.id,
          interviewId: session.interviewId,
          currentScore: session.currentIntegrityScore,
          currentRiskState: session.currentRiskState as any,
        },
      };
      ws.send(JSON.stringify(welcomeMsg));
    } catch (err) {
      logger.error({ err, sessionId }, 'Error verifying session on WS connection');
      ws.close(1011, 'Internal server error');
      return;
    }

    // Message handler
    ws.on('message', async (data: Buffer | string) => {
      try {
        const rawText = data.toString();
        const message = JSON.parse(rawText) as WSClientMessage;

        if (message.type === 'ping') {
          const pong: WSServerMessage = { type: 'pong' };
          ws.send(JSON.stringify(pong));
          return;
        }

        if (message.type === 'detection:event') {
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

            // If risk score changed, broadcast risk:update
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
              ws.send(JSON.stringify(riskUpdate));
            }
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
        if ((message as any).type === 'session:consent') {
          await prisma.session.update({
            where: { id: sessionId },
            data: {
              consentGiven: true,
              consentGivenAt: new Date(),
            },
          });

          const ackMsg: WSServerMessage = {
            type: 'ack',
            sequenceNumber: (message as any).sequenceNumber || 0,
            payload: {
              sequenceNumber: (message as any).sequenceNumber || 0,
              receivedAt: Date.now(),
            },
          };
          ws.send(JSON.stringify(ackMsg));
          return;
        }
      } catch (err) {
        logger.error({ err, sessionId }, 'Error parsing incoming WebSocket message');
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

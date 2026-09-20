/**
 * Shared WebSocket wire protocol interfaces.
 * Source of truth: docs/API_CONTRACT.md §2 & docs/ARCHITECTURE.md
 */

import { DetectionEvent } from './events.js';
import { RiskState } from './risk.js';

export type WSClientMessageType =
  | 'candidate:join'
  | 'detection:event'
  | 'evidence:snapshot'
  | 'ping';

export type WSServerMessageType =
  | 'session:joined'
  | 'ack'
  | 'risk:update'
  | 'error'
  | 'pong';

export interface WSBaseMessage {
  type: string;
  version?: string;
  sequenceNumber?: number;
  timestamp?: number;
}

export interface CandidateJoinPayload {
  token: string;
  metadata?: Record<string, unknown>;
}

export interface CandidateJoinMessage extends WSBaseMessage {
  type: 'candidate:join';
  payload: CandidateJoinPayload;
}

export interface DetectionEventMessage extends WSBaseMessage {
  type: 'detection:event';
  sequenceNumber: number;
  payload: DetectionEvent;
}

export interface EvidenceSnapshotPayload {
  eventId?: string;
  imageBase64: string;
  mimeType: 'image/jpeg' | 'image/png';
  capturedAt: number;
}

export interface EvidenceSnapshotMessage extends WSBaseMessage {
  type: 'evidence:snapshot';
  sequenceNumber: number;
  payload: EvidenceSnapshotPayload;
}

export interface PingMessage extends WSBaseMessage {
  type: 'ping';
}

export type WSClientMessage =
  | CandidateJoinMessage
  | DetectionEventMessage
  | EvidenceSnapshotMessage
  | PingMessage;

export interface SessionJoinedPayload {
  sessionId: string;
  interviewId: string;
  currentScore: number;
  currentRiskState: RiskState;
}

export interface SessionJoinedMessage extends WSBaseMessage {
  type: 'session:joined';
  payload: SessionJoinedPayload;
}

export interface AckPayload {
  sequenceNumber: number;
  receivedAt: number;
}

export interface AckMessage extends WSBaseMessage {
  type: 'ack';
  sequenceNumber: number;
  payload?: AckPayload;
}

export interface RiskUpdatePayload {
  sessionId: string;
  currentScore: number;
  currentRiskState: RiskState;
  explanation: string;
  timestamp: number;
}

export interface RiskUpdateMessage extends WSBaseMessage {
  type: 'risk:update';
  payload: RiskUpdatePayload;
}

export interface ErrorPayload {
  code: string;
  message: string;
  details?: unknown;
}

export interface ErrorMessage extends WSBaseMessage {
  type: 'error';
  payload: ErrorPayload;
}

export interface PongMessage extends WSBaseMessage {
  type: 'pong';
}

export type WSServerMessage =
  | SessionJoinedMessage
  | AckMessage
  | RiskUpdateMessage
  | ErrorMessage
  | PongMessage;

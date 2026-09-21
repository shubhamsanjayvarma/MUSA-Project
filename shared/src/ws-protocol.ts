/**
 * Shared WebSocket wire protocol interfaces.
 * Source of truth: docs/API_CONTRACT.md §2 & docs/ARCHITECTURE.md
 */

import { DetectionEvent } from './events.js';
import { RiskState } from './risk.js';

export type WSClientMessageType =
  | 'candidate:join'
  | 'session:consent'
  | 'session:start'
  | 'session:end'
  | 'session:heartbeat'
  | 'detection:event'
  | 'evidence:snapshot'
  | 'ping';

export type WSServerMessageType =
  | 'session:joined'
  | 'session:confirmed'
  | 'session:error'
  | 'ack'
  | 'risk:update'
  | 'error'
  | 'pong';

export interface WSBaseMessage {
  type: string;
  version?: number | string;
  sequenceNumber?: number;
  timestamp?: number | string;
}

export interface CandidateJoinPayload {
  token: string;
  metadata?: Record<string, unknown>;
}

export interface CandidateJoinMessage extends WSBaseMessage {
  type: 'candidate:join';
  payload: CandidateJoinPayload;
}

export interface SessionConsentPayload {
  consentGiven: boolean;
}

export interface SessionConsentMessage extends WSBaseMessage {
  type: 'session:consent';
  payload: SessionConsentPayload;
}

export interface SessionStartPayload {
  systemCheckPassed: boolean;
}

export interface SessionStartMessage extends WSBaseMessage {
  type: 'session:start';
  payload: SessionStartPayload;
}

export interface SessionEndPayload {
  reason: 'completed' | 'error' | 'disconnected';
}

export interface SessionEndMessage extends WSBaseMessage {
  type: 'session:end';
  payload: SessionEndPayload;
}

export interface SessionHeartbeatMessage extends WSBaseMessage {
  type: 'session:heartbeat';
  payload?: Record<string, unknown>;
}

export interface DetectionEventMessage extends WSBaseMessage {
  type: 'detection:event';
  sequenceNumber: number;
  payload: DetectionEvent;
}

export interface EvidenceSnapshotPayload {
  eventId?: string;
  eventSequenceNumber?: number;
  imageDataUrl?: string;
  imageBase64?: string;
  mimeType?: 'image/jpeg' | 'image/png';
  capturedAt?: number;
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
  | SessionConsentMessage
  | SessionStartMessage
  | SessionEndMessage
  | SessionHeartbeatMessage
  | DetectionEventMessage
  | EvidenceSnapshotMessage
  | PingMessage;

export interface SessionJoinedPayload {
  sessionId: string;
  interviewId: string;
  currentScore: number;
  currentRiskState: RiskState;
  interviewTitle?: string;
  serverTime?: string | number;
}

export interface SessionJoinedMessage extends WSBaseMessage {
  type: 'session:joined';
  payload: SessionJoinedPayload;
}

export interface SessionConfirmedMessage extends WSBaseMessage {
  type: 'session:confirmed';
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
  fatal?: boolean;
  details?: unknown;
}

export interface ErrorMessage extends WSBaseMessage {
  type: 'error';
  payload: ErrorPayload;
}

export interface SessionErrorMessage extends WSBaseMessage {
  type: 'session:error';
  payload: ErrorPayload;
}

export interface PongMessage extends WSBaseMessage {
  type: 'pong';
}

export type WSServerMessage =
  | SessionJoinedMessage
  | SessionConfirmedMessage
  | AckMessage
  | RiskUpdateMessage
  | ErrorMessage
  | SessionErrorMessage
  | PongMessage;

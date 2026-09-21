/**
 * InterviewShield WebSocket Client
 * Connects to /ws/session/:sessionId?token=... with auto-reconnect and heartbeat.
 * Source of truth: docs/API_CONTRACT.md §3 & docs/ARCHITECTURE.md
 */

import {
  WSClientMessage,
  WSServerMessage,
  AckMessage,
  RiskUpdatePayload,
} from '@interviewshield/shared';

export type ConnectionState = 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'RECONNECTING';

export interface WSClientOptions {
  wsUrl: string;
  sessionId: string;
  token: string;
  onStateChange?: (state: ConnectionState) => void;
  onAck?: (sequenceNumber: number) => void;
  onRiskUpdate?: (payload: RiskUpdatePayload) => void;
  onError?: (error: Error) => void;
  onConnect?: () => void;
}

export class WSClient {
  private socket: WebSocket | null = null;
  private wsUrl: string;
  private sessionId: string;
  private token: string;
  private state: ConnectionState = 'DISCONNECTED';
  private pingIntervalId: any = null;
  private reconnectTimeoutId: any = null;
  private reconnectAttempts = 0;
  private isIntentionallyClosed = false;

  private onStateChange?: (state: ConnectionState) => void;
  private onAck?: (sequenceNumber: number) => void;
  private onRiskUpdate?: (payload: RiskUpdatePayload) => void;
  private onError?: (error: Error) => void;
  private onConnect?: () => void;

  constructor(options: WSClientOptions) {
    this.wsUrl = options.wsUrl;
    this.sessionId = options.sessionId;
    this.token = options.token;
    this.onStateChange = options.onStateChange;
    this.onAck = options.onAck;
    this.onRiskUpdate = options.onRiskUpdate;
    this.onError = options.onError;
    this.onConnect = options.onConnect;
  }

  private setState(state: ConnectionState): void {
    if (this.state !== state) {
      this.state = state;
      if (this.onStateChange) {
        this.onStateChange(state);
      }
    }
  }

  connect(): void {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.isIntentionallyClosed = false;
    this.setState(this.reconnectAttempts > 0 ? 'RECONNECTING' : 'CONNECTING');

    try {
      // Build full WebSocket URL
      let targetUrl = this.wsUrl;
      if (!targetUrl.startsWith('ws://') && !targetUrl.startsWith('wss://')) {
        const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        targetUrl = `${proto}//${window.location.host}${targetUrl.startsWith('/') ? '' : '/'}${targetUrl}`;
      }

      const urlObj = new URL(targetUrl);
      urlObj.searchParams.set('token', this.token);

      this.socket = new WebSocket(urlObj.toString());

      this.socket.onopen = () => {
        this.reconnectAttempts = 0;
        this.setState('CONNECTED');
        this.startHeartbeat();
        if (this.onConnect) {
          this.onConnect();
        }
      };

      this.socket.onmessage = (event) => {
        try {
          const msg: WSServerMessage = JSON.parse(event.data);
          this.handleServerMessage(msg);
        } catch (e) {
          console.error('[WSClient] Failed to parse message:', e);
        }
      };

      this.socket.onclose = (_ev) => {
        this.stopHeartbeat();
        this.socket = null;
        if (!this.isIntentionallyClosed) {
          this.setState('DISCONNECTED');
          this.scheduleReconnect();
        } else {
          this.setState('DISCONNECTED');
        }
      };

      this.socket.onerror = (_ev) => {
        const err = new Error('WebSocket connection error');
        if (this.onError) {
          this.onError(err);
        }
      };
    } catch (err) {
      this.setState('DISCONNECTED');
      if (this.onError) {
        this.onError(err as Error);
      }
      this.scheduleReconnect();
    }
  }

  private handleServerMessage(msg: WSServerMessage): void {
    if (msg.type === 'ack') {
      const ackMsg = msg as AckMessage;
      if (typeof ackMsg.sequenceNumber === 'number' && this.onAck) {
        this.onAck(ackMsg.sequenceNumber);
      }
    } else if (msg.type === 'risk:update') {
      if (this.onRiskUpdate) {
        this.onRiskUpdate(msg.payload);
      }
    } else if (msg.type === 'pong') {
      // Heartbeat acknowledged
    }
  }

  send(message: WSClientMessage): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    }
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.pingIntervalId = setInterval(() => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.send({ type: 'ping' });
      }
    }, 15000);
  }

  private stopHeartbeat(): void {
    if (this.pingIntervalId) {
      clearInterval(this.pingIntervalId);
      this.pingIntervalId = null;
    }
  }

  private scheduleReconnect(): void {
    if (this.isIntentionallyClosed) return;
    if (this.reconnectTimeoutId) return;

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 15000);
    this.setState('RECONNECTING');

    this.reconnectTimeoutId = setTimeout(() => {
      this.reconnectTimeoutId = null;
      this.connect();
    }, delay);
  }

  disconnect(): void {
    this.isIntentionallyClosed = true;
    this.stopHeartbeat();
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }
    if (this.socket) {
      this.socket.close(1000, 'Session ended');
      this.socket = null;
    }
    this.setState('DISCONNECTED');
  }

  getSessionId(): string {
    return this.sessionId;
  }

  get isConnected(): boolean {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }

  get connectionState(): ConnectionState {
    return this.state;
  }
}

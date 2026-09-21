/**
 * Event Buffer
 * FIFO queue for reliable delivery of detection events to WebSocket.
 * Source of truth: docs/DETECTION_SPEC.md §10
 */

import { DetectionEvent, DetectionEventMessage } from '@interviewshield/shared';

export interface QueuedEvent {
  sequenceNumber: number;
  event: DetectionEvent;
  sentAt: number | null;
  acknowledged: boolean;
}

export interface WebSocketSender {
  isConnected: boolean;
  send: (message: DetectionEventMessage) => void;
}

export class EventBuffer {
  private queue: QueuedEvent[] = [];
  private nextSequenceNumber = 1;
  private readonly maxBufferSize = 500;
  private readonly retryTimeoutMs = 5000;
  private wsSender: WebSocketSender | null = null;
  private onQueueChangeCallback?: (queueLength: number, unackedLength: number) => void;

  constructor(sender?: WebSocketSender) {
    if (sender) {
      this.wsSender = sender;
    }
  }

  setSender(sender: WebSocketSender): void {
    this.wsSender = sender;
  }

  setOnQueueChange(callback: (queueLength: number, unackedLength: number) => void): void {
    this.onQueueChangeCallback = callback;
  }

  private notifyChange(): void {
    if (this.onQueueChangeCallback) {
      const unacked = this.queue.filter((q) => !q.acknowledged).length;
      this.onQueueChangeCallback(this.queue.length, unacked);
    }
  }

  /**
   * Enqueue events and immediately attempt to flush over WebSocket.
   */
  enqueue(events: DetectionEvent[]): void {
    for (const event of events) {
      if (this.queue.length >= this.maxBufferSize) {
        // Drop oldest unacknowledged to prevent unbounded memory growth
        console.warn('[EventBuffer] Buffer reached max capacity (500). Dropping oldest event.');
        this.queue.shift();
      }

      this.queue.push({
        sequenceNumber: this.nextSequenceNumber++,
        event,
        sentAt: null,
        acknowledged: false,
      });
    }

    this.notifyChange();
    this.flush();
  }

  /**
   * Send pending unacknowledged events via WebSocket sender.
   */
  flush(): void {
    if (!this.wsSender || !this.wsSender.isConnected) return;

    const now = Date.now();
    for (const item of this.queue) {
      if (!item.acknowledged && (!item.sentAt || now - item.sentAt > this.retryTimeoutMs)) {
        try {
          const message: DetectionEventMessage = {
            type: 'detection:event',
            sequenceNumber: item.sequenceNumber,
            payload: item.event,
          };
          this.wsSender.send(message);
          item.sentAt = now;
        } catch (err) {
          console.error(`[EventBuffer] Failed to send event #${item.sequenceNumber}:`, err);
        }
      }
    }
  }

  /**
   * Acknowledge server receipt of an event by sequenceNumber.
   */
  acknowledge(sequenceNumber: number): void {
    const item = this.queue.find((q) => q.sequenceNumber === sequenceNumber);
    if (item) {
      item.acknowledged = true;
    }

    // Prune acknowledged events from the front of the queue
    while (this.queue.length > 0 && this.queue[0].acknowledged) {
      this.queue.shift();
    }

    this.notifyChange();
  }

  /**
   * Replay all unacknowledged events (called after reconnection).
   */
  replayUnacknowledged(): void {
    for (const item of this.queue) {
      if (!item.acknowledged) {
        item.sentAt = null; // Force resend on next flush
      }
    }
    this.flush();
  }

  get queueLength(): number {
    return this.queue.length;
  }

  get unacknowledgedCount(): number {
    return this.queue.filter((q) => !q.acknowledged).length;
  }

  get currentSequenceNumber(): number {
    return this.nextSequenceNumber;
  }

  clear(): void {
    this.queue = [];
    this.nextSequenceNumber = 1;
    this.notifyChange();
  }
}

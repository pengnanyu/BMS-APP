/** 数据收发队列 - 串行发送，无重试
 *
 * 职责：
 * 1. 串行发送帧（一次只发一个，发完不等待响应）
 * 2. ack 机制：收到响应帧时清除 pending 项
 * 3. 超时清理：pending 项超时后直接移除（不重发，重试由 bms-ui 端负责）
 */

export interface QueueItem {
  id: string;
  data: Uint8Array;
  timestamp: number;
  pending: boolean;
  sentAt?: number;
  requestId?: string;
}

const QUEUE_MAX_SIZE = 32;
const PENDING_TIMEOUT = 5000;

export class DataQueue {
  private _queue: QueueItem[] = [];
  private _counter = 0;
  private _processing = false;
  private _sendFn: ((data: Uint8Array) => Promise<boolean>) | null = null;
  private _timer: ReturnType<typeof setInterval> | null = null;

  setSendFn(fn: (data: Uint8Array) => Promise<boolean>): void {
    this._sendFn = fn;
  }

  enqueue(data: Uint8Array, requestId?: string): string {
    if (this._queue.length >= QUEUE_MAX_SIZE) {
      this._queue.shift();
    }

    const id = `q_${++this._counter}`;
    this._queue.push({
      id,
      data,
      timestamp: Date.now(),
      pending: false,
      requestId,
    });

    this._processQueue();
    return id;
  }

  ackOldestPending(): void {
    const idx = this._queue.findIndex((i) => i.pending);
    if (idx !== -1) {
      this._queue.splice(idx, 1);
    }
  }

  clearPending(): void {
    this._queue = this._queue.filter((i) => !i.pending);
    this._processing = false;
  }

  start(): void {
    if (this._timer) return;
    this._timer = setInterval(() => this._tick(), 500);
  }

  stop(): void {
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
    }
    this._queue = [];
    this._processing = false;
  }

  get status() {
    return {
      pendingCount: this._queue.filter((i) => i.pending).length,
      queuedCount: this._queue.filter((i) => !i.pending).length,
    };
  }

  private async _processQueue(): Promise<void> {
    if (this._processing) return;
    this._processing = true;

    while (this._queue.length > 0) {
      const item = this._queue.find((i) => !i.pending);
      if (!item || !this._sendFn) break;

      item.pending = true;
      item.sentAt = Date.now();

      const success = await this._sendFn(item.data);
      if (!success) {
        this._queue.splice(this._queue.indexOf(item), 1);
      }
    }

    this._processing = false;
  }

  /** 超时清理：pending 项超时后直接移除，不重发 */
  private _tick(): void {
    const now = Date.now();
    this._queue = this._queue.filter((item) => {
      if (!item.pending || !item.sentAt) return true;
      return now - item.sentAt <= PENDING_TIMEOUT;
    });

    if (this._queue.some((i) => !i.pending)) {
      this._processQueue();
    }
  }
}

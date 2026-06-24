/** 数据发送队列 - 串行发送，无重试无ack
 *
 * 职责：串行发送帧（一次只发一个），发完不等待响应
 * 帧提取和CRC校验由 bms-ui 端负责
 */

export interface QueueItem {
  id: string;
  data: Uint8Array;
  timestamp: number;
  pending: boolean;
  requestId?: string;
}

const QUEUE_MAX_SIZE = 32;

export class DataQueue {
  private _queue: QueueItem[] = [];
  private _counter = 0;
  private _processing = false;
  private _sendFn: ((data: Uint8Array) => Promise<boolean>) | null = null;

  setSendFn(fn: (data: Uint8Array) => Promise<boolean>): void {
    this._sendFn = fn;
  }

  enqueue(data: Uint8Array, requestId?: string): string {
    /* 新帧入队前，清除所有 pending 项（确保新帧能立即发送） */
    this._queue = this._queue.filter((i) => !i.pending);
    this._processing = false;

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

  clearPending(): void {
    this._queue = this._queue.filter((i) => !i.pending);
    this._processing = false;
  }

  start(): void { /* 兼容接口 */ }
  stop(): void {
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
      const success = await this._sendFn(item.data);
      if (!success) {
        this._queue.splice(this._queue.indexOf(item), 1);
      }
    }

    this._processing = false;
  }
}

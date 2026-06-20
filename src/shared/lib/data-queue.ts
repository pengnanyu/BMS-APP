/** 数据收发队列 - 缓存待发送和已接收的数据，支持并发控制和溢出策略 */

export interface QueueItem {
  /** 唯一标识 */
  id: string;
  /** 原始帧数据 */
  data: Uint8Array;
  /** 入队时间 */
  timestamp: number;
  /** 重试次数 */
  retries: number;
  /** 最大重试次数 */
  maxRetries: number;
  /** 超时时间 ms */
  timeout: number;
  /** 是否已发送等待响应 */
  pending: boolean;
  /** 发送时间 */
  sentAt?: number;
  /** 请求 ID（与 iframe 通信对应） */
  requestId?: string;
}

export interface DataQueueOptions {
  /** 最大队列长度，超出时丢弃最旧数据 */
  maxSize?: number;
  /** 默认最大重试次数 */
  maxRetries?: number;
  /** 默认超时时间 ms */
  defaultTimeout?: number;
  /** 重试间隔 ms */
  retryInterval?: number;
}

const DEFAULT_OPTIONS: Required<DataQueueOptions> = {
  maxSize: 64,
  maxRetries: 3,
  defaultTimeout: 5000,
  retryInterval: 500,
};

type QueueEventType = 'send' | 'timeout' | 'overflow' | 'retry';

export type QueueEventHandler = (event: QueueEventType, item: QueueItem) => void;

export class DataQueue {
  private _sendQueue: QueueItem[] = [];
  private _receiveBuffer: Uint8Array[] = [];
  private _options: Required<DataQueueOptions>;
  private _handlers: Set<QueueEventHandler> = new Set();
  private _counter = 0;
  private _processing = false;
  private _sendFn: ((data: Uint8Array) => Promise<boolean>) | null = null;
  private _timer: ReturnType<typeof setInterval> | null = null;

  constructor(options?: DataQueueOptions) {
    this._options = { ...DEFAULT_OPTIONS, ...options };
  }

  /** 设置发送函数（由 webBridge 提供） */
  setSendFn(fn: (data: Uint8Array) => Promise<boolean>): void {
    this._sendFn = fn;
  }

  /** 注册事件处理 */
  onEvent(handler: QueueEventHandler): () => void {
    this._handlers.add(handler);
    return () => this._handlers.delete(handler);
  }

  /** 入队待发送数据 */
  enqueue(data: Uint8Array, requestId?: string, overrides?: Partial<Pick<QueueItem, 'maxRetries' | 'timeout'>>): string {
    /* 溢出策略：丢弃最旧的未发送数据 */
    if (this._sendQueue.length >= this._options.maxSize) {
      const oldest = this._sendQueue.find((i) => !i.pending);
      if (oldest) {
        this._emit('overflow', oldest);
        this._sendQueue.splice(this._sendQueue.indexOf(oldest), 1);
      } else {
        /* 全部 pending 时丢弃最早的 pending 项 */
        const first = this._sendQueue.shift()!;
        this._emit('overflow', first);
      }
    }

    const id = `q_${++this._counter}_${Date.now()}`;
    const item: QueueItem = {
      id,
      data,
      timestamp: Date.now(),
      retries: 0,
      maxRetries: overrides?.maxRetries ?? this._options.maxRetries,
      timeout: overrides?.timeout ?? this._options.defaultTimeout,
      pending: false,
      requestId,
    };

    this._sendQueue.push(item);
    this._processQueue();
    return id;
  }

  /** 收到设备响应数据 */
  pushReceived(data: Uint8Array): void {
    this._receiveBuffer.push(data);
    /* 限制接收缓冲区大小 */
    if (this._receiveBuffer.length > this._options.maxSize) {
      this._receiveBuffer.shift();
    }
  }

  /** 获取并清空接收缓冲区 */
  drainReceived(): Uint8Array[] {
    const data = this._receiveBuffer;
    this._receiveBuffer = [];
    return data;
  }

  /** 标记某个请求已收到响应（从 pending 中移除） */
  ack(requestId: string): void {
    const idx = this._sendQueue.findIndex((i) => i.requestId === requestId);
    if (idx !== -1) {
      this._sendQueue.splice(idx, 1);
    }
  }

  /** 确认最早的 pending 项（收到响应帧时调用，避免超时重发） */
  ackOldestPending(): void {
    const idx = this._sendQueue.findIndex((i) => i.pending);
    if (idx !== -1) {
      this._sendQueue.splice(idx, 1);
    }
  }

  /** 启动队列处理（超时检测） */
  start(): void {
    if (this._timer) return;
    this._timer = setInterval(() => this._tick(), this._options.retryInterval);
  }

  /** 停止队列处理 */
  stop(): void {
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
    }
    this._sendQueue = [];
    this._receiveBuffer = [];
    this._processing = false;
  }

  /** 获取队列状态 */
  get status() {
    return {
      pendingCount: this._sendQueue.filter((i) => i.pending).length,
      queuedCount: this._sendQueue.filter((i) => !i.pending).length,
      receivedCount: this._receiveBuffer.length,
    };
  }

  /** 处理发送队列 */
  private async _processQueue(): Promise<void> {
    if (this._processing) return;
    this._processing = true;

    while (this._sendQueue.length > 0) {
      const item = this._sendQueue.find((i) => !i.pending);
      if (!item) break;

      if (!this._sendFn) break;

      item.pending = true;
      item.sentAt = Date.now();
      this._emit('send', item);

      const success = await this._sendFn(item.data);
      if (!success) {
        item.pending = false;
        item.retries++;
        if (item.retries > item.maxRetries) {
          this._emit('timeout', item);
          this._sendQueue.splice(this._sendQueue.indexOf(item), 1);
        }
      }
    }

    this._processing = false;
  }

  /** 超时检测和重试 */
  private _tick(): void {
    const now = Date.now();
    const toRemove: number[] = [];

    for (let i = 0; i < this._sendQueue.length; i++) {
      const item = this._sendQueue[i];
      if (!item.pending || !item.sentAt) continue;

      if (now - item.sentAt > item.timeout) {
        item.retries++;
        if (item.retries > item.maxRetries) {
          this._emit('timeout', item);
          toRemove.push(i);
        } else {
          item.pending = false;
          item.sentAt = undefined;
          this._emit('retry', item);
        }
      }
    }

    for (let i = toRemove.length - 1; i >= 0; i--) {
      this._sendQueue.splice(toRemove[i], 1);
    }

    if (toRemove.length > 0 || this._sendQueue.some((i) => !i.pending)) {
      this._processQueue();
    }
  }

  private _emit(event: QueueEventType, item: QueueItem): void {
    this._handlers.forEach((h) => h(event, item));
  }
}

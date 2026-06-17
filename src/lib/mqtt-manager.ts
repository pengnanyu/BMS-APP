// ==================== MQTT 连接管理器 ====================

import type { ConnectionState } from '@/types/bms';

export interface MQTTConfig {
  brokerUrl: string;
  topic: string;
  clientId?: string;
  username?: string;
  password?: string;
}

export class MQTTManager {
  private ws: WebSocket | null = null;
  private state: ConnectionState = 'disconnected';
  private config: MQTTConfig | null = null;
  private onDataCallback: ((topic: string, payload: Uint8Array) => void) | null = null;
  private onStateChange: ((state: ConnectionState) => void) | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;

  static isSupported(): boolean {
    return typeof WebSocket !== 'undefined';
  }

  getState(): ConnectionState {
    return this.state;
  }

  setOnStateChange(callback: (state: ConnectionState) => void) {
    this.onStateChange = callback;
  }

  setOnData(callback: (topic: string, payload: Uint8Array) => void) {
    this.onDataCallback = callback;
  }

  private setState(newState: ConnectionState) {
    this.state = newState;
    this.onStateChange?.(newState);
  }

  /** 连接 MQTT Broker（WebSocket 方式） */
  async connect(config: MQTTConfig): Promise<boolean> {
    this.config = config;

    try {
      this.setState('connecting');

      const clientId = config.clientId || `bms_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const url = new URL(config.brokerUrl);

      // MQTT over WebSocket 路径
      url.searchParams.set('clientId', clientId);
      if (config.username) url.searchParams.set('username', config.username);

      this.ws = new WebSocket(url.toString());
      this.ws.binaryType = 'arraybuffer';

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.setState('connected');
        this.startPing();
        this.subscribe(config.topic);
      };

      this.ws.onmessage = (event) => {
        if (event.data instanceof ArrayBuffer) {
          const data = new Uint8Array(event.data);
          this.handleMQTTMessage(data);
        }
      };

      this.ws.onclose = () => {
        this.stopPing();
        this.setState('disconnected');
        this.scheduleReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.setState('error');
      };

      return true;
    } catch (error) {
      console.error('MQTT connection failed:', error);
      this.setState('error');
      return false;
    }
  }

  /** 处理 MQTT 消息（简化协议解析） */
  private handleMQTTMessage(data: Uint8Array) {
    // 这里实现简化的 MQTT 消息解析
    // 实际项目中建议使用 mqtt-packet 库
    try {
      const text = new TextDecoder().decode(data);
      const parsed = JSON.parse(text);
      if (parsed.topic && parsed.payload) {
        this.onDataCallback?.(parsed.topic, new Uint8Array(
          typeof parsed.payload === 'string'
            ? new TextEncoder().encode(parsed.payload)
            : Object.values(parsed.payload) as number[]
        ));
      }
    } catch {
      // 非 JSON 格式，直接传递原始数据
      this.onDataCallback?.(this.config?.topic || '', data);
    }
  }

  /** 订阅主题 */
  private subscribe(topic: string) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      const msg = JSON.stringify({ action: 'subscribe', topic });
      this.ws.send(msg);
    }
  }

  /** 发布消息 */
  async publish(topic: string, payload: string | Uint8Array): Promise<boolean> {
    if (this.ws?.readyState !== WebSocket.OPEN) {
      return false;
    }

    try {
      const msg = JSON.stringify({
        action: 'publish',
        topic,
        payload: typeof payload === 'string' ? payload : Array.from(payload),
      });
      this.ws.send(msg);
      return true;
    } catch (error) {
      console.error('MQTT publish failed:', error);
      return false;
    }
  }

  /** MQTT 保活心跳 */
  private startPing() {
    this.pingTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ action: 'ping' }));
      }
    }, 30000);
  }

  private stopPing() {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  /** 自动重连 */
  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts || !this.config) return;

    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    this.reconnectAttempts++;

    this.reconnectTimer = setTimeout(() => {
      this.connect(this.config!);
    }, delay);
  }

  /** 断开连接 */
  async disconnect(): Promise<void> {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.stopPing();

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.setState('disconnected');
  }
}

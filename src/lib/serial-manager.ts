// ==================== 串口连接管理器（Web Serial API）====================
// 仅 Web 版支持（Chrome/Edge 89+）

import type { SerialPort, ConnectionState } from '@/types/bms';

export class SerialManager {
  private port: SerialPort | null = null;
  private reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  private writer: WritableStreamDefaultWriter<Uint8Array> | null = null;
  private state: ConnectionState = 'disconnected';
  private onDataCallback: ((data: Uint8Array) => void) | null = null;
  private onStateChange: ((state: ConnectionState) => void) | null = null;
  private reading = false;

  /** 检查浏览器是否支持 Web Serial API */
  static isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'serial' in navigator;
  }

  getState(): ConnectionState {
    return this.state;
  }

  setOnStateChange(callback: (state: ConnectionState) => void) {
    this.onStateChange = callback;
  }

  setOnData(callback: (data: Uint8Array) => void) {
    this.onDataCallback = callback;
  }

  private setState(newState: ConnectionState) {
    this.state = newState;
    this.onStateChange?.(newState);
  }

  /** 请求串口并连接 */
  async connect(baudRate: number = 9600): Promise<boolean> {
    if (!SerialManager.isSupported()) {
      console.error('Web Serial API is not supported');
      this.setState('error');
      return false;
    }

    try {
      this.setState('connecting');

      this.port = await navigator.serial!.requestPort();
      await this.port.open({ baudRate });

      // 启动读取循环
      this.reading = true;
      this.startReading();

      // 获取 writer
      if (this.port.writable) {
        this.writer = this.port.writable.getWriter();
      }

      this.setState('connected');
      return true;
    } catch (error) {
      console.error('Serial connection failed:', error);
      this.setState('error');
      return false;
    }
  }

  /** 持续读取串口数据 */
  private async startReading() {
    if (!this.port?.readable) return;

    this.reader = this.port.readable.getReader();

    try {
      while (this.reading) {
        const { value, done } = await this.reader.read();
        if (done) break;
        if (value) {
          this.onDataCallback?.(value);
        }
      }
    } catch (error) {
      console.error('Serial read error:', error);
    } finally {
      this.reader?.releaseLock();
      this.reader = null;
    }
  }

  /** 发送数据到串口 */
  async writeData(data: Uint8Array): Promise<boolean> {
    if (!this.writer || this.state !== 'connected') {
      return false;
    }

    try {
      await this.writer.write(data);
      return true;
    } catch (error) {
      console.error('Serial write failed:', error);
      return false;
    }
  }

  /** 断开串口连接 */
  async disconnect(): Promise<void> {
    this.reading = false;

    if (this.reader) {
      try {
        await this.reader.cancel();
      } catch { /* ignore */ }
      this.reader.releaseLock();
      this.reader = null;
    }

    if (this.writer) {
      this.writer.releaseLock();
      this.writer = null;
    }

    if (this.port) {
      try {
        await this.port.close();
      } catch { /* ignore */ }
      this.port = null;
    }

    this.setState('disconnected');
  }
}

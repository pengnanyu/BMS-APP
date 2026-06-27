/** Web Bridge 管理器 — 纯透传管道
 *
 * 职责：
 * 1. 蓝牙/串口连接管理
 * 2. 原始字节收发透传（不做帧提取、不做 CRC、不做业务逻辑）
 * 3. 连接状态通知
 *
 * 不负责：
 * - 初始化帧发送（由 bms-ui 端负责）
 * - 帧提取/CRC 校验（由 bms-ui 端负责）
 * - 任何业务逻辑（参数读写、异常记录等）
 */

import { toast } from 'sonner';
import i18n from '@/i18n';
import type {
  ConnectionConfig,
  ConnectionStatus,
  ConnectionStatusCallback,
  DataReceiveCallback,
  PlatformInfo,
  WebBridgeAPI,
} from '@/shared/types/bridge';
import {
  DEFAULT_BLUETOOTH_CONFIG,
  DEFAULT_SERIAL_CONFIG,
} from '@/shared/types/bridge';
import { DataQueue } from '@/shared/lib/data-queue';

class WebBridgeManager implements WebBridgeAPI {
  private _status: ConnectionStatus = 'disconnected';
  private _config: ConnectionConfig;
  private _statusCallbacks: Set<ConnectionStatusCallback> = new Set();
  private _rawDataCallbacks: Set<(data: Uint8Array) => void> = new Set();

  // Web Bluetooth API
  private _bluetoothDevice: BluetoothDevice | null = null;
  private _bluetoothCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;

  // Web Serial API
  private _serialPort: SerialPort | null = null;
  private _serialReader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  private _serialWriter: WritableStreamDefaultWriter<Uint8Array> | null = null;
  private _readingSerial = false;

  // 数据队列（串行发送）
  private _queue: DataQueue;

  constructor() {
    this._config = {
      type: 'bluetooth',
      bluetooth: { ...DEFAULT_BLUETOOTH_CONFIG },
      serial: { ...DEFAULT_SERIAL_CONFIG },
    };

    this._queue = new DataQueue();
    this._queue.setSendFn((data) => this._sendRaw(data));

    this.exposeToWindow();
  }

  // ==================== 公开 API ====================

  async connect(): Promise<boolean> {
    if (this._status === 'connected' || this._status === 'connecting') {
      toast.warning(i18n.t('bridge.alreadyConnected'));
      return false;
    }

    this.setStatus('connecting');

    try {
      if (this._config.type === 'bluetooth') {
        return await this.connectBluetooth();
      } else {
        return await this.connectSerial();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : i18n.t('bridge.connectionFailed');
      this.setStatus('error', message);
      toast.error(i18n.t('bridge.connectionFailedWithMsg', { message }));
      return false;
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this._config.type === 'bluetooth') {
        await this.disconnectBluetooth();
      } else {
        await this.disconnectSerial();
      }
    } catch (error) {
      console.error('Disconnect error:', error);
    }
    this.setStatus('disconnected');
    this._queue.stop();
    toast.info(i18n.t('bridge.disconnected'));
  }

  getConnectionStatus(): ConnectionStatus {
    return this._status;
  }

  async sendData(data: Uint8Array): Promise<boolean> {
    if (this._status !== 'connected') {
      toast.warning(i18n.t('bridge.deviceNotConnected'));
      return false;
    }
    this._queue.enqueue(data);
    return true;
  }

  /** 通过数据队列发送原始帧 */
  sendFrame(data: Uint8Array, requestId?: string): string {
    const id = this._queue.enqueue(data, requestId);
    return id;
  }

  /** 注册原始数据接收回调（透传给 iframe） */
  onRawDataReceived(callback: (data: Uint8Array) => void): () => void {
    this._rawDataCallbacks.add(callback);
    return () => {
      this._rawDataCallbacks.delete(callback);
    };
  }

  onConnectionStatusChange(callback: ConnectionStatusCallback): () => void {
    this._statusCallbacks.add(callback);
    return () => {
      this._statusCallbacks.delete(callback);
    };
  }

  /** 保留旧接口兼容（onDataReceived 内部转发到 onRawDataReceived） */
  onDataReceived(callback: (data: Uint8Array) => void): () => void {
    return this.onRawDataReceived(callback);
  }

  getConfig(): ConnectionConfig {
    return { ...this._config };
  }

  updateConfig(config: Partial<ConnectionConfig>): void {
    this._config = {
      ...this._config,
      ...config,
      bluetooth: { ...this._config.bluetooth, ...config.bluetooth },
      serial: { ...this._config.serial, ...config.serial },
    };
  }

  getPlatformInfo(): PlatformInfo {
    return {
      platform: 'web',
      version: '1.0.0',
      bluetoothSupported: typeof navigator !== 'undefined' && 'bluetooth' in navigator,
      serialSupported: typeof navigator !== 'undefined' && 'serial' in navigator,
    };
  }

  // ==================== 蓝牙连接 ====================

  private async connectBluetooth(): Promise<boolean> {
    if (!('bluetooth' in navigator)) {
      throw new Error(i18n.t('bridge.bluetoothNotSupported'));
    }

    const { nameFilter, serviceUUID, notifyUUID, writeUUID } = this._config.bluetooth;

    const baseUUID = '-0000-1000-8000-00805f9b34fb';
    const serviceFullUUID = `0000${serviceUUID.replace('0x', '').toLowerCase()}${baseUUID}`;
    const notifyFullUUID = `0000${notifyUUID.replace('0x', '').toLowerCase()}${baseUUID}`;
    const writeFullUUID = `0000${writeUUID.replace('0x', '').toLowerCase()}${baseUUID}`;

    const device = await navigator.bluetooth.requestDevice({
      filters: [{ namePrefix: nameFilter }],
      optionalServices: [serviceFullUUID, notifyFullUUID, writeFullUUID],
    });

    this._bluetoothDevice = device;

    device.addEventListener('gattserverdisconnected', () => {
      this._bluetoothDevice = null;
      this._bluetoothCharacteristic = null;
      this.setStatus('disconnected', i18n.t('bridge.deviceDisconnected'));
      toast.warning(i18n.t('bridge.bluetoothDeviceDisconnected'));
    });

    const server = await device.gatt!.connect();

    let notifyChar: BluetoothRemoteGATTCharacteristic | null = null;
    let writeChar: BluetoothRemoteGATTCharacteristic | null = null;

    const notifyShort = notifyUUID.replace('0x', '').toLowerCase();
    const writeShort = writeUUID.replace('0x', '').toLowerCase();

    let services: BluetoothRemoteGATTService[] = [];

    try {
      const targetService = await server.getPrimaryService(serviceFullUUID);
      services = [targetService];
    } catch {
      services = await server.getPrimaryServices();
    }

    for (const service of services) {
      try {
        const characteristics = await service.getCharacteristics();
        for (const char of characteristics) {
          const uuid = char.uuid.toLowerCase();
          if (!notifyChar && uuid.includes(notifyShort)) {
            notifyChar = char;
          }
          if (!writeChar && uuid.includes(writeShort)) {
            writeChar = char;
          }
        }
        if (notifyChar && writeChar) break;
      } catch {
        /* 忽略无法访问的服务 */
      }
    }

    if (!notifyChar || !writeChar) {
      const missing = [];
      if (!notifyChar) missing.push(`Notify(${notifyUUID})`);
      if (!writeChar) missing.push(`Write(${writeUUID})`);
      throw new Error(i18n.t('bridge.characteristicNotFound', { missing: missing.join(', ') }));
    }

    this._bluetoothCharacteristic = writeChar;

    /* 尝试协商 MTU 512 */
    try {
      if (device.gatt?.connected && 'requestMTU' in device.gatt) {
        await (device.gatt as any).requestMTU(512);
      }
    } catch {
      /* MTU 协商失败，使用默认值 */
    }

    await notifyChar.startNotifications();
    notifyChar.addEventListener('characteristicvaluechanged', (event) => {
      const target = event.target as BluetoothRemoteGATTCharacteristic;
      if (target.value) {
        const data = new Uint8Array(target.value.buffer);
        this.notifyRawData(data);
      }
    });

    const deviceName = device.name || i18n.t('bridge.unknownDevice');
    this.setStatus('connected', i18n.t('bridge.connectedBluetooth', { deviceName }));
    toast.success(i18n.t('bridge.connectedBluetooth', { deviceName }));
    return true;
  }

  private async disconnectBluetooth(): Promise<void> {
    if (this._bluetoothDevice?.gatt?.connected) {
      this._bluetoothDevice.gatt.disconnect();
    }
    this._bluetoothDevice = null;
    this._bluetoothCharacteristic = null;
  }

  // ==================== 串口连接 ====================

  private async connectSerial(): Promise<boolean> {
    if (!('serial' in navigator)) {
      throw new Error(i18n.t('bridge.serialNotSupported'));
    }

    const { baudRate, dataBits, stopBits, parity } = this._config.serial;

    const port = await navigator.serial.requestPort();
    await port.open({
      baudRate,
      dataBits,
      stopBits,
      parity,
    });

    this._serialPort = port;

    this._readingSerial = true;
    this.readSerialLoop();

    this._serialWriter = port.writable!.getWriter();

    const br = String(baudRate);
    this.setStatus('connected', i18n.t('bridge.connectedSerial', { baudRate: br }));
    toast.success(i18n.t('bridge.connectedSerial', { baudRate: br }));
    return true;
  }

  private async readSerialLoop(): Promise<void> {
    if (!this._serialPort?.readable) return;

    this._serialReader = this._serialPort.readable.getReader();

    try {
      while (this._readingSerial) {
        const { value, done } = await this._serialReader.read();
        if (done) break;
        if (value) {
          this.notifyRawData(value);
        }
      }
    } catch (error) {
      if (this._readingSerial) {
        console.error('Serial read error:', error);
      }
    } finally {
      this._serialReader?.releaseLock();
      this._serialReader = null;
    }
  }

  private async disconnectSerial(): Promise<void> {
    this._readingSerial = false;

    if (this._serialReader) {
      try {
        await this._serialReader.cancel();
      } catch {
        /* 忽略 */
      }
      this._serialReader = null;
    }

    if (this._serialWriter) {
      this._serialWriter.releaseLock();
      this._serialWriter = null;
    }

    if (this._serialPort) {
      await this._serialPort.close();
      this._serialPort = null;
    }
  }

  // ==================== 内部方法 ====================

  /** 底层发送数据（由队列调用） */
  private async _sendRaw(data: Uint8Array): Promise<boolean> {
    try {
      if (this._config.type === 'bluetooth') {
        if (!this._bluetoothCharacteristic) return false;
        const chunkSize = 509;
        for (let i = 0; i < data.length; i += chunkSize) {
          const chunk = data.slice(i, i + chunkSize);
          await this._bluetoothCharacteristic.writeValueWithoutResponse(chunk);
        }
        return true;
      } else {
        if (!this._serialWriter) return false;
        await this._serialWriter.write(data);
        return true;
      }
    } catch (error) {
      console.error('Send data error:', error);
      return false;
    }
  }

  private setStatus(status: ConnectionStatus, message?: string): void {
    this._status = status;
    this._statusCallbacks.forEach((cb) => cb(status, message));
  }

  /** 透传原始数据给所有监听者 */
  private notifyRawData(data: Uint8Array): void {
    this._rawDataCallbacks.forEach((cb) => cb(data));
  }

  /** 将 Bridge API 暴露到 window 对象 */
  private exposeToWindow(): void {
    const bridge: WebBridgeAPI = {
      connect: () => this.connect(),
      disconnect: () => this.disconnect(),
      getConnectionStatus: () => this.getConnectionStatus(),
      sendData: (data: Uint8Array) => this.sendData(data),
      onDataReceived: (cb: DataReceiveCallback) => this.onDataReceived(cb),
      onConnectionStatusChange: (cb: ConnectionStatusCallback) =>
        this.onConnectionStatusChange(cb),
      getConfig: () => this.getConfig(),
      updateConfig: (config: Partial<ConnectionConfig>) => this.updateConfig(config),
      getPlatformInfo: () => this.getPlatformInfo(),
    };

    (window as any).AIBMSBridge = bridge;
  }
}

export const webBridge = new WebBridgeManager();

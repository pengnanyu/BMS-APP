import { toast } from 'sonner';
import i18n from '@/i18n';
import type {
  ConnectionConfig,
  ConnectionStatus,
  ConnectionStatusCallback,
  DataReceiveCallback,
  PlatformInfo,
  SerialConfig,
  WebBridgeAPI,
} from '@/shared/types/bridge';
import {
  DEFAULT_BLUETOOTH_CONFIG,
  DEFAULT_SERIAL_CONFIG,
} from '@/shared/types/bridge';

// ==================== Web Bridge 实现 ====================

/**
 * Web Bridge 管理器 - 单例模式
 * 提供统一的 API 给 iframe 中的 UI 调用
 */
class WebBridgeManager implements WebBridgeAPI {
  private _status: ConnectionStatus = 'disconnected';
  private _config: ConnectionConfig;
  private _dataCallbacks: Set<DataReceiveCallback> = new Set();
  private _statusCallbacks: Set<ConnectionStatusCallback> = new Set();

  // Web Bluetooth API
  private _bluetoothDevice: BluetoothDevice | null = null;
  private _bluetoothCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;

  // Web Serial API
  private _serialPort: SerialPort | null = null;
  private _serialReader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  private _serialWriter: WritableStreamDefaultWriter<Uint8Array> | null = null;
  private _readingSerial = false;

  constructor() {
    this._config = {
      type: 'bluetooth',
      bluetooth: { ...DEFAULT_BLUETOOTH_CONFIG },
      serial: { ...DEFAULT_SERIAL_CONFIG },
    };

    // 暴露全局 API 给 iframe
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

    try {
      if (this._config.type === 'bluetooth') {
        if (!this._bluetoothCharacteristic) return false;
        // BLE 单次写入限制 20 字节，分包发送
        const chunkSize = 20;
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
      toast.error(i18n.t('bridge.sendDataFailed'));
      return false;
    }
  }

  onDataReceived(callback: DataReceiveCallback): () => void {
    this._dataCallbacks.add(callback);
    return () => {
      this._dataCallbacks.delete(callback);
    };
  }

  onConnectionStatusChange(callback: ConnectionStatusCallback): () => void {
    this._statusCallbacks.add(callback);
    return () => {
      this._statusCallbacks.delete(callback);
    };
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

    // 将 16-bit UUID 转为完整 UUID（必须小写）
    const baseUUID = '-0000-1000-8000-00805f9b34fb';
    const serviceFullUUID = `0000${serviceUUID.replace('0x', '').toLowerCase()}${baseUUID}`;
    const notifyFullUUID = `0000${notifyUUID.replace('0x', '').toLowerCase()}${baseUUID}`;
    const writeFullUUID = `0000${writeUUID.replace('0x', '').toLowerCase()}${baseUUID}`;

    // 请求设备时声明 Service UUID，同时也声明特征值 UUID 作为备选
    const device = await navigator.bluetooth.requestDevice({
      filters: [{ namePrefix: nameFilter }],
      optionalServices: [serviceFullUUID, notifyFullUUID, writeFullUUID],
    });

    this._bluetoothDevice = device;

    // 监听断开事件
    device.addEventListener('gattserverdisconnected', () => {
      this._bluetoothDevice = null;
      this._bluetoothCharacteristic = null;
      this.setStatus('disconnected', i18n.t('bridge.deviceDisconnected'));
      toast.warning(i18n.t('bridge.bluetoothDeviceDisconnected'));
    });

    const server = await device.gatt!.connect();

    // 查找包含目标特征的服务（蓝牙 API 返回小写 UUID）
    let notifyChar: BluetoothRemoteGATTCharacteristic | null = null;
    let writeChar: BluetoothRemoteGATTCharacteristic | null = null;

    const notifyShort = notifyUUID.replace('0x', '').toLowerCase();
    const writeShort = writeUUID.replace('0x', '').toLowerCase();

    // 获取所有服务并遍历查找特征值
    let services: BluetoothRemoteGATTService[] = [];

    // 先尝试通过 Service UUID 直接获取
    try {
      const targetService = await server.getPrimaryService(serviceFullUUID);
      services = [targetService];
    } catch {
      // 如果直接获取失败，获取所有服务
      services = await server.getPrimaryServices();
    }

    console.log(`[AIBMS] Found ${services.length} service(s):`, services.map(s => s.uuid));

    // 遍历所有服务的特征值
    for (const service of services) {
      try {
        const characteristics = await service.getCharacteristics();
        console.log(`[AIBMS] Service ${service.uuid} has ${characteristics.length} characteristic(s):`,
          characteristics.map(c => c.uuid));

        for (const char of characteristics) {
          const uuid = char.uuid.toLowerCase();
          if (!notifyChar && uuid.includes(notifyShort)) {
            notifyChar = char;
            console.log('[AIBMS] Found Notify characteristic:', char.uuid);
          }
          if (!writeChar && uuid.includes(writeShort)) {
            writeChar = char;
            console.log('[AIBMS] Found Write characteristic:', char.uuid);
          }
        }
        // 如果都找到了，提前退出
        if (notifyChar && writeChar) break;
      } catch (err) {
        console.warn(`[AIBMS] Failed to get characteristics for service ${service.uuid}:`, err);
      }
    }

    if (!notifyChar || !writeChar) {
      const missing = [];
      if (!notifyChar) missing.push(`Notify(${notifyUUID})`);
      if (!writeChar) missing.push(`Write(${writeUUID})`);
      throw new Error(i18n.t('bridge.characteristicNotFound', { missing: missing.join(', ') }));
    }

    this._bluetoothCharacteristic = writeChar;

    // 启用 Notify
    await notifyChar.startNotifications();
    notifyChar.addEventListener('characteristicvaluechanged', (event) => {
      const target = event.target as BluetoothRemoteGATTCharacteristic;
      if (target.value) {
        const data = new Uint8Array(target.value.buffer);
        this.notifyDataReceived(data);
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

    // 启动读取循环
    this._readingSerial = true;
    this.readSerialLoop();

    this._serialWriter = port.writable!.getWriter();

    this.setStatus('connected', i18n.t('bridge.connectedSerial', { baudRate }));
    toast.success(i18n.t('bridge.connectedSerial', { baudRate }));
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
          this.notifyDataReceived(value);
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
        // ignore
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

  private setStatus(status: ConnectionStatus, message?: string): void {
    this._status = status;
    this._statusCallbacks.forEach((cb) => cb(status, message));
  }

  private notifyDataReceived(data: Uint8Array): void {
    this._dataCallbacks.forEach((cb) => cb(data));
  }

  /** 将 Bridge API 暴露到 window 对象，供 iframe 调用 */
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

    // 挂载到 window，iframe 可通过 window.parent.AIBMSBridge 访问
    (window as any).AIBMSBridge = bridge;
  }
}

// 导出单例
export const webBridge = new WebBridgeManager();

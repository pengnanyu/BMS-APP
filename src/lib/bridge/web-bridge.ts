// ==================== Web Bridge 实现 ====================
// 统一封装 Web Bluetooth API 和 Web Serial API

import type {
  WebBridgeAPI,
  ConnectionState,
  BluetoothConnectParams,
  SerialConnectParams,
  DataReceived,
  StateChanged,
  BridgeCallback,
} from './types';

// ==================== 蓝牙模块 ====================

class BluetoothModule {
  private device: BluetoothDevice | null = null;
  private notifyCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private writeCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private state: ConnectionState = 'disconnected';
  private dataCallbacks = new Set<BridgeCallback<DataReceived>>();
  private stateCallbacks = new Set<BridgeCallback<StateChanged>>();

  // 固定 UUID（16-bit → 128-bit）
  private readonly SERVICE_UUID = '0000ff00-0000-1000-8000-00805f9b34fb';
  private readonly NOTIFY_UUID = '0000ff01-0000-1000-8000-00805f9b34fb';
  private readonly WRITE_UUID = '0000ff02-0000-1000-8000-00805f9b34fb';

  isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
  }

  getState(): ConnectionState {
    return this.state;
  }

  private setState(state: ConnectionState, error?: string) {
    this.state = state;
    this.stateCallbacks.forEach(cb => cb({ state, error }));
  }

  async connect(params: BluetoothConnectParams): Promise<boolean> {
    if (!this.isSupported()) {
      this.setState('error', '当前浏览器不支持 Web Bluetooth API');
      return false;
    }

    try {
      // ⚠️ requestDevice 必须在用户手势的同步上下文中调用
      // 不能有任何 await 在它之前执行
      this.device = await navigator.bluetooth!.requestDevice({
        filters: [{ namePrefix: params.filterName || 'DCSF+' }],
        optionalServices: [this.SERVICE_UUID],
      });

      // 用户选择设备后才进入 connecting 状态
      this.setState('connecting');

      // 监听断开
      this.device.addEventListener('gattserverdisconnected', () => {
        this.device = null;
        this.notifyCharacteristic = null;
        this.writeCharacteristic = null;
        this.setState('disconnected');
      });

      // 连接 GATT
      const server = await this.device.gatt!.connect();
      const service = await server.getPrimaryService(this.SERVICE_UUID);

      // 获取 Notify 特征
      this.notifyCharacteristic = await service.getCharacteristic(this.NOTIFY_UUID);
      await this.notifyCharacteristic.startNotifications();
      this.notifyCharacteristic.addEventListener(
        'characteristicvaluechanged',
        this.handleNotify.bind(this)
      );

      // 获取 Write 特征
      this.writeCharacteristic = await service.getCharacteristic(this.WRITE_UUID);

      this.setState('connected');
      return true;
    } catch (error: any) {
      // 用户取消选择设备
      if (error.name === 'NotFoundError') {
        this.setState('disconnected');
      } else {
        this.setState('error', error.message || '蓝牙连接失败');
      }
      return false;
    }
  }

  private handleNotify(event: Event) {
    const target = event.target as BluetoothRemoteGATTCharacteristic;
    if (target.value) {
      const data = new Uint8Array(target.value.buffer);
      this.dataCallbacks.forEach(cb => cb({ data, timestamp: Date.now() }));
    }
  }

  async write(data: Uint8Array): Promise<boolean> {
    if (!this.writeCharacteristic || this.state !== 'connected') {
      return false;
    }

    try {
      await this.writeCharacteristic.writeValue(data);
      return true;
    } catch (error: any) {
      console.error('[Bridge] Bluetooth write error:', error);
      return false;
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.device?.gatt?.connected) {
        this.device.gatt.disconnect();
      }
    } finally {
      this.device = null;
      this.notifyCharacteristic = null;
      this.writeCharacteristic = null;
      this.setState('disconnected');
    }
  }

  onData(callback: BridgeCallback<DataReceived>) {
    this.dataCallbacks.add(callback);
  }

  offData(callback: BridgeCallback<DataReceived>) {
    this.dataCallbacks.delete(callback);
  }

  onState(callback: BridgeCallback<StateChanged>) {
    this.stateCallbacks.add(callback);
  }

  offState(callback: BridgeCallback<StateChanged>) {
    this.stateCallbacks.delete(callback);
  }
}

// ==================== 串口模块 ====================

class SerialModule {
  private port: SerialPort | null = null;
  private reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  private writer: WritableStreamDefaultWriter<Uint8Array> | null = null;
  private state: ConnectionState = 'disconnected';
  private reading = false;
  private dataCallbacks = new Set<BridgeCallback<DataReceived>>();
  private stateCallbacks = new Set<BridgeCallback<StateChanged>>();

  isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'serial' in navigator;
  }

  getState(): ConnectionState {
    return this.state;
  }

  private setState(state: ConnectionState, error?: string) {
    this.state = state;
    this.stateCallbacks.forEach(cb => cb({ state, error }));
  }

  async connect(params: SerialConnectParams): Promise<boolean> {
    if (!this.isSupported()) {
      this.setState('error', '当前浏览器不支持 Web Serial API');
      return false;
    }

    try {
      // ⚠️ requestPort 必须在用户手势的同步上下文中调用
      // 不能有任何 await 在它之前执行
      this.port = await navigator.serial!.requestPort();

      // 用户选择端口后才进入 connecting 状态
      this.setState('connecting');

      await this.port.open({
        baudRate: params.baudRate,
        dataBits: 8,
        stopBits: 1,
        parity: params.parity,
      });

      // 获取 writer
      if (this.port.writable) {
        this.writer = this.port.writable.getWriter();
      }

      // 启动读取循环
      this.reading = true;
      this.startReading();

      this.setState('connected');
      return true;
    } catch (error: any) {
      // 用户取消选择端口
      if (error.name === 'NotFoundError') {
        this.setState('disconnected');
      } else {
        this.setState('error', error.message || '串口连接失败');
      }
      return false;
    }
  }

  private async startReading() {
    if (!this.port?.readable) return;

    this.reader = this.port.readable.getReader();

    try {
      while (this.reading) {
        const { value, done } = await this.reader.read();
        if (done) break;
        if (value) {
          this.dataCallbacks.forEach(cb => cb({ data: value, timestamp: Date.now() }));
        }
      }
    } catch (error) {
      console.error('[Bridge] Serial read error:', error);
    } finally {
      this.reader?.releaseLock();
      this.reader = null;
    }
  }

  async write(data: Uint8Array): Promise<boolean> {
    if (!this.writer || this.state !== 'connected') {
      return false;
    }

    try {
      await this.writer.write(data);
      return true;
    } catch (error: any) {
      console.error('[Bridge] Serial write error:', error);
      return false;
    }
  }

  async disconnect(): Promise<void> {
    this.reading = false;

    try {
      if (this.reader) {
        try { await this.reader.cancel(); } catch {}
        try { this.reader.releaseLock(); } catch {}
        this.reader = null;
      }

      if (this.writer) {
        try { this.writer.releaseLock(); } catch {}
        this.writer = null;
      }

      if (this.port) {
        try { await this.port.close(); } catch {}
        this.port = null;
      }
    } finally {
      // 无论清理是否成功，都要更新状态
      this.setState('disconnected');
    }
  }

  onData(callback: BridgeCallback<DataReceived>) {
    this.dataCallbacks.add(callback);
  }

  offData(callback: BridgeCallback<DataReceived>) {
    this.dataCallbacks.delete(callback);
  }

  onState(callback: BridgeCallback<StateChanged>) {
    this.stateCallbacks.add(callback);
  }

  offState(callback: BridgeCallback<StateChanged>) {
    this.stateCallbacks.delete(callback);
  }
}

// ==================== Web Bridge 统一 API ====================

class WebBridge implements WebBridgeAPI {
  private bluetooth = new BluetoothModule();
  private serial = new SerialModule();

  // 能力检测
  isBluetoothSupported(): boolean {
    return this.bluetooth.isSupported();
  }

  isSerialSupported(): boolean {
    return this.serial.isSupported();
  }

  // 蓝牙 API
  async bluetoothConnect(params: BluetoothConnectParams): Promise<boolean> {
    return this.bluetooth.connect(params);
  }

  async bluetoothDisconnect(): Promise<void> {
    return this.bluetooth.disconnect();
  }

  async bluetoothWrite(data: Uint8Array): Promise<boolean> {
    return this.bluetooth.write(data);
  }

  onBluetoothData(callback: BridgeCallback<DataReceived>) {
    this.bluetooth.onData(callback);
  }

  offBluetoothData(callback: BridgeCallback<DataReceived>) {
    this.bluetooth.offData(callback);
  }

  onBluetoothState(callback: BridgeCallback<StateChanged>) {
    this.bluetooth.onState(callback);
  }

  offBluetoothState(callback: BridgeCallback<StateChanged>) {
    this.bluetooth.offState(callback);
  }

  // 串口 API
  async serialConnect(params: SerialConnectParams): Promise<boolean> {
    return this.serial.connect(params);
  }

  async serialDisconnect(): Promise<void> {
    return this.serial.disconnect();
  }

  async serialWrite(data: Uint8Array): Promise<boolean> {
    return this.serial.write(data);
  }

  onSerialData(callback: BridgeCallback<DataReceived>) {
    this.serial.onData(callback);
  }

  offSerialData(callback: BridgeCallback<DataReceived>) {
    this.serial.offData(callback);
  }

  onSerialState(callback: BridgeCallback<StateChanged>) {
    this.serial.onState(callback);
  }

  offSerialState(callback: BridgeCallback<StateChanged>) {
    this.serial.offState(callback);
  }
}

// 全局单例
export const webBridge = new WebBridge();

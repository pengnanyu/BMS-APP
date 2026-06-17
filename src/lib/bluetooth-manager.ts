// ==================== 蓝牙连接管理器 ====================

import type { ConnectionConfig, ConnectionState } from '@/types/bms';

export class BluetoothManager {
  private device: BluetoothDevice | null = null;
  private characteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private state: ConnectionState = 'disconnected';
  private onDataCallback: ((data: Uint8Array) => void) | null = null;
  private onStateChange: ((state: ConnectionState) => void) | null = null;

  constructor() {}

  /** 检查浏览器是否支持 Web Bluetooth API */
  static isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
  }

  /** 获取当前连接状态 */
  getState(): ConnectionState {
    return this.state;
  }

  /** 设置状态变化回调 */
  setOnStateChange(callback: (state: ConnectionState) => void) {
    this.onStateChange = callback;
  }

  /** 设置数据接收回调 */
  setOnData(callback: (data: Uint8Array) => void) {
    this.onDataCallback = callback;
  }

  private setState(newState: ConnectionState) {
    this.state = newState;
    this.onStateChange?.(newState);
  }

  /** 请求蓝牙设备并连接 */
  async connect(config: ConnectionConfig): Promise<boolean> {
    if (!BluetoothManager.isSupported()) {
      console.error('Web Bluetooth API is not supported');
      this.setState('error');
      return false;
    }

    try {
      this.setState('connecting');

      const serviceUUID = config.bluetoothServiceUUID || '0000fff0-0000-1000-8000-00805f9b34fb';
      const characteristicUUID = config.bluetoothCharacteristicUUID || '0000fff1-0000-1000-8000-00805f9b34fb';

      this.device = await navigator.bluetooth!.requestDevice({
        filters: [{ services: [serviceUUID] }],
        optionalServices: [serviceUUID],
      });

      this.device.addEventListener('gattserverdisconnected', () => {
        this.setState('disconnected');
        this.device = null;
        this.characteristic = null;
      });

      const server = await this.device.gatt!.connect();
      const service = await server.getPrimaryService(serviceUUID);
      this.characteristic = await service.getCharacteristic(characteristicUUID);

      // 启用通知
      await this.characteristic.startNotifications();
      this.characteristic.addEventListener(
        'characteristicvaluechanged',
        this.handleCharacteristicChange.bind(this)
      );

      this.setState('connected');
      return true;
    } catch (error) {
      console.error('Bluetooth connection failed:', error);
      this.setState('error');
      return false;
    }
  }

  private handleCharacteristicChange(event: Event) {
    const target = event.target as BluetoothRemoteGATTCharacteristic;
    if (target.value) {
      const data = new Uint8Array(target.value.buffer);
      this.onDataCallback?.(data);
    }
  }

  /** 发送数据到蓝牙设备 */
  async writeData(data: Uint8Array): Promise<boolean> {
    if (!this.characteristic || this.state !== 'connected') {
      return false;
    }

    try {
      await this.characteristic.writeValue(data);
      return true;
    } catch (error) {
      console.error('Bluetooth write failed:', error);
      return false;
    }
  }

  /** 断开蓝牙连接 */
  async disconnect(): Promise<void> {
    if (this.device?.gatt?.connected) {
      this.device.gatt.disconnect();
    }
    this.device = null;
    this.characteristic = null;
    this.setState('disconnected');
  }
}

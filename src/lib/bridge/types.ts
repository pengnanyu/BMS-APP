// ==================== Web Bridge 类型定义 ====================

/** 连接状态 */
export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

/** 连接类型 */
export type ConnectionType = 'bluetooth' | 'serial';

/** 蓝牙配置 */
export interface BluetoothConfig {
  filterName: string; // 设备名称过滤（默认 "DCSF+"）
  serviceUUID: string; // 16-bit UUID → 128-bit
  notifyCharacteristicUUID: string; // 固定 0xFF01
  writeCharacteristicUUID: string; // 固定 0xFF02
}

/** 串口配置 */
export interface SerialConfig {
  baudRate: number; // 波特率
  dataBits: number; // 数据位（固定 8）
  stopBits: number; // 停止位（固定 1）
  parity: 'none' | 'odd' | 'even'; // 校验位
}

/** 蓝牙连接参数 */
export interface BluetoothConnectParams {
  filterName: string;
}

/** 串口连接参数 */
export interface SerialConnectParams {
  baudRate: number;
  parity: 'none' | 'odd' | 'even';
}

/** 写入数据请求 */
export interface WriteDataRequest {
  data: Uint8Array;
}

/** 接收数据 */
export interface DataReceived {
  data: Uint8Array;
  timestamp: number;
}

/** 连接状态变化 */
export interface StateChanged {
  state: ConnectionState;
  error?: string;
}

/** Bridge 回调 */
export type BridgeCallback<T> = (data: T) => void;

/** Web Bridge API 接口 */
export interface WebBridgeAPI {
  // 蓝牙
  bluetoothConnect(params: BluetoothConnectParams): Promise<boolean>;
  bluetoothDisconnect(): Promise<void>;
  bluetoothWrite(data: Uint8Array): Promise<boolean>;
  onBluetoothData(callback: BridgeCallback<DataReceived>): void;
  onBluetoothState(callback: BridgeCallback<StateChanged>): void;
  offBluetoothData(callback: BridgeCallback<DataReceived>): void;
  offBluetoothState(callback: BridgeCallback<StateChanged>): void;

  // 串口
  serialConnect(params: SerialConnectParams): Promise<boolean>;
  serialDisconnect(): Promise<void>;
  serialWrite(data: Uint8Array): Promise<boolean>;
  onSerialData(callback: BridgeCallback<DataReceived>): void;
  onSerialState(callback: BridgeCallback<StateChanged>): void;
  offSerialData(callback: BridgeCallback<DataReceived>): void;
  offSerialState(callback: BridgeCallback<StateChanged>): void;

  // 能力检测
  isBluetoothSupported(): boolean;
  isSerialSupported(): boolean;
}

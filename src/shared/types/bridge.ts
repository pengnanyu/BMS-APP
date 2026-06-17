// ==================== 连接类型定义 ====================

/** 连接方式 */
export type ConnectionType = 'bluetooth' | 'serial';

/** 连接状态 */
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

/** 蓝牙配置 */
export interface BluetoothConfig {
  /** 设备名称过滤前缀 */
  nameFilter: string;
  /** Service UUID (16-bit) - 固定，不展示给用户 */
  serviceUUID: string;
  /** Notify 特征 UUID (16-bit) */
  notifyUUID: string;
  /** Write 特征 UUID (16-bit) */
  writeUUID: string;
}

/** 串口配置 */
export interface SerialConfig {
  /** 波特率 */
  baudRate: number;
  /** 数据位宽 */
  dataBits: 8;
  /** 停止位 */
  stopBits: 1;
  /** 校验位: none | odd | even */
  parity: 'none' | 'odd' | 'even';
}

/** 连接配置 */
export interface ConnectionConfig {
  type: ConnectionType;
  bluetooth: BluetoothConfig;
  serial: SerialConfig;
}

// ==================== Web Bridge API 接口定义 ====================

/** 数据接收回调 */
export type DataReceiveCallback = (data: Uint8Array) => void;

/** 连接状态变化回调 */
export type ConnectionStatusCallback = (status: ConnectionStatus, message?: string) => void;

/** Web Bridge 接口 - 容器提供给 UI 的统一 API */
export interface WebBridgeAPI {
  /**
   * 连接设备（蓝牙或串口）
   * @returns Promise<boolean> 连接是否成功
   */
  connect(): Promise<boolean>;

  /**
   * 断开连接
   */
  disconnect(): Promise<void>;

  /**
   * 获取当前连接状态
   */
  getConnectionStatus(): ConnectionStatus;

  /**
   * 发送数据到设备
   * @param data 要发送的字节数据
   * @returns Promise<boolean> 发送是否成功
   */
  sendData(data: Uint8Array): Promise<boolean>;

  /**
   * 注册数据接收回调
   * @param callback 接收数据的回调函数
   * @returns 取消注册的函数
   */
  onDataReceived(callback: DataReceiveCallback): () => void;

  /**
   * 注册连接状态变化回调
   * @param callback 状态变化的回调函数
   * @returns 取消注册的函数
   */
  onConnectionStatusChange(callback: ConnectionStatusCallback): () => void;

  /**
   * 获取当前连接配置
   */
  getConfig(): ConnectionConfig;

  /**
   * 更新连接配置
   */
  updateConfig(config: Partial<ConnectionConfig>): void;

  /**
   * 获取容器平台信息
   */
  getPlatformInfo(): PlatformInfo;
}

/** 平台信息 */
export interface PlatformInfo {
  /** 平台类型 */
  platform: 'web' | 'android' | 'ios' | 'harmony' | 'miniprogram';
  /** 容器版本 */
  version: string;
  /** 是否支持蓝牙 */
  bluetoothSupported: boolean;
  /** 是否支持串口 */
  serialSupported: boolean;
}

// ==================== 默认配置 ====================

/** 默认蓝牙配置 */
export const DEFAULT_BLUETOOTH_CONFIG: BluetoothConfig = {
  nameFilter: 'DCSF+',
  serviceUUID: '0xFF00',
  notifyUUID: '0xFF01',
  writeUUID: '0xFF02',
};

/** 默认串口配置 */
export const DEFAULT_SERIAL_CONFIG: SerialConfig = {
  baudRate: 9600,
  dataBits: 8,
  stopBits: 1,
  parity: 'none',
};

/** 可用波特率选项 */
export const BAUD_RATE_OPTIONS = [1200, 2400, 4800, 9600, 19200, 38400, 57600, 115200] as const;

/** 校验位选项 */
export const PARITY_OPTIONS = [
  { value: 'none' as const, label: '无' },
  { value: 'odd' as const, label: '奇校验' },
  { value: 'even' as const, label: '偶校验' },
] as const;

/** 连接方式选项 */
export const CONNECTION_TYPE_OPTIONS = [
  { value: 'bluetooth' as const, label: '蓝牙' },
  { value: 'serial' as const, label: '串口' },
] as const;

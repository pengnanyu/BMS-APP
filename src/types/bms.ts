// ==================== BMS 核心数据类型 ====================

/** 单体电芯数据 */
export interface CellData {
  id: number;
  voltage: number; // mV
  temperature: number; // °C
  internalResistance: number; // mΩ
}

/** 电池包状态 */
export interface BatteryPackStatus {
  totalVoltage: number; // V
  current: number; // A (充电正，放电负)
  soc: number; // % 0-100
  soh: number; // % 0-100
  power: number; // W
  capacity: number; // Ah
  remainingCapacity: number; // Ah
  cycleCount: number;
  totalEnergy: number; // kWh
  maxCellVoltage: number; // mV
  minCellVoltage: number; // mV
  avgCellVoltage: number; // mV
  maxCellTemp: number; // °C
  minCellTemp: number; // °C
  avgCellTemp: number; // °C
  cells: CellData[];
  timestamp: number;
}

/** 告警级别 */
export type AlarmLevel = 'info' | 'warning' | 'critical';

/** 告警项 */
export interface Alarm {
  id: string;
  level: AlarmLevel;
  type: string;
  message: string;
  value?: number;
  threshold?: number;
  timestamp: number;
  acknowledged: boolean;
}

/** GPS 定位数据 */
export interface GPSData {
  latitude: number;
  longitude: number;
  altitude: number; // m
  speed: number; // km/h
  heading: number; // degrees
  accuracy: number; // m
  timestamp: number;
}

/** GPS 轨迹点 */
export interface GPSTrackPoint extends GPSData {
  id: string;
}

/** 连接类型 */
export type ConnectionType = 'bluetooth' | 'serial' | 'mqtt';

/** 连接状态 */
export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

/** 连接配置 */
export interface ConnectionConfig {
  type: ConnectionType;
  // Bluetooth
  bluetoothDeviceId?: string;
  bluetoothServiceUUID?: string;
  bluetoothCharacteristicUUID?: string;
  // Serial
  serialPort?: SerialPort;
  serialBaudRate?: number;
  // MQTT
  mqttBrokerUrl?: string;
  mqttTopic?: string;
  mqttClientId?: string;
  mqttUsername?: string;
  mqttPassword?: string;
}

/** 设备信息 */
export interface DeviceInfo {
  manufacturer: string;
  model: string;
  firmwareVersion: string;
  hardwareVersion: string;
  serialNumber: string;
  nominalCapacity: number; // Ah
  nominalVoltage: number; // V
  cellCount: number;
}

/** 历史数据记录 */
export interface HistoryRecord {
  timestamp: number;
  voltage: number;
  current: number;
  soc: number;
  power: number;
  maxCellTemp: number;
  minCellTemp: number;
}

/** 串口类型声明（Web Serial API） */
export interface SerialPort {
  open(options: { baudRate: number }): Promise<void>;
  close(): Promise<void>;
  readable: ReadableStream<Uint8Array> | null;
  writable: WritableStream<Uint8Array> | null;
  getInfo(): { usbVendorId?: number; usbProductId?: number };
}

declare global {
  interface Navigator {
    serial?: {
      requestPort(): Promise<SerialPort>;
      getPorts(): Promise<SerialPort[]>;
    };
    bluetooth?: {
      requestDevice(options: {
        filters: { services: string[] }[];
        optionalServices?: string[];
      }): Promise<{
        gatt?: {
          connect(): Promise<{
            getPrimaryService(uuid: string): Promise<{
              getCharacteristic(uuid: string): Promise<{
                startNotifications(): Promise<void>;
                addEventListener(event: string, callback: (e: { target?: { value?: DataView } }) => void): void;
                readValue(): Promise<DataView>;
                writeValue(value: ArrayBuffer): Promise<void>;
              }>;
            }>;
          }>;
        };
        name?: string;
        id: string;
      }>;
    };
  }
}

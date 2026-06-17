export interface CellData {
  id: number;
  voltage: number;
  temperature: number;
  internalResistance: number;
}

export interface BatteryPackStatus {
  totalVoltage: number;
  current: number;
  soc: number;
  soh: number;
  power: number;
  capacity: number;
  remainingCapacity: number;
  cycleCount: number;
  totalEnergy: number;
  maxCellVoltage: number;
  minCellVoltage: number;
  avgCellVoltage: number;
  maxCellTemp: number;
  minCellTemp: number;
  avgCellTemp: number;
  cells: CellData[];
  timestamp: number;
}

export type AlarmLevel = 'info' | 'warning' | 'critical';

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

export interface GPSData {
  latitude: number;
  longitude: number;
  altitude: number;
  speed: number;
  heading: number;
  accuracy: number;
  timestamp: number;
}

export interface GPSTrackPoint extends GPSData {
  id: string;
}

export type ConnectionType = 'bluetooth' | 'serial' | 'mqtt';

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface ConnectionConfig {
  type: ConnectionType;
  bluetoothDeviceId?: string;
  bluetoothServiceUUID?: string;
  bluetoothCharacteristicUUID?: string;
  serialPort?: SerialPort;
  serialBaudRate?: number;
  mqttBrokerUrl?: string;
  mqttTopic?: string;
  mqttClientId?: string;
  mqttUsername?: string;
  mqttPassword?: string;
}

export interface DeviceInfo {
  manufacturer: string;
  model: string;
  firmwareVersion: string;
  hardwareVersion: string;
  serialNumber: string;
  nominalCapacity: number;
  nominalVoltage: number;
  cellCount: number;
}

export interface HistoryRecord {
  timestamp: number;
  voltage: number;
  current: number;
  soc: number;
  power: number;
  maxCellTemp: number;
  minCellTemp: number;
}

export type ParamInputType = 'number' | 'select' | 'text';

export interface ParamOption {
  label: string;
  value: number | string;
}

export interface ParamItem {
  key: string;
  label: string;
  value: number | string;
  unit: string;
  min?: number;
  max?: number;
  step?: number;
  type: ParamInputType;
  options?: ParamOption[];
  group: string;
}

export interface PresetConfig {
  name: string;
  code: string;
  description: string;
  params: Record<string, number | string>;
}

export interface AlarmInfo {
  id: string;
  level: 'info' | 'warning' | 'critical';
  code: string;
  message: string;
  timestamp: number;
}

export interface ChartPoint {
  time: string;
  voltage: number;
  current: number;
}

export interface DeviceInfoSimple {
  cellCount: number;
  voltageDiff: number;
  avgCellVoltage: number;
  nominalCapacity: number;
}

export type TabKey = 'battery' | 'config' | 'alarm' | 'command';

export type LayoutMode = 'mobile' | 'tablet' | 'desktop';

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

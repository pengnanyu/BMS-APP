// ==================== BMS Store（React Context 状态管理）====================

import { createContext, useContext, useReducer, useCallback, useRef, useEffect } from 'react';
import type {
  BatteryPackStatus,
  Alarm,
  GPSData,
  GPSTrackPoint,
  ConnectionState,
  ConnectionType,
  DeviceInfo,
  HistoryRecord,
} from '@/types/bms';
import { generateMockBMSData, generateMockGPSData } from '@/lib/bms-protocol';
import { BluetoothManager } from '@/lib/bluetooth-manager';
import { SerialManager } from '@/lib/serial-manager';
import { MQTTManager } from '@/lib/mqtt-manager';
import { GPSManager } from '@/lib/gps-manager';

// ==================== State ====================

interface BMSState {
  // 电池数据
  batteryData: BatteryPackStatus | null;
  deviceInfo: DeviceInfo | null;
  historyData: HistoryRecord[];

  // 告警
  alarms: Alarm[];
  unacknowledgedCount: number;

  // GPS
  gpsData: GPSData | null;
  gpsTrack: GPSTrackPoint[];
  gpsEnabled: boolean;

  // 连接状态
  bluetoothState: ConnectionState;
  serialState: ConnectionState;
  mqttState: ConnectionState;
  activeConnection: ConnectionType | null;

  // UI 状态
  cellCount: number;
  isDemoMode: boolean;
  lastUpdateTime: number;
}

const initialState: BMSState = {
  batteryData: null,
  deviceInfo: null,
  historyData: [],
  alarms: [],
  unacknowledgedCount: 0,
  gpsData: null,
  gpsTrack: [],
  gpsEnabled: false,
  bluetoothState: 'disconnected',
  serialState: 'disconnected',
  mqttState: 'disconnected',
  activeConnection: null,
  cellCount: 16,
  isDemoMode: false,
  lastUpdateTime: 0,
};

// ==================== Actions ====================

type BMSAction =
  | { type: 'SET_BATTERY_DATA'; payload: BatteryPackStatus }
  | { type: 'SET_DEVICE_INFO'; payload: DeviceInfo }
  | { type: 'ADD_ALARM'; payload: Alarm }
  | { type: 'ACKNOWLEDGE_ALARM'; payload: string }
  | { type: 'CLEAR_ALARMS' }
  | { type: 'SET_GPS_DATA'; payload: GPSData }
  | { type: 'ADD_GPS_TRACK'; payload: GPSTrackPoint }
  | { type: 'SET_GPS_ENABLED'; payload: boolean }
  | { type: 'CLEAR_GPS_TRACK' }
  | { type: 'SET_BT_STATE'; payload: ConnectionState }
  | { type: 'SET_SERIAL_STATE'; payload: ConnectionState }
  | { type: 'SET_MQTT_STATE'; payload: ConnectionState }
  | { type: 'SET_ACTIVE_CONNECTION'; payload: ConnectionType | null }
  | { type: 'SET_CELL_COUNT'; payload: number }
  | { type: 'SET_DEMO_MODE'; payload: boolean }
  | { type: 'ADD_HISTORY_RECORD'; payload: HistoryRecord }
  | { type: 'CLEAR_HISTORY' };

function bmsReducer(state: BMSState, action: BMSAction): BMSState {
  switch (action.type) {
    case 'SET_BATTERY_DATA': {
      const record: HistoryRecord = {
        timestamp: action.payload.timestamp,
        voltage: action.payload.totalVoltage,
        current: action.payload.current,
        soc: action.payload.soc,
        power: action.payload.power,
        maxCellTemp: action.payload.maxCellTemp,
        minCellTemp: action.payload.minCellTemp,
      };
      const newHistory = [...state.historyData, record].slice(-500);

      // 自动生成告警
      const newAlarms = [...state.alarms];
      if (action.payload.maxCellTemp > 45) {
        newAlarms.push({
          id: `alarm-${Date.now()}-temp`,
          level: action.payload.maxCellTemp > 55 ? 'critical' : 'warning',
          type: 'OVER_TEMPERATURE',
          message: `电芯温度过高: ${action.payload.maxCellTemp}°C`,
          value: action.payload.maxCellTemp,
          threshold: 45,
          timestamp: Date.now(),
          acknowledged: false,
        });
      }
      if (action.payload.soc < 10) {
        newAlarms.push({
          id: `alarm-${Date.now()}-soc`,
          level: action.payload.soc < 5 ? 'critical' : 'warning',
          type: 'LOW_SOC',
          message: `电量过低: ${action.payload.soc}%`,
          value: action.payload.soc,
          threshold: 10,
          timestamp: Date.now(),
          acknowledged: false,
        });
      }

      return {
        ...state,
        batteryData: action.payload,
        historyData: newHistory,
        alarms: newAlarms.slice(-100),
        unacknowledgedCount: newAlarms.filter(a => !a.acknowledged).length,
        lastUpdateTime: Date.now(),
      };
    }

    case 'SET_DEVICE_INFO':
      return { ...state, deviceInfo: action.payload, cellCount: action.payload.cellCount };

    case 'ADD_ALARM':
      return {
        ...state,
        alarms: [...state.alarms, action.payload].slice(-100),
        unacknowledgedCount: state.unacknowledgedCount + 1,
      };

    case 'ACKNOWLEDGE_ALARM':
      return {
        ...state,
        alarms: state.alarms.map(a =>
          a.id === action.payload ? { ...a, acknowledged: true } : a
        ),
        unacknowledgedCount: Math.max(0, state.unacknowledgedCount - 1),
      };

    case 'CLEAR_ALARMS':
      return { ...state, alarms: [], unacknowledgedCount: 0 };

    case 'SET_GPS_DATA':
      return { ...state, gpsData: action.payload };

    case 'ADD_GPS_TRACK':
      return {
        ...state,
        gpsTrack: [...state.gpsTrack, action.payload].slice(-1000),
      };

    case 'SET_GPS_ENABLED':
      return { ...state, gpsEnabled: action.payload };

    case 'CLEAR_GPS_TRACK':
      return { ...state, gpsTrack: [] };

    case 'SET_BT_STATE':
      return { ...state, bluetoothState: action.payload };

    case 'SET_SERIAL_STATE':
      return { ...state, serialState: action.payload };

    case 'SET_MQTT_STATE':
      return { ...state, mqttState: action.payload };

    case 'SET_ACTIVE_CONNECTION':
      return { ...state, activeConnection: action.payload };

    case 'SET_CELL_COUNT':
      return { ...state, cellCount: action.payload };

    case 'SET_DEMO_MODE':
      return { ...state, isDemoMode: action.payload };

    case 'ADD_HISTORY_RECORD':
      return {
        ...state,
        historyData: [...state.historyData, action.payload].slice(-500),
      };

    case 'CLEAR_HISTORY':
      return { ...state, historyData: [] };

    default:
      return state;
  }
}

// ==================== Context ====================

interface BMSContextValue extends BMSState {
  dispatch: React.Dispatch<BMSAction>;
  // 连接管理器引用
  bluetoothRef: React.RefObject<BluetoothManager>;
  serialRef: React.RefObject<SerialManager>;
  mqttRef: React.RefObject<MQTTManager>;
  gpsRef: React.RefObject<GPSManager>;
  // 便捷方法
  connectBluetooth: () => Promise<void>;
  connectSerial: () => Promise<void>;
  disconnectAll: () => Promise<void>;
  startDemoMode: () => void;
  stopDemoMode: () => void;
}

const BMSContext = createContext<BMSContextValue | null>(null);

export function useBMS() {
  const ctx = useContext(BMSContext);
  if (!ctx) throw new Error('useBMS must be used within BMSProvider');
  return ctx;
}

// ==================== Provider ====================

export function BMSProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(bmsReducer, initialState);

  const bluetoothRef = useRef(new BluetoothManager());
  const serialRef = useRef(new SerialManager());
  const mqttRef = useRef(new MQTTManager());
  const gpsRef = useRef(new GPSManager());
  const demoTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 处理接收到的 BMS 数据
  const handleBMSData = useCallback((data: Uint8Array) => {
    // 实际项目中在这里解析协议帧
    // 目前直接生成模拟数据
    const bmsData = generateMockBMSData(state.cellCount);
    dispatch({ type: 'SET_BATTERY_DATA', payload: bmsData });
  }, [state.cellCount]);

  // 蓝牙连接
  const connectBluetooth = useCallback(async () => {
    const bt = bluetoothRef.current;
    bt.setOnStateChange(s => dispatch({ type: 'SET_BT_STATE', payload: s }));
    bt.setOnData(handleBMSData);

    const ok = await bt.connect({
      type: 'bluetooth',
      bluetoothServiceUUID: '0000fff0-0000-1000-8000-00805f9b34fb',
      bluetoothCharacteristicUUID: '0000fff1-0000-1000-8000-00805f9b34fb',
    });

    if (ok) {
      dispatch({ type: 'SET_ACTIVE_CONNECTION', payload: 'bluetooth' });
    }
  }, [handleBMSData]);

  // 串口连接
  const connectSerial = useCallback(async () => {
    const serial = serialRef.current;
    serial.setOnStateChange(s => dispatch({ type: 'SET_SERIAL_STATE', payload: s }));
    serial.setOnData(handleBMSData);

    const ok = await serial.connect(9600);

    if (ok) {
      dispatch({ type: 'SET_ACTIVE_CONNECTION', payload: 'serial' });
    }
  }, [handleBMSData]);

  // 断开所有连接
  const disconnectAll = useCallback(async () => {
    await bluetoothRef.current.disconnect();
    await serialRef.current.disconnect();
    await mqttRef.current.disconnect();
    gpsRef.current.stopWatching();
    dispatch({ type: 'SET_ACTIVE_CONNECTION', payload: null });
    dispatch({ type: 'SET_GPS_ENABLED', payload: false });
  }, []);

  // Demo 模式
  const startDemoMode = useCallback(() => {
    if (demoTimerRef.current) return;
    dispatch({ type: 'SET_DEMO_MODE', payload: true });

    // 立即生成一次数据
    const bmsData = generateMockBMSData(state.cellCount);
    dispatch({ type: 'SET_BATTERY_DATA', payload: bmsData });

    demoTimerRef.current = setInterval(() => {
      const bmsData = generateMockBMSData(state.cellCount);
      dispatch({ type: 'SET_BATTERY_DATA', payload: bmsData });

      const gpsData = generateMockGPSData();
      dispatch({ type: 'SET_GPS_DATA', payload: gpsData });
      dispatch({
        type: 'ADD_GPS_TRACK',
        payload: { ...gpsData, id: `track-${Date.now()}` },
      });
    }, 2000);
  }, [state.cellCount]);

  const stopDemoMode = useCallback(() => {
    if (demoTimerRef.current) {
      clearInterval(demoTimerRef.current);
      demoTimerRef.current = null;
    }
    dispatch({ type: 'SET_DEMO_MODE', payload: false });
  }, []);

  // 清理
  useEffect(() => {
    return () => {
      if (demoTimerRef.current) clearInterval(demoTimerRef.current);
      bluetoothRef.current.disconnect();
      serialRef.current.disconnect();
      mqttRef.current.disconnect();
      gpsRef.current.stopWatching();
    };
  }, []);

  const value: BMSContextValue = {
    ...state,
    dispatch,
    bluetoothRef,
    serialRef,
    mqttRef,
    gpsRef,
    connectBluetooth,
    connectSerial,
    disconnectAll,
    startDemoMode,
    stopDemoMode,
  };

  return <BMSContext.Provider value={value}>{children}</BMSContext.Provider>;
}

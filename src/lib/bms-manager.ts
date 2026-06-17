import { webBridge } from '@/lib/bridge';
import type { ConnectionState } from '@/lib/bridge';
import type { ParamItem, DeviceInfoSimple, AlarmInfo, ChartPoint } from '@/types/bms';
import { getParamDefinitions } from '@/lib/param-definitions';
import { isAlarmDefined } from '@/lib/alarm-definitions';

export interface CellInfo {
  id: number;
  voltage: number;
  temperature: number;
}

export interface BatteryData {
  totalVoltage: number;
  current: number;
  soc: number;
  soh: number;
  power: number;
  capacity: number;
  remainingCapacity: number;
  cycleCount: number;
  maxCellVoltage: number;
  minCellVoltage: number;
  avgCellVoltage: number;
  maxCellTemp: number;
  minCellTemp: number;
  cells: CellInfo[];
  timestamp: number;
}

type DataCallback = (data: BatteryData) => void;
type AlarmCallback = (alarms: AlarmInfo[]) => void;
type ChartCallback = (points: ChartPoint[]) => void;
type StateCallback = (state: ConnectionState) => void;
type ParamCallback = (params: ParamItem[]) => void;

function generateMockBatteryData(cellCount: number = 16): BatteryData {
  const cells: CellInfo[] = [];
  const baseVoltage = 3300 + Math.random() * 200;

  for (let i = 0; i < cellCount; i++) {
    cells.push({
      id: i + 1,
      voltage: Math.round(baseVoltage + (Math.random() - 0.5) * 80),
      temperature: Math.round((25 + (Math.random() - 0.5) * 10) * 10) / 10,
    });
  }

  const voltages = cells.map(c => c.voltage);
  const temps = cells.map(c => c.temperature);
  const totalVoltage = voltages.reduce((a, b) => a + b, 0) / 1000;
  const current = Math.round((Math.random() - 0.3) * 100 * 10) / 10;
  const soc = Math.round(50 + Math.random() * 45);

  return {
    totalVoltage: Math.round(totalVoltage * 100) / 100,
    current,
    soc,
    soh: Math.round(90 + Math.random() * 10),
    power: Math.round(totalVoltage * current * 10) / 10,
    capacity: 100,
    remainingCapacity: Math.round(100 * soc / 100 * 10) / 10,
    cycleCount: Math.floor(Math.random() * 500),
    maxCellVoltage: Math.max(...voltages),
    minCellVoltage: Math.min(...voltages),
    avgCellVoltage: Math.round(voltages.reduce((a, b) => a + b, 0) / voltages.length),
    maxCellTemp: Math.max(...temps),
    minCellTemp: Math.min(...temps),
    cells,
    timestamp: Date.now(),
  };
}

class BMSDataManager {
  private batteryData: BatteryData | null = null;
  private alarms: AlarmInfo[] = [];
  private chartPoints: ChartPoint[] = [];
  private paramItems: ParamItem[] = [];
  private cellCount = 16;
  private refreshTimer: ReturnType<typeof setInterval> | null = null;
  private isDemoMode = false;

  private dataCallbacks = new Set<DataCallback>();
  private alarmCallbacks = new Set<AlarmCallback>();
  private chartCallbacks = new Set<ChartCallback>();
  private stateCallbacks = new Set<StateCallback>();
  private paramCallbacks = new Set<ParamCallback>();

  getBatteryData(): BatteryData | null { return this.batteryData; }
  getAlarms(): AlarmInfo[] { return [...this.alarms]; }
  getChartPoints(): ChartPoint[] { return [...this.chartPoints]; }
  getParamItems(): ParamItem[] { return [...this.paramItems]; }

  onData(cb: DataCallback) { this.dataCallbacks.add(cb); }
  offData(cb: DataCallback) { this.dataCallbacks.delete(cb); }
  onAlarms(cb: AlarmCallback) { this.alarmCallbacks.add(cb); }
  offAlarms(cb: AlarmCallback) { this.alarmCallbacks.delete(cb); }
  onChart(cb: ChartCallback) { this.chartCallbacks.add(cb); }
  offChart(cb: ChartCallback) { this.chartCallbacks.delete(cb); }
  onState(cb: StateCallback) { this.stateCallbacks.add(cb); }
  offState(cb: StateCallback) { this.stateCallbacks.delete(cb); }
  onParams(cb: ParamCallback) { this.paramCallbacks.add(cb); }
  offParams(cb: ParamCallback) { this.paramCallbacks.delete(cb); }

  startRefresh() {
    if (this.refreshTimer) return;
    this.refreshTimer = setInterval(() => this.refresh(), 1000);
  }

  stopRefresh() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  private refresh() {
    const data = generateMockBatteryData(this.cellCount);
    this.batteryData = data;

    const time = new Date().toLocaleTimeString('zh-CN', { hour12: false });
    this.chartPoints.push({
      time,
      voltage: data.totalVoltage,
      current: data.current,
    });
    if (this.chartPoints.length > 120) this.chartPoints.shift();

    this.checkAlarms(data);

    this.dataCallbacks.forEach(cb => cb(data));
    this.chartCallbacks.forEach(cb => cb(this.chartPoints));
  }

  private checkAlarms(data: BatteryData) {
    if (data.maxCellTemp > 45) {
      this.addAlarm({
        id: `temp-${Date.now()}`,
        level: data.maxCellTemp > 55 ? 'critical' : 'warning',
        code: 'OVER_TEMP',
        message: `电芯温度过高: ${data.maxCellTemp}°C`,
        timestamp: Date.now(),
      });
    }
    if (data.soc < 10) {
      this.addAlarm({
        id: `soc-${Date.now()}`,
        level: data.soc < 5 ? 'critical' : 'warning',
        code: 'LOW_SOC',
        message: `电量过低: ${data.soc}%`,
        timestamp: Date.now(),
      });
    }
    const voltageDiff = data.maxCellVoltage - data.minCellVoltage;
    if (voltageDiff > 100) {
      this.addAlarm({
        id: `vdiff-${Date.now()}`,
        level: voltageDiff > 200 ? 'critical' : 'warning',
        code: 'VOLTAGE_DIFF',
        message: `电芯压差过大: ${voltageDiff}mV`,
        timestamp: Date.now(),
      });
    }
  }

  private addAlarm(alarm: AlarmInfo) {
    if (!isAlarmDefined(alarm.code)) return;
    this.alarms.push(alarm);
    if (this.alarms.length > 100) this.alarms.shift();
    this.alarmCallbacks.forEach(cb => cb(this.alarms));
  }

  clearAlarms() {
    this.alarms = [];
    this.alarmCallbacks.forEach(cb => cb([]));
  }

  clearChart() {
    this.chartPoints = [];
    this.chartCallbacks.forEach(cb => cb([]));
  }

  async readParams(): Promise<ParamItem[]> {
    if (this.isDemoMode) {
      this.paramItems = getParamDefinitions().map(p => ({
        ...p,
        value: p.type === 'number' ? (p.value as number) + Math.round((Math.random() - 0.5) * 10) / 100 : p.value,
      }));
    } else {
      this.paramItems = getParamDefinitions();
    }
    this.paramCallbacks.forEach(cb => cb(this.paramItems));
    return [...this.paramItems];
  }

  async writeParams(params: ParamItem[]): Promise<boolean> {
    this.paramItems = params.map(p => ({ ...p }));
    this.paramCallbacks.forEach(cb => cb(this.paramItems));
    return true;
  }

  getDeviceInfo(): DeviceInfoSimple {
    if (this.batteryData) {
      return {
        cellCount: this.batteryData.cells.length,
        voltageDiff: this.batteryData.maxCellVoltage - this.batteryData.minCellVoltage,
        avgCellVoltage: this.batteryData.avgCellVoltage,
        nominalCapacity: 100,
      };
    }
    return { cellCount: 16, voltageDiff: 0, avgCellVoltage: 3300, nominalCapacity: 100 };
  }

  setDemoMode(enabled: boolean) {
    this.isDemoMode = enabled;
    if (enabled) {
      this.startRefresh();
    } else {
      this.stopRefresh();
    }
  }

  isDemo(): boolean { return this.isDemoMode; }

  handleRawData(data: Uint8Array) {
    const battery = generateMockBatteryData(this.cellCount);
    this.batteryData = battery;

    const time = new Date().toLocaleTimeString('zh-CN', { hour12: false });
    this.chartPoints.push({
      time,
      voltage: battery.totalVoltage,
      current: battery.current,
    });
    if (this.chartPoints.length > 120) this.chartPoints.shift();

    this.checkAlarms(battery);

    this.dataCallbacks.forEach(cb => cb(battery));
    this.chartCallbacks.forEach(cb => cb(this.chartPoints));
  }

  destroy() {
    this.stopRefresh();
    this.dataCallbacks.clear();
    this.alarmCallbacks.clear();
    this.chartCallbacks.clear();
    this.stateCallbacks.clear();
    this.paramCallbacks.clear();
  }
}

export const bmsManager = new BMSDataManager();

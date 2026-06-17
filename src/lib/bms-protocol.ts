// ==================== BMS 协议解析器 ====================
// 支持常见 BMS 通信协议的数据解析

import type { BatteryPackStatus, CellData, DeviceInfo } from '@/types/bms';

/** 原始帧数据 */
export interface RawFrame {
  header: number[];
  command: number;
  data: number[];
  checksum: number;
  raw: Uint8Array;
}

/** 解析结果 */
export interface ParseResult {
  success: boolean;
  data?: Partial<BatteryPackStatus> | DeviceInfo | CellData[];
  error?: string;
}

/**
 * 校验和计算（常见 BMS 校验方式）
 */
export function calculateChecksum(data: Uint8Array, excludeLast: number = 1): number {
  let sum = 0;
  for (let i = 0; i < data.length - excludeLast; i++) {
    sum += data[i];
  }
  return sum & 0xFF;
}

/**
 * 验证帧校验和
 */
export function verifyChecksum(frame: Uint8Array): boolean {
  if (frame.length < 2) return false;
  const expected = frame[frame.length - 1];
  const calculated = calculateChecksum(frame);
  return expected === calculated;
}

/**
 * 从 DataView 读取有符号 16 位整数（大端序）
 */
export function readInt16BE(view: DataView, offset: number): number {
  return view.getInt16(offset, false);
}

/**
 * 从 DataView 读取无符号 16 位整数（大端序）
 */
export function readUInt16BE(view: DataView, offset: number): number {
  return view.getUint16(offset, false);
}

/**
 * 从 DataView 读取有符号 32 位整数（大端序）
 */
export function readInt32BE(view: DataView, offset: number): number {
  return view.getInt32(offset, false);
}

/**
 * 从 DataView 读取无符号 32 位整数（大端序）
 */
export function readUInt32BE(view: DataView, offset: number): number {
  return view.getUint32(offset, false);
}

/**
 * 字节数组转十六进制字符串
 */
export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join(' ');
}

/**
 * 十六进制字符串转字节数组
 */
export function hexToBytes(hex: string): Uint8Array {
  const cleaned = hex.replace(/\s+/g, '');
  const bytes = new Uint8Array(cleaned.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(cleaned.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

/**
 * 模拟 BMS 数据生成器（用于开发和演示）
 */
export function generateMockBMSData(cellCount: number = 16): BatteryPackStatus {
  const cells: CellData[] = [];
  const baseVoltage = 3300 + Math.random() * 200; // 3.3V - 3.5V
  
  for (let i = 0; i < cellCount; i++) {
    cells.push({
      id: i + 1,
      voltage: Math.round(baseVoltage + (Math.random() - 0.5) * 80),
      temperature: Math.round((25 + (Math.random() - 0.5) * 10) * 10) / 10,
      internalResistance: Math.round((15 + Math.random() * 10) * 100) / 100,
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
    totalEnergy: Math.round(Math.random() * 5000 * 100) / 100,
    maxCellVoltage: Math.max(...voltages),
    minCellVoltage: Math.min(...voltages),
    avgCellVoltage: Math.round(voltages.reduce((a, b) => a + b, 0) / voltages.length),
    maxCellTemp: Math.max(...temps),
    minCellTemp: Math.min(...temps),
    avgCellTemp: Math.round(temps.reduce((a, b) => a + b, 0) / temps.length * 10) / 10,
    cells,
    timestamp: Date.now(),
  };
}

/**
 * 模拟 GPS 数据生成器
 */
export function generateMockGPSData() {
  return {
    latitude: 31.2304 + (Math.random() - 0.5) * 0.01,
    longitude: 121.4737 + (Math.random() - 0.5) * 0.01,
    altitude: Math.round((5 + Math.random() * 50) * 10) / 10,
    speed: Math.round(Math.random() * 60 * 10) / 10,
    heading: Math.round(Math.random() * 360),
    accuracy: Math.round((2 + Math.random() * 10) * 10) / 10,
    timestamp: Date.now(),
  };
}

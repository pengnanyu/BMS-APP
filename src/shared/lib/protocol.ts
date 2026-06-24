/** Modbus RTU 协议帧工具 - 基于帧长度识别完整帧（无 7E 分隔符） */

import { verifyCrc16 } from './crc16';

/** 功能码枚举 */
export const FUNC_CODE = {
  READ_03: 0x03,
  READ_30: 0x30,
  READ_11: 0x11,
  WRITE_10: 0x10,
} as const;

/** 默认地址码 */
export const DEFAULT_ADDRESS = 0x00;

/** 判断是否为读功能码 — 透传模式：除写功能码和异常外，都按读响应格式处理 */
export function isReadFuncCode(code: number): boolean {
  if (code & 0x80) return false;
  if (code === 0x10 || code === 0x3D || code === 0x3E) return false;
  return true;
}

/** 判断是否为写功能码 */
export function isWriteFuncCode(code: number): boolean {
  return code === 0x10 || code === 0x3D || code === 0x3E;
}

/** 根据功能码和已有数据计算期望帧长度 */
function expectedFrameLength(data: Uint8Array): number | null {
  if (data.length < 2) return null;

  const funcCode = data[1];

  /* 异常响应：功能码最高位为 1，长度固定 5 字节（地址+功能码+异常码+CRC16） */
  if (funcCode & 0x80) return 5;

  /* 写响应：地址(1) + 功能码(1) + 起始地址(2) + 寄存器数量(2) + CRC(2) = 8 */
  if (isWriteFuncCode(funcCode)) return 8;

  /* 读响应：地址(1) + 功能码(1) + 字节计数(1) + 数据(n) + CRC(2) */
  if (isReadFuncCode(funcCode)) {
    if (data.length < 3) return null;
    const byteCount = data[2];
    return 3 + byteCount + 2;
  }

  return null;
}

/** 从原始字节流中提取完整的 Modbus RTU 帧 */
export function extractFrames(data: Uint8Array): { frames: Uint8Array[]; remainder: Uint8Array } {
  const frames: Uint8Array[] = [];
  let offset = 0;

  while (offset < data.length) {
    const remaining = data.slice(offset);

    /* 跳过无效起始字节（非有效地址码范围 0x00-0xF7） */
    if (remaining[0] > 0xf7) {
      offset++;
      continue;
    }

    const expected = expectedFrameLength(remaining);
    if (expected === null) {
      /* 未知功能码：尝试 CRC16 扫描找到帧边界 */
      if (remaining.length < 5) {
        /* 数据太短，无法扫描，保留在缓冲区等待更多数据 */
        break;
      }
      let found = false;
      for (let len = 5; len <= Math.min(remaining.length, 256); len++) {
        if (verifyCrc16(remaining.slice(0, len))) {
          frames.push(remaining.slice(0, len));
          offset += len;
          found = true;
          break;
        }
      }
      if (!found) {
        /* CRC 扫描也找不到，跳过当前字节 */
        offset++;
      }
      continue;
    }

    if (remaining.length < expected) {
      /* 数据不完整，等待更多数据 */
      break;
    }

    const candidate = remaining.slice(0, expected);
    if (verifyCrc16(candidate)) {
      frames.push(candidate);
      offset += expected;
    } else {
      /* CRC 校验失败，跳过当前字节继续尝试 */
      offset++;
    }
  }

  const remainder = offset < data.length ? data.slice(offset) : new Uint8Array(0);
  return { frames, remainder };
}

/** 解析读请求帧 */
export function parseReadRequest(frame: Uint8Array): {
  address: number;
  funcCode: number;
  startAddr: number;
  length: number;
} | null {
  if (frame.length !== 8) return null;
  if (!verifyCrc16(frame)) return null;

  return {
    address: frame[0],
    funcCode: frame[1],
    startAddr: (frame[2] << 8) | frame[3],
    length: (frame[4] << 8) | frame[5],
  };
}

/** 解析写请求帧（非标准 Modbus：无字节计数字段）
 *  格式：地址码(1B) + 功能码0x10(1B) + 起始地址(2B) + 寄存器数量(2B) + 数据(2*nB) + CRC16(2B)
 */
export function parseWriteRequest(frame: Uint8Array): {
  address: number;
  funcCode: number;
  startAddr: number;
  length: number;
  data: number[];
} | null {
  if (frame.length < 10) return null;
  if (!verifyCrc16(frame)) return null;

  const regCount = (frame[4] << 8) | frame[5];
  if (frame.length !== 6 + regCount * 2 + 2) return null;

  const writeData: number[] = [];
  for (let i = 0; i < regCount; i++) {
    writeData.push((frame[6 + i * 2] << 8) | frame[6 + i * 2 + 1]);
  }

  return {
    address: frame[0],
    funcCode: frame[1],
    startAddr: (frame[2] << 8) | frame[3],
    length: regCount,
    data: writeData,
  };
}

/** 解析读响应帧 */
export function parseReadResponse(frame: Uint8Array): {
  address: number;
  funcCode: number;
  byteCount: number;
  data: number[];
} | null {
  if (frame.length < 5) return null;
  if (!verifyCrc16(frame)) return null;

  const byteCount = frame[2];
  if (frame.length !== 3 + byteCount + 2) return null;

  const data: number[] = [];
  for (let i = 0; i < byteCount; i += 2) {
    data.push((frame[3 + i] << 8) | frame[3 + i + 1]);
  }

  return {
    address: frame[0],
    funcCode: frame[1],
    byteCount,
    data,
  };
}

/** 解析写响应帧 */
export function parseWriteResponse(frame: Uint8Array): {
  address: number;
  funcCode: number;
} | null {
  if (frame.length !== 4) return null;
  if (!verifyCrc16(frame)) return null;

  return {
    address: frame[0],
    funcCode: frame[1],
  };
}

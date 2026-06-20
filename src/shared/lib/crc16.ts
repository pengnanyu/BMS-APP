/** CRC16-MODBUS 校验算法 */

const CRC16_TABLE = new Uint16Array(256);

/* 预计算 CRC16 查找表 */
for (let i = 0; i < 256; i++) {
  let crc = i;
  for (let j = 0; j < 8; j++) {
    if (crc & 1) {
      crc = (crc >> 1) ^ 0xa001;
    } else {
      crc >>= 1;
    }
  }
  CRC16_TABLE[i] = crc;
}

/** 计算 CRC16-MODBUS 校验值，返回低字节在前 */
export function crc16(data: Uint8Array): [low: number, high: number] {
  let crc = 0xffff;
  for (let i = 0; i < data.length; i++) {
    crc = (crc >> 8) ^ CRC16_TABLE[(crc ^ data[i]) & 0xff];
  }
  return [crc & 0xff, (crc >> 8) & 0xff];
}

/** 校验数据末尾的 CRC16 是否正确 */
export function verifyCrc16(data: Uint8Array): boolean {
  if (data.length < 3) return false;
  const payload = data.slice(0, -2);
  const [expectedLow, expectedHigh] = crc16(payload);
  return data[data.length - 2] === expectedLow && data[data.length - 1] === expectedHigh;
}

// ==================== ER 函数 - 同时 serve 共享 UI 和 API ====================

// EdgeKV 命名空间
declare const EdgeKV: any;
const kv_devices = new EdgeKV({ namespace: 'bms-devices' });
const kv_gps = new EdgeKV({ namespace: 'bms-gps' });
const kv_alarms = new EdgeKV({ namespace: 'bms-alarms' });

// ==================== 辅助函数 ====================

async function getAllDevices(): Promise<any[]> {
  const data = await kv_devices.get('all');
  if (!data) return [];
  try {
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

async function saveAllDevices(devices: any[]): Promise<void> {
  await kv_devices.put('all', JSON.stringify(devices));
}

async function getGPSTrack(deviceId: string): Promise<any[]> {
  const data = await kv_gps.get(deviceId);
  if (!data) return [];
  try {
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

async function saveGPSTrack(deviceId: string, track: any[]): Promise<void> {
  await kv_gps.put(deviceId, JSON.stringify(track));
}

async function getAlarms(deviceId: string): Promise<any[]> {
  const data = await kv_alarms.get(deviceId);
  if (!data) return [];
  try {
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

async function saveAlarms(deviceId: string, alarms: any[]): Promise<void> {
  await kv_alarms.put(deviceId, JSON.stringify(alarms));
}

// ==================== CORS ====================

function corsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

function jsonResponse(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json', ...corsHeaders() },
  });
}

// ==================== API 路由 ====================

async function handleGetDevices(): Promise<Response> {
  const devices = await getAllDevices();
  return jsonResponse(devices);
}

async function handleRegisterDevice(request: Request): Promise<Response> {
  const body = await request.json();
  const devices = await getAllDevices();
  const existingIndex = devices.findIndex((d: any) => d.id === body.id);
  if (existingIndex >= 0) {
    devices[existingIndex] = { ...devices[existingIndex], ...body, lastSeen: Date.now() };
  } else {
    devices.push({ ...body, lastSeen: Date.now(), registeredAt: Date.now() });
  }
  await saveAllDevices(devices);
  return jsonResponse({ success: true });
}

async function handleReportBattery(request: Request, deviceId: string): Promise<Response> {
  const body = await request.json();
  const devices = await getAllDevices();
  const deviceIndex = devices.findIndex((d: any) => d.id === deviceId);
  if (deviceIndex === -1) {
    return jsonResponse({ error: 'Device not found' }, 404);
  }
  devices[deviceIndex] = { ...devices[deviceIndex], batteryData: body, lastSeen: Date.now() };
  await saveAllDevices(devices);

  // 检查告警
  const newAlarms: any[] = [];
  if (body.maxCellTemp > 45) {
    newAlarms.push({
      id: `alarm-${Date.now()}-temp`,
      level: body.maxCellTemp > 55 ? 'critical' : 'warning',
      type: 'OVER_TEMPERATURE',
      message: `电芯温度过高: ${body.maxCellTemp}°C`,
      value: body.maxCellTemp, threshold: 45,
      timestamp: Date.now(), acknowledged: false,
    });
  }
  if (body.soc < 10) {
    newAlarms.push({
      id: `alarm-${Date.now()}-soc`,
      level: body.soc < 5 ? 'critical' : 'warning',
      type: 'LOW_SOC',
      message: `电量过低: ${body.soc}%`,
      value: body.soc, threshold: 10,
      timestamp: Date.now(), acknowledged: false,
    });
  }
  if (newAlarms.length > 0) {
    const existingAlarms = await getAlarms(deviceId);
    await saveAlarms(deviceId, [...existingAlarms, ...newAlarms].slice(-100));
  }
  return jsonResponse({ success: true, alarms: newAlarms });
}

async function handleGetBattery(deviceId: string): Promise<Response> {
  const devices = await getAllDevices();
  const device = devices.find((d: any) => d.id === deviceId);
  if (!device) return jsonResponse({ error: 'Device not found' }, 404);
  return jsonResponse(device.batteryData || {});
}

async function handleReportGPS(request: Request, deviceId: string): Promise<Response> {
  const body = await request.json();
  const track = await getGPSTrack(deviceId);
  track.push({ ...body, id: `track-${Date.now()}` });
  await saveGPSTrack(deviceId, track.slice(-1000));
  return jsonResponse({ success: true });
}

async function handleGetGPS(deviceId: string): Promise<Response> {
  const track = await getGPSTrack(deviceId);
  return jsonResponse(track);
}

async function handleGetAlarms(deviceId: string): Promise<Response> {
  const alarms = await getAlarms(deviceId);
  return jsonResponse(alarms);
}

async function handleAckAlarm(deviceId: string, alarmId: string): Promise<Response> {
  const alarms = await getAlarms(deviceId);
  const index = alarms.findIndex((a: any) => a.id === alarmId);
  if (index === -1) return jsonResponse({ error: 'Alarm not found' }, 404);
  alarms[index].acknowledged = true;
  await saveAlarms(deviceId, alarms);
  return jsonResponse({ success: true });
}

// ==================== 主路由 ====================

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    try {
      // API 路由
      if (pathname === '/api/devices') {
        if (request.method === 'GET') return handleGetDevices();
        if (request.method === 'POST') return handleRegisterDevice(request);
      }

      const batteryMatch = pathname.match(/^\/api\/battery\/([^/]+)$/);
      if (batteryMatch) {
        const deviceId = batteryMatch[1];
        if (request.method === 'GET') return handleGetBattery(deviceId);
        if (request.method === 'POST') return handleReportBattery(request, deviceId);
      }

      const gpsMatch = pathname.match(/^\/api\/gps\/([^/]+)$/);
      if (gpsMatch) {
        const deviceId = gpsMatch[1];
        if (request.method === 'GET') return handleGetGPS(deviceId);
        if (request.method === 'POST') return handleReportGPS(request, deviceId);
      }

      const alarmsMatch = pathname.match(/^\/api\/alarms\/([^/]+)(?:\/(.+))?$/);
      if (alarmsMatch) {
        const deviceId = alarmsMatch[1];
        const alarmId = alarmsMatch[2];
        if (request.method === 'GET' && !alarmId) return handleGetAlarms(deviceId);
        if (request.method === 'PUT' && alarmId) return handleAckAlarm(deviceId, alarmId);
      }

      if (pathname === '/api/health') {
        return jsonResponse({ status: 'ok', timestamp: Date.now() });
      }

      // 静态资源（共享 UI 构建产物）
      // 生产环境中，shared-ui 的构建产物会被部署到 ER 的 assets
      // 这里直接 fallback 到静态资源服务

      return new Response('Not Found', { status: 404 });
    } catch (error: any) {
      console.error('ER error:', error);
      return jsonResponse({ error: error.message || 'Internal Server Error' }, 500);
    }
  },
};

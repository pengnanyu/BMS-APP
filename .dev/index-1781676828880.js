// .dev/mock/cache.js
var MockCache = class _MockCache {
  static port = 0;
  constructor() {}
  async put(reqOrUrl, response) {
    if (arguments.length < 2) {
      throw new TypeError(`Failed to execute 'put' on 'cache': 2 arguments required, but only ${arguments.length} present.`);
    }
    if (!reqOrUrl) {
      throw new TypeError("Failed to execute 'put' on 'cache': 2 arguments required, but only 0 present.");
    }
    if (!(response instanceof Response)) {
      throw new TypeError("Failed to execute 'put' on 'cache': Argument 2 is not of type Response.");
    }
    try {
      const body = await response.clone().text();
      const headers = {};
      response.headers.forEach((v, k) => headers[k] = v);
      const cacheControl = response.headers.get("Cache-Control") || "";
      const ttl = this.parseTTL(cacheControl);
      const key = this.normalizeKey(reqOrUrl);
      const fetchRes = await fetch(`http://localhost:${_MockCache.port}/mock_cache/put`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          key,
          response: {
            status: response.status,
            headers,
            body
          },
          ttl
        })
      });
      if (!fetchRes.ok) {
        const error = await fetchRes.json();
        throw new Error(error.error);
      }
      return void 0;
    } catch (err2) {
      throw new Error(`Cache put failed: ${err2.message}`);
    }
  }
  async get(reqOrUrl) {
    const key = this.normalizeKey(reqOrUrl);
    const fetchRes = await fetch(`http://localhost:${_MockCache.port}/mock_cache/get`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        key
      })
    });
    if (!fetchRes.ok) {
      const error = await fetchRes.json();
      throw new Error(error.error);
    }
    const res = await fetchRes.json();
    if (res && res.success) {
      return new Response(res.data.response.body, {
        status: res.data.response.status,
        headers: new Headers(res.data.response.headers)
      });
    } else {
      return void 0;
    }
  }
  async delete(reqOrUrl) {
    const key = this.normalizeKey(reqOrUrl);
    const fetchRes = await fetch(`http://localhost:${_MockCache.port}/mock_cache/delete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        key
      })
    });
    if (!fetchRes.ok) {
      const error = await fetchRes.json();
      throw new Error(error.error);
    }
    const res = await fetchRes.json();
    return res.success;
  }
  normalizeKey(input) {
    const url = input instanceof Request ? input.url : input;
    return url.replace(/^https:/i, "http:");
  }
  parseTTL(cacheControl) {
    const maxAgeMatch = cacheControl.match(/max-age=(\d+)/);
    return maxAgeMatch ? parseInt(maxAgeMatch[1]) : 3600;
  }
};
var mock_cache = new MockCache();
globalThis.mockCache = mock_cache;
var cache_default = MockCache;

// .dev/mock/kv.js
var EdgeKV2 = class _EdgeKV {
  static port = 0;
  JS_RESPONSE_BUFFER_THRESHOLD = 64 * 1024;
  constructor(options) {
    if (!options || !options.namespace && !options.namespaceId) {
      throw new TypeError("The argument to `EdgeKV` must be an object with a `namespace` or `namespaceId` field");
    }
    this.namespace = options.namespace;
  }
  async put(key, value) {
    if (arguments.length < 2) {
      throw new TypeError(`Failed to execute 'put' on 'EdgeKV': 2 arguments required, but only ${arguments.length} present.`);
    }
    if (!key) {
      throw new TypeError("Failed to execute 'put' on 'EdgeKV': 2 arguments required, but only 0 present.");
    }
    if (typeof key !== "string") {
      throw new TypeError(`Failed to execute 'put' on 'EdgeKV': 1th argument must be a string.`);
    }
    try {
      let body;
      if (typeof value === "string") {
        if (value.length > this.JS_RESPONSE_BUFFER_THRESHOLD) {
          const encoder = new TextEncoder();
          const encodedValue = encoder.encode(value);
          body = new ReadableStream({
            start(controller) {
              controller.enqueue(encodedValue);
              controller.close();
            }
          });
        } else {
          body = value;
        }
      } else if (value instanceof Response) {
        const resBody = await value.clone().text();
        const headers = {};
        value.headers.forEach((v, k) => headers[k] = v);
        body = JSON.stringify({
          body: resBody,
          headers,
          status: value.status
        });
      } else if (value instanceof ReadableStream || value instanceof ArrayBuffer || ArrayBuffer.isView(value)) {
        body = value;
      } else {
        throw new TypeError(`Failed to execute 'put' on 'EdgeKV': 2nd argument should be one of string/Response/ArrayBuffer/ArrayBufferView/ReadableStream`);
      }
      const fetchRes = await fetch(`http://localhost:${_EdgeKV.port}/mock_kv/put?key=${key}&namespace=${this.namespace}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body
      });
      if (!fetchRes.ok) {
        const error = await fetchRes.json();
        throw new Error(error.error);
      }
      return void 0;
    } catch (err2) {
      throw new Error(`Cache put failed: ${err2.message}`);
    }
  }
  async get(key, options) {
    const isTypeValid = ty => typeof ty === "string" && (ty === "text" || ty === "json" || ty === "stream" || ty === "arrayBuffer");
    if (options && !isTypeValid(options?.type)) {
      throw new TypeError("EdgeKV.get: 2nd optional argument must be an object with a 'type' field. The 'type' field specifies the format of the return value and must be a string of 'text', 'json', 'stream' or 'arrayBuffer'");
    }
    const type = options?.type || "text";
    const fetchRes = await fetch(`http://localhost:${_EdgeKV.port}/mock_kv/get?key=${key}&namespace=${this.namespace}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      }
    });
    let isGetFailed = false;
    fetchRes.headers.forEach((v, k) => {
      if (k === "kv-get-empty") {
        isGetFailed = true;
      }
    });
    if (isGetFailed) {
      return void 0;
    }
    switch (type) {
      case "text":
        return fetchRes.text();
      case "json":
        try {
          const value2 = await fetchRes.text();
          const userObject = JSON.parse(value2);
          return userObject;
        } catch (error) {
          throw new TypeError(`Invalid JSON: ${err.message}`);
        }
      case "arrayBuffer":
        try {
          const buffer = await fetchRes.arrayBuffer();
          return buffer;
        } catch (error) {
          throw new TypeError(`Failed to read the response body into an ArrayBuffer: ${error.message}`);
        }
      case "stream":
        const value = await fetchRes.text();
        return new ReadableStream({
          start(controller) {
            controller.enqueue(new TextEncoder().encode(value));
            controller.close();
          }
        });
      default:
        throw new Error(`Unsupported type: ${type}`);
    }
  }
  async delete(key) {
    const fetchRes = await fetch(`http://localhost:${_EdgeKV.port}/mock_kv/delete?key=${key}&namespace=${this.namespace}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      }
    });
    if (!fetchRes.ok) {
      const error = await fetchRes.json();
      throw new Error(error.error);
    }
    const res = await fetchRes.json();
    return res.success;
  }
};
globalThis.mockKV = EdgeKV2;
var kv_default = EdgeKV2;

// functions/index.ts
var kv_devices = new mockKV({
  namespace: "bms-devices"
});
var kv_gps = new mockKV({
  namespace: "bms-gps"
});
var kv_alarms = new mockKV({
  namespace: "bms-alarms"
});
async function getAllDevices() {
  const data = await kv_devices.get("all");
  if (!data) return [];
  try {
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
async function saveAllDevices(devices) {
  await kv_devices.put("all", JSON.stringify(devices));
}
async function getGPSTrack(deviceId) {
  const data = await kv_gps.get(deviceId);
  if (!data) return [];
  try {
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
async function saveGPSTrack(deviceId, track) {
  await kv_gps.put(deviceId, JSON.stringify(track));
}
async function getAlarms(deviceId) {
  const data = await kv_alarms.get(deviceId);
  if (!data) return [];
  try {
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
async function saveAlarms(deviceId, alarms) {
  await kv_alarms.put(deviceId, JSON.stringify(alarms));
}
function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  };
}
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json",
      ...corsHeaders()
    }
  });
}
async function handleGetDevices() {
  const devices = await getAllDevices();
  return jsonResponse(devices);
}
async function handleRegisterDevice(request) {
  const body = await request.json();
  const devices = await getAllDevices();
  const existingIndex = devices.findIndex(d => d.id === body.id);
  if (existingIndex >= 0) {
    devices[existingIndex] = {
      ...devices[existingIndex],
      ...body,
      lastSeen: Date.now()
    };
  } else {
    devices.push({
      ...body,
      lastSeen: Date.now(),
      registeredAt: Date.now()
    });
  }
  await saveAllDevices(devices);
  return jsonResponse({
    success: true
  });
}
async function handleReportBattery(request, deviceId) {
  const body = await request.json();
  const devices = await getAllDevices();
  const deviceIndex = devices.findIndex(d => d.id === deviceId);
  if (deviceIndex === -1) {
    return jsonResponse({
      error: "Device not found"
    }, 404);
  }
  devices[deviceIndex] = {
    ...devices[deviceIndex],
    batteryData: body,
    lastSeen: Date.now()
  };
  await saveAllDevices(devices);
  const newAlarms = [];
  if (body.maxCellTemp > 45) {
    newAlarms.push({
      id: `alarm-${Date.now()}-temp`,
      level: body.maxCellTemp > 55 ? "critical" : "warning",
      type: "OVER_TEMPERATURE",
      message: `\u7535\u82AF\u6E29\u5EA6\u8FC7\u9AD8: ${body.maxCellTemp}\xB0C`,
      value: body.maxCellTemp,
      threshold: 45,
      timestamp: Date.now(),
      acknowledged: false
    });
  }
  if (body.soc < 10) {
    newAlarms.push({
      id: `alarm-${Date.now()}-soc`,
      level: body.soc < 5 ? "critical" : "warning",
      type: "LOW_SOC",
      message: `\u7535\u91CF\u8FC7\u4F4E: ${body.soc}%`,
      value: body.soc,
      threshold: 10,
      timestamp: Date.now(),
      acknowledged: false
    });
  }
  if (newAlarms.length > 0) {
    const existingAlarms = await getAlarms(deviceId);
    await saveAlarms(deviceId, [...existingAlarms, ...newAlarms].slice(-100));
  }
  return jsonResponse({
    success: true,
    alarms: newAlarms
  });
}
async function handleGetBattery(deviceId) {
  const devices = await getAllDevices();
  const device = devices.find(d => d.id === deviceId);
  if (!device) return jsonResponse({
    error: "Device not found"
  }, 404);
  return jsonResponse(device.batteryData || {});
}
async function handleReportGPS(request, deviceId) {
  const body = await request.json();
  const track = await getGPSTrack(deviceId);
  track.push({
    ...body,
    id: `track-${Date.now()}`
  });
  await saveGPSTrack(deviceId, track.slice(-1e3));
  return jsonResponse({
    success: true
  });
}
async function handleGetGPS(deviceId) {
  const track = await getGPSTrack(deviceId);
  return jsonResponse(track);
}
async function handleGetAlarms(deviceId) {
  const alarms = await getAlarms(deviceId);
  return jsonResponse(alarms);
}
async function handleAckAlarm(deviceId, alarmId) {
  const alarms = await getAlarms(deviceId);
  const index = alarms.findIndex(a => a.id === alarmId);
  if (index === -1) return jsonResponse({
    error: "Alarm not found"
  }, 404);
  alarms[index].acknowledged = true;
  await saveAlarms(deviceId, alarms);
  return jsonResponse({
    success: true
  });
}
var functions_default = {
  async fetch(request) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders()
      });
    }
    try {
      if (pathname === "/api/devices") {
        if (request.method === "GET") return handleGetDevices();
        if (request.method === "POST") return handleRegisterDevice(request);
      }
      const batteryMatch = pathname.match(/^\/api\/battery\/([^/]+)$/);
      if (batteryMatch) {
        const deviceId = batteryMatch[1];
        if (request.method === "GET") return handleGetBattery(deviceId);
        if (request.method === "POST") return handleReportBattery(request, deviceId);
      }
      const gpsMatch = pathname.match(/^\/api\/gps\/([^/]+)$/);
      if (gpsMatch) {
        const deviceId = gpsMatch[1];
        if (request.method === "GET") return handleGetGPS(deviceId);
        if (request.method === "POST") return handleReportGPS(request, deviceId);
      }
      const alarmsMatch = pathname.match(/^\/api\/alarms\/([^/]+)(?:\/(.+))?$/);
      if (alarmsMatch) {
        const deviceId = alarmsMatch[1];
        const alarmId = alarmsMatch[2];
        if (request.method === "GET" && !alarmId) return handleGetAlarms(deviceId);
        if (request.method === "PUT" && alarmId) return handleAckAlarm(deviceId, alarmId);
      }
      if (pathname === "/api/health") {
        return jsonResponse({
          status: "ok",
          timestamp: Date.now()
        });
      }
      return new Response("Not Found", {
        status: 404
      });
    } catch (error) {
      console.error("ER error:", error);
      return jsonResponse({
        error: error.message || "Internal Server Error"
      }, 500);
    }
  }
};

// .dev/devEntry-1781676828880.js
cache_default.port = 18080;
kv_default.port = 18080;
var devEntry_1781676828880_default = functions_default;
export { devEntry_1781676828880_default as default };
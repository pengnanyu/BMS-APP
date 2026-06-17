# AIBMS Web Bridge API 文档

## 概述

AIBMS Web Bridge 是容器与外部 UI 之间的通信桥梁。容器（Web/APP/小程序）负责设备连接管理，UI 负责数据展示与操作交互。

## 项目结构

```
src/
├── shared/                    # 跨平台共享代码
│   └── types/
│       └── bridge.ts          # 核心类型定义 + 默认配置
├── platforms/
│   └── web/                   # Web 平台专属代码
│       ├── WebContainer.tsx   # Web 容器主页面
│       ├── components/
│       │   ├── ConnectionBar.tsx  # 顶部连接控制栏
│       │   └── UIContent.tsx      # UI 内容区（占位/iframe）
│       ├── lib/
│       │   └── web-bridge.ts      # Web Bridge 管理器
│       └── types/
│           ├── global.d.ts        # window.AIBMSBridge 全局类型
│           └── web-serial.d.ts    # Web Serial API 类型声明
├── components/                # 共享 UI 组件（shadcn/ui）
├── lib/                       # 共享工具函数
└── main.tsx                   # 入口
```

> 未来新增 APP/小程序平台时，在 `src/platforms/` 下新建对应目录即可。

## 架构

```
┌─────────────────────────────────────────────┐
│              Web Container                   │
│  ┌───────────────────────────────────────┐  │
│  │  ConnectionBar (连接控制栏)            │  │
│  │  - 蓝牙/串口选择                       │  │
│  │  - 连接参数配置                        │  │
│  │  - 连接/断开操作                       │  │
│  └───────────────────────────────────────┘  │
│  ┌───────────────────────────────────────┐  │
│  │  UIContent (占位 / iframe)            │  │
│  │  ┌───────────────────────────────┐    │  │
│  │  │  BMS 数据展示 & 操作界面       │    │  │
│  │  │  通过 window.parent.AIBMSBridge│    │  │
│  │  │  调用容器 API                  │    │  │
│  │  └───────────────────────────────┘    │  │
│  └───────────────────────────────────────┘  │
│         ↕ AIBMSBridge API                   │
│  ┌───────────────────────────────────────┐  │
│  │  Web Bridge (连接管理层)               │  │
│  │  - Web Bluetooth API                  │  │
│  │  - Web Serial API                     │  │
│  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

## 访问方式

- **容器地址**: `app.aibms.net` — 加载 Web 容器
- **UI 地址**: `ui.aibms.net` — 通过 iframe 嵌入容器

## API 接口

容器通过 `window.AIBMSBridge` 暴露统一 API，iframe 中的 UI 通过 `window.parent.AIBMSBridge` 调用。

### 1. connect()

连接设备（根据当前配置选择蓝牙或串口）。

```typescript
const success: boolean = await window.parent.AIBMSBridge.connect();
```

**返回值**: `Promise<boolean>` — 连接是否成功

### 2. disconnect()

断开当前设备连接。

```typescript
await window.parent.AIBMSBridge.disconnect();
```

### 3. getConnectionStatus()

获取当前连接状态。

```typescript
type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

const status: ConnectionStatus = window.parent.AIBMSBridge.getConnectionStatus();
```

### 4. sendData(data)

发送数据到已连接的设备。

```typescript
// 发送字节数据
const data = new Uint8Array([0x01, 0x02, 0x03, 0x04]);
const success: boolean = await window.parent.AIBMSBridge.sendData(data);
```

**参数**: `Uint8Array` — 要发送的字节数据  
**返回值**: `Promise<boolean>` — 发送是否成功

> **注意**: 蓝牙模式下会自动分包发送（每包 20 字节）

### 5. onDataReceived(callback)

注册数据接收回调。当设备返回数据时触发。

```typescript
const unsubscribe = window.parent.AIBMSBridge.onDataReceived((data: Uint8Array) => {
  console.log('收到数据:', data);
  // 解析 BMS 数据...
});

// 取消监听
unsubscribe();
```

**参数**: `(data: Uint8Array) => void` — 数据接收回调  
**返回值**: `() => void` — 取消注册的函数

### 6. onConnectionStatusChange(callback)

注册连接状态变化回调。

```typescript
const unsubscribe = window.parent.AIBMSBridge.onConnectionStatusChange(
  (status: ConnectionStatus, message?: string) => {
    console.log('连接状态:', status, message);
    // 更新 UI 状态...
  }
);

// 取消监听
unsubscribe();
```

### 7. getConfig()

获取当前连接配置。

```typescript
const config = window.parent.AIBMSBridge.getConfig();
// {
//   type: 'bluetooth' | 'serial',
//   bluetooth: { nameFilter, notifyUUID, writeUUID },
//   serial: { baudRate, dataBits, stopBits, parity }
// }
```

### 8. updateConfig(config)

更新连接配置（连接断开时生效）。

```typescript
window.parent.AIBMSBridge.updateConfig({
  type: 'serial',
  serial: {
    baudRate: 115200,
    parity: 'none',
  },
});
```

### 9. getPlatformInfo()

获取容器平台信息。

```typescript
const info = window.parent.AIBMSBridge.getPlatformInfo();
// {
//   platform: 'web' | 'android' | 'ios' | 'harmony' | 'miniprogram',
//   version: '1.0.0',
//   bluetoothSupported: true,
//   serialSupported: true
// }
```

## UI 集成指南

### 基本集成

```javascript
// 在 UI 页面中
const bridge = window.parent.AIBMSBridge;

// 1. 监听容器就绪事件
window.addEventListener('message', (event) => {
  if (event.data?.type === 'aibms:containerReady') {
    console.log('容器已就绪', event.data.data);
    initBMSUI();
  }
  
  if (event.data?.type === 'aibms:connectionStatus') {
    updateConnectionStatus(event.data.data.status);
  }
});

// 2. 注册数据接收
bridge.onDataReceived((data) => {
  parseBMSData(data);
  updateUI();
});

// 3. 发送指令
async function sendCommand(cmd) {
  const data = encodeCommand(cmd);
  await bridge.sendData(data);
}
```

### 连接参数说明

#### 蓝牙模式

| 参数 | 说明 | 默认值 | 可修改 |
|------|------|--------|--------|
| nameFilter | 设备名称过滤前缀 | `DCSF+` | ✅ |
| notifyUUID | Notify 特征值 | `0xFF01` | ❌ (固定) |
| writeUUID | Write 特征值 | `0xFF02` | ❌ (固定) |

#### 串口模式

| 参数 | 说明 | 默认值 | 可修改 |
|------|------|--------|--------|
| baudRate | 波特率 | 9600 | ✅ (下拉选择) |
| dataBits | 数据位 | 8 | ❌ (固定) |
| stopBits | 停止位 | 1 | ❌ (固定) |
| parity | 校验位 | none | ✅ (下拉选择) |

**波特率选项**: 1200, 2400, 4800, 9600, 19200, 38400, 57600, 115200  
**校验位选项**: 无(none), 奇校验(odd), 偶校验(even)

## 浏览器兼容性

| API | Chrome | Edge | Firefox | Safari |
|-----|--------|------|---------|--------|
| Web Bluetooth | ✅ 56+ | ✅ 79+ | ❌ | ❌ |
| Web Serial | ✅ 89+ | ✅ 89+ | ❌ | ❌ |

> **注意**: Web Bluetooth 和 Web Serial 需要 HTTPS 环境（localhost 除外）

## 部署说明

1. 容器部署到 `app.aibms.net`
2. UI 部署到 `ui.aibms.net`
3. 通过 `.env` 文件的 `VITE_UI_URL` 配置 UI 地址
4. 确保 CORS 配置允许跨域 iframe 嵌入

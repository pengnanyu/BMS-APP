# BMS APP 需求规格说明书

> 版本：2.0  
> 日期：2026-06-27  
> 目标读者：开发团队（重新开发 BMS APP 父容器）

---

## 1. 项目定位

BMS APP 是 AIBMS 系统的**父容器**，部署在 `app.aibms.net`。

**核心定位：纯透传管道。**

APP 只做三件事：
1. 蓝牙/串口连接管理
2. 原始字节收发透传
3. 连接状态/主题/语言同步

**APP 不做**：
- 不发送初始化帧（由 bms-ui 负责）
- 不做帧提取/CRC 校验（由 bms-ui 负责）
- 不参与任何业务逻辑（参数读写、异常记录、协议解析等）

---

## 2. 技术栈

- React 18 + TypeScript
- Vite 构建
- Web Bluetooth API + Web Serial API
- 支持 Cloudflare Workers 和阿里云 ESA 部署
- oklch 色彩空间（light/dark 双主题）
- i18next 国际化（中文/英文）
- sonner（Toast 通知）
- lucide-react（图标）

---

## 3. 页面结构

```
┌──────────────────────────────────────────┐
│  ConnectionBar（顶部固定，h=48px）         │
│  [连接方式] [配置] [连接/断开] [语言] [主题] │
├──────────────────────────────────────────┤
│                                          │
│  UIContent（iframe，占满剩余空间）          │
│  src = https://ui.aibms.net              │
│                                          │
└──────────────────────────────────────────┘
```

### 3.1 ConnectionBar

顶部固定栏，高度 48px，包含：

| 区域 | 内容 |
|------|------|
| 左侧 | Logo（sm 以上显示） |
| 连接方式 | 下拉选择：蓝牙/串口 |
| 蓝牙配置 | 设备名称过滤前缀输入框 |
| 串口配置 | 波特率下拉 + 校验位下拉 |
| 连接按钮 | 连接/断开切换 |
| 右侧 | 语言切换 + 主题切换 |

**连接状态指示**：

| 状态 | 颜色 | 行为 |
|------|------|------|
| disconnected | 灰色圆点 | — |
| connecting | 黄色脉冲 | 按钮禁用 |
| connected | 绿色圆点 | 按钮变红色"断开" |
| error | 红色圆点 | — |

### 3.2 UIContent

iframe 容器，加载 bms-ui 子应用：

- URL：`VITE_UI_URL` 环境变量，默认 `https://ui.aibms.net`
- `sandbox="allow-scripts allow-same-origin allow-forms allow-popups"`
- `allow="bluetooth; serial"`
- 加载中显示 Loader 动画
- iframe 加载完成后推送当前状态

---

## 4. 连接管理

### 4.1 蓝牙连接

**配置参数**：

| 参数 | 默认值 | 说明 |
|------|--------|------|
| nameFilter | `DCSF+` | 设备名称前缀过滤 |
| serviceUUID | `0xFF00` | BLE Service UUID |
| notifyUUID | `0xFF01` | Notify 特征 UUID |
| writeUUID | `0xFF02` | Write 特征 UUID |

**连接流程**：

1. 调用 `navigator.bluetooth.requestDevice` 请求设备
2. 连接 GATT Server
3. 遍历服务查找 Notify 和 Write 特征值
4. 尝试协商 MTU 512（失败则使用默认值）
5. 启用 Notify 通知
6. 收到数据时通过 `notifyRawData` 透传给所有监听者

**16-bit UUID 转换**：

```
短 UUID（如 0xFF01）→ 完整 UUID：0000ff01-0000-1000-8000-00805f9b34fb
```

**蓝牙发送**：

- MTU 512 - 3 字节 ATT 头 = 509 字节有效载荷
- 超过 509 字节时分片发送
- 使用 `writeValueWithoutResponse`

**断开事件**：

- 监听 `gattserverdisconnected` 事件
- 自动清理设备引用
- 通知状态变为 `disconnected`

### 4.2 串口连接

**配置参数**：

| 参数 | 默认值 | 说明 |
|------|--------|------|
| baudRate | 9600 | 波特率 |
| dataBits | 8 | 数据位 |
| stopBits | 1 | 停止位 |
| parity | none | 校验位 |

**可用波特率**：1200, 2400, 4800, 9600, 19200, 38400, 57600, 115200

**连接流程**：

1. 调用 `navigator.serial.requestPort` 请求串口
2. 打开串口（传入波特率等参数）
3. 启动读取循环（`readSerialLoop`）
4. 获取 WritableStream writer

**串口读取**：

- 持续循环读取 `ReadableStream`
- 收到数据时通过 `notifyRawData` 透传给所有监听者
- 读取错误时仅在 `_readingSerial=true` 时打印

**串口发送**：

- 使用 `WritableStream.write` 发送整个帧

---

## 5. 数据队列

DataQueue 负责**串行发送**帧到设备。

**核心规则**：

| 规则 | 说明 |
|------|------|
| 串行发送 | 一次只发一个帧，发完不等待响应 |
| 新帧优先 | 新帧入队时清除所有 pending 项，确保新帧立即发送 |
| 最大容量 | 32 项，超出时移除最早的 |
| 无重试 | 发送失败直接丢弃 |
| 无 ACK | 发完不等待确认 |

**QueueItem 结构**：

```typescript
interface QueueItem {
  id: string;           // q_{自增计数器}
  data: Uint8Array;     // 原始帧数据
  timestamp: number;    // 入队时间
  pending: boolean;     // 是否正在发送
  requestId?: string;   // 请求 ID（来自 iframe）
}
```

---

## 6. postMessage 通信协议

### 6.1 APP → iframe 消息

| 消息类型 | 触发时机 | Payload |
|----------|----------|---------|
| `bms:connection-status` | 连接状态变化 | `{ status: ConnectionStatus }` |
| `bms:raw-data` | 收到蓝牙/串口原始数据 | `{ data: number[] }` |
| `bms:locale-change` | 语言切换 | `{ locale: 'zh' \| 'en' }` |
| `bms:theme-change` | 主题切换 | `{ theme: 'light' \| 'dark' }` |
| `bms:frame-send-ack` | 帧发送确认 | `{ requestId: string, queueId: string }` |

### 6.2 iframe → APP 消息

| 消息类型 | 触发时机 | Payload |
|----------|----------|---------|
| `bms:frame-send` | 请求发送协议帧 | `{ frame: number[], requestId?: string }` |
| `bms:request-status` | 请求重新推送状态 | `{}` |

### 6.3 消息处理逻辑

**APP 收到 `bms:frame-send`**：

1. 从 payload 取出 `frame` 数组
2. 转为 `Uint8Array`
3. 调用 `webBridge.sendFrame(data, requestId)` 入数据队列
4. 回复 `bms:frame-send-ack`（含 requestId 和 queueId）

**APP 收到 `bms:request-status`**：

1. 重新推送 `bms:connection-status`（当前连接状态）
2. 重新推送 `bms:theme-change`（当前主题）
3. 重新推送 `bms:locale-change`（当前语言，从 `document.documentElement.lang` 推断）

### 6.4 主动推送时机

| 时机 | 推送内容 |
|------|----------|
| iframe 加载完成 | connection-status + theme-change + locale-change |
| 连接状态变化 | connection-status |
| 收到蓝牙/串口数据 | raw-data |
| 主题变化 | theme-change |
| 语言变化 | locale-change（通过 `aibms:locale-change` 自定义事件触发） |

### 6.5 安全约束

- APP 向 iframe 发送消息使用 `'*'` 作为 targetOrigin（因为 iframe 可能被 ESA 反向代理到不同域名）
- iframe 加载时使用 `sandbox` 和 `allow` 属性限制权限

---

## 7. 连接状态定义

```typescript
type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';
```

| 状态 | 含义 |
|------|------|
| disconnected | 未连接 |
| connecting | 正在连接中 |
| connected | 已连接 |
| error | 连接错误 |

---

## 8. WebBridgeAPI 接口

APP 将 Bridge API 暴露到 `window.AIBMSBridge`，供 iframe 直接调用：

```typescript
interface WebBridgeAPI {
  connect(): Promise<boolean>;
  disconnect(): Promise<void>;
  getConnectionStatus(): ConnectionStatus;
  sendData(data: Uint8Array): Promise<boolean>;
  onDataReceived(callback: (data: Uint8Array) => void): () => void;
  onConnectionStatusChange(callback: (status: ConnectionStatus, message?: string) => void): () => void;
  getConfig(): ConnectionConfig;
  updateConfig(config: Partial<ConnectionConfig>): void;
  getPlatformInfo(): PlatformInfo;
}
```

---

## 9. 主题与语言

### 9.1 主题

- 三种模式：`light`、`dark`、`system`
- 使用 oklch 色彩空间
- 主题变化时通过 `bms:theme-change` 推送给 iframe
- 背景使用多层径向渐变（oklch 色值）

### 9.2 语言

- 支持中文和英文
- 语言切换时触发 `aibms:locale-change` 自定义事件
- UIContent 监听该事件，通过 `bms:locale-change` 推送给 iframe
- 同时更新 `document.documentElement.lang`

---

## 10. 部署要求

- 部署到 `app.aibms.net`
- 同时兼容 Cloudflare Workers 和阿里云 ESA
- iframe URL 通过 `VITE_UI_URL` 环境变量配置

---

## 11. 关键约束清单

1. **APP 是纯透传管道**，不做帧提取、CRC 校验、初始化帧发送
2. **所有业务逻辑由 bms-ui 端负责**，APP 只转发字节
3. **数据队列串行发送**，新帧优先，无重试无 ACK
4. **收到原始数据立即透传**，不做任何解析或缓存
5. **连接状态变化立即通知** iframe
6. **主题/语言变化立即通知** iframe

# AIBMS Web 容器 - BMS 智能电池管理上位机

## 项目简介

AIBMS Web 容器是 BMS（电池管理系统）的上位机容器应用，负责设备连接管理（蓝牙/串口），并通过 iframe 加载外部 UI 界面。

**架构设计**：容器（连接管理）+ UI（数据展示）分离部署

```
┌─────────────────────────────────────────────┐
│              Web Container                   │
│  ┌───────────────────────────────────────┐  │
│  │  ConnectionBar (连接控制栏)            │  │
│  │  - 蓝牙/串口选择 + 参数配置            │  │
│  │  - 连接/断开操作                       │  │
│  └───────────────────────────────────────┘  │
│  ┌───────────────────────────────────────┐  │
│  │  UI Content (iframe → ui.aibms.net)   │  │
│  └───────────────────────────────────────┘  │
│         ↕ AIBMSBridge API                   │
│  ┌───────────────────────────────────────┐  │
│  │  Web Bridge (Web Bluetooth / Serial)   │  │
│  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

## 技术栈

- **框架**：React 18 + TypeScript + Vite 5
- **样式**：Tailwind CSS v4 + shadcn/ui
- **通信**：Web Bluetooth API + Web Serial API
- **部署**：Cloudflare Workers (Pages)

## 快速开始

### 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

### 环境变量

复制 `.env` 文件并修改配置：

```env
# BMS UI 服务地址（iframe 加载的外部 UI）
VITE_UI_URL=https://ui.aibms.net
```

## 项目结构

```
src/
├── shared/                      # 跨平台共享代码
│   └── types/
│       └── bridge.ts            # 核心类型定义 + 默认配置
├── platforms/
│   └── web/                     # Web 平台专属
│       ├── WebContainer.tsx     # Web 容器主页面
│       ├── components/
│       │   ├── ConnectionBar.tsx  # 顶部连接控制栏
│       │   └── UIContent.tsx      # UI 内容区
│       ├── lib/
│       │   └── web-bridge.ts      # Web Bridge 管理器
│       └── types/
│           ├── global.d.ts        # window.AIBMSBridge 全局类型
│           └── web-serial.d.ts    # Web Serial API 类型声明
├── components/                  # 共享 UI 组件
│   ├── theme-provider.tsx       # 主题管理
│   └── ui/                      # shadcn/ui 组件
├── lib/
│   └── utils.ts                 # 工具函数
└── main.tsx                     # 入口
```

## 部署

### Cloudflare Pages 部署

本项目已配置 Cloudflare Pages 自动部署。

**构建配置**：
- 构建命令：`npm run build`
- 构建输出目录：`dist`
- 根目录：`/`

**方式一：通过 Cloudflare Dashboard**

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 进入 Workers & Pages → Create → Pages
3. 连接 GitHub 仓库
4. 设置构建配置：
   - Build command: `npm run build`
   - Build output directory: `dist`
5. 添加环境变量 `VITE_UI_URL`
6. 点击 "Save and Deploy"

**方式二：通过 wrangler CLI**

```bash
# 安装 wrangler
npm install -g wrangler

# 登录 Cloudflare
wrangler login

# 部署
wrangler pages deploy dist --project-name=aibms-web-container
```

**方式三：GitHub Actions 自动部署**

推送代码到 GitHub 后，GitHub Actions 会自动构建并部署到 Cloudflare Pages。

## Web Bridge API

容器通过 `window.AIBMSBridge` 暴露统一 API 给 iframe 中的 UI 调用。

详细 API 文档见 [BRIDGE_API.md](./BRIDGE_API.md)

### 快速集成示例

```javascript
// 在 UI 页面中（ui.aibms.net）
const bridge = window.parent.AIBMSBridge;

// 监听容器就绪
window.addEventListener('message', (event) => {
  if (event.data?.type === 'aibms:containerReady') {
    console.log('容器已就绪', event.data.data);
  }
});

// 注册数据接收
bridge.onDataReceived((data) => {
  console.log('收到数据:', data);
});

// 发送指令
const cmd = new Uint8Array([0x01, 0x02, 0x03]);
await bridge.sendData(cmd);
```

## 连接参数

### 蓝牙
- Service UUID: `0xFF00`
- Notify 特征: `0xFF01`
- Write 特征: `0xFF02`
- 设备过滤: `DCSF+`（可配置）

### 串口
- 波特率: 1200 ~ 115200（可配置）
- 数据位: 8
- 停止位: 1
- 校验位: 无/奇/偶（可配置）

## 浏览器兼容性

| API | Chrome | Edge | Firefox | Safari |
|-----|--------|------|---------|--------|
| Web Bluetooth | ✅ 56+ | ✅ 79+ | ❌ | ❌ |
| Web Serial | ✅ 89+ | ✅ 89+ | ❌ | ❌ |

> 需要 HTTPS 环境（localhost 除外）

## License

Private

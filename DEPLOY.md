# AIBMS Web 容器 - 部署指南

## 部署架构

```
app.aibms.net (Cloudflare Pages)
  ├── 容器 UI (ConnectionBar + 主题切换)
  ├── Web Bridge API (window.AIBMSBridge)
  └── iframe → ui.aibms.net (外部 UI 服务)
```

---

## 方式一：Cloudflare Pages（推荐）

### 1. 准备工作

1. 将代码推送到 GitHub 仓库
2. 注册 [Cloudflare](https://dash.cloudflare.com) 账号

### 2. 创建 Pages 项目

1. 登录 Cloudflare Dashboard
2. 进入 **Workers & Pages** → **Create** → **Pages**
3. 选择 **Connect to Git**
4. 授权并选择你的 GitHub 仓库

### 3. 构建配置

| 配置项 | 值 |
|--------|-----|
| Production branch | `main` (或你的主分支) |
| Framework preset | `None` (自定义) |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | `/` |

### 4. 环境变量

在 **Environment variables** 中添加：

| 变量名 | 值 | 环境 |
|--------|-----|------|
| `VITE_UI_URL` | `https://ui.aibms.net` | Production |
| `VITE_UI_URL` | `https://staging-ui.aibms.net` | Preview |

### 5. 自定义域名

1. 进入 Pages 项目 → **Custom domains**
2. 点击 **Set up a custom domain**
3. 输入 `app.aibms.net`
4. 按照提示配置 DNS（Cloudflare 会自动管理）

### 6. 部署

点击 **Save and Deploy**，首次构建约 1-2 分钟。

---

## 方式二：GitHub Actions + Cloudflare Pages

### 1. 获取 Cloudflare API Token

1. Cloudflare Dashboard → **My Profile** → **API Tokens**
2. 点击 **Create Token**
3. 使用 **Edit Cloudflare Workers** 模板
4. 权限：
   - Account → Cloudflare Pages → Edit
   - Zone → Zone → Read
5. 复制生成的 API Token

### 2. 获取 Account ID

Cloudflare Dashboard 右侧边栏底部可找到 **Account ID**。

### 3. 配置 GitHub Secrets

在 GitHub 仓库 → **Settings** → **Secrets and variables** → **Actions** 中添加：

**Secrets**（加密存储）：
| 名称 | 值 |
|------|-----|
| `CLOUDFLARE_API_TOKEN` | 上一步获取的 API Token |
| `CLOUDFLARE_ACCOUNT_ID` | 你的 Account ID |
| `GITHUB_TOKEN` | 自动生成，无需手动添加 |

**Variables**（明文）：
| 名称 | 值 |
|------|-----|
| `CLOUDFLARE_PROJECT_NAME` | `aibms-web-container` |
| `VITE_UI_URL` | `https://ui.aibms.net` |

### 4. 自动部署

推送代码到 `main` 分支后，GitHub Actions 会自动：
1. 安装依赖 (`npm ci`)
2. 构建项目 (`npm run build`)
3. 部署到 Cloudflare Pages

可以在 GitHub 仓库的 **Actions** 标签页查看部署状态。

---

## 方式三：Wrangler CLI 手动部署

```bash
# 安装 wrangler
npm install -g wrangler

# 登录 Cloudflare
wrangler login

# 本地构建
npm run build

# 部署到 Cloudflare Pages
wrangler pages deploy dist \
  --project-name=aibms-web-container \
  --branch=main
```

---

## 方式四：其他静态托管平台

### Vercel

1. 连接 GitHub 仓库
2. Framework: `Vite`
3. Build Command: `npm run build`
4. Output Directory: `dist`
5. 添加环境变量 `VITE_UI_URL`

### Netlify

1. 连接 GitHub 仓库
2. Build command: `npm run build`
3. Publish directory: `dist`
4. 添加环境变量 `VITE_UI_URL`
5. 创建 `netlify.toml`：

```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    Permissions-Policy = "bluetooth=*, serial=*"
```

---

## 重要配置说明

### 安全头（Security Headers）

`public/_headers` 文件已预配置：

```
Permissions-Policy: bluetooth=*, serial=*
```

这是 **Web Bluetooth 和 Web Serial API 正常工作所必需的**。如果部署平台不支持 `_headers` 文件，需要在平台设置中手动配置。

### CSP（内容安全策略）

```
Content-Security-Policy: frame-src https://ui.aibms.net ...
```

确保 `frame-src` 包含你的 UI 服务域名，否则 iframe 无法加载。

### SPA 路由

```
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

所有路由返回 `index.html`，由前端处理路由。

---

## 验证部署

### 1. 基本检查

- [ ] 访问 `app.aibms.net` 能正常加载页面
- [ ] 顶部显示 AIBMS logo 和连接控制栏
- [ ] 主题切换按钮正常工作
- [ ] 浏览器 Console 无错误

### 2. 蓝牙功能检查

- [ ] 点击"连接"按钮弹出蓝牙设备选择器
- [ ] 能扫描到 `DCSF+` 前缀的设备
- [ ] 连接成功后按钮变为"断开"
- [ ] Console 显示 `[AIBMS]` 调试日志

### 3. 串口功能检查

- [ ] 切换到"串口"模式
- [ ] 点击"连接"弹出串口选择器
- [ ] 能选择串口设备并连接

### 4. iframe 检查

- [ ] UI 内容区能加载 `ui.aibms.net`
- [ ] iframe 内能通过 `window.parent.AIBMSBridge` 调用 API
- [ ] 数据收发正常

---

## 故障排查

### 问题：蓝牙/串口 API 不可用

**原因**：缺少 `Permissions-Policy` 头

**解决**：确保部署平台正确应用了 `public/_headers` 中的配置。

### 问题：iframe 无法加载

**原因**：CSP 策略阻止了 iframe 加载

**解决**：检查 `Content-Security-Policy` 头中的 `frame-src` 是否包含 UI 域名。

### 问题：构建失败

**原因**：Node.js 版本不兼容

**解决**：确保使用 Node.js 18+，推荐 Node.js 20。

### 问题：主题切换不生效

**原因**：CSS 变量未正确覆盖

**解决**：检查浏览器 DevTools → Elements → `<html>` 是否有 `class="dark"`，Console 是否有 `[AIBMS Theme]` 日志。

---

## 多环境部署

| 环境 | 域名 | 分支 | UI 地址 |
|------|------|------|---------|
| 生产 | `app.aibms.net` | `main` | `https://ui.aibms.net` |
| 预览 | PR 自动生成的 URL | PR 分支 | `https://staging-ui.aibms.net` |
| 本地 | `localhost:5173` | 任意 | `http://localhost:5174` |

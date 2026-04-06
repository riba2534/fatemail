<p align="center">
  <img src="public/icons/icon-192x192.png" alt="FateMail Logo" width="100" height="100">
  <h1 align="center">FateMail</h1>
</p>

<p align="center">
  命运投递的临时邮箱 · Emails Delivered by Fate
</p>

<p align="center">
  <a href="https://fate.email">在线体验</a> ·
  <a href="#功能特性">功能特性</a> ·
  <a href="#快速部署">快速部署</a> ·
  <a href="#本地开发">本地开发</a> ·
  <a href="#权限系统">权限系统</a> ·
  <a href="#飞书通知">飞书通知</a> ·
  <a href="#开放-api">开放 API</a>
</p>

---

## 简介

FateMail 是一个基于 **Next.js + Cloudflare** 全家桶构建的临时邮箱服务。完全免费自托管，零服务器运维，开箱即用。

每一封邮件都是命运的馈赠，转瞬即逝，让每一次相遇都有迹可循。

**在线体验**：[https://fate.email](https://fate.email)

## 功能特性

- 🔒 **隐私保护** — 保护真实邮箱地址，远离垃圾邮件
- ⚡ **实时收信** — 自动轮询，即时接收邮件通知
- ⏱️ **灵活有效期** — 支持 1 小时、1 天、3 天或永久有效
- 📤 **发送邮件** — 支持用临时地址发信（基于 Resend）
- 🐦 **飞书通知** — 收到新邮件时自动推送飞书卡片到群聊
- 🛡️ **权限管理** — 四级角色体系（皇帝/公爵/骑士/平民）
- 👥 **用户管理** — 管理员可查看所有用户、修改角色、重置密码
- 🔑 **开放 API** — 完整的 RESTful API，支持 API Key 认证
- 🤖 **AI 友好** — CLI 工具专为 AI Agent 设计，支持自动化工作流
- 🌍 **多语言** — 中文、英文、日文、韩文、繁体中文
- 🎨 **明暗主题** — 支持亮色和暗色模式切换
- 📱 **响应式 + PWA** — 完美适配移动端，支持安装为应用
- 💸 **完全免费** — 基于 Cloudflare 免费套餐，零成本运行

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | [Next.js 15](https://nextjs.org/)（App Router） |
| 部署 | [Cloudflare Pages](https://pages.cloudflare.com/) |
| 数据库 | [Cloudflare D1](https://developers.cloudflare.com/d1/)（SQLite） |
| 认证 | [NextAuth](https://authjs.dev/) + GitHub/Google OAuth + 用户名密码 |
| 邮件接收 | [Cloudflare Email Workers](https://developers.cloudflare.com/email-routing/) |
| 邮件发送 | [Resend](https://resend.com/)（可选） |
| ORM | [Drizzle ORM](https://orm.drizzle.team/) |
| 样式 | [Tailwind CSS](https://tailwindcss.com/) + [Radix UI](https://www.radix-ui.com/) |
| 国际化 | [next-intl](https://next-intl-docs.vercel.app/) |
| 类型安全 | TypeScript |

## 快速部署

### 方式一：GitHub Actions 自动部署（推荐）

每次 push 到 `master` 分支自动部署。

1. Fork 本仓库
2. 在仓库 **Settings → Secrets and variables → Actions** 中添加以下 Secrets：

| Secret 名 | 说明 |
|-----------|------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API Token（需要 Pages/Workers/D1/KV Edit 权限） |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare 账户 ID |
| `AUTH_GITHUB_ID` | GitHub OAuth App Client ID |
| `AUTH_GITHUB_SECRET` | GitHub OAuth App Client Secret |
| `AUTH_SECRET` | NextAuth 加密密钥（随机字符串） |
| `CUSTOM_DOMAIN` | 自定义域名（可选，如 `fate.email`） |
| `PROJECT_NAME` | Pages 项目名（默认 `moemail`） |
| `DATABASE_NAME` | D1 数据库名（默认 `moemail-db`） |
| `KV_NAMESPACE_NAME` | KV 命名空间名（默认 `moemail-kv`） |

3. Push 代码或手动触发 Actions，等待 3-5 分钟即可上线

### 方式二：本地手动部署

```bash
cp .env.example .env
# 编辑 .env 填入所有环境变量
pnpm dlx tsx ./scripts/deploy/index.ts
```

部署脚本会自动完成：创建 D1 数据库 → 运行迁移 → 创建 KV → 构建 Pages → 部署 Workers。

### 部署后初始化

1. 访问你的域名，用 GitHub 登录
2. 浏览器访问 `https://你的域名/api/roles/init-emperor` 成为管理员（皇帝）
3. 进入 Profile 页面配置邮箱域名、默认角色等

### 邮件路由配置

在 Cloudflare 控制台为你的域名启用 Email Routing：

1. 选择域名 → Email → Email Routing → 启用
2. 配置 Catch-all 规则 → 动作选"Send to Worker" → 选择 `email-receiver-worker`
3. 保存

## 本地开发

```bash
# 克隆仓库
git clone https://github.com/riba2534/fatemail.git
cd fatemail

# 安装依赖
pnpm install

# 配置文件
cp .env.example .env.local
cp wrangler.example.json wrangler.json
cp wrangler.email.example.json wrangler.email.json
cp wrangler.cleanup.example.json wrangler.cleanup.json

# 初始化本地数据库
pnpm db:migrate-local

# 启动开发服务器
pnpm dev
```

### 常用命令

| 命令 | 说明 |
|------|------|
| `pnpm dev` | 启动开发服务器 |
| `pnpm run build:pages` | 构建 Cloudflare Pages 产物 |
| `pnpm db:migrate-local` | 应用数据库迁移（本地） |
| `pnpm db:migrate-remote` | 应用数据库迁移（远端） |
| `pnpm deploy:email` | 部署邮件接收 Worker |
| `pnpm deploy:cleanup` | 部署定时清理 Worker |
| `pnpm deploy:pages` | 构建并部署 Pages |

## 权限系统

采用 RBAC 四级角色体系：

| 角色 | 说明 | 权限 |
|------|------|------|
| 🏆 **皇帝** | 站长，唯一 | 所有权限 + 用户管理 + 系统配置 |
| 💎 **公爵** | 超级用户 | 临时邮箱 + 飞书通知 + API Key + 发信 5 封/天 |
| ⚔️ **骑士** | 高级用户 | 临时邮箱 + 飞书通知 + 发信 2 封/天 |
| 👤 **平民** | 普通用户 | 无权限，需管理员提升 |

**管理员后台**（皇帝专属）：
- 查看所有注册用户列表（支持搜索、分页、角色过滤）
- 修改任意用户的角色
- 重置任意用户的密码（自动生成临时密码或手动输入）
- 配置第三方登录开关（GitHub / Google）
- 配置邮箱域名、默认角色、Turnstile 验证等

## 飞书通知

收到新邮件时，自动发送精美卡片消息到飞书群聊。

**配置方法**：
1. 在飞书群聊 → 设置 → 群机器人 → 添加「自定义机器人」
2. 复制 Webhook 地址
3. 登录 fate.email → Profile → 飞书 Webhook → 粘贴地址并保存
4. 点击「发送测试」验证

> 建议关闭机器人的「签名校验」以确保消息正常送达。

## 邮件发送

支持用临时邮箱地址发送邮件，基于 [Resend](https://resend.com/) 服务（免费套餐：100 封/天）。

**配置方法**：
1. 在 [Resend](https://resend.com/) 注册并获取 API Key
2. 在 Resend 添加域名并验证 DNS（DKIM + SPF + DMARC）
3. 登录 fate.email → Profile → Resend 发件服务配置 → 开启并填入 API Key

## 开放 API

通过 API Key 调用接口，支持自动化集成。API Key 可在 Profile 页面创建（公爵及以上角色）。

请求时添加 Header：
```
X-API-Key: YOUR_API_KEY
```

### 主要接口

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/config` | 获取系统配置（邮箱域名等） |
| `POST` | `/api/emails/generate` | 创建临时邮箱 |
| `GET` | `/api/emails` | 获取邮箱列表 |
| `GET` | `/api/emails/{id}` | 获取邮箱的邮件列表 |
| `GET` | `/api/emails/{id}/{messageId}` | 读取单封邮件 |
| `DELETE` | `/api/emails/{id}` | 删除邮箱 |
| `POST` | `/api/emails/{id}/share` | 创建邮箱分享链接 |
| `POST` | `/api/emails/{id}/send` | 用临时邮箱发送邮件 |

### 创建临时邮箱示例

```bash
curl -X POST https://fate.email/api/emails/generate \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name": "test", "expiryTime": 3600000, "domain": "fate.email"}'
```

`expiryTime` 可选值：`3600000`（1 小时）、`86400000`（1 天）、`604800000`（7 天）、`0`（永久）

## CLI 工具

FateMail 提供面向 AI Agent 的命令行工具，支持自动化邮件工作流。

```bash
# 安装
npm i -g @fatemail/cli

# 配置
fatemail config set api-url https://fate.email
fatemail config set api-key YOUR_API_KEY

# 创建临时邮箱
fatemail create --domain fate.email --expiry 1h --json

# 等待新邮件
fatemail wait --email-id <id> --timeout 120 --json

# 读取邮件内容
fatemail read --email-id <id> --message-id <id> --json
```

详细文档见 [packages/cli/README.md](packages/cli/README.md)。

## 环境变量

| 变量名 | 说明 | 必需 |
|--------|------|------|
| `AUTH_SECRET` | NextAuth 加密密钥 | 是 |
| `AUTH_GITHUB_ID` | GitHub OAuth Client ID | 是 |
| `AUTH_GITHUB_SECRET` | GitHub OAuth Client Secret | 是 |
| `AUTH_GOOGLE_ID` | Google OAuth Client ID | 否 |
| `AUTH_GOOGLE_SECRET` | Google OAuth Client Secret | 否 |
| `CLOUDFLARE_API_TOKEN` | Cloudflare API Token | 部署时 |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare 账户 ID | 部署时 |
| `CUSTOM_DOMAIN` | 自定义域名 | 否 |

## GitHub OAuth 配置

1. 访问 [GitHub Developer Settings](https://github.com/settings/developers)，创建 OAuth App
2. **Homepage URL**：`https://你的域名`
3. **Authorization callback URL**：`https://你的域名/api/auth/callback/github`
4. 获取 Client ID 和 Client Secret

## 致谢

本项目 Fork 自 [beilunyang/moemail](https://github.com/beilunyang/moemail)，在此基础上进行了品牌改造、管理后台强化、飞书通知集成等定制开发。感谢原作者的开源贡献。

## 许可证

[MIT](LICENSE)

## 联系方式

- 邮箱：riba2534@qq.com
- GitHub：[@riba2534](https://github.com/riba2534)

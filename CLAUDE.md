# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FateMail (fate.email) is a temporary email service built with Next.js 15 + Cloudflare (Pages, D1, Workers, KV). Theme: "命运投递的临时邮箱 / Emails Delivered by Fate". Supports 5 languages (en, zh-CN, zh-TW, ja, ko).

## Essential Commands

```bash
# Development
pnpm dev                          # Start Next.js dev server
pnpm run build:pages              # Build for Cloudflare Pages (@cloudflare/next-on-pages)

# Database
pnpm exec drizzle-kit generate    # Generate migration from schema changes
pnpm run db:migrate-local         # Apply migrations to local D1
pnpm run db:migrate-remote        # Apply migrations to remote D1 (needs CLOUDFLARE_API_TOKEN)

# Deploy (manual, each needs CLOUDFLARE_API_TOKEN + CLOUDFLARE_ACCOUNT_ID env vars)
pnpm run deploy:pages             # Build + deploy Pages
pnpm run deploy:email             # Deploy email-receiver-worker
pnpm run deploy:cleanup           # Deploy cleanup-worker

# Full automated deploy
pnpm dlx tsx scripts/deploy/index.ts   # Orchestrates: D1 + KV + Pages + 2 Workers

# Local update script (contains hardcoded tokens, not in git)
./update.sh                       # Smart incremental update
./update.sh --all                 # Full redeploy
./update.sh --pages               # Pages only
./update.sh --workers             # Both workers only
./update.sh --db                  # Database migration only
```

## Architecture

### Deployment Units (3 independent)

| Unit | Config | Runtime | Trigger |
|------|--------|---------|---------|
| **Pages** (main app) | `wrangler.json` | Edge Functions (33 routes) | HTTP requests to fate.email |
| **email-receiver-worker** | `wrangler.email.json` | Cloudflare Worker | Email Routing catch-all (*@fate.email) |
| **cleanup-worker** | `wrangler.cleanup.json` | Cloudflare Worker | Cron `0 * * * *` (hourly) |

All three share the same D1 database (`moemail-db`). Pages also binds KV (`moemail-kv` as `SITE_CONFIG`).

### Cloudflare Resource Names (NEVER rename — production data)

- D1: `moemail-db`, KV: `moemail-kv`, Pages project: `moemail`
- Workers: `email-receiver-worker`, `cleanup-worker`

### Path Alias

`@/*` maps to `./app/*` (tsconfig paths).

### Auth Flow

NextAuth 5 beta with three providers:
- **GitHub/Google OAuth** — standard OAuth flow, accounts stored in `account` table
- **Credentials** — username/password, SHA-256 hash with `AUTH_SECRET` as salt (`app/lib/utils.ts: hashPassword`)

On first sign-in, user gets assigned `DEFAULT_ROLE` from KV SITE_CONFIG (defaults to CIVILIAN).

### Permission System (RBAC)

Defined in `app/lib/permissions.ts`. Four roles, six permissions:

```
EMPEROR → all permissions (Object.values(PERMISSIONS))
DUKE    → MANAGE_EMAIL, MANAGE_WEBHOOK, MANAGE_API_KEY
KNIGHT  → MANAGE_EMAIL, MANAGE_WEBHOOK
CIVILIAN → none
```

Backend check: `checkPermission(PERMISSIONS.XXX)` in `app/lib/auth.ts`.
Frontend check: `useRolePermission()` hook in `app/hooks/use-role-permission.ts`.
Middleware enforces permissions per route pattern in `middleware.ts`.

### API Authentication (dual path)

1. **Session** — NextAuth session cookie (browser users)
2. **API Key** — `X-API-Key` header → middleware sets `X-User-Id` → `getUserId()` reads it

`getUserId()` (`app/lib/apiKey.ts`) checks `X-User-Id` header first, then session. This enables both browser and API key access to the same endpoints.

### Database (Drizzle ORM + D1)

Schema in `app/lib/schema.ts`. Key tables: `user`, `email`, `message`, `role`, `user_role`, `webhook`, `api_keys`, `email_share`, `message_share`, `account`.

Cascade deletes: user→emails→messages, user→userRoles, email→emailShares, message→messageShares.

**Pagination**: cursor-based using `(createdAt, id)` encoded as base64 (`app/lib/cursor.ts`).

**All API routes must declare `export const runtime = "edge"`** — Cloudflare Pages constraint.

### Webhook Adapter Pattern

`app/lib/webhook-adapter.ts` supports two types:
- `standard` — JSON payload with `X-Webhook-Event: new_message` header
- `feishu` — Feishu interactive card format (auto-detected by URL host: `open.larkoffice.com` or `open.feishu.cn`)

`detectWebhookType(url)` auto-classifies on save; `buildWebhookPayload(type, data)` generates the correct format. Used in both `workers/email-receiver.ts` (production) and `app/api/webhook/test/route.ts` (testing).

### Email Flow

```
External SMTP → Cloudflare MX → Email Routing (catch-all) → email-receiver-worker
  → PostalMime parse → lookup email in D1 → save message → trigger webhook (if enabled)
```

### i18n

5 languages × 6 JSON files under `app/i18n/messages/{locale}/`. Files: `auth.json`, `common.json`, `emails.json`, `home.json`, `metadata.json`, `profile.json`.

Use `useTranslations("namespace.key")` client-side, `getTranslations()` server-side.

### Key Config Files (not in git)

These contain real Cloudflare resource IDs and secrets. Copy from examples when setting up:
- `.env` (from `.env.example`)
- `wrangler.json` (from `wrangler.example.json`)
- `wrangler.email.json` (from `wrangler.email.example.json`)
- `wrangler.cleanup.json` (from `wrangler.cleanup.example.json`)
- `update.sh` (local maintenance script with embedded tokens)

### GitHub Actions

`.github/workflows/deploy.yml` triggers on push to `master`/`main`. Runs `scripts/deploy/index.ts` which orchestrates the full deployment pipeline (D1 create/migrate → KV create → Pages create/deploy → Workers deploy). Requires 13 GitHub Secrets.

### Pre-push Checklist

**推送前必须验证构建通过**。项目启用了 ESLint 严格检查（未使用的导入/变量会导致构建失败），CI 通过 `pnpm run build:pages` 构建。

推送前至少执行以下检查之一：
- `npx next lint` — 快速 ESLint 检查
- `pnpm run build:pages` — 完整构建验证（与 CI 一致）

常见导致 CI 失败的问题：
- 导入了未使用的模块/变量（`@typescript-eslint/no-unused-vars`）
- 缺少 React Hook 依赖（`react-hooks/exhaustive-deps`，warning 不阻断但应注意）

### CLI Tool

`packages/cli/` — `@fatemail/cli` npm package. Agent-first design for AI automation workflows. Binary name: `fatemail`. Config dir: `~/.fatemail/`. Env vars: `FATEMAIL_API_URL`, `FATEMAIL_API_KEY`.

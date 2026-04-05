import { WEBHOOK_CONFIG } from "@/config"
import type { EmailMessage } from "@/lib/webhook"

export type WebhookType = "standard" | "feishu"

const FEISHU_HOSTS = new Set(["open.larkoffice.com", "open.feishu.cn"])
const FEISHU_PATH_PREFIX = "/open-apis/bot/v2/hook/"

export function detectWebhookType(url: string): WebhookType {
  try {
    const u = new URL(url)
    if (FEISHU_HOSTS.has(u.hostname) && u.pathname.startsWith(FEISHU_PATH_PREFIX)) {
      return "feishu"
    }
  } catch {}
  return "standard"
}

interface BuiltPayload {
  headers: Record<string, string>
  body: string
}

const FEISHU_CONTENT_MAX = 200

function truncate(text: string, max: number): string {
  if (!text) return ""
  const cleaned = text.replace(/\s+/g, " ").trim()
  return cleaned.length > max ? cleaned.slice(0, max) + "…" : cleaned
}

function buildFeishuCard(data: EmailMessage): string {
  const preview = truncate(data.content, FEISHU_CONTENT_MAX) || "(无正文)"
  const receivedAt = data.receivedAt || new Date().toISOString()

  const card = {
    msg_type: "interactive",
    card: {
      config: { wide_screen_mode: true },
      header: {
        title: { tag: "plain_text", content: "📧 fate.email 新邮件" },
        template: "blue",
      },
      elements: [
        {
          tag: "div",
          fields: [
            {
              is_short: true,
              text: { tag: "lark_md", content: `**发件人**\n${data.fromAddress || "-"}` },
            },
            {
              is_short: true,
              text: { tag: "lark_md", content: `**收件人**\n${data.toAddress || "-"}` },
            },
          ],
        },
        {
          tag: "div",
          text: { tag: "lark_md", content: `**主题**：${data.subject || "(无主题)"}` },
        },
        { tag: "hr" },
        { tag: "div", text: { tag: "lark_md", content: preview } },
        {
          tag: "note",
          elements: [{ tag: "plain_text", content: receivedAt }],
        },
      ],
    },
  }

  return JSON.stringify(card)
}

export function buildWebhookPayload(
  type: WebhookType,
  data: EmailMessage,
): BuiltPayload {
  if (type === "feishu") {
    return {
      headers: { "Content-Type": "application/json" },
      body: buildFeishuCard(data),
    }
  }
  return {
    headers: {
      "Content-Type": "application/json",
      "X-Webhook-Event": WEBHOOK_CONFIG.EVENTS.NEW_MESSAGE,
    },
    body: JSON.stringify(data),
  }
}

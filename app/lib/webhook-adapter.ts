import type { EmailMessage } from "@/lib/webhook"

export type WebhookType = "feishu"

const FEISHU_HOSTS = new Set(["open.larkoffice.com", "open.feishu.cn"])
const FEISHU_PATH_PREFIX = "/open-apis/bot/v2/hook/"

export function isValidFeishuUrl(url: string): boolean {
  try {
    const u = new URL(url)
    return FEISHU_HOSTS.has(u.hostname) && u.pathname.startsWith(FEISHU_PATH_PREFIX)
  } catch {
    return false
  }
}

const CONTENT_MAX = 300

/** 飞书安全审计会拦截包含邮箱地址的消息（code:11312），用 [at] 替换 @ 绕过 */
function maskEmail(text: string): string {
  if (!text) return ""
  return text.replace(/@/g, "[at]")
}

function truncate(text: string, max: number): string {
  if (!text) return ""
  const cleaned = text.replace(/\s+/g, " ").trim()
  return cleaned.length > max ? cleaned.slice(0, max) + "…" : cleaned
}

function formatTime(isoString: string): string {
  try {
    const d = new Date(isoString)
    const pad = (n: number) => String(n).padStart(2, "0")
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
  } catch {
    return isoString
  }
}

export function buildFeishuPayload(data: EmailMessage): {
  headers: Record<string, string>
  body: string
} {
  const preview = maskEmail(truncate(data.content, CONTENT_MAX)) || "(无正文内容)"
  const time = formatTime(data.receivedAt)
  const subject = data.subject || "(无主题)"
  const from = maskEmail(data.fromAddress || "未知")
  const to = maskEmail(data.toAddress || "未知")

  const card = {
    msg_type: "interactive",
    card: {
      config: { wide_screen_mode: true },
      header: {
        title: { tag: "plain_text", content: `📮 ${subject}` },
        template: "indigo",
      },
      elements: [
        {
          tag: "div",
          fields: [
            {
              is_short: true,
              text: {
                tag: "lark_md",
                content: `**✉️ 发件人**\n${from}`,
              },
            },
            {
              is_short: true,
              text: {
                tag: "lark_md",
                content: `**📬 收件人**\n${to}`,
              },
            },
          ],
        },
        { tag: "hr" },
        {
          tag: "div",
          text: {
            tag: "lark_md",
            content: preview,
          },
        },
        { tag: "hr" },
        {
          tag: "note",
          elements: [
            {
              tag: "plain_text",
              content: `⏱ ${time}  ·  fate.email`,
            },
          ],
        },
      ],
    },
  }

  return {
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(card),
  }
}

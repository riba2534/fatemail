import { WEBHOOK_CONFIG } from "@/config"
import { buildFeishuPayload } from "@/lib/webhook-adapter"

export interface EmailMessage {
  emailId: string
  messageId: string
  fromAddress: string
  subject: string
  content: string
  html: string
  receivedAt: string
  toAddress: string
}

export async function callFeishuWebhook(url: string, data: EmailMessage) {
  let lastError: Error | null = null
  const { headers, body } = buildFeishuPayload(data)

  for (let i = 0; i < WEBHOOK_CONFIG.MAX_RETRIES; i++) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), WEBHOOK_CONFIG.TIMEOUT)

      const response = await fetch(url, {
        method: "POST",
        headers,
        body,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        return true
      }

      lastError = new Error(`HTTP error! status: ${response.status}`)
    } catch (error) {
      lastError = error as Error

      if (i < WEBHOOK_CONFIG.MAX_RETRIES - 1) {
        await new Promise(resolve => setTimeout(resolve, WEBHOOK_CONFIG.RETRY_DELAY))
      }
    }
  }

  throw lastError
}

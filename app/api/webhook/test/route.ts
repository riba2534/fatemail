import { callWebhook } from "@/lib/webhook"
import { detectWebhookType } from "@/lib/webhook-adapter"
import { WEBHOOK_CONFIG } from "@/config"
import { z } from "zod"
import { EmailMessage } from "@/lib/webhook"

export const runtime = "edge"

const testSchema = z.object({
  url: z.string().url()
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { url } = testSchema.parse(body)
    const type = detectWebhookType(url)

    await callWebhook(
      url,
      {
        event: WEBHOOK_CONFIG.EVENTS.NEW_MESSAGE,
        data: {
          emailId: "test-email-id",
          messageId: "test-message-id",
          fromAddress: "sender@example.com",
          subject: "FateMail Webhook 测试",
          content: "这是一条来自 fate.email 的测试消息。若你看到此内容，说明 Webhook 已成功连通。",
          html: "<p>这是一条来自 <strong>fate.email</strong> 的测试消息。</p>",
          receivedAt: new Date().toISOString(),
          toAddress: "test@fate.email"
        } as EmailMessage
      },
      type,
    )

    return Response.json({ success: true, type })
  } catch (error) {
    console.error("Failed to test webhook:", error)
    return Response.json(
      { error: "Failed to test webhook" },
      { status: 400 }
    )
  }
}

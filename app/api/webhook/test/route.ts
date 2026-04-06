import { callFeishuWebhook } from "@/lib/webhook"
import { isValidFeishuUrl } from "@/lib/webhook-adapter"
import { z } from "zod"
import type { EmailMessage } from "@/lib/webhook"

export const runtime = "edge"

const testSchema = z.object({
  url: z.string().url()
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { url } = testSchema.parse(body)

    if (!isValidFeishuUrl(url)) {
      return Response.json({ error: "无效的飞书 Webhook 地址" }, { status: 400 })
    }

    await callFeishuWebhook(url, {
      emailId: "test-email-id",
      messageId: "test-message-id",
      fromAddress: "noreply@example.com",
      subject: "FateMail 飞书通知测试",
      content: "这是一条来自 fate.email 的测试消息。如果你在飞书群中看到了这张卡片，说明 Webhook 已经配置成功。\n\n命运投递的临时邮箱，让每一次相遇都有迹可循。",
      html: "",
      receivedAt: new Date().toISOString(),
      toAddress: "test@fate.email",
    } as EmailMessage)

    return Response.json({ success: true })
  } catch (error) {
    console.error("Failed to test webhook:", error)
    return Response.json({ error: "测试失败，请检查飞书机器人配置" }, { status: 400 })
  }
}

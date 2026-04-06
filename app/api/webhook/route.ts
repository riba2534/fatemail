import { auth } from "@/lib/auth"
import { createDb } from "@/lib/db"
import { webhooks } from "@/lib/schema"
import { isValidFeishuUrl } from "@/lib/webhook-adapter"
import { eq } from "drizzle-orm"
import { z } from "zod"

export const runtime = "edge"

const webhookSchema = z.object({
  url: z.string(),
})

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const db = createDb()
  const webhook = await db.query.webhooks.findFirst({
    where: eq(webhooks.userId, session.user.id)
  })

  return Response.json(webhook || { enabled: false, url: "" })
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { url } = webhookSchema.parse(body)

    const db = createDb()
    const now = new Date()

    // 空 URL 表示清除 webhook
    if (!url.trim()) {
      await db.delete(webhooks).where(eq(webhooks.userId, session.user.id))
      return Response.json({ success: true })
    }

    // 验证飞书 URL 格式
    if (!isValidFeishuUrl(url)) {
      return Response.json(
        { error: "请输入有效的飞书群机器人 Webhook 地址" },
        { status: 400 }
      )
    }

    const existingWebhook = await db.query.webhooks.findFirst({
      where: eq(webhooks.userId, session.user.id)
    })

    if (existingWebhook) {
      await db
        .update(webhooks)
        .set({ url, type: "feishu", enabled: true, updatedAt: now })
        .where(eq(webhooks.userId, session.user.id))
    } else {
      await db
        .insert(webhooks)
        .values({ userId: session.user.id, url, type: "feishu", enabled: true })
    }

    return Response.json({ success: true })
  } catch (error) {
    console.error("Failed to save webhook:", error)
    return Response.json({ error: "Invalid request" }, { status: 400 })
  }
}

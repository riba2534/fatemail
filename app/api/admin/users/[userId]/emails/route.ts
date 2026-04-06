import { createDb } from "@/lib/db"
import { emails } from "@/lib/schema"
import { checkPermission } from "@/lib/auth"
import { PERMISSIONS } from "@/lib/permissions"
import { eq, desc, sql } from "drizzle-orm"

export const runtime = "edge"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const canManage = await checkPermission(PERMISSIONS.MANAGE_USERS)
    if (!canManage) {
      return Response.json({ error: "权限不足" }, { status: 403 })
    }

    const { userId } = await params
    if (!userId) {
      return Response.json({ error: "缺少 userId" }, { status: 400 })
    }

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, Number(searchParams.get("page") || "1"))
    const pageSize = Math.min(50, Math.max(1, Number(searchParams.get("pageSize") || "20")))
    const offset = (page - 1) * pageSize

    const db = createDb()
    const now = Date.now()

    const totalRow = await db
      .select({ c: sql<number>`count(*)` })
      .from(emails)
      .where(eq(emails.userId, userId))
    const total = Number(totalRow[0]?.c ?? 0)

    const rows = await db
      .select()
      .from(emails)
      .where(eq(emails.userId, userId))
      .orderBy(desc(emails.createdAt))
      .limit(pageSize)
      .offset(offset)

    const items = rows.map((e) => ({
      id: e.id,
      address: e.address,
      createdAt: e.createdAt.getTime(),
      expiresAt: e.expiresAt.getTime(),
      expired: e.expiresAt.getTime() < now,
    }))

    return Response.json({
      items,
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    })
  } catch (error) {
    console.error("Failed to list user emails:", error)
    return Response.json({ error: "获取用户邮箱列表失败" }, { status: 500 })
  }
}

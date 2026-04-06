import { createDb } from "@/lib/db"
import { emails, users } from "@/lib/schema"
import { checkPermission } from "@/lib/auth"
import { PERMISSIONS } from "@/lib/permissions"
import { like, sql, inArray } from "drizzle-orm"

export const runtime = "edge"

export async function GET(request: Request) {
  try {
    const canManage = await checkPermission(PERMISSIONS.MANAGE_USERS)
    if (!canManage) {
      return Response.json({ error: "权限不足" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const q = (searchParams.get("q") || "").trim()
    if (!q) {
      return Response.json({ items: [], total: 0 })
    }

    const db = createDb()
    const now = Date.now()

    const emailRows = await db
      .select()
      .from(emails)
      .where(like(sql`LOWER(${emails.address})`, `%${q.toLowerCase()}%`))
      .limit(20)

    if (emailRows.length === 0) {
      return Response.json({ items: [], total: 0 })
    }

    const userIds = [...new Set(emailRows.map((e) => e.userId).filter(Boolean))] as string[]

    const userRows = userIds.length
      ? await db.query.users.findMany({
          where: inArray(users.id, userIds),
          with: {
            userRoles: {
              with: { role: true },
            },
          },
        })
      : []

    const userMap = new Map(
      userRows.map((u) => [
        u.id,
        {
          id: u.id,
          username: u.username,
          name: u.name,
          email: u.email,
          role: u.userRoles[0]?.role.name ?? null,
        },
      ])
    )

    const items = emailRows.map((e) => ({
      id: e.id,
      address: e.address,
      createdAt: e.createdAt.getTime(),
      expiresAt: e.expiresAt.getTime(),
      expired: e.expiresAt.getTime() < now,
      user: e.userId ? userMap.get(e.userId) ?? null : null,
    }))

    return Response.json({ items, total: items.length })
  } catch (error) {
    console.error("Failed to search emails:", error)
    return Response.json({ error: "搜索邮箱失败" }, { status: 500 })
  }
}

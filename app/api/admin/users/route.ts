import { createDb } from "@/lib/db"
import { users, accounts, emails } from "@/lib/schema"
import { checkPermission } from "@/lib/auth"
import { PERMISSIONS } from "@/lib/permissions"
import { like, or, sql, desc, inArray, eq } from "drizzle-orm"

export const runtime = "edge"

export async function GET(request: Request) {
  try {
    const canManage = await checkPermission(PERMISSIONS.MANAGE_USERS)
    if (!canManage) {
      return Response.json({ error: "权限不足" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, Number(searchParams.get("page") || "1"))
    const pageSize = Math.min(50, Math.max(1, Number(searchParams.get("pageSize") || "20")))
    const search = (searchParams.get("search") || "").trim()
    const roleFilter = (searchParams.get("role") || "").trim()

    const db = createDb()

    const whereClause = search
      ? or(
          like(users.username, `%${search}%`),
          like(users.email, `%${search}%`),
          like(users.name, `%${search}%`),
        )
      : undefined

    const totalRow = await db.select({ c: sql<number>`count(*)` })
      .from(users)
      .where(whereClause)
    const total = Number(totalRow[0]?.c ?? 0)

    const offset = (page - 1) * pageSize

    const rows = await db.query.users.findMany({
      where: whereClause,
      limit: pageSize,
      offset,
      orderBy: [desc(users.createdAt)],
      with: {
        userRoles: {
          with: { role: true },
        },
      },
    })

    const userIds = rows.map(r => r.id)
    const providerRows = userIds.length
      ? await db.select({
          userId: accounts.userId,
          provider: accounts.provider,
        }).from(accounts).where(inArray(accounts.userId, userIds))
      : []

    const providersByUser = new Map<string, string[]>()
    for (const row of providerRows) {
      const arr = providersByUser.get(row.userId) ?? []
      arr.push(row.provider)
      providersByUser.set(row.userId, arr)
    }

    const emailCountRows = userIds.length
      ? await db.select({
          userId: emails.userId,
          count: sql<number>`count(*)`,
        }).from(emails).where(inArray(emails.userId, userIds)).groupBy(emails.userId)
      : []

    const emailCountByUser = new Map<string, number>()
    for (const row of emailCountRows) {
      if (row.userId) emailCountByUser.set(row.userId, Number(row.count))
    }

    let items = rows.map(u => {
      const providers = providersByUser.get(u.id) ?? []
      if (u.password) providers.push("credentials")
      return {
        id: u.id,
        name: u.name,
        username: u.username,
        email: u.email,
        role: u.userRoles[0]?.role.name ?? null,
        createdAt: u.createdAt?.getTime() ?? null,
        providers,
        emailCount: emailCountByUser.get(u.id) ?? 0,
      }
    })

    if (roleFilter) {
      items = items.filter(u => u.role === roleFilter)
    }

    return Response.json({
      items,
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    })
  } catch (error) {
    console.error("Failed to list users:", error)
    return Response.json({ error: "获取用户列表失败" }, { status: 500 })
  }
}

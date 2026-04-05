import { createDb } from "@/lib/db"
import { users } from "@/lib/schema"
import { checkPermission } from "@/lib/auth"
import { PERMISSIONS } from "@/lib/permissions"
import { hashPassword } from "@/lib/utils"
import { eq } from "drizzle-orm"

export const runtime = "edge"

const TEMP_PASSWORD_LENGTH = 12
const TEMP_PASSWORD_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#"

function generateTempPassword(): string {
  const buf = new Uint8Array(TEMP_PASSWORD_LENGTH)
  crypto.getRandomValues(buf)
  let out = ""
  for (let i = 0; i < buf.length; i++) {
    out += TEMP_PASSWORD_CHARS[buf[i] % TEMP_PASSWORD_CHARS.length]
  }
  return out
}

export async function POST(
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

    const body = await request.json() as { newPassword?: string, generate?: boolean }

    let plain: string
    if (body.generate) {
      plain = generateTempPassword()
    } else {
      plain = (body.newPassword ?? "").trim()
      if (plain.length < 8) {
        return Response.json({ error: "密码至少 8 位" }, { status: 400 })
      }
    }

    const db = createDb()
    const target = await db.query.users.findFirst({ where: eq(users.id, userId) })
    if (!target) {
      return Response.json({ error: "用户不存在" }, { status: 404 })
    }

    if (!target.username && !target.password) {
      return Response.json(
        { error: "该用户使用 OAuth 登录，无密码可重置" },
        { status: 400 }
      )
    }

    const hashed = await hashPassword(plain)
    await db.update(users).set({ password: hashed }).where(eq(users.id, userId))

    return Response.json({
      success: true,
      tempPassword: body.generate ? plain : undefined,
    })
  } catch (error) {
    console.error("Failed to reset password:", error)
    return Response.json({ error: "重置密码失败" }, { status: 500 })
  }
}

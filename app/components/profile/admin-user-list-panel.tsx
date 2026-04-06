"use client"

import { useState, useEffect, useCallback } from "react"
import { useTranslations } from "next-intl"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Users,
  Crown,
  Gem,
  Sword,
  User2,
  Loader2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  KeyRound,
  Copy,
  Github,
  Mail,
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useCopy } from "@/hooks/use-copy"
import { ROLES, Role } from "@/lib/permissions"
import { AdminUserEmailsDialog } from "./admin-user-emails-dialog"
import { AdminEmailSearchResults } from "./admin-email-search-results"

type AdminUser = {
  id: string
  name: string | null
  username: string | null
  email: string | null
  role: string | null
  createdAt: number | null
  providers: string[]
}

type RoleWithoutEmperor = Exclude<Role, typeof ROLES.EMPEROR>

const roleIcons: Record<string, typeof User2> = {
  emperor: Crown,
  duke: Gem,
  knight: Sword,
  civilian: User2,
}

export function AdminUserListPanel() {
  const t = useTranslations("profile.admin")
  const tCard = useTranslations("profile.card")
  const { toast } = useToast()
  const { copyToClipboard } = useCopy()
  const { data: session } = useSession()
  const currentUserId = session?.user?.id

  const [items, setItems] = useState<AdminUser[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [loading, setLoading] = useState(false)
  const [searchMode, setSearchMode] = useState<"user" | "email">("user")
  const [emailSearchQuery, setEmailSearchQuery] = useState("")
  const [emailDialogUser, setEmailDialogUser] = useState<AdminUser | null>(null)

  const [roleDialogUser, setRoleDialogUser] = useState<AdminUser | null>(null)
  const [newRole, setNewRole] = useState<RoleWithoutEmperor>(ROLES.KNIGHT)
  const [pwConfirmUser, setPwConfirmUser] = useState<AdminUser | null>(null)
  const [pwDialogUser, setPwDialogUser] = useState<AdminUser | null>(null)
  const [pwMode, setPwMode] = useState<"generate" | "manual">("generate")
  const [pwInput, setPwInput] = useState("")
  const [tempPassword, setTempPassword] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const roleNames: Record<string, string> = {
    emperor: tCard("roles.EMPEROR"),
    duke: tCard("roles.DUKE"),
    knight: tCard("roles.KNIGHT"),
    civilian: tCard("roles.CIVILIAN"),
  }

  const fetchList = useCallback(async () => {
    setLoading(true)
    try {
      const qs = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      })
      if (search) qs.set("search", search)
      if (roleFilter && roleFilter !== "all") qs.set("role", roleFilter)
      const res = await fetch(`/api/admin/users?${qs.toString()}`)
      if (!res.ok) throw new Error()
      const data = (await res.json()) as {
        items: AdminUser[]
        total: number
        totalPages: number
      }
      setItems(data.items)
      setTotal(data.total)
      setTotalPages(data.totalPages)
    } catch {
      toast({ title: t("fetchFailed"), variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, search, roleFilter, t, toast])

  useEffect(() => {
    fetchList()
  }, [fetchList])

  const handleSearch = () => {
    setPage(1)
    setSearch(searchInput.trim())
  }

  const handleOpenRoleDialog = (user: AdminUser) => {
    setRoleDialogUser(user)
    setNewRole(
      user.role === ROLES.DUKE || user.role === ROLES.KNIGHT || user.role === ROLES.CIVILIAN
        ? user.role
        : ROLES.KNIGHT
    )
  }

  const handleSubmitRoleChange = async () => {
    if (!roleDialogUser) return
    setBusy(true)
    try {
      const res = await fetch("/api/roles/promote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: roleDialogUser.id, roleName: newRole }),
      })
      const data = (await res.json()) as { success?: boolean; error?: string }
      if (!res.ok) throw new Error(data.error || "")
      toast({ title: t("roleUpdateSuccess") })
      setRoleDialogUser(null)
      fetchList()
    } catch (e) {
      toast({
        title: t("roleUpdateFailed"),
        description: e instanceof Error ? e.message : undefined,
        variant: "destructive",
      })
    } finally {
      setBusy(false)
    }
  }

  const handleConfirmResetPassword = (user: AdminUser) => {
    setPwConfirmUser(user)
  }

  const handleProceedReset = () => {
    if (!pwConfirmUser) return
    setPwDialogUser(pwConfirmUser)
    setPwConfirmUser(null)
    setPwMode("generate")
    setPwInput("")
    setTempPassword(null)
  }

  const handleSubmitResetPassword = async () => {
    if (!pwDialogUser) return
    setBusy(true)
    try {
      const body: Record<string, unknown> =
        pwMode === "generate" ? { generate: true } : { newPassword: pwInput }
      const res = await fetch(
        `/api/admin/users/${pwDialogUser.id}/reset-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      )
      const data = (await res.json()) as {
        success?: boolean
        tempPassword?: string
        error?: string
      }
      if (!res.ok) throw new Error(data.error || "")
      if (pwMode === "generate" && data.tempPassword) {
        setTempPassword(data.tempPassword)
      } else {
        toast({ title: t("pwResetSuccess") })
        setPwDialogUser(null)
      }
    } catch (e) {
      toast({
        title: t("pwResetFailed"),
        description: e instanceof Error ? e.message : undefined,
        variant: "destructive",
      })
    } finally {
      setBusy(false)
    }
  }

  const handleClosePwDialog = () => {
    setPwDialogUser(null)
    setTempPassword(null)
    setPwInput("")
  }

  const formatDate = (ts: number | null) => {
    if (!ts) return "-"
    const d = new Date(ts)
    return d.toISOString().slice(0, 10)
  }

  const renderProvider = (p: string) => {
    if (p === "github") return <Github className="w-3 h-3" key={p} />
    if (p === "credentials")
      return (
        <span
          key={p}
          className="text-[10px] px-1 rounded bg-primary/10 text-primary"
        >
          {t("provider.credentials")}
        </span>
      )
    if (p === "google")
      return (
        <span
          key={p}
          className="text-[10px] px-1 rounded bg-red-500/10 text-red-500"
        >
          {t("provider.google")}
        </span>
      )
    return null
  }

  return (
    <div className="bg-background rounded-lg border-2 border-primary/20 p-6">
      <div className="flex items-center gap-2 mb-6">
        <Users className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold">{t("title")}</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-4">{t("description")}</p>

      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <Select
          value={searchMode}
          onValueChange={(v: "user" | "email") => {
            setSearchMode(v)
            setSearchInput("")
            setSearch("")
            setEmailSearchQuery("")
            setPage(1)
          }}
        >
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="user">
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                {t("search.modeUser")}
              </div>
            </SelectItem>
            <SelectItem value="email">
              <div className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" />
                {t("search.modeEmail")}
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
        <Input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder={searchMode === "user" ? t("search.placeholder") : t("search.emailPlaceholder")}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              if (searchMode === "user") {
                handleSearch()
              } else {
                setEmailSearchQuery(searchInput.trim())
              }
            }
          }}
          className="flex-1"
        />
        {searchMode === "user" && (
          <Select
            value={roleFilter}
            onValueChange={(v) => {
              setRoleFilter(v)
              setPage(1)
            }}
          >
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("filter.allRoles")}</SelectItem>
              <SelectItem value={ROLES.EMPEROR}>{roleNames.emperor}</SelectItem>
              <SelectItem value={ROLES.DUKE}>{roleNames.duke}</SelectItem>
              <SelectItem value={ROLES.KNIGHT}>{roleNames.knight}</SelectItem>
              <SelectItem value={ROLES.CIVILIAN}>
                {roleNames.civilian}
              </SelectItem>
            </SelectContent>
          </Select>
        )}
        <Button
          variant="outline"
          onClick={() => {
            if (searchMode === "user") {
              handleSearch()
            } else {
              setEmailSearchQuery(searchInput.trim())
            }
          }}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
        </Button>
      </div>

      {searchMode === "email" ? (
        <AdminEmailSearchResults
          searchQuery={emailSearchQuery}
          onViewUserEmails={(user) => setEmailDialogUser(user as AdminUser)}
        />
      ) : (
      <>
      <div className="border rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-3 py-2 font-medium">
                {t("column.username")}
              </th>
              <th className="text-left px-3 py-2 font-medium hidden md:table-cell">
                {t("column.email")}
              </th>
              <th className="text-left px-3 py-2 font-medium">
                {t("column.role")}
              </th>
              <th className="text-left px-3 py-2 font-medium hidden lg:table-cell">
                {t("column.createdAt")}
              </th>
              <th className="text-left px-3 py-2 font-medium hidden md:table-cell">
                {t("column.providers")}
              </th>
              <th className="text-right px-3 py-2 font-medium">
                {t("column.actions")}
              </th>
            </tr>
          </thead>
          <tbody>
            {loading && items.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">
                  {t("loading")}
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">
                  {t("empty")}
                </td>
              </tr>
            ) : (
              items.map((u) => {
                const isSelf = u.id === currentUserId
                const isEmperor = u.role === ROLES.EMPEROR
                const RoleIcon = roleIcons[u.role ?? "civilian"] ?? User2
                const hasCredentials = u.providers.includes("credentials")
                const roleDisabled = isSelf || isEmperor
                const pwDisabled = isEmperor || !hasCredentials
                return (
                  <tr key={u.id} className="border-t">
                    <td className="px-3 py-2">
                      <button
                        className="font-medium truncate max-w-[160px] text-primary hover:underline underline-offset-2 text-left"
                        onClick={() => setEmailDialogUser(u)}
                      >
                        {u.username || u.name || "-"}
                      </button>
                    </td>
                    <td className="px-3 py-2 hidden md:table-cell">
                      <div className="truncate max-w-[200px] text-muted-foreground">
                        {u.email || "-"}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                        <RoleIcon className="w-3 h-3" />
                        {roleNames[u.role ?? "civilian"] ?? "-"}
                      </div>
                    </td>
                    <td className="px-3 py-2 hidden lg:table-cell text-muted-foreground text-xs">
                      {formatDate(u.createdAt)}
                    </td>
                    <td className="px-3 py-2 hidden md:table-cell">
                      <div className="flex gap-1 items-center">
                        {u.providers.map(renderProvider)}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex gap-1 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={roleDisabled}
                          title={
                            isSelf
                              ? t("roleDialog.cannotSelf")
                              : isEmperor
                              ? t("roleDialog.cannotEmperor")
                              : undefined
                          }
                          onClick={() => handleOpenRoleDialog(u)}
                        >
                          {t("action.changeRole")}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={pwDisabled}
                          title={
                            isEmperor
                              ? t("roleDialog.cannotEmperor")
                              : !hasCredentials
                              ? t("pwResetOAuthOnly")
                              : undefined
                          }
                          onClick={() => handleConfirmResetPassword(u)}
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
        <span>{t("total", { count: total })}</span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span>
            {t("pagination.page", { page, total: totalPages })}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages || loading}
            onClick={() => setPage((p) => p + 1)}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
      </>
      )}

      {/* 用户邮箱 Dialog */}
      <AdminUserEmailsDialog
        user={emailDialogUser}
        onClose={() => setEmailDialogUser(null)}
      />

      {/* 改角色 Dialog */}
      <Dialog
        open={!!roleDialogUser}
        onOpenChange={(open) => !open && setRoleDialogUser(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("roleDialog.title")}</DialogTitle>
            <DialogDescription>
              {roleDialogUser && (
                <span>
                  {t("roleDialog.description", {
                    user: roleDialogUser.username || roleDialogUser.email || "-",
                  })}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select
              value={newRole}
              onValueChange={(v) => setNewRole(v as RoleWithoutEmperor)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ROLES.DUKE}>
                  <div className="flex items-center gap-2">
                    <Gem className="w-4 h-4" />
                    {roleNames.duke}
                  </div>
                </SelectItem>
                <SelectItem value={ROLES.KNIGHT}>
                  <div className="flex items-center gap-2">
                    <Sword className="w-4 h-4" />
                    {roleNames.knight}
                  </div>
                </SelectItem>
                <SelectItem value={ROLES.CIVILIAN}>
                  <div className="flex items-center gap-2">
                    <User2 className="w-4 h-4" />
                    {roleNames.civilian}
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRoleDialogUser(null)}
              disabled={busy}
            >
              {t("roleDialog.cancel")}
            </Button>
            <Button onClick={handleSubmitRoleChange} disabled={busy}>
              {busy ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                t("roleDialog.confirm")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 重置密码二次确认 */}
      <AlertDialog
        open={!!pwConfirmUser}
        onOpenChange={(open) => !open && setPwConfirmUser(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("pwDialog.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {pwConfirmUser && (
                <span>
                  {t("pwDialog.description", {
                    user: pwConfirmUser.username || pwConfirmUser.email || "-",
                  })}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("pwDialog.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleProceedReset}>
              {t("pwDialog.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 重置密码主 Dialog */}
      <Dialog open={!!pwDialogUser} onOpenChange={(open) => !open && handleClosePwDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("pwDialog.title")}</DialogTitle>
          </DialogHeader>
          {tempPassword ? (
            <div className="py-4 space-y-3">
              <p className="text-sm">{t("pwDialog.tempPassword")}</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-muted px-3 py-2 rounded font-mono text-sm break-all">
                  {tempPassword}
                </code>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(tempPassword)}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {t("pwDialog.copyHint")}
              </p>
            </div>
          ) : (
            <div className="py-4 space-y-4">
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    checked={pwMode === "generate"}
                    onChange={() => setPwMode("generate")}
                  />
                  {t("pwDialog.generate")}
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    checked={pwMode === "manual"}
                    onChange={() => setPwMode("manual")}
                  />
                  {t("pwDialog.manual")}
                </label>
              </div>
              {pwMode === "manual" && (
                <div>
                  <Input
                    type="text"
                    value={pwInput}
                    onChange={(e) => setPwInput(e.target.value)}
                    placeholder={t("pwDialog.placeholder")}
                  />
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            {tempPassword ? (
              <Button onClick={handleClosePwDialog}>{t("pwDialog.close")}</Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={handleClosePwDialog}
                  disabled={busy}
                >
                  {t("pwDialog.cancel")}
                </Button>
                <Button
                  onClick={handleSubmitResetPassword}
                  disabled={busy || (pwMode === "manual" && pwInput.length < 8)}
                >
                  {busy ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    t("pwDialog.submit")
                  )}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

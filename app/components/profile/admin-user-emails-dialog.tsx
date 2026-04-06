"use client"

import { useState, useEffect, useCallback } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

type AdminUser = {
  id: string
  name: string | null
  username: string | null
  email: string | null
  role: string | null
}

type EmailItem = {
  id: string
  address: string
  createdAt: number
  expiresAt: number
  expired: boolean
}

export function AdminUserEmailsDialog({
  user,
  onClose,
}: {
  user: AdminUser | null
  onClose: () => void
}) {
  const t = useTranslations("profile.admin")
  const { toast } = useToast()

  const [items, setItems] = useState<EmailItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)

  const fetchEmails = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const qs = new URLSearchParams({ page: String(page), pageSize: "20" })
      const res = await fetch(`/api/admin/users/${user.id}/emails?${qs.toString()}`)
      if (!res.ok) throw new Error()
      const data = (await res.json()) as {
        items: EmailItem[]
        total: number
        totalPages: number
      }
      setItems(data.items)
      setTotal(data.total)
      setTotalPages(data.totalPages)
    } catch {
      toast({ title: t("emailDialog.loading"), variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [user, page, t, toast])

  useEffect(() => {
    if (user) {
      setPage(1)
      setItems([])
      setTotal(0)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  useEffect(() => {
    if (user) fetchEmails()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, page])

  const formatDate = (ts: number) => {
    const d = new Date(ts)
    return d.toISOString().slice(0, 16).replace("T", " ")
  }

  const displayName = user?.username || user?.name || user?.email || "-"

  return (
    <Dialog open={!!user} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("emailDialog.title", { user: displayName })}</DialogTitle>
        </DialogHeader>

        <div className="border rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-3 py-2 font-medium">
                  {t("emailDialog.address")}
                </th>
                <th className="text-left px-3 py-2 font-medium hidden sm:table-cell">
                  {t("emailDialog.createdAt")}
                </th>
                <th className="text-left px-3 py-2 font-medium hidden sm:table-cell">
                  {t("emailDialog.expiresAt")}
                </th>
                <th className="text-left px-3 py-2 font-medium">
                  {t("emailDialog.status")}
                </th>
              </tr>
            </thead>
            <tbody>
              {loading && items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-center text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin inline-block mr-2" />
                    {t("emailDialog.loading")}
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-center text-muted-foreground">
                    {t("emailDialog.empty")}
                  </td>
                </tr>
              ) : (
                items.map((e) => (
                  <tr key={e.id} className="border-t">
                    <td className="px-3 py-2">
                      <div className="font-mono text-xs truncate max-w-[240px]">
                        {e.address}
                      </div>
                    </td>
                    <td className="px-3 py-2 hidden sm:table-cell text-muted-foreground text-xs">
                      {formatDate(e.createdAt)}
                    </td>
                    <td className="px-3 py-2 hidden sm:table-cell text-muted-foreground text-xs">
                      {formatDate(e.expiresAt)}
                    </td>
                    <td className="px-3 py-2">
                      {e.expired ? (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-destructive/10 text-destructive">
                          {t("emailDialog.expired")}
                        </span>
                      ) : (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/10 text-green-600">
                          {t("emailDialog.active")}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{t("emailDialog.total", { count: total })}</span>
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span>{t("pagination.page", { page, total: totalPages })}</span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages || loading}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t("emailDialog.close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

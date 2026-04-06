"use client"

import { useState, useEffect, useCallback } from "react"
import { useTranslations } from "next-intl"
import { Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

type EmailSearchUser = {
  id: string
  username: string | null
  name: string | null
  email: string | null
  role: string | null
}

type EmailSearchItem = {
  id: string
  address: string
  createdAt: number
  expiresAt: number
  expired: boolean
  user: EmailSearchUser | null
}

export function AdminEmailSearchResults({
  searchQuery,
  onViewUserEmails,
}: {
  searchQuery: string
  onViewUserEmails: (user: { id: string; name: string | null; username: string | null; email: string | null; role: string | null }) => void
}) {
  const t = useTranslations("profile.admin")
  const tCard = useTranslations("profile.card")
  const { toast } = useToast()

  const [items, setItems] = useState<EmailSearchItem[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const roleNames: Record<string, string> = {
    emperor: tCard("roles.EMPEROR"),
    duke: tCard("roles.DUKE"),
    knight: tCard("roles.KNIGHT"),
    civilian: tCard("roles.CIVILIAN"),
  }

  const fetchResults = useCallback(async () => {
    if (!searchQuery) {
      setItems([])
      setSearched(false)
      return
    }
    setLoading(true)
    setSearched(true)
    try {
      const qs = new URLSearchParams({ q: searchQuery })
      const res = await fetch(`/api/admin/emails/search?${qs.toString()}`)
      if (!res.ok) throw new Error()
      const data = (await res.json()) as { items: EmailSearchItem[]; total: number }
      setItems(data.items)
    } catch {
      toast({ title: t("emailSearch.fetchFailed"), variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [searchQuery, t, toast])

  useEffect(() => {
    fetchResults()
  }, [fetchResults])

  const formatDate = (ts: number) => {
    const d = new Date(ts)
    return d.toISOString().slice(0, 16).replace("T", " ")
  }

  if (!searched && !searchQuery) return null

  return (
    <div className="border rounded-lg overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="text-left px-3 py-2 font-medium">
              {t("emailDialog.address")}
            </th>
            <th className="text-left px-3 py-2 font-medium">
              {t("emailSearch.owner")}
            </th>
            <th className="text-left px-3 py-2 font-medium hidden md:table-cell">
              {t("column.role")}
            </th>
            <th className="text-left px-3 py-2 font-medium hidden lg:table-cell">
              {t("emailDialog.createdAt")}
            </th>
            <th className="text-left px-3 py-2 font-medium">
              {t("emailDialog.status")}
            </th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin inline-block mr-2" />
                {t("loading")}
              </td>
            </tr>
          ) : items.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">
                {t("emailSearch.noResults")}
              </td>
            </tr>
          ) : (
            items.map((e) => (
              <tr key={e.id} className="border-t">
                <td className="px-3 py-2">
                  <div className="font-mono text-xs truncate max-w-[200px]">
                    {e.address}
                  </div>
                </td>
                <td className="px-3 py-2">
                  {e.user ? (
                    <button
                      className="text-primary hover:underline underline-offset-2 font-medium truncate max-w-[140px] block text-left"
                      onClick={() => onViewUserEmails(e.user!)}
                    >
                      {e.user.username || e.user.name || e.user.email || "-"}
                    </button>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </td>
                <td className="px-3 py-2 hidden md:table-cell">
                  {e.user?.role ? (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                      {roleNames[e.user.role] ?? e.user.role}
                    </span>
                  ) : (
                    "-"
                  )}
                </td>
                <td className="px-3 py-2 hidden lg:table-cell text-muted-foreground text-xs">
                  {formatDate(e.createdAt)}
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
  )
}

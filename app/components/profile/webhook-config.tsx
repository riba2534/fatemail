"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Send, Trash2, CheckCircle2 } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export function WebhookConfig() {
  const t = useTranslations("profile.webhook")
  const tMessages = useTranslations("emails.messages")
  const [url, setUrl] = useState("")
  const [savedUrl, setSavedUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [testing, setTesting] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetch("/api/webhook")
      .then(res => res.json() as Promise<{ enabled: boolean; url: string }>)
      .then(data => {
        setUrl(data.url || "")
        setSavedUrl(data.url || "")
      })
      .catch(console.error)
      .finally(() => setInitialLoading(false))
  }, [])

  if (initialLoading) {
    return (
      <div className="text-center py-4">
        <Loader2 className="w-6 h-6 text-primary animate-spin mx-auto" />
        <p className="text-sm text-muted-foreground mt-2">{tMessages("loading")}</p>
      </div>
    )
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim()) return

    setLoading(true)
    try {
      const res = await fetch("/api/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() })
      })

      const data = await res.json() as { success?: boolean; error?: string }
      if (!res.ok) throw new Error(data.error || t("saveFailed"))

      setSavedUrl(url.trim())
      toast({ title: t("saveSuccess") })
    } catch (error) {
      toast({
        title: t("saveFailed"),
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleClear = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: "" })
      })
      if (!res.ok) throw new Error()
      setUrl("")
      setSavedUrl("")
      toast({ title: t("clearSuccess") })
    } catch {
      toast({ title: t("saveFailed"), variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleTest = async () => {
    if (!savedUrl) return

    setTesting(true)
    try {
      const res = await fetch("/api/webhook/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: savedUrl })
      })

      const data = await res.json() as { success?: boolean; error?: string }
      if (!res.ok) throw new Error(data.error || t("testFailed"))

      toast({ title: t("testSuccess") })
    } catch (error) {
      toast({
        title: t("testFailed"),
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive"
      })
    } finally {
      setTesting(false)
    }
  }

  const isConfigured = !!savedUrl

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <p className="text-sm text-muted-foreground">{t("description")}</p>
      </div>

      {isConfigured && (
        <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded-lg px-3 py-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{t("active")}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="webhook-url">{t("url")}</Label>
          <div className="flex gap-2">
            <Input
              id="webhook-url"
              placeholder={t("urlPlaceholder")}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              type="url"
            />
            <Button type="submit" disabled={loading || !url.trim() || url.trim() === savedUrl} className="flex-shrink-0">
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                t("save")
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">{t("urlHint")}</p>
        </div>
      </form>

      {isConfigured && (
        <div className="flex gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTest}
                  disabled={testing}
                >
                  {testing ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-1" />
                  ) : (
                    <Send className="w-4 h-4 mr-1" />
                  )}
                  {t("test")}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t("testTip")}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            disabled={loading}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            {t("clear")}
          </Button>
        </div>
      )}

      <div className="rounded-lg border border-dashed border-primary/20 p-3 text-xs text-muted-foreground space-y-1">
        <p>{t("help.step1")}</p>
        <p>{t("help.step2")}</p>
        <p>{t("help.step3")}</p>
      </div>
    </div>
  )
}

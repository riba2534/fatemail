"use client"

import Link from "next/link"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { ExternalLink, Mail } from "lucide-react"

interface BrandHeaderProps {
  title?: string
  subtitle?: string
  ctaText?: string
}

export function BrandHeader({
  title,
  subtitle,
  ctaText,
}: BrandHeaderProps) {
  const t = useTranslations("emails.shared.brand")

  const displayTitle = title || t("title")
  const displaySubtitle = subtitle || t("subtitle")
  const displayCtaText = ctaText || t("cta")
  return (
    <div className="text-center space-y-4 lg:pb-4">
      <div className="flex justify-center pt-2">
        <Link
          href="https://fate.email"
          className="flex items-center gap-3 hover:opacity-80 transition-opacity group"
        >
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 grid grid-cols-8 grid-rows-8 gap-px">
              <svg
                width="48"
                height="48"
                viewBox="0 0 32 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-primary group-hover:scale-105 transition-transform duration-200"
              >
                {/* 信封主体 */}
                <path
                  d="M4 8h24v16H4V8z"
                  className="fill-primary/20"
                />

                {/* 信封边框 */}
                <path
                  d="M4 8h24v2H4V8zM4 22h24v2H4v-2z"
                  className="fill-primary"
                />

                {/* @ 符号 */}
                <path
                  d="M14 12h4v4h-4v-4zM12 14h2v4h-2v-4zM18 14h2v4h-2v-4zM14 18h4v2h-4v-2z"
                  className="fill-primary"
                />

                {/* 折线装饰 */}
                <path
                  d="M4 8l12 8 12-8"
                  className="stroke-primary stroke-2"
                  fill="none"
                />

                {/* 装饰点 */}
                <path
                  d="M8 18h2v2H8v-2zM22 18h2v2h-2v-2z"
                  className="fill-primary/60"
                />

                {/* 底部装饰线 */}
                <path
                  d="M8 14h2v2H8v-2zM22 14h2v2h-2v-2z"
                  className="fill-primary/40"
                />
              </svg>
            </div>
          </div>
          <span className="text-3xl font-bold tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600">
            FateMail
          </span>
        </Link>
      </div>

      <div className="space-y-3">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
          {displayTitle}
        </h1>
        <p className="text-gray-600 dark:text-gray-300 max-w-md mx-auto">
          {displaySubtitle}
        </p>
      </div>

      <div className="flex justify-center">
        <Button
          asChild
          size="lg"
          className="gap-2 bg-primary hover:bg-primary/90 text-white px-8 min-h-10 h-auto py-1"
        >
          <Link href="/" target="_blank" rel="noopener noreferrer">
            <Mail className="w-5 h-5" />
            {displayCtaText}
            <ExternalLink className="w-4 h-4" />
          </Link>
        </Button>
      </div>
    </div>
  )
}

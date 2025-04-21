"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { shortenUrl } from "@/app/actions/url-actions"

interface ShortLinkProps {
  href: string
  children: React.ReactNode
  className?: string
  prefetch?: boolean
  onClick?: () => void
}

export default function ShortLink({ href, children, className, prefetch, onClick }: ShortLinkProps) {
  const [shortUrl, setShortUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function createShortUrl() {
      try {
        // Only shorten external URLs or specific paths we want to obfuscate
        if (href.startsWith("http") || href.includes("/view/") || href.includes("/check-in/")) {
          const baseUrl = typeof window !== "undefined" ? window.location.origin : ""
          const fullUrl = href.startsWith("http") ? href : `${baseUrl}${href}`
          const shortened = await shortenUrl(fullUrl)
          setShortUrl(shortened)
        }
      } catch (error) {
        console.error("Error generating short URL:", error)
      } finally {
        setIsLoading(false)
      }
    }

    createShortUrl()
  }, [href])

  // If we're still loading or if this is an internal link we don't want to shorten
  if (isLoading || !shortUrl) {
    return (
      <Link href={href} className={className} prefetch={prefetch} onClick={onClick}>
        {children}
      </Link>
    )
  }

  // For shortened URLs, we use a regular anchor tag
  return (
    <a href={shortUrl} className={className} onClick={onClick}>
      {children}
    </a>
  )
}

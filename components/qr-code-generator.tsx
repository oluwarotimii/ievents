"use client"

import { useState, useRef, useEffect } from "react"
import { QRCodeSVG } from "qrcode.react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Download, Copy, Check } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { shortenUrl } from "@/app/actions/url-actions"

interface QRCodeGeneratorProps {
  url: string
  size?: number
  title?: string
}

export default function QRCodeGenerator({ url, size = 200, title }: QRCodeGeneratorProps) {
  const [copied, setCopied] = useState(false)
  const [shortUrl, setShortUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const qrRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    async function createShortUrl() {
      try {
        const shortened = await shortenUrl(url)
        setShortUrl(shortened)
      } catch (error) {
        console.error("Error shortening URL:", error)
        setShortUrl(url) // Fallback to original URL
      } finally {
        setLoading(false)
      }
    }

    createShortUrl()
  }, [url])

  const handleCopyLink = () => {
    const urlToCopy = shortUrl || url
    navigator.clipboard.writeText(urlToCopy)
    setCopied(true)
    toast({
      title: "Link Copied",
      description: "URL copied to clipboard",
    })

    setTimeout(() => {
      setCopied(false)
    }, 2000)
  }

  const handleDownload = () => {
    if (!qrRef.current) return

    const svgElement = qrRef.current.querySelector("svg")
    if (!svgElement) return

    // Create a canvas element
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions
    canvas.width = size
    canvas.height = size

    // Create an image from the SVG
    const img = new Image()
    const svgData = new XMLSerializer().serializeToString(svgElement)
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" })
    const url = URL.createObjectURL(svgBlob)

    img.onload = () => {
      // Draw white background
      ctx.fillStyle = "white"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw the image
      ctx.drawImage(img, 0, 0)

      // Convert to data URL and trigger download
      const pngUrl = canvas.toDataURL("image/png")
      const downloadLink = document.createElement("a")
      downloadLink.href = pngUrl
      downloadLink.download = `${title || "qrcode"}.png`
      document.body.appendChild(downloadLink)
      downloadLink.click()
      document.body.removeChild(downloadLink)
      URL.revokeObjectURL(url)
    }

    img.src = url
    img.crossOrigin = "anonymous"
  }

  return (
    <Card className="w-full">
      <CardContent className="pt-6 flex flex-col items-center">
        {loading ? (
          <div
            className="bg-white p-4 rounded-lg mb-4 flex items-center justify-center"
            style={{ width: size, height: size }}
          >
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <div ref={qrRef} className="bg-white p-4 rounded-lg mb-4">
            <QRCodeSVG value={shortUrl || url} size={size} />
          </div>
        )}

        {title && <p className="text-center font-medium mb-2">{title}</p>}

        <p className="text-sm text-muted-foreground mb-4 text-center break-all">
          {loading ? "Generating shortened URL..." : shortUrl || url}
        </p>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleCopyLink} disabled={loading}>
            {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
            Copy Link
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownload} disabled={loading}>
            <Download className="h-4 w-4 mr-2" />
            Download QR
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}


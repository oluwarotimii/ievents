"use client"

import { useState, useRef } from "react"
import { QRCodeSVG } from "qrcode.react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Download, Copy, Check, Share2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface QRCodeGeneratorProps {
  url: string
  size?: number
  title?: string
  showUrl?: boolean
}

export default function QRCodeGenerator({ url, size = 200, title, showUrl = true }: QRCodeGeneratorProps) {
  const [copied, setCopied] = useState(false)
  const qrRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  const handleCopyLink = () => {
    navigator.clipboard.writeText(url)
    setCopied(true)
    toast({
      title: "Link Copied",
      description: "URL copied to clipboard",
    })

    setTimeout(() => {
      setCopied(false)
    }, 2000)
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title || "QR Code",
          text: "Check out this link",
          url: url,
        })
        toast({
          title: "Shared Successfully",
          description: "The link has been shared",
        })
      } catch (error) {
        console.error("Error sharing:", error)
      }
    } else {
      handleCopyLink()
    }
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
    const blobUrl = URL.createObjectURL(svgBlob)

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
      URL.revokeObjectURL(blobUrl)
    }

    img.src = blobUrl
    img.crossOrigin = "anonymous"
  }

  return (
    <Card className="w-full">
      <CardContent className="pt-6 flex flex-col items-center">
        <div ref={qrRef} className="bg-white p-4 rounded-lg mb-4">
          <QRCodeSVG value={url} size={size} />
        </div>

        {title && <p className="text-center font-medium mb-2">{title}</p>}

        {showUrl && (
          <p className="text-sm text-muted-foreground mb-4 text-center break-all max-w-full overflow-hidden text-ellipsis">
            {url}
          </p>
        )}

        <div className="flex gap-2 flex-wrap justify-center">
          <Button variant="outline" size="sm" onClick={handleCopyLink}>
            {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
            Copy Link
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download QR
          </Button>
          <Button variant="outline" size="sm" onClick={handleShare}>
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

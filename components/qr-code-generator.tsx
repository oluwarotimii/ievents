"use client"

import { useState, useRef } from "react"
import { QRCodeSVG } from "qrcode.react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Download, Copy, Check } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface QRCodeGeneratorProps {
  url: string
  size?: number
  title?: string
}

export default function QRCodeGenerator({ url, size = 200, title }: QRCodeGeneratorProps) {
  const [copied, setCopied] = useState(false)
  const qrRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // Responsive size calculation
  const responsiveSize =
    typeof window !== "undefined" && window.innerWidth < 640 ? Math.min(window.innerWidth - 80, size) : size

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

  const handleDownload = () => {
    if (!qrRef.current) return

    const svgElement = qrRef.current.querySelector("svg")
    if (!svgElement) return

    // Create a canvas element
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions
    canvas.width = responsiveSize
    canvas.height = responsiveSize

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
        <div ref={qrRef} className="bg-white p-4 rounded-lg mb-4">
          <QRCodeSVG value={url} size={responsiveSize} />
        </div>

        {title && <p className="text-center font-medium mb-2">{title}</p>}

        <p className="text-sm text-muted-foreground mb-4 text-center break-all px-2">{url}</p>

        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button variant="outline" size="sm" onClick={handleCopyLink} className="w-full sm:w-auto">
            {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
            Copy Link
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownload} className="w-full sm:w-auto">
            <Download className="h-4 w-4 mr-2" />
            Download QR
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}


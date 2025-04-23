"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Copy, Check, QrCode, Share2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

interface ShareFormLinkProps {
  code: string
}

export default function ShareFormLink({ code }: ShareFormLinkProps) {
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  // Generate URLs directly without async calls to improve performance
  const baseUrl = typeof window !== "undefined" ? window.location.origin : ""
  const formUrl = `${baseUrl}/view/${code}`

  const handleCopyLink = () => {
    navigator.clipboard.writeText(formUrl)
    setCopied(true)
    toast({
      title: "Link Copied",
      description: "Form link copied to clipboard",
    })

    setTimeout(() => {
      setCopied(false)
    }, 2000)
  }

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code)
    toast({
      title: "Code Copied",
      description: "Event code copied to clipboard",
    })
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Event Registration Form",
          text: `Register for this event using code: ${code}`,
          url: formUrl,
        })
        toast({
          title: "Shared Successfully",
          description: "The form link has been shared",
        })
      } catch (error) {
        console.error("Error sharing:", error)
      }
    } else {
      handleCopyLink()
    }
  }

  return (
    <Card className="bg-muted">
      <CardContent className="pt-6">
        <div className="flex flex-col space-y-4">
          <p className="text-sm font-medium">Share this form with others using this link or code:</p>

          <div className="flex items-center space-x-2">
            <Input value={formUrl} readOnly className="flex-1" />
            <Button variant="outline" size="icon" onClick={handleCopyLink} className="flex-shrink-0">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Event Code:</span>
            <div className="flex items-center">
              <span className="font-mono text-lg font-bold tracking-wider mr-2">{code}</span>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCopyCode}>
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={handleCopyLink}>
              {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
              Copy Link
            </Button>
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/qr-codes/${code}`}>
                <QrCode className="h-4 w-4 mr-2" />
                QR Codes
              </Link>
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Anyone with this link or code can view and fill out this form. Only you as the creator can view the
            responses.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

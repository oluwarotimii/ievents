"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Copy, Check } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ShareFormLinkProps {
  code: string
}

export default function ShareFormLink({ code }: ShareFormLinkProps) {
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  // Generate the full URL for sharing
  const formUrl = typeof window !== "undefined" ? `${window.location.origin}/view/${code}` : `/view/${code}`

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
            <span className="font-mono text-lg font-bold tracking-wider">{code}</span>
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


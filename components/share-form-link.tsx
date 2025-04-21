"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Copy, Check } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { createEventShareUrls } from "@/app/actions/url-actions"

interface ShareFormLinkProps {
  code: string
}

export default function ShareFormLink({ code }: ShareFormLinkProps) {
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)
  const [formUrl, setFormUrl] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    async function loadShareUrls() {
      try {
        setLoading(true)
        // First set a temporary URL while we wait for the shortened one
        setFormUrl(`${window.location.origin}/view/${code}`)

        const result = await createEventShareUrls(code)

        if (result.success) {
          setFormUrl(result.viewUrl)
        }
      } catch (error) {
        console.error("Error loading share URLs:", error)
        // Keep the fallback URL that was already set
      } finally {
        setLoading(false)
      }
    }

    loadShareUrls()
  }, [code])

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
            <Input value={formUrl} readOnly className={`flex-1 ${loading ? "animate-pulse" : ""}`} />
            <Button variant="outline" size="icon" onClick={handleCopyLink} className="flex-shrink-0" disabled={loading}>
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

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle } from "lucide-react"

export default function EmailTestPage() {
  const [to, setTo] = useState("")
  const [subject, setSubject] = useState("Test Email")
  const [content, setContent] = useState("<p>This is a test email from the Event Form Builder.</p>")
  const [status, setStatus] = useState<{ success: boolean; message: string } | null>(null)
  const [loading, setLoading] = useState(false)

  const testApiConnection = async () => {
    setLoading(true)
    setStatus(null)

    try {
      const response = await fetch("/api/email/send", {
        method: "GET",
      })

      const result = await response.json()

      setStatus({
        success: result.success,
        message: result.success ? "Connection successful" : `Connection failed: ${result.error}`,
      })
    } catch (error) {
      setStatus({
        success: false,
        message: `Error testing API connection: ${error instanceof Error ? error.message : "Unknown error"}`,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSendTestEmail = async () => {
    setLoading(true)
    setStatus(null)

    try {
      const response = await fetch("/api/email/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to,
          subject,
          customHtml: content,
        }),
      })

      const result = await response.json()

      setStatus({
        success: result.success,
        message: result.success
          ? `Email sent successfully to ${to}`
          : `Failed to send email: ${result.error || "Unknown error"}`,
      })
    } catch (error) {
      setStatus({
        success: false,
        message: `Error sending email: ${error instanceof Error ? error.message : "Unknown error"}`,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Email Testing Tool</h1>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Test Email Configuration</CardTitle>
            <CardDescription>Check if your email configuration is working correctly</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={testApiConnection} disabled={loading}>
              {loading ? "Testing..." : "Test Email Configuration"}
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Send Test Email</CardTitle>
            <CardDescription>Send a test email to verify your email configuration</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="to">Recipient Email</Label>
                <Input id="to" value={to} onChange={(e) => setTo(e.target.value)} placeholder="recipient@example.com" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="subject">Subject</Label>
                <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="content">Content (HTML)</Label>
                <Textarea id="content" value={content} onChange={(e) => setContent(e.target.value)} rows={5} />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleSendTestEmail} disabled={loading || !to}>
              {loading ? "Sending..." : "Send Test Email"}
            </Button>
          </CardFooter>
        </Card>

        {status && (
          <Alert variant={status.success ? "default" : "destructive"}>
            {status.success ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            <AlertTitle>{status.success ? "Success" : "Error"}</AlertTitle>
            <AlertDescription>{status.message}</AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  )
}

"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Send, Users, Mail, AlertTriangle, Loader2 } from "lucide-react"
import { sendEventMassEmail, getEmailStatistics } from "@/app/actions/email-actions"
import EmailManagerLoading from "./loading" // Adjust path if different

export default function EmailManagerPage({ params }: { params: { code: string } }) {
  const { code } = params

  const [formName, setFormName] = useState("Event Registration Form")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [subject, setSubject] = useState("")
  const [content, setContent] = useState("")
  const [statistics, setStatistics] = useState({
    totalRegistrants: 0,
    emailsCollected: 0,
  })

  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const email = typeof window !== "undefined" ? sessionStorage.getItem("loggedInEmail") : null

    if (!email) {
      toast({
        title: "Not Logged In",
        description: "Please log in to access email manager.",
        variant: "destructive",
      })
      router.push("/")
      return
    }

    loadData(email)
  }, [code])

  const loadData = async (email: string) => {
    try {
      if (!/^\d{4}$/.test(code)) {
        toast({
          title: "Invalid Event Code",
          description: "Event code must be 4 digits.",
          variant: "destructive",
        })
        router.push("/dashboard")
        return
      }

      const creatorEmails = localStorage.getItem("formCreators")
        ? JSON.parse(localStorage.getItem("formCreators")!)
        : {}

      if (creatorEmails[code] !== email) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to access email manager for this event.",
          variant: "destructive",
        })
        router.push("/dashboard")
        return
      }

      const storedForms = localStorage.getItem("eventForms")
      const forms = storedForms ? JSON.parse(storedForms) : {}

      if (!forms[code]) {
        toast({
          title: "Event Not Found",
          description: "No event found with this code. Please check and try again.",
          variant: "destructive",
        })
        router.push("/dashboard")
        return
      }

      setFormName(forms[code].name || "Event Registration Form")

      const statsResult = await getEmailStatistics(code)
      if (statsResult.success) {
        setStatistics(statsResult.statistics)
      }
    } catch (error) {
      console.error("Error loading data:", error)
      toast({
        title: "Error",
        description: "Failed to load email manager data.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!subject.trim()) {
      toast({
        title: "Missing Subject",
        description: "Please enter an email subject.",
        variant: "destructive",
      })
      return
    }

    if (!content.trim()) {
      toast({
        title: "Missing Content",
        description: "Please enter email content.",
        variant: "destructive",
      })
      return
    }

    setSending(true)

    try {
      const formData = new FormData()
      formData.append("subject", subject)
      formData.append("content", content)

      const result = await sendEventMassEmail(code, formData)

      if (result.success) {
        toast({
          title: "Emails Sent",
          description: result.message || `Successfully sent ${result.sent} emails.`,
        })

        setSubject("")
        setContent("")
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to send emails.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error sending emails:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred while sending emails.",
        variant: "destructive",
      })
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return <EmailManagerLoading message="Loading email manager..." />
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>{formName} - Email Manager</CardTitle>
              <CardDescription>Send emails to all registrants of this event</CardDescription>
            </div>
            <Button variant="outline" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <div className="p-2 bg-primary/10 rounded-full mr-4">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Registrants</p>
                    <h3 className="text-2xl font-bold">{statistics.totalRegistrants}</h3>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <div className="p-2 bg-primary/10 rounded-full mr-4">
                    <Mail className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Emails Collected</p>
                    <h3 className="text-2xl font-bold">{statistics.emailsCollected}</h3>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {statistics.emailsCollected === 0 ? (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-md flex items-start">
              <AlertTriangle className="h-5 w-5 text-amber-500 mr-2 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-amber-800">
                  No email addresses have been collected for this event. You need at least one registrant with an email
                  address to send emails.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSendEmail} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="subject" className="block text-sm font-medium">
                  Email Subject
                </label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Enter email subject"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="content" className="block text-sm font-medium">
                  Email Content
                </label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Enter email content"
                  rows={10}
                  required
                />
                <p className="text-xs text-muted-foreground">You can use HTML formatting in your email content.</p>
              </div>

              <div className="pt-4">
                <Button type="submit" disabled={sending || statistics.emailsCollected === 0}>
                  {sending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Email to {statistics.emailsCollected} Recipients
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
        <CardFooter>
          <p className="text-sm text-muted-foreground">
            Note: Emails are sent in batches and may take some time to deliver to all recipients.
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}

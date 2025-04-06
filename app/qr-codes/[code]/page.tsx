"use client"

import React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft } from "lucide-react"
import QRCodeGenerator from "@/components/qr-code-generator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createEventShareUrls } from "@/app/actions/url-actions"

export default function QRCodesPage({ params }: { params: { code: string } }) {
  // Unwrap the params object using React.use()
  const unwrappedParams = React.use(params)
  const { code } = unwrappedParams
  const [formName, setFormName] = useState("Event Registration Form")
  const [loading, setLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [shareUrls, setShareUrls] = useState({
    viewUrl: "",
    checkInUrl: "",
  })
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    async function loadData() {
      try {
        // Check if user is logged in
        const email = sessionStorage.getItem("loggedInEmail")
        if (!email) {
          toast({
            title: "Not Logged In",
            description: "Please log in to access QR codes.",
            variant: "destructive",
          })
          router.push("/")
          return
        }

        // Validate that code is 4 digits
        if (!/^\d{4}$/.test(code)) {
          toast({
            title: "Invalid Event Code",
            description: "Event code must be 4 digits.",
            variant: "destructive",
          })
          router.push("/dashboard")
          return
        }

        // Check if this user is the creator of this form
        const creatorEmails = localStorage.getItem("formCreators")
          ? JSON.parse(localStorage.getItem("formCreators")!)
          : {}

        if (creatorEmails[code] !== email) {
          toast({
            title: "Access Denied",
            description: "You don't have permission to access QR codes for this event.",
            variant: "destructive",
          })
          router.push("/dashboard")
          return
        }

        // Load form data
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
        setIsAuthorized(true)

        // Get shortened URLs
        const result = await createEventShareUrls(code)
        if (result.success) {
          setShareUrls({
            viewUrl: result.viewUrl,
            checkInUrl: result.checkInUrl,
          })
        } else {
          // Fallback to regular URLs
          const baseUrl = window.location.origin
          setShareUrls({
            viewUrl: `${baseUrl}/view/${code}`,
            checkInUrl: `${baseUrl}/check-in/${code}`,
          })
        }
      } catch (error) {
        console.error("Error loading data:", error)
        // Fallback to regular URLs
        const baseUrl = window.location.origin
        setShareUrls({
          viewUrl: `${baseUrl}/view/${code}`,
          checkInUrl: `${baseUrl}/check-in/${code}`,
        })
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [code, router, toast])

  if (loading || !isAuthorized) {
    return (
      <div className="container flex items-center justify-center min-h-screen">
        <p>{loading ? "Loading QR codes..." : "Unauthorized access"}</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>{formName} - QR Codes</CardTitle>
              <CardDescription>Event Code: {code}</CardDescription>
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
          <Tabs defaultValue="registration">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="registration">Registration QR</TabsTrigger>
              <TabsTrigger value="checkin">Check-In QR</TabsTrigger>
            </TabsList>
            <TabsContent value="registration" className="pt-4">
              <div className="max-w-md mx-auto">
                <p className="text-sm text-muted-foreground mb-4">
                  Share this QR code with potential attendees to allow them to register for your event.
                </p>
                <QRCodeGenerator url={shareUrls.viewUrl} title="Registration QR Code" />
              </div>
            </TabsContent>
            <TabsContent value="checkin" className="pt-4">
              <div className="max-w-md mx-auto">
                <p className="text-sm text-muted-foreground mb-4">
                  Display this QR code at your event venue to allow attendees to check in when they arrive.
                </p>
                <QRCodeGenerator url={shareUrls.checkInUrl} title="Check-In QR Code" />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}


"use client"

import React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Loader2 } from 'lucide-react'
import QRCodeGenerator from "@/components/qr-code-generator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createEventShareUrls } from "@/app/actions/url-actions"
import { getFormByCode } from "@/app/actions/form-actions"

export default function QRCodesPage({ params }: { params: { code: string } }) {
  const { code } = params
  const [formName, setFormName] = useState("Event Registration Form")
  const [loading, setLoading] = useState(true)
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
          router.push("/login")
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

        // Load form data
        const form = await getFormByCode(code)
        
        if (!form) {
          toast({
            title: "Event Not Found",
            description: "No event found with this code. Please check and try again.",
            variant: "destructive",
          })
          router.push("/dashboard")
          return
        }

        setFormName(form.name || "Event Registration Form")

        // Get shortened URLs
        const result = await createEventShareUrls(code)
        if (result.success) {
          setShareUrls({
            viewUrl: result.viewUrl,
            checkInUrl: result.checkInUrl,
          })
        } else {
          toast({
            title: "Error",
            description: "Failed to create share URLs. Using regular URLs instead.",
            variant: "destructive",
          })
          // Fallback to regular URLs
          const baseUrl = window.location.origin
          setShareUrls({
            viewUrl: `${baseUrl}/view/${code}`,
            checkInUrl: `${baseUrl}/check-in/${code}`,
          })
        }
      } catch (error) {
        console.error("Error loading data:", error)
        toast({
          title: "Error",
          description: "An error occurred while loading QR codes.",
          variant: "destructive",
        })
        router.push("/dashboard")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [code, router, toast])

  if (loading) {
    return (
      <div className="container flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
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
            <Button variant="outline" onClick={() => router.push("/dashboard")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
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

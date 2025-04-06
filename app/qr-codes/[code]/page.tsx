"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft } from "lucide-react"
import QRCodeGenerator from "@/components/qr-code-generator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getFormByCode } from "@/app/actions/form-actions"

export default function QRCodesPage({ params }: { params: { code: string } }) {
  const { code } = params
  const [formName, setFormName] = useState("Event Registration Form")
  const [loading, setLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  // Generate the full URLs for sharing
  const registrationUrl = typeof window !== "undefined" ? `${window.location.origin}/view/${code}` : `/view/${code}`
  const checkInUrl = typeof window !== "undefined" ? `${window.location.origin}/check-in/${code}` : `/check-in/${code}`

  useEffect(() => {
    loadFormData()
  }, [code])

  const loadFormData = async () => {
    try {
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

      // Load form data from the database
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
      setIsAuthorized(true)
    } catch (error) {
      console.error("Error loading form:", error)
      toast({
        title: "Error",
        description: "Failed to load form data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container flex items-center justify-center min-h-screen p-4">
        <p>Loading QR codes...</p>
      </div>
    )
  }

  if (!isAuthorized) {
    return (
      <div className="container flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center mb-4">You don't have permission to access this page.</p>
            <Button variant="outline" asChild className="w-full">
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-4 md:py-8 px-4">
      <Card className="mb-6">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div>
              <CardTitle className="text-xl md:text-2xl">{formName} - QR Codes</CardTitle>
              <CardDescription>Event Code: {code}</CardDescription>
            </div>
            <Button variant="outline" asChild className="w-full md:w-auto">
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
                <QRCodeGenerator url={registrationUrl} title="Registration QR Code" />
              </div>
            </TabsContent>
            <TabsContent value="checkin" className="pt-4">
              <div className="max-w-md mx-auto">
                <p className="text-sm text-muted-foreground mb-4">
                  Display this QR code at your event venue to allow attendees to check in when they arrive.
                </p>
                <QRCodeGenerator url={checkInUrl} title="Check-In QR Code" />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}


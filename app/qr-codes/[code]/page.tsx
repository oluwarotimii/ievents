"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Loader2, Copy, QrCode, UserCheck } from "lucide-react"
import QRCodeGenerator from "@/components/qr-code-generator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { getFormByCode } from "@/app/actions/form-actions"

export default function QRCodesPage({ params }: { params: { code: string } }) {
  const { code } = params
  const [formName, setFormName] = useState("Event Registration Form")
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("registration")

  // URLs for different purposes
  const baseUrl = typeof window !== "undefined" ? window.location.origin : ""
  const viewUrl = `${baseUrl}/view/${code}`
  const checkInUrl = `${baseUrl}/check-in/${code}`

  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    async function loadData() {
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
      } catch (error) {
        console.error("Error loading form:", error)
        toast({
          title: "Error",
          description: "Failed to load the form. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [code, router, toast])

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code)
    toast({
      title: "Code Copied",
      description: "Event code copied to clipboard",
    })
  }

  if (loading) {
    return (
      <div className="container flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin mb-4" />
        <p>Loading QR codes...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="mb-6">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>{formName}</CardTitle>
              <CardDescription className="flex items-center mt-1">
                Event Code:
                <span className="font-mono font-bold mx-2">{code}</span>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCopyCode}>
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </CardDescription>
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
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="registration">Registration QR</TabsTrigger>
              <TabsTrigger value="checkin">Check-In QR</TabsTrigger>
            </TabsList>

            <TabsContent value="registration">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Registration Link</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Share this link or QR code with potential attendees to allow them to register for your event.
                  </p>

                  <div className="flex items-center space-x-2 mb-4">
                    <Input value={viewUrl} readOnly />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        navigator.clipboard.writeText(viewUrl)
                        toast({
                          title: "Link Copied",
                          description: "Registration link copied to clipboard",
                        })
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(viewUrl)
                        toast({
                          title: "Link Copied",
                          description: "Registration link copied to clipboard",
                        })
                      }}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Link
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/view/${code}`} target="_blank">
                        <QrCode className="h-4 w-4 mr-2" />
                        Open Form
                      </Link>
                    </Button>
                  </div>
                </div>

                <div>
                  <QRCodeGenerator url={viewUrl} title="Registration QR Code" showUrl={false} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="checkin">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Check-In Link</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Display this QR code at your event venue to allow attendees to check in when they arrive.
                  </p>

                  <div className="flex items-center space-x-2 mb-4">
                    <Input value={checkInUrl} readOnly />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        navigator.clipboard.writeText(checkInUrl)
                        toast({
                          title: "Link Copied",
                          description: "Check-in link copied to clipboard",
                        })
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(checkInUrl)
                        toast({
                          title: "Link Copied",
                          description: "Check-in link copied to clipboard",
                        })
                      }}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Link
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/check-in/${code}`} target="_blank">
                        <UserCheck className="h-4 w-4 mr-2" />
                        Open Check-In
                      </Link>
                    </Button>
                  </div>
                </div>

                <div>
                  <QRCodeGenerator url={checkInUrl} title="Check-In QR Code" showUrl={false} />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>

        <CardFooter>
          <p className="text-sm text-muted-foreground">
            Tip: Print these QR codes or share the links directly with your attendees.
          </p>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quick Access</CardTitle>
          <CardDescription>All the important links for your event in one place</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Button asChild variant="outline" className="h-auto py-4 justify-start">
              <Link href={`/view/${code}`} target="_blank">
                <div className="flex flex-col items-start">
                  <span className="font-medium">Registration Form</span>
                  <span className="text-xs text-muted-foreground mt-1">View the form</span>
                </div>
              </Link>
            </Button>

            <Button asChild variant="outline" className="h-auto py-4 justify-start">
              <Link href={`/check-in/${code}`} target="_blank">
                <div className="flex flex-col items-start">
                  <span className="font-medium">Check-In Page</span>
                  <span className="text-xs text-muted-foreground mt-1">For attendees to check in</span>
                </div>
              </Link>
            </Button>

            <Button asChild variant="outline" className="h-auto py-4 justify-start">
              <Link href={`/responses/${code}`}>
                <div className="flex flex-col items-start">
                  <span className="font-medium">Responses</span>
                  <span className="text-xs text-muted-foreground mt-1">View all submissions</span>
                </div>
              </Link>
            </Button>

            <Button asChild variant="outline" className="h-auto py-4 justify-start">
              <Link href={`/manual-check-in/${code}`}>
                <div className="flex flex-col items-start">
                  <span className="font-medium">Manual Check-In</span>
                  <span className="text-xs text-muted-foreground mt-1">Check in attendees manually</span>
                </div>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

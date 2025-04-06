"use client"

import React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, CheckCircle2, Search, UserCheck, Loader2, RefreshCw } from "lucide-react"
import { format } from "date-fns"
import QuickCheckInCard from "@/components/quick-check-in-card"
import { getFormByCode, getFormResponses, checkInAttendee } from "@/app/actions/form-actions"

interface FormResponse {
  id: string
  submittedAt: string
  data: Record<string, any>
  checkedIn?: boolean
  checkInTime?: string
}

export default function ManualCheckInPage({ params }: { params: { code: string } }) {
  // Unwrap the params object using React.use()
  const unwrappedParams = React.use(params)
  const { code } = unwrappedParams

  const [formName, setFormName] = useState("Event Registration Form")
  const [responses, setResponses] = useState<FormResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [checkingIn, setCheckingIn] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    loadData()
  }, [code])

  const loadData = async () => {
    setRefreshing(true)

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

      // Load responses from the database
      const formResponses = await getFormResponses(code)
      setResponses(formResponses || [])
    } catch (error) {
      console.error("Error loading data:", error)
      toast({
        title: "Error",
        description: "Failed to load data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleCheckIn = async (responseId: string) => {
    setCheckingIn(responseId)

    try {
      await checkInAttendee(code, responseId)

      // Refresh the responses list
      await loadData()

      toast({
        title: "Checked In",
        description: "Attendee has been checked in successfully.",
      })
    } catch (error) {
      console.error("Error checking in attendee:", error)
      toast({
        title: "Error",
        description: "Failed to check in attendee. Please try again.",
        variant: "destructive",
      })
    } finally {
      setCheckingIn(null)
    }
  }

  // Helper function to get attendee name from response data
  const getAttendeeName = (response: FormResponse): string => {
    // Look for name field in response data
    const data = response.data
    for (const key in data) {
      const value = data[key]
      if (typeof value === "string") {
        // Look for fields that might contain name
        const fieldKey = key.toLowerCase()
        if (fieldKey.includes("name") || fieldKey === "fullname" || fieldKey === "full_name") {
          return value
        }
      }
    }
    return "Unknown Attendee"
  }

  // Helper function to get attendee email from response data
  const getAttendeeEmail = (response: FormResponse): string => {
    // Look for email field in response data
    const data = response.data
    for (const key in data) {
      const value = data[key]
      if (typeof value === "string" && value.includes("@")) {
        const fieldKey = key.toLowerCase()
        if (fieldKey.includes("email")) {
          return value
        }
      }
    }
    return "No email"
  }

  const filteredResponses = responses.filter((response) => {
    if (!searchTerm) return true

    const attendeeName = getAttendeeName(response).toLowerCase()
    const attendeeEmail = getAttendeeEmail(response).toLowerCase()
    const searchLower = searchTerm.toLowerCase()

    return attendeeName.includes(searchLower) || attendeeEmail.includes(searchLower)
  })

  if (loading) {
    return (
      <div className="container flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin mb-4" />
        <p>Loading check-in page...</p>
        <Button variant="outline" className="mt-4" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>{formName} - Manual Check-In</CardTitle>
              <CardDescription>
                Event Code: {code} | Total Registrations: {responses.length}
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={loadData} disabled={refreshing} title="Refresh attendee list">
                <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              </Button>
              <Button variant="outline" asChild>
                <Link href="/dashboard">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <QuickCheckInCard eventCode={code} onCheckIn={handleCheckIn} />
            </div>
            <div className="md:col-span-2">
              <div className="flex items-center space-x-2 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Filter attendees..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                  <UserCheck className="h-4 w-4" />
                  <span>
                    {responses.filter((r) => r.checkedIn).length} / {responses.length} checked in
                  </span>
                </div>
              </div>

              {responses.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    No registrations yet. Share your form to collect registrations.
                  </p>
                  <Button variant="outline" className="mt-4" asChild>
                    <Link href={`/qr-codes/${code}`}>Go to QR Codes</Link>
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Registration Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredResponses.map((response) => (
                        <TableRow key={response.id}>
                          <TableCell className="font-medium">{getAttendeeName(response)}</TableCell>
                          <TableCell>{getAttendeeEmail(response)}</TableCell>
                          <TableCell>{format(new Date(response.submittedAt), "MMM d, yyyy")}</TableCell>
                          <TableCell>
                            {response.checkedIn ? (
                              <div className="flex items-center">
                                <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                                <span className="text-green-600">
                                  Checked In
                                  {response.checkInTime && (
                                    <span className="text-xs block text-muted-foreground">
                                      {format(new Date(response.checkInTime), "h:mm a")}
                                    </span>
                                  )}
                                </span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">Not Checked In</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant={response.checkedIn ? "outline" : "default"}
                              size="sm"
                              onClick={() => handleCheckIn(response.id)}
                              disabled={response.checkedIn || checkingIn === response.id}
                            >
                              {checkingIn === response.id ? (
                                <>
                                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                  Checking...
                                </>
                              ) : response.checkedIn ? (
                                "Checked In"
                              ) : (
                                "Check In"
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" asChild>
            <Link href={`/view/${code}`}>View Registration Form</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/responses/${code}`}>View All Responses</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}


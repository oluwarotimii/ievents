"use client"

import React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Users, Clock, TrendingUp, CheckCircle2, Loader2 } from "lucide-react"
import { format, subDays } from "date-fns"

interface FormResponse {
  id: string
  submittedAt: string
  data: Record<string, any>
  checkedIn?: boolean
}

export default function AnalyticsPage({ params }: { params: { code: string } }) {
  // Unwrap the params object using React.use()
  const unwrappedParams = React.use(params)
  const { code } = unwrappedParams
  const [formName, setFormName] = useState("Event Registration Form")
  const [responses, setResponses] = useState<FormResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [dailyStats, setDailyStats] = useState<{ date: string; count: number }[]>([])
  const [fieldStats, setFieldStats] = useState<{ fieldName: string; completionRate: number }[]>([])
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    // Check if user is logged in
    const email = sessionStorage.getItem("loggedInEmail")
    if (!email) {
      toast({
        title: "Not Logged In",
        description: "Please log in to access analytics.",
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
    const creatorEmails = localStorage.getItem("formCreators") ? JSON.parse(localStorage.getItem("formCreators")!) : {}

    if (creatorEmails[code] !== email) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to view analytics for this form.",
        variant: "destructive",
      })
      router.push("/dashboard")
      return
    }

    // Load form data and responses
    fetchFormData()
  }, [code, router, toast])

  const fetchFormData = async () => {
    try {
      // Fetch form data from API
      const formResponse = await fetch(`/api/forms/${code}`)
      if (!formResponse.ok) {
        throw new Error("Failed to fetch form data")
      }
      const formData = await formResponse.json()
      setFormName(formData.name || "Event Registration Form")

      // Fetch responses
      const responsesResponse = await fetch(`/api/forms/${code}/responses`)
      if (!responsesResponse.ok) {
        throw new Error("Failed to fetch responses")
      }
      const responsesData = await responsesResponse.json()
      setResponses(responsesData)

      // Generate daily stats for the last 7 days
      generateDailyStats(responsesData)

      // Generate field completion stats
      generateFieldStats(responsesData, formData)
    } catch (error) {
      console.error("Error fetching data:", error)
      toast({
        title: "Error",
        description: "Failed to load analytics data.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const generateDailyStats = (formResponses: FormResponse[]) => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), i)
      return format(date, "yyyy-MM-dd")
    }).reverse()

    const dailyCounts = last7Days.map((date) => {
      const count = formResponses.filter(
        (response: FormResponse) => format(new Date(response.submittedAt), "yyyy-MM-dd") === date,
      ).length

      return {
        date: format(new Date(date), "MMM d"),
        count,
      }
    })

    setDailyStats(dailyCounts)
  }

  const generateFieldStats = (formResponses: FormResponse[], formData: any) => {
    if (!formResponses.length || !formData.elements) {
      setFieldStats([])
      return
    }

    // Extract field names from form elements
    const formFields = formData.elements
      .filter((element: any) => element.type !== "heading" && element.type !== "paragraph")
      .map((element: any) => ({
        id: element.id,
        label: element.properties?.label || `Field ${element.id}`,
      }))

    // Calculate completion rate for each field
    const stats = formFields.map((field) => {
      const completedCount = formResponses.filter((response) => {
        const data = response.data as Record<string, any>
        return data[field.id] !== undefined && data[field.id] !== null && data[field.id] !== ""
      }).length

      const completionRate = formResponses.length > 0 ? Math.round((completedCount / formResponses.length) * 100) : 0

      return {
        fieldName: field.label,
        completionRate,
      }
    })

    // Sort by completion rate descending
    stats.sort((a, b) => b.completionRate - a.completionRate)

    // Take top 4 fields
    setFieldStats(stats.slice(0, 4))
  }

  const getCheckInStats = () => {
    const totalResponses = responses.length
    const checkedInCount = responses.filter((response) => response.checkedIn).length
    const checkInRate = totalResponses > 0 ? Math.round((checkedInCount / totalResponses) * 100) : 0

    return {
      checkedInCount,
      checkInRate,
    }
  }

  if (loading) {
    return (
      <div className="container flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin mb-4" />
          <p>Loading analytics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-4 sm:py-8 px-4">
      <Card className="mb-6">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-xl sm:text-2xl">{formName} - Analytics</CardTitle>
              <CardDescription>Event Code: {code}</CardDescription>
            </div>
            <Button variant="outline" asChild className="w-full sm:w-auto">
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-primary/10 rounded-full mr-4">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Responses</p>
                <h3 className="text-2xl font-bold">{responses.length}</h3>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-primary/10 rounded-full mr-4">
                <CheckCircle2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Checked In</p>
                <h3 className="text-2xl font-bold">{getCheckInStats().checkedInCount}</h3>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-primary/10 rounded-full mr-4">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Check-In Rate</p>
                <h3 className="text-2xl font-bold">{getCheckInStats().checkInRate}%</h3>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-primary/10 rounded-full mr-4">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg. Completion Time</p>
                <h3 className="text-2xl font-bold">{responses.length > 0 ? "Not Available" : "No Data"}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Daily Responses</CardTitle>
          </CardHeader>
          <CardContent>
            {responses.length > 0 ? (
              <div className="h-[300px] flex items-end justify-between">
                {dailyStats.map((day, index) => (
                  <div key={index} className="flex flex-col items-center">
                    <div
                      className="bg-primary w-12 rounded-t-md"
                      style={{
                        height: day.count ? `${Math.max(day.count * 30, 20)}px` : "4px",
                        minHeight: day.count ? "20px" : "4px",
                      }}
                    ></div>
                    <div className="text-xs mt-2">{day.date}</div>
                    <div className="text-sm font-medium">{day.count}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center">
                <p className="text-muted-foreground">No response data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Field Completion Rates</CardTitle>
          </CardHeader>
          <CardContent>
            {fieldStats.length > 0 ? (
              <div className="space-y-4">
                {fieldStats.map((field, index) => (
                  <div key={index}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">{field.fieldName}</span>
                      <span className="text-sm font-medium">{field.completionRate}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-primary h-2 rounded-full" style={{ width: `${field.completionRate}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center">
                <p className="text-muted-foreground">No field data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

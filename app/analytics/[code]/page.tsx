"use client"

import React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Users, Clock, TrendingUp, CheckCircle2 } from "lucide-react"
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

    // Load responses
    const storedResponses = localStorage.getItem("eventResponses")
    const allResponses = storedResponses ? JSON.parse(storedResponses) : {}

    const formResponses = allResponses[code] || []
    setResponses(formResponses)

    // Generate daily stats for the last 7 days
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
    setLoading(false)
  }, [code, router, toast])

  const handleBackToDashboard = () => {
    router.push("/dashboard")
  }

  const getCompletionRate = () => {
    // This would normally calculate based on form views vs submissions
    // For now, we'll simulate a random completion rate between 40-90%
    return Math.floor(Math.random() * 50) + 40
  }

  const getAverageCompletionTime = () => {
    // This would normally calculate based on actual form completion times
    // For now, we'll simulate a random time between 1-5 minutes
    return Math.floor(Math.random() * 4) + 1
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
        <p>Loading analytics...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>{formName} - Analytics</CardTitle>
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
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
                <h3 className="text-2xl font-bold">{getAverageCompletionTime()} min</h3>
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Response Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* This would normally show actual field data distribution */}
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm">Email Provided</span>
                  <span className="text-sm font-medium">100%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full" style={{ width: "100%" }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm">Phone Number Provided</span>
                  <span className="text-sm font-medium">78%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full" style={{ width: "78%" }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm">Payment Completed</span>
                  <span className="text-sm font-medium">65%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full" style={{ width: "65%" }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm">Dietary Preferences</span>
                  <span className="text-sm font-medium">42%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full" style={{ width: "42%" }}></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


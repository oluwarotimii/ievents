"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { LoadingButton } from "@/components/ui/loading-button"
import { useToast } from "@/hooks/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import {
  Edit,
  Eye,
  ClipboardList,
  LogOut,
  Trash2,
  BarChart3,
  Plus,
  QrCode,
  UserCheck,
  Loader2,
  RefreshCw,
  AlertTriangle,
  Mail,
} from "lucide-react"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { getUserForms, deleteForm } from "../actions/form-actions"
import { logoutUser, getCurrentUserSubscriptionInfo } from "../actions/auth-actions"
import { useRouter } from "next/navigation"
import { useLoading } from "@/components/loading-context"

interface FormData {
  id: number
  code: string
  name: string
  createdAt: string
  _count: {
    responses: number
  }
}

export default function DashboardPage() {
  const [forms, setForms] = useState<FormData[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [deletingForm, setDeletingForm] = useState<string | null>(null)
  const [username, setUsername] = useState<string>("")
  const [greeting, setGreeting] = useState<string>("Welcome")
  const { toast } = useToast()
  const { isLoading, startLoading, stopLoading } = useLoading()
  const [subscriptionInfo, setSubscriptionInfo] = useState<{
    plan: string
    formLimit: number | null
    formCount: number
    isActive: boolean
  } | null>(null)
  const router = useRouter()

  useEffect(() => {
    loadDashboardData()
    setTimeBasedGreeting()
  }, [])

  const setTimeBasedGreeting = () => {
    const hour = new Date().getHours()
    let greetingText = "Welcome"

    if (hour >= 5 && hour < 12) {
      greetingText = "Good morning"
    } else if (hour >= 12 && hour < 18) {
      greetingText = "Good afternoon"
    } else {
      greetingText = "Good evening"
    }

    setGreeting(greetingText)
  }

  const loadDashboardData = async () => {
    setRefreshing(true)
    try {
      // Get forms from database using Prisma via server action
      const userForms = await getUserForms()
      setForms(userForms)

      // Get subscription info using server action
      const subInfo = await getCurrentUserSubscriptionInfo()
      setSubscriptionInfo(subInfo)

      // Get username
      const user = await fetch("/api/user").then((res) => res.json())
      if (user && user.username) {
        setUsername(user.username)
      }

      console.log("Dashboard data loaded successfully")
    } catch (error) {
      console.error("Error loading forms:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load your forms. Please try again.",
        variant: "destructive",
      })

      // If authentication error, redirect to login
      if (error instanceof Error && error.message.includes("Authentication required")) {
        router.push("/login")
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleLogout = async () => {
    startLoading("logout")
    try {
      await logoutUser()
      // The logoutUser function should handle the redirect
    } catch (error) {
      console.error("Error logging out:", error)
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      })
    } finally {
      stopLoading("logout")
    }
  }

  const handleDeleteForm = async (code: string) => {
    setDeletingForm(code)
    startLoading(`delete-${code}`)
    try {
      await deleteForm(code)
      // Refresh the forms list after deletion
      loadDashboardData()
      toast({
        title: "Form Deleted",
        description: "The form and all its responses have been deleted.",
      })
    } catch (error) {
      console.error("Error deleting form:", error)
      toast({
        title: "Error",
        description: "Failed to delete the form. Please try again.",
        variant: "destructive",
      })
    } finally {
      setDeletingForm(null)
      stopLoading(`delete-${code}`)
    }
  }

  const filteredForms = forms.filter((form) => {
    if (!searchTerm) return true
    return form.code.includes(searchTerm) || form.name.toLowerCase().includes(searchTerm.toLowerCase())
  })

  if (loading) {
    return (
      <div className="container flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin mb-4" />
        <p>Loading dashboard...</p>
      </div>
    )
  }

  // Check if user has reached form limit
  const hasReachedLimit =
    subscriptionInfo?.formLimit !== null && subscriptionInfo?.formCount >= subscriptionInfo?.formLimit

  return (
    <div className="container mx-auto py-8">
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>
                {greeting}, {username || "User"}!
              </CardTitle>
              <CardDescription>Total Forms: {forms.length}</CardDescription>
            </div>
            <div className="flex space-x-2">
              <LoadingButton
                variant="outline"
                onClick={loadDashboardData}
                disabled={refreshing}
                title="Refresh dashboard"
                loadingId="refresh-dashboard"
                loadingText="Refreshing..."
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              </LoadingButton>
              <LoadingButton asChild loadingId="upgrade-plan" loadingText="Loading...">
                <Link href="/pricing">Upgrade Plan</Link>
              </LoadingButton>
              <LoadingButton variant="outline" onClick={handleLogout} loadingId="logout" loadingText="Logging out...">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </LoadingButton>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {subscriptionInfo && (
            <div className="flex justify-between items-center mb-4 p-3 bg-muted rounded-md">
              <div>
                <p className="text-sm font-medium">
                  Current Plan:{" "}
                  <span className="font-bold">
                    {subscriptionInfo.plan === "FREE"
                      ? "Free"
                      : subscriptionInfo.plan === "BASIC"
                        ? "Basic"
                        : "Premium"}
                  </span>
                </p>
                {subscriptionInfo.formLimit && (
                  <p className="text-sm text-muted-foreground">
                    Forms: {subscriptionInfo.formCount} / {subscriptionInfo.formLimit}
                  </p>
                )}
              </div>
              <LoadingButton variant="outline" asChild loadingId="manage-subscription" loadingText="Loading...">
                <Link href="/subscription">
                  {subscriptionInfo.plan === "FREE" ? "Upgrade Plan" : "Manage Subscription"}
                </Link>
              </LoadingButton>
            </div>
          )}

          <div className="flex justify-between items-center mb-4">
            <Input
              placeholder="Search forms..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
              disabled={isLoading}
            />
            {/* Only show the Create Form button if user hasn't reached the limit */}
            {!hasReachedLimit && (
              <LoadingButton asChild loadingId="create-form" loadingText="Loading...">
                <Link href="/create">
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Form
                </Link>
              </LoadingButton>
            )}
          </div>

          {hasReachedLimit && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md flex items-start">
              <AlertTriangle className="h-5 w-5 text-amber-500 mr-2 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-amber-800">
                  You've reached the maximum number of forms allowed on your current plan.
                  <Link href="/subscription" className="ml-1 font-medium underline">
                    Upgrade your plan
                  </Link>{" "}
                  to create more forms.
                </p>
              </div>
            </div>
          )}

          {forms.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">You haven't created any forms yet.</p>
              {!hasReachedLimit && (
                <LoadingButton asChild className="mt-4" loadingId="create-first-form" loadingText="Loading...">
                  <Link href="/create">Create Your First Form</Link>
                </LoadingButton>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event Code</TableHead>
                    <TableHead>Form Name</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Responses</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredForms.map((form) => (
                    <TableRow key={form.id}>
                      <TableCell className="font-mono">{form.code}</TableCell>
                      <TableCell>{form.name}</TableCell>
                      <TableCell>{format(new Date(form.createdAt), "MMM d, yyyy")}</TableCell>
                      <TableCell>{form._count.responses}</TableCell>
                      <TableCell>
                        <Badge variant={form._count.responses > 0 ? "success" : "secondary"}>
                          {form._count.responses > 0 ? "Active" : "No Responses"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <LoadingButton
                            variant="ghost"
                            size="icon"
                            asChild
                            loadingId={`edit-${form.code}`}
                            loadingText=""
                          >
                            <Link href={`/create/${form.code}`} title="Edit Form">
                              <Edit className="h-4 w-4" />
                            </Link>
                          </LoadingButton>
                          <LoadingButton
                            variant="ghost"
                            size="icon"
                            asChild
                            loadingId={`view-${form.code}`}
                            loadingText=""
                          >
                            <Link href={`/view/${form.code}`} title="View Form">
                              <Eye className="h-4 w-4" />
                            </Link>
                          </LoadingButton>
                          <LoadingButton
                            variant="ghost"
                            size="icon"
                            asChild
                            loadingId={`responses-${form.code}`}
                            loadingText=""
                          >
                            <Link href={`/responses/${form.code}`} title="View Responses">
                              <ClipboardList className="h-4 w-4" />
                            </Link>
                          </LoadingButton>
                          <LoadingButton
                            variant="ghost"
                            size="icon"
                            asChild
                            loadingId={`analytics-${form.code}`}
                            loadingText=""
                          >
                            <Link href={`/analytics/${form.code}`} title="View Analytics">
                              <BarChart3 className="h-4 w-4" />
                            </Link>
                          </LoadingButton>
                          <LoadingButton
                            variant="ghost"
                            size="icon"
                            asChild
                            loadingId={`qr-${form.code}`}
                            loadingText=""
                          >
                            <Link href={`/qr-codes/${form.code}`} title="QR Codes">
                              <QrCode className="h-4 w-4" />
                            </Link>
                          </LoadingButton>
                          <LoadingButton
                            variant="ghost"
                            size="icon"
                            asChild
                            loadingId={`checkin-${form.code}`}
                            loadingText=""
                          >
                            <Link href={`/manual-check-in/${form.code}`} title="Manual Check-In">
                              <UserCheck className="h-4 w-4" />
                            </Link>
                          </LoadingButton>
                          <LoadingButton
                            variant="ghost"
                            size="icon"
                            asChild
                            loadingId={`email-${form.code}`}
                            loadingText=""
                          >
                            <Link href={`/email-manager/${form.code}`} title="Email Manager">
                              <Mail className="h-4 w-4" />
                            </Link>
                          </LoadingButton>
                          <LoadingButton
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteForm(form.code)}
                            disabled={deletingForm === form.code}
                            title="Delete Form"
                            loadingId={`delete-${form.code}`}
                            loadingText=""
                          >
                            {deletingForm === form.code ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </LoadingButton>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <p className="text-sm text-muted-foreground">
            Tip: Use the Manual Check-In feature on the day of your event to quickly mark attendees as present.
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}

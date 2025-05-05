"use client"

import React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { format } from "date-fns"
import { useRouter } from "next/navigation"

// UI Components
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { LoadingButton } from "@/components/ui/loading-button"
import { useToast } from "@/hooks/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"

// Icons
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
  MoreVertical,
  Search,
  Share2,
  Grid,
  List,
} from "lucide-react"

// Custom components
import ShareFormLink from "@/components/share-form-link"

// Actions and context
import { getUserForms, deleteForm } from "../actions/form-actions"
import { logoutUser, getCurrentUserSubscriptionInfo } from "../actions/auth-actions"
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
  const [selectedForm, setSelectedForm] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid")
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

    // Set initial view mode based on screen size
    const handleResize = () => {
      setViewMode(window.innerWidth >= 768 ? "table" : "grid")
    }

    // Set initial value
    handleResize()

    // Add event listener
    window.addEventListener("resize", handleResize)

    // Cleanup
    return () => window.removeEventListener("resize", handleResize)
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

  const handleFormClick = (code: string) => {
    // If the form is already selected, navigate to view it
    if (selectedForm === code) {
      router.push(`/view/${code}`)
    } else {
      // Otherwise, select it to show sharing options
      setSelectedForm(code)
    }
  }

  const filteredForms = forms.filter((form) => {
    if (!searchTerm) return true
    return form.code.includes(searchTerm) || form.name.toLowerCase().includes(searchTerm.toLowerCase())
  })

  // Check if user has reached form limit
  const hasReachedLimit =
    subscriptionInfo?.formLimit !== null && subscriptionInfo?.formCount >= subscriptionInfo?.formLimit

  if (loading) {
    return (
      <div className="container max-w-6xl mx-auto py-8 px-4">
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div className="space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-24" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-9 w-9" />
                <Skeleton className="h-9 w-28" />
                <Skeleton className="h-9 w-24" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-10 w-full" />
            <div className="space-y-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container max-w-6xl mx-auto py-4 sm:py-8 px-4">
      <Card className="mb-6 shadow-sm border-slate-200">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <CardTitle className="text-xl sm:text-2xl font-bold">
                {greeting}, {username || "User"}!
              </CardTitle>
              <CardDescription className="mt-1">
                You have {forms.length} {forms.length === 1 ? "form" : "forms"} in your account
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <LoadingButton
                variant="outline"
                onClick={loadDashboardData}
                disabled={refreshing}
                title="Refresh dashboard"
                loadingId="refresh-dashboard"
                loadingText="Refreshing..."
                size="sm"
                className="h-9"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              </LoadingButton>
              <LoadingButton
                asChild
                loadingId="upgrade-plan"
                loadingText="Loading..."
                size="sm"
                className="h-9 bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600"
              >
                <Link href="/pricing">Upgrade Plan</Link>
              </LoadingButton>
              <LoadingButton
                variant="outline"
                onClick={handleLogout}
                loadingId="logout"
                loadingText="Logging out..."
                size="sm"
                className="h-9"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </LoadingButton>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {subscriptionInfo && (
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div>
                <p className="text-sm font-medium flex items-center">
                  Current Plan:{" "}
                  <Badge
                    variant="outline"
                    className={`ml-2 ${
                      subscriptionInfo.plan === "PREMIUM"
                        ? "bg-gradient-to-r from-amber-200 to-yellow-400 text-amber-900 border-amber-300"
                        : ""
                    }`}
                  >
                    {subscriptionInfo.plan === "FREE"
                      ? "Free"
                      : subscriptionInfo.plan === "BASIC"
                        ? "Basic"
                        : "Premium"}
                  </Badge>
                </p>
                {subscriptionInfo.formLimit && (
                  <div className="mt-2">
                    <p className="text-sm text-muted-foreground">
                      Forms: {subscriptionInfo.formCount} / {subscriptionInfo.formLimit}
                    </p>
                    <div className="w-full bg-slate-200 rounded-full h-1.5 mt-1">
                      <div
                        className="bg-primary h-1.5 rounded-full"
                        style={{
                          width: `${Math.min(100, (subscriptionInfo.formCount / subscriptionInfo.formLimit) * 100)}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
              <LoadingButton
                variant={subscriptionInfo.plan === "FREE" ? "default" : "outline"}
                asChild
                loadingId="manage-subscription"
                loadingText="Loading..."
                size="sm"
                className="mt-2 sm:mt-0"
              >
                <Link href="/subscription">
                  {subscriptionInfo.plan === "FREE" ? "Upgrade Plan" : "Manage Subscription"}
                </Link>
              </LoadingButton>
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="relative w-full sm:max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search forms..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
                disabled={isLoading}
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {/* View toggle for larger screens */}
              <div className="hidden md:flex items-center border rounded-md p-1 mr-2">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  className="h-8 px-2"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid className="h-4 w-4 mr-1" />
                  Grid
                </Button>
                <Button
                  variant={viewMode === "table" ? "default" : "ghost"}
                  size="sm"
                  className="h-8 px-2"
                  onClick={() => setViewMode("table")}
                >
                  <List className="h-4 w-4 mr-1" />
                  Table
                </Button>
              </div>

              {/* Only show the Create Form button if user hasn't reached the limit */}
              {!hasReachedLimit && (
                <LoadingButton asChild loadingId="create-form" loadingText="Loading..." className="w-full sm:w-auto">
                  <Link href="/create">
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Form
                  </Link>
                </LoadingButton>
              )}
            </div>
          </div>

          {hasReachedLimit && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start">
              <AlertTriangle className="h-5 w-5 text-amber-500 mr-3 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">Form Limit Reached</p>
                <p className="text-sm text-amber-700 mt-1">
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
            <div className="text-center py-12 px-4 border-2 border-dashed border-slate-200 rounded-lg">
              <div className="mx-auto w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <ClipboardList className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium">No forms yet</h3>
              <p className="text-muted-foreground mt-1 mb-4">You haven't created any forms yet.</p>
              {!hasReachedLimit && (
                <LoadingButton asChild loadingId="create-first-form" loadingText="Loading...">
                  <Link href="/create">Create Your First Form</Link>
                </LoadingButton>
              )}
            </div>
          ) : (
            <>
              {/* Mobile/Grid view - Card layout */}
              <div className={viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" : "hidden"}>
                {filteredForms.map((form) => (
                  <div key={form.id} className="flex flex-col">
                    <Card
                      className={`overflow-hidden relative h-full transition-all ${
                        selectedForm === form.code
                          ? "ring-2 ring-primary shadow-md"
                          : "hover:border-primary/50 hover:shadow-sm"
                      }`}
                      onClick={() => handleFormClick(form.code)}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div className="z-10">
                            <CardTitle className="text-lg line-clamp-1">{form.name}</CardTitle>
                            <CardDescription className="flex items-center mt-1">
                              <span className="text-xs bg-slate-100 px-1.5 py-0.5 rounded font-mono font-medium">
                                {form.code}
                              </span>
                            </CardDescription>
                          </div>
                          <div className="z-10 pointer-events-auto">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 rounded-full"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <MoreVertical className="h-4 w-4" />
                                  <span className="sr-only">More options</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem asChild>
                                  <Link href={`/view/${form.code}`} className="cursor-pointer">
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Form
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <Link href={`/create/${form.code}`} className="cursor-pointer">
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit Form
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <Link href={`/responses/${form.code}`} className="cursor-pointer">
                                    <ClipboardList className="h-4 w-4 mr-2" />
                                    View Responses
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <Link href={`/analytics/${form.code}`} className="cursor-pointer">
                                    <BarChart3 className="h-4 w-4 mr-2" />
                                    Analytics
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <Link href={`/qr-codes/${form.code}`} className="cursor-pointer">
                                    <QrCode className="h-4 w-4 mr-2" />
                                    QR Codes
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <Link href={`/manual-check-in/${form.code}`} className="cursor-pointer">
                                    <UserCheck className="h-4 w-4 mr-2" />
                                    Check-In
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <Link href={`/email-manager/${form.code}`} className="cursor-pointer">
                                    <Mail className="h-4 w-4 mr-2" />
                                    Email
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDeleteForm(form.code)
                                  }}
                                  disabled={deletingForm === form.code}
                                  className="text-destructive focus:text-destructive cursor-pointer"
                                >
                                  {deletingForm === form.code ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4 mr-2" />
                                  )}
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pb-4 pt-0">
                        <div className="flex justify-between items-center">
                          <p className="text-xs text-muted-foreground z-10 pointer-events-none">
                            Created: {format(new Date(form.createdAt), "MMM d, yyyy")}
                          </p>
                          <Badge
                            variant={form._count.responses > 0 ? "success" : "secondary"}
                            className="z-10 pointer-events-none"
                          >
                            {form._count.responses > 0 ? `${form._count.responses} Responses` : "No Responses"}
                          </Badge>
                        </div>

                        <div className="flex flex-wrap gap-1 mt-4">
                          <Button variant="outline" size="sm" className="h-7 px-2 text-xs" asChild>
                            <Link href={`/view/${form.code}`} onClick={(e) => e.stopPropagation()}>
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </Link>
                          </Button>
                          <Button variant="outline" size="sm" className="h-7 px-2 text-xs" asChild>
                            <Link href={`/create/${form.code}`} onClick={(e) => e.stopPropagation()}>
                              <Edit className="h-3 w-3 mr-1" />
                              Edit
                            </Link>
                          </Button>
                          <Button variant="outline" size="sm" className="h-7 px-2 text-xs" asChild>
                            <Link href={`/responses/${form.code}`} onClick={(e) => e.stopPropagation()}>
                              <ClipboardList className="h-3 w-3 mr-1" />
                              Responses
                            </Link>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedForm(selectedForm === form.code ? null : form.code)
                            }}
                          >
                            <Share2 className="h-3 w-3 mr-1" />
                            Share
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {selectedForm === form.code && (
                      <div className="mt-2 mb-4">
                        <ShareFormLink code={form.code} />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Desktop view - Table layout */}
              <div className={viewMode === "table" ? "block" : "hidden"}>
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px]">Event Code</TableHead>
                        <TableHead>Form Name</TableHead>
                        <TableHead className="w-[120px]">Created</TableHead>
                        <TableHead className="w-[100px]">Responses</TableHead>
                        <TableHead className="w-[100px]">Status</TableHead>
                        <TableHead className="text-right w-[220px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredForms.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="h-24 text-center">
                            No forms found matching your search.
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredForms.map((form) => (
                          <React.Fragment key={form.id}>
                            <TableRow
                              className={`cursor-pointer ${selectedForm === form.code ? "bg-muted" : ""}`}
                              onClick={() => handleFormClick(form.code)}
                            >
                              <TableCell className="font-mono text-xs">{form.code}</TableCell>
                              <TableCell>
                                <Link
                                  href={`/view/${form.code}`}
                                  className="font-medium hover:underline"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {form.name}
                                </Link>
                              </TableCell>
                              <TableCell className="text-sm">
                                {format(new Date(form.createdAt), "MMM d, yyyy")}
                              </TableCell>
                              <TableCell className="text-center">{form._count.responses}</TableCell>
                              <TableCell>
                                <Badge variant={form._count.responses > 0 ? "success" : "secondary"}>
                                  {form._count.responses > 0 ? "Active" : "No Responses"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end space-x-1" onClick={(e) => e.stopPropagation()}>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-full"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setSelectedForm(selectedForm === form.code ? null : form.code)
                                    }}
                                    title="Share Form"
                                  >
                                    <Share2 className="h-4 w-4" />
                                  </Button>
                                  <LoadingButton
                                    variant="ghost"
                                    size="icon"
                                    asChild
                                    loadingId={`edit-${form.code}`}
                                    loadingText=""
                                    className="h-8 w-8 rounded-full"
                                  >
                                    <Link href={`/create/${form.code}`} title="Edit Form">
                                      <Edit className="h-4 w-4" />
                                    </Link>
                                  </LoadingButton>
                                  <LoadingButton
                                    variant="ghost"
                                    size="icon"
                                    asChild
                                    loadingId={`responses-${form.code}`}
                                    loadingText=""
                                    className="h-8 w-8 rounded-full"
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
                                    className="h-8 w-8 rounded-full"
                                  >
                                    <Link href={`/analytics/${form.code}`} title="View Analytics">
                                      <BarChart3 className="h-4 w-4" />
                                    </Link>
                                  </LoadingButton>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                                        <MoreVertical className="h-4 w-4" />
                                        <span className="sr-only">More options</span>
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-48">
                                      <DropdownMenuItem asChild>
                                        <Link href={`/qr-codes/${form.code}`} className="cursor-pointer">
                                          <QrCode className="h-4 w-4 mr-2" />
                                          QR Codes
                                        </Link>
                                      </DropdownMenuItem>
                                      <DropdownMenuItem asChild>
                                        <Link href={`/manual-check-in/${form.code}`} className="cursor-pointer">
                                          <UserCheck className="h-4 w-4 mr-2" />
                                          Check-In
                                        </Link>
                                      </DropdownMenuItem>
                                      <DropdownMenuItem asChild>
                                        <Link href={`/email-manager/${form.code}`} className="cursor-pointer">
                                          <Mail className="h-4 w-4 mr-2" />
                                          Email
                                        </Link>
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleDeleteForm(form.code)
                                        }}
                                        disabled={deletingForm === form.code}
                                        className="text-destructive focus:text-destructive cursor-pointer"
                                      >
                                        {deletingForm === form.code ? (
                                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        ) : (
                                          <Trash2 className="h-4 w-4 mr-2" />
                                        )}
                                        Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </TableCell>
                            </TableRow>
                            {selectedForm === form.code && (
                              <TableRow>
                                <TableCell colSpan={6} className="p-0 border-t-0">
                                  <div className="p-4 bg-muted/50">
                                    <ShareFormLink code={form.code} />
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </React.Fragment>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </>
          )}
        </CardContent>
        <CardFooter className="border-t pt-4 text-center sm:text-left">
          <div className="w-full flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
            <p className="text-sm text-muted-foreground">
              Tip: Click on a form to view sharing options or click the form name to preview it.
            </p>
            {forms.length > 0 && (
              <p className="text-sm text-muted-foreground">
                Showing {filteredForms.length} of {forms.length} forms
              </p>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}

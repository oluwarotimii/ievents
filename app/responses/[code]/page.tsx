"use client"

import React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import type { FormField } from "@/event-form-builder/types"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Download, ArrowLeft, Trash2, CheckCircle2, Loader2, RefreshCw, UserCheck } from "lucide-react"
import { format } from "date-fns"
import { getFormByCode, getFormResponses } from "@/app/actions/form-actions"

interface FormResponse {
  id: string
  submittedAt: string
  data: Record<string, any>
  checkedIn?: boolean
  checkInTime?: string
}

export default function ResponsesPage({ params }: { params: { code: string } }) {
  // Unwrap the params object using React.use()
  const unwrappedParams = React.use(params)
  const { code } = unwrappedParams
  const [formFields, setFormFields] = useState<FormField[]>([])
  const [formName, setFormName] = useState("Event Registration Form")
  const [responses, setResponses] = useState<FormResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [deletingResponse, setDeletingResponse] = useState<string | null>(null)
  const [exportingCSV, setExportingCSV] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    loadFormData()
  }, [code])

  const loadFormData = async () => {
    setRefreshing(true)

    try {
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

      setFormFields(form.fields || [])
      setFormName(form.name || "Event Registration Form")

      // Load responses from the database
      const formResponses = await getFormResponses(code)
      setResponses(formResponses || [])
    } catch (error) {
      console.error("Error loading form data:", error)
      toast({
        title: "Error",
        description: "Failed to load form data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleDeleteResponse = async (responseId: string) => {
    setDeletingResponse(responseId)

    try {
      // Call API to delete response
      const response = await fetch(`/api/responses/${responseId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete response")
      }

      // Refresh responses
      await loadFormData()

      toast({
        title: "Response Deleted",
        description: "The response has been deleted successfully.",
      })
    } catch (error) {
      console.error("Error deleting response:", error)
      toast({
        title: "Error",
        description: "Failed to delete the response. Please try again.",
        variant: "destructive",
      })
    } finally {
      setDeletingResponse(null)
    }
  }

  const handleExportCSV = () => {
    if (responses.length === 0) {
      toast({
        title: "No Data",
        description: "There are no responses to export.",
        variant: "destructive",
      })
      return
    }

    setExportingCSV(true)

    try {
      // Create headers
      const headers = ["Submission Date", "Check-In Status", ...formFields.map((field) => field.label)]

      // Create rows
      const rows = responses.map((response) => {
        const row = [
          format(new Date(response.submittedAt), "yyyy-MM-dd HH:mm:ss"),
          response.checkedIn
            ? `Yes (${response.checkInTime ? format(new Date(response.checkInTime), "yyyy-MM-dd HH:mm:ss") : "Unknown time"})`
            : "No",
        ]

        formFields.forEach((field) => {
          const value = response.data[field.id]
          if (field.type === "payment" && typeof value === "object") {
            row.push(`${value.amount || ""} ${value.currency || "USD"}`)
          } else {
            row.push(value || "")
          }
        })

        return row
      })

      // Combine headers and rows
      const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n")

      // Create download link
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.setAttribute("href", url)
      link.setAttribute("download", `${formName.replace(/\s+/g, "_")}_responses.csv`)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "Export Successful",
        description: "Your responses have been exported to CSV.",
      })
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "There was an error exporting your responses.",
        variant: "destructive",
      })
    } finally {
      setExportingCSV(false)
    }
  }

  const filteredResponses = responses.filter((response) => {
    if (!searchTerm) return true

    // Search in all fields
    return Object.values(response.data).some((value) => {
      if (typeof value === "string") {
        return value.toLowerCase().includes(searchTerm.toLowerCase())
      }
      if (typeof value === "object" && value !== null) {
        return Object.values(value).some((v) => String(v).toLowerCase().includes(searchTerm.toLowerCase()))
      }
      return String(value).toLowerCase().includes(searchTerm.toLowerCase())
    })
  })

  if (loading) {
    return (
      <div className="container flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin mb-4" />
        <p>Loading responses...</p>
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
              <CardTitle>{formName}</CardTitle>
              <CardDescription>
                Event Code: {code} | Total Responses: {responses.length}
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={loadFormData} disabled={refreshing} title="Refresh responses">
                <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              </Button>
              <Button variant="outline" asChild>
                <Link href="/dashboard">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
              <Button onClick={handleExportCSV} disabled={exportingCSV || responses.length === 0}>
                {exportingCSV ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <div className="relative max-w-sm">
              <Input
                placeholder="Search responses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
              <Loader2 className={`absolute left-2.5 top-2.5 h-4 w-4 ${searchTerm ? "animate-spin" : "hidden"}`} />
            </div>
            <Button variant="outline" asChild>
              <Link href={`/manual-check-in/${code}`}>
                <UserCheck className="h-4 w-4 mr-2" />
                Manual Check-In
              </Link>
            </Button>
          </div>

          {responses.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No responses yet. Share your form to collect responses.</p>
              <Button variant="outline" className="mt-4" asChild>
                <Link href={`/qr-codes/${code}`}>Go to QR Codes</Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Submission Date</TableHead>
                    {formFields.map((field) => (
                      <TableHead key={field.id}>{field.label}</TableHead>
                    ))}
                    <TableHead>Check-In Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredResponses.map((response) => (
                    <TableRow key={response.id}>
                      <TableCell>{format(new Date(response.submittedAt), "MMM d, yyyy h:mm a")}</TableCell>
                      {formFields.map((field) => (
                        <TableCell key={field.id}>
                          {field.type === "payment" && typeof response.data[field.id] === "object"
                            ? `${response.data[field.id]?.amount || ""} ${response.data[field.id]?.currency || "USD"}`
                            : response.data[field.id] || "-"}
                        </TableCell>
                      ))}
                      <TableCell>
                        {response.checkedIn ? (
                          <div className="flex items-center">
                            <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                            <span className="text-green-600">
                              Checked In
                              {response.checkInTime && (
                                <span className="text-xs block text-muted-foreground">
                                  {format(new Date(response.checkInTime), "MMM d, h:mm a")}
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
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteResponse(response.id)}
                          disabled={deletingResponse === response.id}
                        >
                          {deletingResponse === response.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <p className="text-sm text-muted-foreground">
            {filteredResponses.length} of {responses.length} responses shown
          </p>
          <div className="flex space-x-2">
            <Button variant="outline" asChild>
              <Link href={`/view/${code}`}>View Registration Form</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/analytics/${code}`}>View Analytics</Link>
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}


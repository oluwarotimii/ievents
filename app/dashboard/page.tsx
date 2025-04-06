"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
} from "lucide-react"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { getUserForms, deleteForm } from "../actions/form-actions"
import { logoutUser } from "../actions/auth-actions"

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
  const { toast } = useToast()

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    setRefreshing(true)
    try {
      const userForms = await getUserForms()
      setForms(userForms)
    } catch (error) {
      console.error("Error loading forms:", error)
      toast({
        title: "Error",
        description: "Failed to load your forms. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleLogout = async () => {
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
    }
  }

  const handleDeleteForm = async (code: string) => {
    setDeletingForm(code)
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

  return (
    <div className="container mx-auto py-8">
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Your Forms Dashboard</CardTitle>
              <CardDescription>Total Forms: {forms.length}</CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={loadDashboardData} disabled={refreshing} title="Refresh dashboard">
                <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              </Button>
              <Button asChild>
                <Link href="/pricing">Upgrade Plan</Link>
              </Button>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <Input
              placeholder="Search forms..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <Button asChild>
              <Link href="/create">
                <Plus className="h-4 w-4 mr-2" />
                Create New Form
              </Link>
            </Button>
          </div>

          {forms.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">You haven't created any forms yet.</p>
              <Button asChild className="mt-4">
                <Link href="/create">Create Your First Form</Link>
              </Button>
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
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={`/create/${form.code}`} title="Edit Form">
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={`/view/${form.code}`} title="View Form">
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={`/responses/${form.code}`} title="View Responses">
                              <ClipboardList className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={`/analytics/${form.code}`} title="View Analytics">
                              <BarChart3 className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={`/qr-codes/${form.code}`} title="QR Codes">
                              <QrCode className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={`/manual-check-in/${form.code}`} title="Manual Check-In">
                              <UserCheck className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteForm(form.code)}
                            disabled={deletingForm === form.code}
                            title="Delete Form"
                          >
                            {deletingForm === form.code ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
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


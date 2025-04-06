"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import EventFormBuilder from "@/event-form-builder/EventFormBuilder"
import type { FormField } from "@/event-form-builder/types"
import ShareFormLink from "@/components/share-form-link"
import { ClipboardList, ArrowLeft } from "lucide-react"
import React from "react"
import { getFormByCode, updateForm } from "@/app/actions/form-actions"

export default function CreateFormPage({ params }: { params: { code: string } }) {
  // Unwrap the params object using React.use()
  const unwrappedParams = React.use(params)
  const { code } = unwrappedParams
  const [formFields, setFormFields] = useState<FormField[]>([])
  const [formName, setFormName] = useState("Untitled Event Registration Form")
  const [category, setCategory] = useState<string | null>(null)
  const [showShareLink, setShowShareLink] = useState(false)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

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
        router.push("/")
        return
      }

      // Load form data from the database
      const form = await getFormByCode(code)

      if (form) {
        // Form exists, load its data
        setFormFields(form.fields || [])
        setFormName(form.name || "Untitled Event Registration Form")
        setCategory(form.category)
        setShowShareLink(true)
        setIsAuthorized(true)
      } else {
        toast({
          title: "Form Not Found",
          description: "No form found with this code. Please check and try again.",
          variant: "destructive",
        })
        router.push("/dashboard")
      }
    } catch (error) {
      console.error("Error loading form:", error)
      toast({
        title: "Error",
        description: "Failed to load the form. Please try again.",
        variant: "destructive",
      })
      router.push("/dashboard")
    } finally {
      setLoading(false)
    }
  }

  const handleFormChange = (fields: FormField[]) => {
    setFormFields(fields)
  }

  const handleFormNameChange = (name: string) => {
    setFormName(name)
  }

  const handleCategoryChange = (newCategory: string | null) => {
    setCategory(newCategory)
  }

  const handleSaveForm = async () => {
    setSaving(true)
    try {
      await updateForm(code, formName, category, formFields)

      toast({
        title: "Form Saved",
        description: "Your event registration form has been saved successfully.",
      })

      setShowShareLink(true)
    } catch (error) {
      console.error("Error saving form:", error)
      toast({
        title: "Error",
        description: "Failed to save the form. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="container flex items-center justify-center min-h-screen">
        <p>Loading form...</p>
      </div>
    )
  }

  if (!isAuthorized) {
    return (
      <div className="container flex items-center justify-center min-h-screen">
        <p>You don't have permission to edit this form.</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Event Form Builder - Code: {code}</span>
            <div className="flex space-x-2">
              <Button variant="outline" asChild>
                <Link href="/dashboard">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
              <Button onClick={handleSaveForm} disabled={saving}>
                {saving ? "Saving..." : "Save Form"}
              </Button>
              <Button variant="outline" asChild className="flex items-center">
                <Link href={`/responses/${code}`}>
                  <ClipboardList className="h-4 w-4 mr-2" />
                  View Responses
                </Link>
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>{showShareLink && <ShareFormLink code={code} />}</CardContent>
      </Card>

      <EventFormBuilder
        eventId={code}
        fields={formFields}
        onChange={handleFormChange}
        onNameChange={handleFormNameChange}
        onCategoryChange={handleCategoryChange}
      />
    </div>
  )
}


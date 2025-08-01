"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import type { FormField } from "@/event-form-builder/types"
import React from "react"

// Add imports for the Tabs components if they're not already there
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Loader2, Save } from "lucide-react"
// First, make sure we import the PaymentSettingsComponent
import PaymentSettingsComponent from "./payment-settings"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import ShareFormLink from "@/components/share-form-link"
import EventFormBuilder from "@/event-form-builder/EventFormBuilder"
import { getFormByCode, updateForm } from "@/app/actions/form-actions"
// Import the PaymentGuide component near the top of the file
import PaymentGuide from "./payment-guide"

export default function EditFormPage({ params }: { params: { code: string } }) {
  // Unwrap the params object using React.use()
  const unwrappedParams = React.use(params)
  const { code } = unwrappedParams
  const [formFields, setFormFields] = useState<FormField[]>([])
  const [formName, setFormName] = useState("Untitled Event Registration Form")
  const [category, setCategory] = useState<string | null>(null)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("form")
  const [formData, setFormData] = useState({
    collectsPayments: false,
    paymentAmount: 0 as number,
    paymentTitle: "Event Registration Fee" as string,
    paymentDescription: "Payment for event registration" as string,
  })
  const router = useRouter()
  const { toast } = useToast()

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

      if (form) {
        // Load existing form data
        setFormFields(form.fields || [])
        setFormName(form.name || "Untitled Event Registration Form")
        setCategory(form.category || null)
        setIsAuthorized(true)
        setFormData({
          collectsPayments: form.collectsPayments || false,
          paymentAmount: form.paymentAmount || 0,
          paymentTitle: form.paymentTitle || "Event Registration Fee",
          paymentDescription: form.paymentDescription || "Payment for event registration",
        })
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

  useEffect(() => {
    loadFormData()
  }, [code])

  const handleFormChange = (fields: FormField[]) => {
    setFormFields(fields)
  }

  const handleFormNameChange = (name: string) => {
    setFormName(name)
  }

  const handleCategoryChange = (newCategory: string | null) => {
    setCategory(newCategory)
  }

  // Use useCallback to prevent recreation of this function on every render
  const handlePaymentSettingsChange = useCallback(
    (settings: {
      collectsPayments: boolean
      paymentAmount: number
      paymentTitle: string
      paymentDescription: string
    }) => {
      setFormData(settings)
    },
    [],
  )

  const handleSaveForm = async () => {
    if (formFields.length === 0) {
      toast({
        title: "Form Empty",
        description: "Please add at least one field to your form.",
        variant: "destructive",
      })
      return
    }

    setSaving(true)

    try {
      await updateForm(
        code,
        formName,
        category,
        formFields,
        formData.collectsPayments,
        formData.paymentAmount,
        formData.paymentTitle,
        formData.paymentDescription,
      )

      toast({
        title: "Form Saved",
        description: "Your form has been updated successfully.",
      })
    } catch (error) {
      console.error("Error updating form:", error)
      toast({
        title: "Error",
        description: "Failed to update the form. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="container flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin mb-4" />
        <p>Loading form...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Edit Event Form</CardTitle>
            <CardDescription>Event Code: {code}</CardDescription>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" asChild>
              <Link href="/dashboard">Cancel</Link>
            </Button>
            <Button onClick={handleSaveForm} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Form
                </>
              )}
            </Button>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="form" className="w-full" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="form">Form Builder</TabsTrigger>
          <TabsTrigger value="payment">Payment Settings</TabsTrigger>
          <TabsTrigger value="sharing">Sharing Options</TabsTrigger>
        </TabsList>

        <TabsContent value="form">
          <EventFormBuilder
            eventId={code}
            fields={formFields}
            onChange={handleFormChange}
            onNameChange={handleFormNameChange}
            onCategoryChange={handleCategoryChange}
            initialFormName={formName}
            initialCategory={category}
          />
        </TabsContent>

        <TabsContent value="payment">
          <PaymentGuide />
          <PaymentSettingsComponent formCode={code} formData={formData} onChange={handlePaymentSettingsChange} />
        </TabsContent>

        <TabsContent value="sharing">
          <Card>
            <CardHeader>
              <CardTitle>Sharing Options</CardTitle>
              <CardDescription>Configure how your form can be shared with attendees</CardDescription>
            </CardHeader>
            <CardContent>
              <ShareFormLink code={code} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

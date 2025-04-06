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
import { ClipboardList, ArrowLeft, CreditCard } from "lucide-react"
import React from "react"
import { getFormByCode, updateForm } from "@/app/actions/form-actions"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
// import PaymentSettingsComponent from "./[code]/payment-settings"

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
  const [formData, setFormData] = useState({
    collectsPayments: false,
    paymentAmount: null as number | null,
    paymentTitle: null as string | null,
    paymentDescription: null as string | null,
  })
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
        setFormData({
          collectsPayments: form.collectsPayments || false,
          paymentAmount: form.paymentAmount,
          paymentTitle: form.paymentTitle,
          paymentDescription: form.paymentDescription,
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
        <p>You are not authorized to view this form.</p>
        <Link href="/dashboard" className="ml-2 text-blue-500">
          Go to Dashboard
        </Link>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10">
      <Link href="/dashboard" className="inline-flex items-center mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Link>

      <Card className="w-full">
        <CardHeader>
          <CardTitle>{formName}</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="form-builder" className="w-full">
            <TabsList>
              <TabsTrigger value="form-builder">
                <ClipboardList className="mr-2 h-4 w-4" />
                Form Builder
              </TabsTrigger>
              <TabsTrigger value="payment-settings">
                <CreditCard className="mr-2 h-4 w-4" />
                Payment Settings
              </TabsTrigger>
            </TabsList>
            <TabsContent value="form-builder">
              <EventFormBuilder
                formFields={formFields}
                onFormChange={handleFormChange}
                onFormNameChange={handleFormNameChange}
                onCategoryChange={handleCategoryChange}
                formName={formName}
                category={category}
              />
            </TabsContent>
            <TabsContent value="payment-settings">
              <PaymentSettingsComponent formData={formData} setFormData={setFormData} />
            </TabsContent>
          </Tabs>

          <div className="flex justify-end mt-4">
            <Button variant="secondary" onClick={handleSaveForm} disabled={saving}>
              {saving ? "Saving..." : "Save Form"}
            </Button>
            {showShareLink && <ShareFormLink code={code} />}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


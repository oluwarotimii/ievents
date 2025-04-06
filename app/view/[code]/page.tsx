"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import type { FormField } from "@/event-form-builder/types"
import ShareFormLink from "@/components/share-form-link"
import { getFormByCode, submitFormResponse } from "@/app/actions/form-actions"
import { CheckCircle2, Loader2 } from "lucide-react"

export default function ViewFormPage({ params }: { params: { code: string } }) {
  // Unwrap the params object using React.use()
  const unwrappedParams = React.use(params)
  const { code } = unwrappedParams

  const [formFields, setFormFields] = useState<FormField[]>([])
  const [formName, setFormName] = useState("Event Registration Form")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [formExists, setFormExists] = useState(false)
  const [formValues, setFormValues] = useState<Record<string, any>>({})
  const router = useRouter()
  const { toast } = useToast()
  const [submissionSuccess, setSubmissionSuccess] = useState(false)
  const [submittedData, setSubmittedData] = useState<Record<string, any>>({})

  useEffect(() => {
    loadForm()
  }, [code])

  const loadForm = async () => {
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
        // Load existing form data
        setFormFields(form.fields || [])
        setFormName(form.name || "Event Registration Form")
        setFormExists(true)
      } else {
        toast({
          title: "Event Not Found",
          description: "No event found with this code. Please check and try again.",
          variant: "destructive",
        })
        router.push("/")
      }
    } catch (error) {
      console.error("Error loading form:", error)
      toast({
        title: "Error",
        description: "Failed to load the form. Please try again.",
        variant: "destructive",
      })
      router.push("/")
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (fieldId: string, value: any) => {
    setFormValues((prev) => ({
      ...prev,
      [fieldId]: value,
    }))
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      // Submit form response to the database
      const result = await submitFormResponse(code, formValues)

      if (!result.success) {
        throw new Error("Failed to submit form")
      }

      // Store the submitted data for the success screen
      setSubmittedData({ ...formValues })

      // Show success screen
      setSubmissionSuccess(true)
    } catch (error) {
      console.error("Error submitting form:", error)
      toast({
        title: "Submission Failed",
        description: error instanceof Error ? error.message : "Failed to submit your registration. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const getFirstName = (data: Record<string, any>): string => {
    // Try to find a field that might contain the first name
    for (const field of formFields) {
      const fieldId = field.id
      const value = data[fieldId]

      // Check if the field label contains "name" and has a value
      if (field.label.toLowerCase().includes("name") && typeof value === "string" && value.trim() !== "") {
        // If it's "Full Name", try to extract first name
        if (field.label.toLowerCase().includes("full")) {
          const nameParts = value.trim().split(" ")
          return nameParts[0] || value
        }
        return value
      }
    }

    // Fallback to "there" if no name field found
    return "there"
  }

  if (loading) {
    return (
      <div className="container flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin mb-4" />
        <p>Loading form...</p>
      </div>
    )
  }

  if (!formExists) {
    return null // Will redirect in useEffect
  }

  // If submission was successful, show success screen
  if (submissionSuccess) {
    const firstName = getFirstName(submittedData)

    return (
      <div className="container mx-auto py-8 px-4 max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">{formName}</CardTitle>
            <CardDescription className="text-center">Event Code: {code}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="h-10 w-10 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-center mb-2">Thank You, {firstName}!</h2>
            <p className="text-center text-muted-foreground mb-4">Your registration has been successfully submitted.</p>
            <p className="text-center text-muted-foreground">
              You will receive a confirmation email shortly with all the event details.
            </p>
          </CardContent>
          <CardFooter className="flex justify-center gap-4">
            <Button
              variant="outline"
              onClick={() => {
                setSubmissionSuccess(false)
                setFormValues({})
              }}
            >
              Register Another Person
            </Button>
            <Button asChild>
              <Link href="/">Return to Home</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  // Otherwise show the form
  const renderField = (field: FormField) => {
    switch (field.type) {
      case "text":
      case "email":
      case "phone":
        return (
          <div className="mb-4">
            <label htmlFor={field.id} className="block text-sm font-medium mb-1">
              {field.label}
              {field.required && "*"}
            </label>
            <input
              id={field.id}
              type={field.type === "email" ? "email" : "text"}
              className="w-full p-2 border rounded-md"
              required={field.required}
              value={formValues[field.id] || ""}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
            />
          </div>
        )
      case "date":
        return (
          <div className="mb-4">
            <label htmlFor={field.id} className="block text-sm font-medium mb-1">
              {field.label}
              {field.required && "*"}
            </label>
            <input
              id={field.id}
              type="date"
              className="w-full p-2 border rounded-md"
              required={field.required}
              value={formValues[field.id] || ""}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
            />
          </div>
        )
      case "textarea":
        return (
          <div className="mb-4">
            <label htmlFor={field.id} className="block text-sm font-medium mb-1">
              {field.label}
              {field.required && "*"}
            </label>
            <textarea
              id={field.id}
              className="w-full p-2 border rounded-md"
              required={field.required}
              value={formValues[field.id] || ""}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
            />
          </div>
        )
      case "select":
        return (
          <div className="mb-4">
            <label htmlFor={field.id} className="block text-sm font-medium mb-1">
              {field.label}
              {field.required && "*"}
            </label>
            <select
              id={field.id}
              className="w-full p-2 border rounded-md"
              required={field.required}
              value={formValues[field.id] || ""}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
            >
              <option value="">Select an option</option>
              {field.options?.map((option, index) => (
                <option key={index} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        )
      case "radio":
        return (
          <div className="mb-4">
            <fieldset>
              <legend className="block text-sm font-medium mb-1">
                {field.label}
                {field.required && "*"}
              </legend>
              {field.options?.map((option, index) => (
                <div key={index} className="flex items-center space-x-2 mt-1">
                  <input
                    type="radio"
                    id={`${field.id}-${index}`}
                    name={field.id}
                    value={option}
                    required={field.required}
                    checked={formValues[field.id] === option}
                    onChange={() => handleInputChange(field.id, option)}
                  />
                  <label htmlFor={`${field.id}-${index}`}>{option}</label>
                </div>
              ))}
            </fieldset>
          </div>
        )
      case "number":
        return (
          <div className="mb-4">
            <label htmlFor={field.id} className="block text-sm font-medium mb-1">
              {field.label}
              {field.required && "*"}
            </label>
            <input
              id={field.id}
              type="number"
              className="w-full p-2 border rounded-md"
              required={field.required}
              value={formValues[field.id] || ""}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
            />
          </div>
        )
      case "payment":
        return (
          <div className="mb-4">
            <label htmlFor={field.id} className="block text-sm font-medium mb-1">
              {field.label}
              {field.required && "*"}
            </label>
            <div className="flex space-x-2">
              <input
                id={field.id}
                type="number"
                className="w-full p-2 border rounded-md"
                required={field.required}
                placeholder="Enter amount"
                value={formValues[field.id]?.amount || ""}
                onChange={(e) =>
                  handleInputChange(field.id, {
                    ...formValues[field.id],
                    amount: e.target.value,
                  })
                }
              />
              <select
                className="p-2 border rounded-md"
                value={formValues[field.id]?.currency || "USD"}
                onChange={(e) =>
                  handleInputChange(field.id, {
                    ...formValues[field.id],
                    currency: e.target.value,
                  })
                }
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
              </select>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{formName}</CardTitle>
          <CardDescription>Event Code: {code}</CardDescription>
        </CardHeader>
        <CardContent>
          <ShareFormLink code={code} />

          <form onSubmit={handleFormSubmit} className="mt-6 space-y-4">
            {formFields.map((field) => (
              <div key={field.id}>{renderField(field)}</div>
            ))}

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Registration"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}


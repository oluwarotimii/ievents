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
import { initializeFormPayment } from "@/app/actions/payment-actions"
import { CheckCircle2, Loader2, CreditCard } from "lucide-react"

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
  const [collectsPayments, setCollectsPayments] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState<number | null>(null)
  const [paymentTitle, setPaymentTitle] = useState<string | null>(null)
  const [paymentDescription, setPaymentDescription] = useState<string | null>(null)
  const [processingPayment, setProcessingPayment] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const [submissionSuccess, setSubmissionSuccess] = useState(false)
  const [submittedData, setSubmittedData] = useState<Record<string, any>>({})
  const [responseId, setResponseId] = useState<number | null>(null)

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
        setCollectsPayments(form.collectsPayments || false)
        setPaymentAmount(form.paymentAmount)
        setPaymentTitle(form.paymentTitle)
        setPaymentDescription(form.paymentDescription)
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

    // Validate required fields
    const missingRequiredFields = formFields.filter((field) => field.required).filter((field) => !formValues[field.id])

    if (missingRequiredFields.length > 0) {
      toast({
        title: "Missing Required Fields",
        description: "Please fill in all required fields before submitting.",
        variant: "destructive",
      })
      return
    }

    setSubmitting(true)

    try {
      // Submit form response to the database
      const result = await submitFormResponse(code, formValues)

      if (!result.success) {
        throw new Error(result.message || "Failed to submit form")
      }

      // Store the submitted data for the success screen
      setSubmittedData({ ...formValues })
      setResponseId(result.responseId)

      // If the form collects payments, redirect to payment
      if (collectsPayments && paymentAmount) {
        await handlePayment(result.responseId)
      } else {
        // Show success screen
        setSubmissionSuccess(true)
      }
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

  const handlePayment = async (responseId: number) => {
    setProcessingPayment(true)

    try {
      // Get email and name from form values
      let email = ""
      let name = ""

      for (const field of formFields) {
        const value = formValues[field.id]
        if (field.type === "email" && value) {
          email = value
        }
        if (field.label.toLowerCase().includes("name") && value) {
          name = value
        }
      }

      if (!email) {
        throw new Error("Email is required for payment")
      }

      // Initialize payment
      const paymentResult = await initializeFormPayment(code, email, name, responseId)

      if (!paymentResult.success) {
        throw new Error(paymentResult.message || "Failed to initialize payment")
      }

      // Redirect to payment page
      window.location.href = paymentResult.paymentUrl
    } catch (error) {
      console.error("Error processing payment:", error)
      toast({
        title: "Payment Error",
        description: error instanceof Error ? error.message : "Failed to process payment. Please try again.",
        variant: "destructive",
      })

      // Show success screen anyway, they can try payment again later
      setSubmissionSuccess(true)
    } finally {
      setProcessingPayment(false)
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

  // Calculate platform fee (2% capped at ₦200)
  const calculatePlatformFee = (amount: number): number => {
    const fee = amount * 0.02
    return Math.min(fee, 200) // Cap at ₦200
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

  // If submission was successful
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

            {collectsPayments && paymentAmount && responseId && (
              <div className="w-full mt-4">
                <Card className="bg-blue-50 border-blue-100">
                  <CardContent className="pt-6">
                    <h3 className="font-medium text-blue-800 mb-2">Payment Required</h3>
                    <p className="text-sm text-blue-700 mb-4">
                      Please complete your payment to confirm your registration.
                    </p>
                    <div className="bg-white p-3 rounded-md mb-4">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Base Amount:</span>
                        <span>₦{paymentAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Platform Fee (2%):</span>
                        <span>₦{calculatePlatformFee(paymentAmount).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between font-medium border-t border-blue-100 pt-1 mt-1">
                        <span>Total:</span>
                        <span>₦{(paymentAmount + calculatePlatformFee(paymentAmount)).toLocaleString()}</span>
                      </div>
                    </div>
                    <Button className="w-full" onClick={() => handlePayment(responseId)} disabled={processingPayment}>
                      {processingPayment ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CreditCard className="h-4 w-4 mr-2" />
                          Pay Now
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}

            <p className="text-center text-muted-foreground mt-4">
              You will receive a confirmation email shortly with all the event details.
            </p>
          </CardContent>
          <CardFooter className="flex justify-center gap-4">
            <Button
              variant="outline"
              onClick={() => {
                setSubmissionSuccess(false)
                setFormValues({})
                setResponseId(null)
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
                value={formValues[field.id]?.currency || "NGN"}
                onChange={(e) =>
                  handleInputChange(field.id, {
                    ...formValues[field.id],
                    currency: e.target.value,
                  })
                }
              >
                <option value="NGN">NGN</option>
              </select>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="container mx-auto py-8 px-4 w-full max-w-md sm:max-w-lg md:max-w-xl">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-xl sm:text-2xl">{formName}</CardTitle>
          <CardDescription>Event Code: {code}</CardDescription>
        </CardHeader>
        <CardContent>
          <ShareFormLink code={code} />

          <form onSubmit={handleFormSubmit} className="mt-6 space-y-4">
            {formFields.map((field) => (
              <div key={field.id}>{renderField(field)}</div>
            ))}

            {collectsPayments && paymentAmount && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-md">
                <h3 className="font-medium text-blue-800 mb-2">{paymentTitle || "Registration Fee"}</h3>
                <p className="text-sm text-blue-700 mb-3">
                  {paymentDescription || "A payment is required to complete your registration for this event."}
                </p>

                <div className="bg-white p-3 rounded-md">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">Registration Fee:</span>
                    <span className="font-medium">₦{paymentAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">Platform Fee (2%):</span>
                    <span>₦{calculatePlatformFee(paymentAmount).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-medium border-t border-blue-100 pt-1 mt-1">
                    <span>Total:</span>
                    <span>₦{(paymentAmount + calculatePlatformFee(paymentAmount)).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}

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

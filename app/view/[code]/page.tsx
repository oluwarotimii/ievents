"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { LoadingButton } from "@/components/ui/loading-button"
import { useToast } from "@/hooks/use-toast"
import type { FormField, PaymentField } from "@/event-form-builder/types"
import ShareFormLink from "@/components/share-form-link"
import { getFormByCode, submitFormResponse } from "@/app/actions/form-actions"
import { initializeFormPayment } from "@/app/actions/payment-actions"
import { CheckCircle2, Loader2, CreditCard } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { useLoading } from "@/contexts/loading-context"

export default function ViewFormPage({ params }: { params: { code: string } }) {
  // Unwrap the params object using React.use()
  const unwrappedParams = React.use(params)
  const { code } = unwrappedParams

  const [formFields, setFormFields] = useState<FormField[]>([])
  const [formName, setFormName] = useState("Event Registration Form")
  const [loading, setLoading] = useState(true)
  const [formExists, setFormExists] = useState(false)
  const [formValues, setFormValues] = useState<Record<string, any>>({})
  const [selectedPaymentItems, setSelectedPaymentItems] = useState<Record<string, boolean>>({})
  const [submissionSuccess, setSubmissionSuccess] = useState(false)
  const [submittedData, setSubmittedData] = useState<Record<string, any>>({})
  const [responseId, setResponseId] = useState<number | null>(null)
  const router = useRouter()
  const { toast } = useToast()
  const { isLoading, startLoading, stopLoading } = useLoading()

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

        // Initialize selected payment items
        const paymentSelections: Record<string, boolean> = {}
        form.fields.forEach((field) => {
          if (field.type === "payment") {
            const paymentField = field as PaymentField
            // Required payment items are automatically selected
            paymentSelections[field.id] = !paymentField.isOptional
          }
        })
        setSelectedPaymentItems(paymentSelections)
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

  const handlePaymentItemToggle = (fieldId: string, checked: boolean) => {
    setSelectedPaymentItems((prev) => ({
      ...prev,
      [fieldId]: checked,
    }))
  }

  // Calculate total payment amount based on selected items
  const calculateTotalPayment = () => {
    return formFields
      .filter((field) => field.type === "payment" && selectedPaymentItems[field.id])
      .reduce((total, field) => total + ((field as PaymentField).amount || 0), 0)
  }

  // Calculate platform fee (2% capped at ₦200)
  const calculatePlatformFee = (amount: number): number => {
    const fee = amount * 0.02
    return Math.min(fee, 200) // Cap at ₦200
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    startLoading("form-submit")

    // Validate required fields
    const missingRequiredFields = formFields
      .filter((field) => field.required && field.type !== "payment")
      .filter((field) => !formValues[field.id])

    // Check for required payment fields that aren't selected
    const missingRequiredPayments = formFields
      .filter((field) => field.type === "payment" && field.required && !(field as PaymentField).isOptional)
      .filter((field) => !selectedPaymentItems[field.id])

    if (missingRequiredFields.length > 0 || missingRequiredPayments.length > 0) {
      toast({
        title: "Missing Required Fields",
        description: "Please fill in all required fields before submitting.",
        variant: "destructive",
      })
      stopLoading("form-submit")
      return
    }

    try {
      // Add payment selections to form values
      const paymentData: Record<string, any> = {}
      formFields.forEach((field) => {
        if (field.type === "payment" && selectedPaymentItems[field.id]) {
          const paymentField = field as PaymentField
          paymentData[field.id] = {
            amount: paymentField.amount,
            currency: paymentField.currency,
            itemType: paymentField.itemType || "registration",
            description: paymentField.description || field.label,
          }
        }
      })

      const submissionData = {
        ...formValues,
        ...paymentData,
      }

      // Submit form response to the database
      const result = await submitFormResponse(code, submissionData)

      if (!result.success) {
        throw new Error(result.message || "Failed to submit form")
      }

      // Store the submitted data for the success screen
      setSubmittedData(submissionData)
      setResponseId(result.responseId)

      // If there are selected payment items, redirect to payment
      const totalPayment = calculateTotalPayment()
      if (totalPayment > 0) {
        await handlePayment(result.responseId, totalPayment)
      } else {
        // Show success screen if no payment needed
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
      stopLoading("form-submit")
    }
  }

  const handlePayment = async (responseId: number, totalAmount: number) => {
    startLoading("payment-process")

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
      stopLoading("payment-process")
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

  // If submission was successful
  if (submissionSuccess) {
    const firstName = getFirstName(submittedData)
    const totalPayment = calculateTotalPayment()

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

            {totalPayment > 0 && responseId && (
              <div className="w-full mt-4">
                <Card className="bg-blue-50 border-blue-100">
                  <CardContent className="pt-6">
                    <h3 className="font-medium text-blue-800 mb-2">Payment Required</h3>
                    <p className="text-sm text-blue-700 mb-4">
                      Please complete your payment to confirm your registration.
                    </p>
                    <div className="bg-white p-3 rounded-md mb-4">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Total Amount:</span>
                        <span>₦{totalPayment.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Platform Fee (2%):</span>
                        <span>₦{calculatePlatformFee(totalPayment).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between font-medium border-t border-blue-100 pt-1 mt-1">
                        <span>Total:</span>
                        <span>₦{(totalPayment + calculatePlatformFee(totalPayment)).toLocaleString()}</span>
                      </div>
                    </div>
                    <LoadingButton
                      className="w-full"
                      onClick={() => handlePayment(responseId, totalPayment)}
                      loadingId="payment-process"
                      loadingText="Processing payment..."
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      Pay Now
                    </LoadingButton>
                  </CardContent>
                </Card>
              </div>
            )}

            <p className="text-center text-muted-foreground mt-4">
              You will receive a confirmation email shortly with all the event details.
            </p>
          </CardContent>
          <CardFooter className="flex justify-center gap-4">
            <LoadingButton
              variant="outline"
              onClick={() => {
                setSubmissionSuccess(false)
                setFormValues({})
                setResponseId(null)
              }}
              loadingId="register-another"
              loadingText="Loading..."
            >
              Register Another Person
            </LoadingButton>
            <LoadingButton asChild loadingId="return-home" loadingText="Loading...">
              <Link href="/">Return to Home</Link>
            </LoadingButton>
          </CardFooter>
        </Card>
      </div>
    )
  }

  // Check if there are any payment fields
  const hasPaymentFields = formFields.some((field) => field.type === "payment")
  const totalPayment = calculateTotalPayment()
  const platformFee = calculatePlatformFee(totalPayment)
  const grandTotal = totalPayment + platformFee

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
              disabled={isLoading}
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
              disabled={isLoading}
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
              disabled={isLoading}
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
              disabled={isLoading}
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
                    disabled={isLoading}
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
              disabled={isLoading}
            />
          </div>
        )
      case "payment":
        const paymentField = field as PaymentField
        const isOptional = paymentField.isOptional || false
        const isSelected = selectedPaymentItems[field.id] || false

        return (
          <div className="mb-4 p-3 border rounded-md bg-gray-50">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                {isOptional && (
                  <Checkbox
                    id={`payment-${field.id}`}
                    checked={isSelected}
                    onCheckedChange={(checked) => handlePaymentItemToggle(field.id, checked === true)}
                    className="mr-2"
                    disabled={isLoading}
                  />
                )}
                <label htmlFor={`payment-${field.id}`} className="font-medium">
                  {field.label}
                  {!isOptional && "*"}
                </label>
              </div>
              <div className="text-right font-medium">
                {paymentField.currency} {paymentField.amount.toLocaleString()}
              </div>
            </div>

            {paymentField.description && (
              <p className="text-sm text-muted-foreground mt-1">{paymentField.description}</p>
            )}

            {paymentField.itemType && (
              <div className="mt-1">
                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                  {paymentField.itemType.charAt(0).toUpperCase() + paymentField.itemType.slice(1)}
                </span>
              </div>
            )}
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

            {hasPaymentFields && totalPayment > 0 && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-md">
                <h3 className="font-medium text-blue-800 mb-2">Payment Summary</h3>
                <div className="bg-white p-3 rounded-md">
                  {formFields
                    .filter((field) => field.type === "payment" && selectedPaymentItems[field.id])
                    .map((field, index) => {
                      const paymentField = field as PaymentField
                      return (
                        <div key={index} className="flex justify-between mb-1">
                          <span className="text-sm">{field.label}</span>
                          <span>
                            {paymentField.currency} {paymentField.amount.toLocaleString()}
                          </span>
                        </div>
                      )
                    })}
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">Platform Fee (2%):</span>
                    <span>₦{platformFee.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-medium border-t border-blue-100 pt-1 mt-1">
                    <span>Total:</span>
                    <span>₦{grandTotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}

            <LoadingButton type="submit" className="w-full" loadingId="form-submit" loadingText="Submitting...">
              Submit Registration
            </LoadingButton>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

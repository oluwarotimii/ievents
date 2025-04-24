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
import { useLoading } from "@/components/loading-context"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Button } from "@/components/ui/button"

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
  const [showPaymentConfirmation, setShowPaymentConfirmation] = useState(false)
  const [formLevelPayment, setFormLevelPayment] = useState<number>(0)
  const [isLoadingFormData, setIsLoadingFormData] = useState<boolean>(false)

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

      // Calculate total from payment fields
      const totalPaymentFieldsAmount = calculateTotalPayment()

      // Get form-level payment info
      const formResponse = await getFormByCode(code)
      const hasFormLevelPayment =
        formResponse && formResponse.collectsPayments && formResponse.paymentAmount && formResponse.paymentAmount > 0

      // If there are selected payment items OR form has a payment amount, proceed to payment
      if (totalPaymentFieldsAmount > 0 || hasFormLevelPayment) {
        // Show payment confirmation step
        setShowPaymentConfirmation(true)
        stopLoading("form-submit")
      } else {
        // Show success screen if no payment needed
        setSubmissionSuccess(true)
        stopLoading("form-submit")
      }
    } catch (error) {
      console.error("Error submitting form:", error)
      toast({
        title: "Submission Failed",
        description: error instanceof Error ? error.message : "Failed to submit your registration. Please try again.",
        variant: "destructive",
      })
      stopLoading("form-submit")
    }
  }

  // Update the handlePayment function to include the form payment
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

      // Show loading message before redirect
      toast({
        title: "Redirecting to Payment",
        description: "Please wait while we redirect you to the payment page...",
      })

      // Short delay before redirect for better UX
      setTimeout(() => {
        // Redirect to payment page
        window.location.href = paymentResult.paymentUrl
      }, 1000)
    } catch (error) {
      console.error("Error processing payment:", error)
      toast({
        title: "Payment Error",
        description: error instanceof Error ? error.message : "Failed to process payment. Please try again.",
        variant: "destructive",
      })

      // Show success screen anyway, they can try payment again later
      setShowPaymentConfirmation(false)
      setSubmissionSuccess(true)
      stopLoading("payment-process")
    }
  }

  // Update the payment confirmation screen to include form-level payment
  // This part comes after the handlePayment function

  // Payment confirmation screen
  if (showPaymentConfirmation && responseId) {
    // Effect to load form data to get payment amount
    useEffect(() => {
      const loadFormPaymentData = async () => {
        setIsLoadingFormData(true)
        try {
          const formData = await getFormByCode(code)
          if (formData && formData.collectsPayments && formData.paymentAmount) {
            setFormLevelPayment(formData.paymentAmount)
          }
        } catch (error) {
          console.error("Error loading form payment data:", error)
        } finally {
          setIsLoadingFormData(false)
        }
      }

      loadFormPaymentData()
    }, [code])

    if (isLoadingFormData) {
      return (
        <div className="container mx-auto py-6 sm:py-8 px-4 w-full max-w-md">
          <Card className="w-full shadow-lg">
            <CardContent className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p className="ml-2">Loading payment information...</p>
            </CardContent>
          </Card>
        </div>
      )
    }

    const totalPaymentFieldsAmount = calculateTotalPayment()
    const platformFee = calculatePlatformFee(totalPaymentFieldsAmount + formLevelPayment)
    const grandTotal = totalPaymentFieldsAmount + formLevelPayment + platformFee

    return (
      <div className="container mx-auto py-6 sm:py-8 px-4 w-full max-w-md">
        <Card className="w-full shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl sm:text-2xl text-center">Complete Your Payment</CardTitle>
            <CardDescription className="text-center">
              Your registration for {formName} has been received
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-md">
              <h3 className="font-medium text-blue-800 mb-3">Payment Summary</h3>
              <div className="bg-white p-4 rounded-md">
                {formLevelPayment > 0 && (
                  <div className="flex justify-between mb-2">
                    <span className="text-sm">Registration Fee</span>
                    <span>₦{formLevelPayment.toLocaleString()}</span>
                  </div>
                )}

                {formFields
                  .filter((field) => field.type === "payment" && selectedPaymentItems[field.id])
                  .map((field, index) => {
                    const paymentField = field as PaymentField
                    return (
                      <div key={index} className="flex justify-between mb-2">
                        <span className="text-sm">{field.label}</span>
                        <span>
                          {paymentField.currency} {paymentField.amount.toLocaleString()}
                        </span>
                      </div>
                    )
                  })}
                <div className="flex justify-between mb-2">
                  <span className="text-sm">Platform Fee (2%):</span>
                  <span>₦{platformFee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-medium border-t border-blue-100 pt-2 mt-2">
                  <span>Total:</span>
                  <span>₦{grandTotal.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-md">
                <h4 className="font-medium mb-2">Payment Information</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  You'll be redirected to Paystack to complete your payment securely.
                </p>
                <div className="flex items-center space-x-2 text-sm">
                  <CreditCard className="h-4 w-4 text-green-600" />
                  <span>Secure payment powered by Paystack</span>
                </div>
              </div>

              <LoadingButton
                className="w-full h-12 text-lg"
                onClick={() => handlePayment(responseId, totalPaymentFieldsAmount + formLevelPayment)}
                loadingId="payment-process"
                loadingText="Processing payment..."
              >
                <CreditCard className="h-5 w-5 mr-2" />
                Proceed to Payment
              </LoadingButton>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setShowPaymentConfirmation(false)
                  setSubmissionSuccess(true)
                }}
              >
                Pay Later
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Update the success screen to include form-level payment details
  // This comes after the showPaymentConfirmation section

  // If submission was successful
  if (submissionSuccess) {
    const getFirstName = (data: Record<string, any>): string => {
      for (const key in data) {
        if (key.toLowerCase().includes("name")) {
          const name = data[key]
          if (typeof name === "string") {
            return name.split(" ")[0]
          }
        }
      }
      return "Guest"
    }
    const firstName = getFirstName(submittedData)

    // Effect to load form data to get payment amount
    useEffect(() => {
      const loadFormPaymentData = async () => {
        setIsLoadingFormData(true)
        try {
          const formData = await getFormByCode(code)
          if (formData && formData.collectsPayments && formData.paymentAmount) {
            setFormLevelPayment(formData.paymentAmount)
          }
        } catch (error) {
          console.error("Error loading form payment data:", error)
        } finally {
          setIsLoadingFormData(false)
        }
      }

      loadFormPaymentData()
    }, [code])

    if (isLoadingFormData) {
      return (
        <div className="container mx-auto py-8 px-4 max-w-md">
          <Card>
            <CardContent className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p className="ml-2">Loading registration details...</p>
            </CardContent>
          </Card>
        </div>
      )
    }

    const totalPaymentFieldsAmount = calculateTotalPayment()
    const totalAmount = totalPaymentFieldsAmount + formLevelPayment
    const platformFee = calculatePlatformFee(totalAmount)
    const grandTotal = totalAmount + platformFee

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

            {totalAmount > 0 && responseId && (
              <div className="w-full mt-4">
                <Card className="bg-blue-50 border-blue-100">
                  <CardContent className="pt-6">
                    <h3 className="font-medium text-blue-800 mb-2">Payment Required</h3>
                    <p className="text-sm text-blue-700 mb-4">
                      Please complete your payment to confirm your registration.
                    </p>
                    <div className="bg-white p-3 rounded-md mb-4">
                      {formLevelPayment > 0 && (
                        <div className="flex justify-between mb-1">
                          <span className="text-sm">Registration Fee:</span>
                          <span>₦{formLevelPayment.toLocaleString()}</span>
                        </div>
                      )}

                      {totalPaymentFieldsAmount > 0 && (
                        <div className="flex justify-between mb-1">
                          <span className="text-sm">Additional Items:</span>
                          <span>₦{totalPaymentFieldsAmount.toLocaleString()}</span>
                        </div>
                      )}

                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Platform Fee (2%):</span>
                        <span>₦{platformFee.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between font-medium border-t border-blue-100 pt-1 mt-1">
                        <span>Total:</span>
                        <span>₦{grandTotal.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <LoadingButton
                        className="w-full"
                        onClick={() => handlePayment(responseId, totalAmount)}
                        loadingId="payment-process"
                        loadingText="Processing payment..."
                      >
                        <CreditCard className="h-4 w-4 mr-2" />
                        Pay Now
                      </LoadingButton>
                      <p className="text-xs text-center text-muted-foreground">Secure payment powered by Paystack</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            <p className="text-center text-muted-foreground mt-4">
              You will receive a confirmation email shortly with all the event details.
            </p>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row justify-center gap-4">
            <LoadingButton
              variant="outline"
              onClick={() => {
                setSubmissionSuccess(false)
                setFormValues({})
                setResponseId(null)
              }}
              loadingId="register-another"
              loadingText="Loading..."
              className="w-full sm:w-auto"
            >
              Register Another Person
            </LoadingButton>
            <LoadingButton asChild loadingId="return-home" loadingText="Loading..." className="w-full sm:w-auto">
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
            <Label htmlFor={field.id} className="mb-1.5 block">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={field.id}
              type={field.type === "email" ? "email" : "text"}
              required={field.required}
              value={formValues[field.id] || ""}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              disabled={isLoading}
              placeholder={`Enter ${field.label.toLowerCase()}`}
              className="w-full"
            />
          </div>
        )
      case "date":
        return (
          <div className="mb-4">
            <Label htmlFor={field.id} className="mb-1.5 block">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={field.id}
              type="date"
              required={field.required}
              value={formValues[field.id] || ""}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              disabled={isLoading}
              className="w-full"
            />
          </div>
        )
      case "textarea":
        return (
          <div className="mb-4">
            <Label htmlFor={field.id} className="mb-1.5 block">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Textarea
              id={field.id}
              required={field.required}
              value={formValues[field.id] || ""}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              disabled={isLoading}
              placeholder={`Enter ${field.label.toLowerCase()}`}
              className="w-full min-h-[100px]"
            />
          </div>
        )
      case "select":
        return (
          <div className="mb-4">
            <Label htmlFor={field.id} className="mb-1.5 block">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Select
              value={formValues[field.id] || ""}
              onValueChange={(value) => handleInputChange(field.id, value)}
              disabled={isLoading}
            >
              <SelectTrigger id={field.id} className="w-full">
                <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option, index) => (
                  <SelectItem key={index} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )
      case "radio":
        return (
          <div className="mb-4">
            <Label className="mb-1.5 block">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <RadioGroup
              value={formValues[field.id] || ""}
              onValueChange={(value) => handleInputChange(field.id, value)}
              className="mt-2 space-y-2"
            >
              {field.options?.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`${field.id}-${index}`} disabled={isLoading} />
                  <Label htmlFor={`${field.id}-${index}`} className="cursor-pointer">
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        )
      case "number":
        return (
          <div className="mb-4">
            <Label htmlFor={field.id} className="mb-1.5 block">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={field.id}
              type="number"
              required={field.required}
              value={formValues[field.id] || ""}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              disabled={isLoading}
              placeholder={`Enter ${field.label.toLowerCase()}`}
              className="w-full"
            />
          </div>
        )
      case "payment":
        const paymentField = field as PaymentField
        const isOptional = paymentField.isOptional || false
        const isSelected = selectedPaymentItems[field.id] || false

        return (
          <div className="mb-4 p-4 border rounded-md bg-gray-50 hover:bg-gray-100 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                {isOptional && (
                  <Checkbox
                    id={`payment-${field.id}`}
                    checked={isSelected}
                    onCheckedChange={(checked) => handlePaymentItemToggle(field.id, checked === true)}
                    className="mr-3"
                    disabled={isLoading}
                  />
                )}
                <Label htmlFor={`payment-${field.id}`} className="font-medium cursor-pointer">
                  {field.label}
                  {!isOptional && <span className="text-red-500 ml-1">*</span>}
                </Label>
              </div>
              <div className="text-right font-medium">
                {paymentField.currency} {paymentField.amount.toLocaleString()}
              </div>
            </div>

            {paymentField.description && (
              <p className="text-sm text-muted-foreground mt-1 ml-7">{paymentField.description}</p>
            )}

            {paymentField.itemType && (
              <div className="mt-2 ml-7">
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
    <div className="container mx-auto py-6 sm:py-8 px-4 w-full max-w-md sm:max-w-lg md:max-w-xl">
      <Card className="w-full shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl sm:text-2xl text-center">{formName}</CardTitle>
          <CardDescription className="text-center">Event Code: {code}</CardDescription>
        </CardHeader>
        <CardContent>
          <ShareFormLink code={code} />

          <form onSubmit={handleFormSubmit} className="mt-6 space-y-4">
            {formFields.map((field) => (
              <div key={field.id}>{renderField(field)}</div>
            ))}

            {hasPaymentFields && totalPayment > 0 && (
              <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-md">
                <h3 className="font-medium text-blue-800 mb-3">Payment Summary</h3>
                <div className="bg-white p-4 rounded-md">
                  {formFields
                    .filter((field) => field.type === "payment" && selectedPaymentItems[field.id])
                    .map((field, index) => {
                      const paymentField = field as PaymentField
                      return (
                        <div key={index} className="flex justify-between mb-2">
                          <span className="text-sm">{field.label}</span>
                          <span>
                            {paymentField.currency} {paymentField.amount.toLocaleString()}
                          </span>
                        </div>
                      )
                    })}
                  <div className="flex justify-between mb-2">
                    <span className="text-sm">Platform Fee (2%):</span>
                    <span>₦{platformFee.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-medium border-t border-blue-100 pt-2 mt-2">
                    <span>Total:</span>
                    <span>₦{grandTotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}

            <LoadingButton
              type="submit"
              className="w-full h-12 text-lg mt-6"
              loadingId="form-submit"
              loadingText="Submitting..."
            >
              Submit Registration
            </LoadingButton>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import EventFormBuilder from "@/event-form-builder/EventFormBuilder"
import type { FormField } from "@/event-form-builder/types"
import { ArrowLeft, Save, Loader2 } from "lucide-react"
import { createForm } from "../actions/form-actions"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"

export default function CreateFormPage() {
  const [formFields, setFormFields] = useState<FormField[]>([])
  const [formName, setFormName] = useState("Untitled Event Registration Form")
  const [category, setCategory] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState("form")

  // Payment settings
  const [collectsPayments, setCollectsPayments] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState<number>(0)
  const [paymentTitle, setPaymentTitle] = useState<string>("Event Registration Fee")
  const [paymentDescription, setPaymentDescription] = useState<string>("Payment for event registration")

  const router = useRouter()
  const { toast } = useToast()

  const handleFormChange = (fields: FormField[]) => {
    setFormFields(fields)
  }

  const handleFormNameChange = (name: string) => {
    setFormName(name)
  }

  const handleCategoryChange = (newCategory: string | null) => {
    setCategory(newCategory)
  }

  // Calculate platform fee (2% capped at ₦200)
  const calculatePlatformFee = (amount: number): number => {
    const fee = amount * 0.02
    return Math.min(fee, 200) // Cap at ₦200
  }

  const handleSaveForm = async () => {
    if (formFields.length === 0) {
      toast({
        title: "Form Empty",
        description: "Please add at least one field to your form.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Create form with payment settings if enabled
      const formData = {
        name: formName,
        category,
        fields: formFields,
        collectsPayments,
        paymentAmount: collectsPayments ? paymentAmount : null,
        paymentTitle: collectsPayments ? paymentTitle : null,
        paymentDescription: collectsPayments ? paymentDescription : null,
      }

      const form = await createForm(
        formName,
        category,
        formFields,
        collectsPayments,
        paymentAmount,
        paymentTitle,
        paymentDescription,
      )

      toast({
        title: "Form Created",
        description: `Your form has been created with code: ${form.code}`,
      })

      router.push(`/dashboard`)
    } catch (error) {
      console.error("Error creating form:", error)
      toast({
        title: "Error",
        description: "Failed to create the form. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBackToDashboard = () => {
    router.push("/dashboard")
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8">
      <Card className="mb-6 max-w-full">
        <CardHeader>
          <CardTitle className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <span>Create New Event Form</span>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" asChild onClick={handleBackToDashboard}>
                <Link href="/dashboard">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
              <Button onClick={handleSaveForm} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Create Form
                  </>
                )}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Design your event registration form below. Once created, you'll get a unique 4-digit code to share with
            attendees.
          </p>
        </CardContent>
      </Card>

      <Tabs defaultValue="form" className="w-full" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="form">Form Builder</TabsTrigger>
          <TabsTrigger value="payment">Payment Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="form">
          <div className="w-full max-w-full overflow-x-hidden">
            <EventFormBuilder
              fields={formFields}
              onChange={handleFormChange}
              onNameChange={handleFormNameChange}
              onCategoryChange={handleCategoryChange}
            />
          </div>
        </TabsContent>

        <TabsContent value="payment">
          <Card>
            <CardHeader>
              <CardTitle>Payment Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center space-x-2">
                  <Switch id="collect-payments" checked={collectsPayments} onCheckedChange={setCollectsPayments} />
                  <Label htmlFor="collect-payments">Enable payment collection for this form</Label>
                </div>

                {collectsPayments && (
                  <div className="space-y-4 border p-4 rounded-md">
                    <div>
                      <Label htmlFor="payment-title">Payment Title</Label>
                      <Input
                        id="payment-title"
                        value={paymentTitle}
                        onChange={(e) => setPaymentTitle(e.target.value)}
                        placeholder="e.g., Event Registration Fee"
                      />
                    </div>

                    <div>
                      <Label htmlFor="payment-amount">Payment Amount (NGN)</Label>
                      <Input
                        id="payment-amount"
                        type="number"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(Number(e.target.value))}
                        placeholder="Enter amount in Naira"
                      />
                    </div>

                    <div>
                      <Label htmlFor="payment-description">Payment Description</Label>
                      <Textarea
                        id="payment-description"
                        value={paymentDescription}
                        onChange={(e) => setPaymentDescription(e.target.value)}
                        placeholder="Describe what this payment is for"
                      />
                    </div>

                    <div className="bg-muted p-4 rounded-md">
                      <h4 className="font-medium mb-2">Payment Summary</h4>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span>Base Amount:</span>
                          <span>₦{paymentAmount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Platform Fee (2%):</span>
                          <span>₦{calculatePlatformFee(paymentAmount).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between font-medium pt-1 border-t">
                          <span>Total Amount:</span>
                          <span>₦{(paymentAmount + calculatePlatformFee(paymentAmount)).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

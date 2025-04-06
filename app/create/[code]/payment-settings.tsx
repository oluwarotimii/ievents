"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { Loader2, AlertTriangle } from "lucide-react"
import { enableFormPayments, disableFormPayments, getPaymentSettings } from "@/app/actions/payment-actions"

interface PaymentSettingsProps {
  formCode: string
  formData: {
    collectsPayments: boolean
    paymentAmount: number | null
    paymentTitle: string | null
    paymentDescription: string | null
  }
}

export default function PaymentSettingsComponent({ formCode, formData }: PaymentSettingsProps) {
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [collectPayments, setCollectPayments] = useState(formData.collectsPayments)
  const [paymentAmount, setPaymentAmount] = useState(formData.paymentAmount?.toString() || "")
  const [paymentTitle, setPaymentTitle] = useState(formData.paymentTitle || "Event Registration Fee")
  const [paymentDescription, setPaymentDescription] = useState(
    formData.paymentDescription || "Payment for event registration",
  )
  const [hasPaymentSettings, setHasPaymentSettings] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    checkPaymentSettings()
  }, [])

  const checkPaymentSettings = async () => {
    try {
      const result = await getPaymentSettings()
      setHasPaymentSettings(!!result.settings)
    } catch (error) {
      console.error("Error checking payment settings:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleTogglePayments = async (enabled: boolean) => {
    setCollectPayments(enabled)

    if (!enabled) {
      setSubmitting(true)
      try {
        const result = await disableFormPayments(formCode)
        if (result.success) {
          toast({
            title: "Payments Disabled",
            description: "Payment collection has been disabled for this form",
          })
        } else {
          toast({
            title: "Error",
            description: result.message || "Failed to disable payments",
            variant: "destructive",
          })
          // Revert the switch if there was an error
          setCollectPayments(true)
        }
      } catch (error) {
        console.error("Error disabling payments:", error)
        toast({
          title: "Error",
          description: "An unexpected error occurred",
          variant: "destructive",
        })
        // Revert the switch if there was an error
        setCollectPayments(true)
      } finally {
        setSubmitting(false)
      }
    }
  }

  const handleSavePaymentSettings = async () => {
    if (!paymentAmount || isNaN(Number.parseFloat(paymentAmount)) || Number.parseFloat(paymentAmount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid payment amount",
        variant: "destructive",
      })
      return
    }

    setSubmitting(true)
    try {
      const result = await enableFormPayments(
        formCode,
        Number.parseFloat(paymentAmount),
        paymentTitle || "Event Registration Fee",
        paymentDescription || "Payment for event registration",
      )

      if (result.success) {
        toast({
          title: "Settings Saved",
          description: "Payment settings have been saved successfully",
        })
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to save payment settings",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error saving payment settings:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Settings</CardTitle>
        <CardDescription>Configure payment collection for this event registration form</CardDescription>
      </CardHeader>
      <CardContent>
        {!hasPaymentSettings && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-md flex items-start">
            <AlertTriangle className="h-5 w-5 text-amber-500 mr-2 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-amber-800">
                You need to set up your payment details before you can collect payments.{" "}
                <Button variant="link" className="p-0 h-auto text-amber-800 underline" asChild>
                  <a href="/payment-settings">Set up payment details</a>
                </Button>
              </p>
            </div>
          </div>
        )}

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="collect-payments" className="text-base">
                Collect Payments
              </Label>
              <p className="text-sm text-muted-foreground">Enable payment collection for this form</p>
            </div>
            <Switch
              id="collect-payments"
              checked={collectPayments}
              onCheckedChange={handleTogglePayments}
              disabled={submitting || !hasPaymentSettings}
            />
          </div>

          {collectPayments && (
            <>
              <div className="space-y-2">
                <Label htmlFor="payment-amount">Payment Amount (₦)</Label>
                <Input
                  id="payment-amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="Enter amount in Naira"
                  disabled={submitting || !hasPaymentSettings}
                />
                <p className="text-xs text-muted-foreground">
                  Note: A 2% platform fee will be deducted from each payment
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment-title">Payment Title</Label>
                <Input
                  id="payment-title"
                  value={paymentTitle}
                  onChange={(e) => setPaymentTitle(e.target.value)}
                  placeholder="e.g. Event Registration Fee"
                  disabled={submitting || !hasPaymentSettings}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment-description">Payment Description</Label>
                <Textarea
                  id="payment-description"
                  value={paymentDescription}
                  onChange={(e) => setPaymentDescription(e.target.value)}
                  placeholder="Describe what the payment is for"
                  disabled={submitting || !hasPaymentSettings}
                />
              </div>
            </>
          )}
        </div>
      </CardContent>
      {collectPayments && (
        <CardFooter>
          <Button onClick={handleSavePaymentSettings} disabled={submitting || !hasPaymentSettings}>
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Payment Settings"
            )}
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}


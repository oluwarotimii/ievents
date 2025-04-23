"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Loader2, AlertTriangle, CreditCard } from "lucide-react"
import { getPaymentSettings, enableFormPayments, disableFormPayments } from "@/app/actions/payment-actions"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

interface PaymentSettingsProps {
  formCode: string
  formData: {
    collectsPayments: boolean
    paymentAmount: number | null
    paymentTitle: string | null
    paymentDescription: string | null
  }
  onChange?: (settings: {
    collectsPayments: boolean
    paymentAmount: number
    paymentTitle: string
    paymentDescription: string
  }) => void
}

export default function PaymentSettingsComponent({ formCode, formData, onChange }: PaymentSettingsProps) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hasPaymentSettings, setHasPaymentSettings] = useState(false)
  const [collectsPayments, setCollectsPayments] = useState(formData.collectsPayments || false)
  const [paymentAmount, setPaymentAmount] = useState<number>(formData.paymentAmount || 0)
  const [paymentTitle, setPaymentTitle] = useState<string>(formData.paymentTitle || "Event Registration Fee")
  const [paymentDescription, setPaymentDescription] = useState<string>(
    formData.paymentDescription || "Payment for event registration",
  )
  const { toast } = useToast()

  // Use a ref to track if we should notify parent of changes
  const shouldNotifyParent = useRef(false)

  // Calculate platform fee (2% capped at ₦200)
  const calculatePlatformFee = (amount: number): number => {
    const fee = amount * 0.02
    return Math.min(fee, 200) // Cap at ₦200
  }

  // Check payment settings only on initial mount
  useEffect(() => {
    checkPaymentSettings()
  }, [])

  // Update local state when formData changes, but don't trigger onChange
  useEffect(() => {
    shouldNotifyParent.current = false
    setCollectsPayments(formData.collectsPayments || false)
    setPaymentAmount(formData.paymentAmount || 0)
    setPaymentTitle(formData.paymentTitle || "Event Registration Fee")
    setPaymentDescription(formData.paymentDescription || "Payment for event registration")
    // After a short delay, allow notifying parent again
    setTimeout(() => {
      shouldNotifyParent.current = true
    }, 0)
  }, [formData])

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

  // Handle direct user changes to form fields
  const handleCollectsPaymentsChange = (checked: boolean) => {
    setCollectsPayments(checked)
    if (shouldNotifyParent.current && onChange) {
      onChange({
        collectsPayments: checked,
        paymentAmount,
        paymentTitle,
        paymentDescription,
      })
    }
  }

  const handlePaymentAmountChange = (value: number) => {
    setPaymentAmount(value)
    if (shouldNotifyParent.current && onChange) {
      onChange({
        collectsPayments,
        paymentAmount: value,
        paymentTitle,
        paymentDescription,
      })
    }
  }

  const handlePaymentTitleChange = (value: string) => {
    setPaymentTitle(value)
    if (shouldNotifyParent.current && onChange) {
      onChange({
        collectsPayments,
        paymentAmount,
        paymentTitle: value,
        paymentDescription,
      })
    }
  }

  const handlePaymentDescriptionChange = (value: string) => {
    setPaymentDescription(value)
    if (shouldNotifyParent.current && onChange) {
      onChange({
        collectsPayments,
        paymentAmount,
        paymentTitle,
        paymentDescription: value,
      })
    }
  }

  const handleSavePaymentSettings = async () => {
    setSaving(true)
    try {
      if (collectsPayments) {
        // Enable payments
        if (!paymentAmount || paymentAmount <= 0) {
          toast({
            title: "Invalid Amount",
            description: "Please enter a valid payment amount greater than 0.",
            variant: "destructive",
          })
          setSaving(false)
          return
        }

        const result = await enableFormPayments(formCode, paymentAmount, paymentTitle, paymentDescription)

        if (result.success) {
          toast({
            title: "Payment Settings Saved",
            description: "Payment collection has been enabled for this form.",
          })
        } else {
          toast({
            title: "Error",
            description: result.message || "Failed to enable payment collection.",
            variant: "destructive",
          })
        }
      } else {
        // Disable payments
        const result = await disableFormPayments(formCode)

        if (result.success) {
          toast({
            title: "Payment Settings Updated",
            description: "Payment collection has been disabled for this form.",
          })
        } else {
          toast({
            title: "Error",
            description: result.message || "Failed to disable payment collection.",
            variant: "destructive",
          })
        }
      }
    } catch (error) {
      console.error("Error saving payment settings:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred while saving payment settings.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
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
          <div className="flex items-center space-x-2">
            <Switch
              id="collect-payments"
              checked={collectsPayments}
              onCheckedChange={handleCollectsPaymentsChange}
              disabled={!hasPaymentSettings}
            />
            <Label htmlFor="collect-payments">Enable payment collection for this form</Label>
          </div>

          {collectsPayments && (
            <div className="space-y-4 border p-4 rounded-md">
              <div>
                <Label htmlFor="payment-title">Payment Title</Label>
                <Input
                  id="payment-title"
                  value={paymentTitle || ""}
                  onChange={(e) => handlePaymentTitleChange(e.target.value)}
                  placeholder="e.g., Event Registration Fee"
                  disabled={!hasPaymentSettings}
                />
              </div>

              <div>
                <Label htmlFor="payment-amount">Payment Amount (NGN)</Label>
                <Input
                  id="payment-amount"
                  type="number"
                  value={paymentAmount || 0}
                  onChange={(e) => handlePaymentAmountChange(Number(e.target.value))}
                  placeholder="Enter amount in Naira"
                  disabled={!hasPaymentSettings}
                />
              </div>

              <div>
                <Label htmlFor="payment-description">Payment Description</Label>
                <Textarea
                  id="payment-description"
                  value={paymentDescription || ""}
                  onChange={(e) => handlePaymentDescriptionChange(e.target.value)}
                  placeholder="Describe what this payment is for"
                  disabled={!hasPaymentSettings}
                />
              </div>

              <div className="bg-muted p-4 rounded-md">
                <h4 className="font-medium mb-2">Payment Summary</h4>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>Base Amount:</span>
                    <span>₦{(paymentAmount || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Platform Fee (2%):</span>
                    <span>₦{calculatePlatformFee(paymentAmount || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-medium pt-1 border-t">
                    <span>Total Amount:</span>
                    <span>₦{((paymentAmount || 0) + calculatePlatformFee(paymentAmount || 0)).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="p-4 bg-blue-50 border border-blue-100 rounded-md">
            <h3 className="font-medium text-blue-800 mb-2">How Payments Work</h3>
            <p className="text-sm text-blue-700 mb-4">You can collect payments in two ways:</p>

            <div className="space-y-2 text-sm text-blue-700">
              <p>
                <strong>1. Form-level payment:</strong> Set a fixed registration fee for all attendees
              </p>
              <p>
                <strong>2. Payment items:</strong> Add individual payment items directly in the form builder
              </p>

              <p className="mt-3">
                <strong>Payment Processing:</strong>
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Payments are processed securely through Paystack</li>
                <li>Funds are settled directly to your connected bank account</li>
                <li>Platform fee: 2% of total (capped at ₦200)</li>
              </ul>
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-3">Payment Status</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>Payment Processor</TableCell>
                  <TableCell>Paystack</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Payment Methods</TableCell>
                  <TableCell>Credit/Debit Cards, Bank Transfers</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Payment Status</TableCell>
                  <TableCell>
                    {hasPaymentSettings ? (
                      <Badge variant="success">Ready to collect payments</Badge>
                    ) : (
                      <Badge variant="destructive">Payment settings not configured</Badge>
                    )}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Form Payment</TableCell>
                  <TableCell>
                    {collectsPayments ? (
                      <Badge variant="success">Enabled</Badge>
                    ) : (
                      <Badge variant="secondary">Disabled</Badge>
                    )}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        {!hasPaymentSettings ? (
          <Button asChild>
            <a href="/payment-settings">
              <CreditCard className="mr-2 h-4 w-4" />
              Set Up Payment Settings
            </a>
          </Button>
        ) : (
          <>
            <Button variant="outline" onClick={checkPaymentSettings}>
              Reset
            </Button>
            <Button onClick={handleSavePaymentSettings} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Payment Settings"
              )}
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  )
}

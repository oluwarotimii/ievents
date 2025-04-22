"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Loader2, AlertTriangle } from "lucide-react"
import { getPaymentSettings } from "@/app/actions/payment-actions"
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
}

export default function PaymentSettingsComponent({ formCode, formData }: PaymentSettingsProps) {
  const [loading, setLoading] = useState(true)
  const [hasPaymentSettings, setHasPaymentSettings] = useState(false)
  const { toast } = useToast()

  // Calculate platform fee (2% capped at ₦200)
  const calculatePlatformFee = (amount: number): number => {
    const fee = amount * 0.02
    return Math.min(fee, 200) // Cap at ₦200
  }

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
          <div className="p-4 bg-blue-50 border border-blue-100 rounded-md">
            <h3 className="font-medium text-blue-800 mb-2">How Payments Work</h3>
            <p className="text-sm text-blue-700 mb-4">
              You can add payment items directly in the form builder. Each payment field represents an item that
              attendees can pay for.
            </p>

            <div className="space-y-2 text-sm text-blue-700">
              <p>
                <strong>Payment Types:</strong>
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  <strong>Registration Fee:</strong> The main fee for attending your event
                </li>
                <li>
                  <strong>Merchandise:</strong> T-shirts, books, or other physical items
                </li>
                <li>
                  <strong>Donation:</strong> Optional contributions
                </li>
                <li>
                  <strong>Other:</strong> Any other payment type
                </li>
              </ul>

              <p className="mt-3">
                <strong>Optional vs. Required:</strong>
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Mark a payment as "Optional" if attendees can choose whether to pay for it</li>
                <li>Required payments must be paid to complete registration</li>
              </ul>
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-3">Payment Processing Information</h3>
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
                  <TableCell>Platform Fee</TableCell>
                  <TableCell>2% of total (capped at ₦200)</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Payment Methods</TableCell>
                  <TableCell>Credit/Debit Cards, Bank Transfers</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Settlement</TableCell>
                  <TableCell>Funds are settled to your connected bank account</TableCell>
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
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        {!hasPaymentSettings && (
          <Button asChild>
            <a href="/payment-settings">Set Up Payment Settings</a>
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}

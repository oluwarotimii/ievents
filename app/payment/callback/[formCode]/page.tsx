"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { verifyFormPayment, getTransactionByReference } from "@/app/actions/payment-actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"
import Link from "next/link"

export default function PaymentCallbackPage({ params }: { params: { formCode: string } }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const reference = searchParams.get("reference")
  const [loading, setLoading] = useState(true)
  const [success, setSuccess] = useState(false)
  const [message, setMessage] = useState("")
  const [transaction, setTransaction] = useState<any>(null)
  const [formCode, setFormCode] = useState(params.formCode)

  useEffect(() => {
    async function verifyPayment() {
      if (!reference) {
        setLoading(false)
        setSuccess(false)
        setMessage("No payment reference found")
        return
      }

      try {
        console.log("Verifying payment with reference:", reference)
        const result = await verifyFormPayment(reference)
        console.log("Payment verification result:", result)

        if (result.success) {
          setSuccess(true)
          setMessage("Payment successful!")
          setTransaction(result.transaction)
        } else {
          setSuccess(false)
          setMessage(result.message || "Payment verification failed")

          // Try to get transaction details even if verification failed
          const transactionResult = await getTransactionByReference(reference)
          if (transactionResult.success) {
            setTransaction(transactionResult.transaction)
          }
        }
      } catch (error) {
        console.error("Error verifying payment:", error)
        setSuccess(false)
        setMessage(error instanceof Error ? error.message : "An error occurred while verifying payment")
      } finally {
        setLoading(false)
      }
    }

    verifyPayment()
  }, [reference])

  return (
    <div className="container max-w-md mx-auto py-8 px-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-center">
            {loading ? "Processing Payment" : success ? "Payment Successful" : "Payment Failed"}
          </CardTitle>
          <CardDescription className="text-center">
            {loading ? "Please wait while we verify your payment..." : ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="mt-4 text-sm text-muted-foreground">Verifying your payment...</p>
            </div>
          ) : success ? (
            <div className="flex flex-col items-center justify-center py-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
              <p className="mt-4 text-center">{message}</p>
              {transaction && (
                <div className="mt-6 w-full">
                  <div className="rounded-lg bg-muted p-4">
                    <h3 className="font-medium mb-2">Payment Details</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Reference:</span>
                        <span className="font-medium">{transaction.reference}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Amount:</span>
                        <span className="font-medium">₦{transaction.amount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status:</span>
                        <span className="font-medium capitalize">{transaction.status.toLowerCase()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Date:</span>
                        <span className="font-medium">{new Date(transaction.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Event:</span>
                        <span className="font-medium">{transaction.response.form.name}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-4">
              <XCircle className="h-16 w-16 text-red-500" />
              <p className="mt-4 text-center">{message}</p>
              <p className="mt-2 text-sm text-muted-foreground text-center">
                Your payment with reference {reference} could not be processed. You can try again or contact support for
                assistance.
              </p>
              {transaction && (
                <div className="mt-4 text-sm text-muted-foreground text-center">
                  <p>If this issue persists, please contact support with the following information:</p>
                  <p className="mt-2">
                    <span className="font-medium">Form Code:</span> {formCode}
                  </p>
                  <p>
                    <span className="font-medium">Payment Reference:</span> {reference}
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          {!loading && (
            <>
              {success ? (
                <Button asChild className="w-full">
                  <Link href={`/view/${formCode}`}>Return to Form</Link>
                </Button>
              ) : (
                <>
                  <Button asChild variant="outline" className="w-full">
                    <Link href={`/view/${formCode}`}>Return to Form</Link>
                  </Button>
                  <Button asChild variant="secondary" className="w-full">
                    <Link href="/">Go to Home</Link>
                  </Button>
                </>
              )}
            </>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}

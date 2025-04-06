"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { XCircle, Loader2 } from "lucide-react"
import { verifyFormPayment } from "@/app/actions/payment-actions"
import PaymentReceipt from "@/components/payment-receipt"

export default function PaymentCallbackPage({ params }: { params: { formCode: string } }) {
  const [verifying, setVerifying] = useState(true)
  const [success, setSuccess] = useState(false)
  const [message, setMessage] = useState("")
  const [transaction, setTransaction] = useState<any>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const formCode = params.formCode

  useEffect(() => {
    const reference = searchParams.get("reference")

    if (!reference) {
      setVerifying(false)
      setSuccess(false)
      setMessage("Invalid payment reference")
      return
    }

    const verifyPayment = async () => {
      try {
        const result = await verifyFormPayment(reference)

        setSuccess(result.success)
        setMessage(result.message)

        if (result.transaction) {
          setTransaction(result.transaction)
        }

        if (result.success) {
          toast({
            title: "Payment Successful",
            description: "Your payment has been processed successfully.",
          })
        } else {
          toast({
            title: "Payment Failed",
            description: result.message,
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Error verifying payment:", error)
        setSuccess(false)
        setMessage("An error occurred while verifying your payment")

        toast({
          title: "Verification Error",
          description: "Failed to verify payment. Please contact support.",
          variant: "destructive",
        })
      } finally {
        setVerifying(false)
      }
    }

    verifyPayment()
  }, [searchParams, toast])

  if (verifying) {
    return (
      <div className="container mx-auto py-16 px-4 flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 rounded-full w-12 h-12 flex items-center justify-center bg-primary/10">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
            <CardTitle className="text-2xl">Processing Payment</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p>Please wait while we verify your payment...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!success) {
    return (
      <div className="container mx-auto py-16 px-4 flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 rounded-full w-12 h-12 flex items-center justify-center bg-red-100">
              <XCircle className="h-6 w-6 text-red-500" />
            </div>
            <CardTitle className="text-2xl">Payment Failed</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p>{message}</p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button asChild>
              <Link href={`/view/${formCode}`}>Try Again</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 flex flex-col items-center justify-center min-h-screen">
      <div className="w-full max-w-md mb-6">
        <h1 className="text-2xl font-bold text-center mb-2">Payment Successful!</h1>
        <p className="text-center text-muted-foreground mb-6">
          Your payment has been processed successfully. Please keep this receipt for your records.
        </p>
      </div>

      {transaction && <PaymentReceipt transaction={transaction} />}

      <div className="mt-8 w-full max-w-md">
        <Button asChild className="w-full">
          <Link href={`/view/${formCode}`}>Return to Event Page</Link>
        </Button>
      </div>
    </div>
  )
}


"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { XCircle, Loader2, CheckCircle, ArrowLeft } from "lucide-react"
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
  const [formName, setFormName] = useState<string>("")

  useEffect(() => {
    const reference = searchParams.get("reference")

    if (!reference) {
      setVerifying(false)
      setSuccess(false)
      setMessage("Invalid payment reference")
      return
    }

    // Add this debug log
    console.log("Payment callback received with reference:", reference, "for form:", formCode)

    const verifyPayment = async () => {
      try {
        console.log(`Verifying payment with reference: ${reference}`)
        const result = await verifyFormPayment(reference)
        console.log("Payment verification result:", result)

        setSuccess(result.success)
        setMessage(result.message)

        if (result.transaction) {
          setTransaction(result.transaction)
          setFormName(result.transaction.response?.form?.name || "")
        }

        if (result.success) {
          toast({
            title: "Payment Successful",
            description: "Your payment has been processed successfully.",
          })
        } else {
          toast({
            title: "Payment Failed",
            description: result.message || "Your payment could not be processed at this time.",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Error verifying payment:", error)
        setSuccess(false)
        setMessage(
          error instanceof Error
            ? `Verification error: ${error.message}`
            : "An error occurred while verifying your payment",
        )

        toast({
          title: "Verification Error",
          description: "We encountered an issue while verifying your payment. Please contact support for assistance.",
          variant: "destructive",
        })
      } finally {
        setVerifying(false)
      }
    }

    verifyPayment()
  }, [searchParams, toast, formCode])

  if (verifying) {
    return (
      <div className="container mx-auto py-8 px-4 flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 rounded-full w-12 h-12 flex items-center justify-center bg-primary/10">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
            <CardTitle className="text-2xl">Processing Payment</CardTitle>
            <CardDescription>Please wait while we verify your payment...</CardDescription>
          </CardHeader>
          <CardContent className="text-center py-6">
            <div className="flex flex-col items-center">
              <div className="w-full max-w-xs bg-muted h-2 rounded-full overflow-hidden mb-4">
                <div className="h-full bg-primary animate-pulse" style={{ width: "60%" }}></div>
              </div>
              <p className="text-sm text-muted-foreground">This may take a few moments</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!success) {
    return (
      <div className="container mx-auto py-8 px-4 flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 rounded-full w-12 h-12 flex items-center justify-center bg-red-100">
              <XCircle className="h-6 w-6 text-red-500" />
            </div>
            <CardTitle className="text-2xl">Payment Failed</CardTitle>
            <CardDescription>{message}</CardDescription>
          </CardHeader>
          <CardContent className="text-center py-6">
            <p className="mb-6 text-muted-foreground">
              {searchParams.get("reference") ? (
                <>
                  Your payment with reference <span className="font-mono">{searchParams.get("reference")}</span> could
                  not be processed.
                </>
              ) : (
                "Your payment could not be processed."
              )}{" "}
              You can try again or contact support for assistance.
            </p>

            {/* Show support contact info or reference for troubleshooting */}
            <div className="bg-muted p-4 rounded-md mb-6 text-sm">
              <p>If this issue persists, please contact support with the following information:</p>
              <p className="mt-2">
                Form Code: <span className="font-mono">{formCode}</span>
              </p>
              {searchParams.get("reference") && (
                <p>
                  Payment Reference: <span className="font-mono">{searchParams.get("reference")}</span>
                </p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild className="w-full sm:w-auto">
              <Link href={`/view/${formCode}`}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Return to Form
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full sm:w-auto">
              <Link href="/">Go to Home</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 flex flex-col items-center justify-center min-h-screen">
      <Card className="w-full max-w-md mb-6">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 rounded-full w-12 h-12 flex items-center justify-center bg-green-100">
            <CheckCircle className="h-6 w-6 text-green-500" />
          </div>
          <CardTitle className="text-2xl">Payment Successful!</CardTitle>
          <CardDescription>
            Your payment has been processed successfully and your registration is complete.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <div className="bg-green-50 p-4 rounded-md mb-4">
            <p className="text-green-800">A receipt has been sent to your email. Please check your inbox.</p>
          </div>
          <p className="mb-4">
            Thank you for registering for{" "}
            <span className="font-semibold">{transaction?.response?.form?.name || formName}</span>. We look forward to
            seeing you at the event!
          </p>
        </CardContent>
      </Card>

      {transaction && <PaymentReceipt transaction={transaction} />}

      <div className="mt-8 w-full max-w-md">
        <div className="flex flex-col sm:flex-row gap-3">
          <Button asChild className="w-full">
            <Link href={`/view/${formCode}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Return to Event Page
            </Link>
          </Button>
          <Button variant="outline" asChild className="w-full mt-3 sm:mt-0">
            <Link href="/">Go to Home</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

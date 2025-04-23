"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { CheckCircle2, XCircle, Loader2 } from "lucide-react"
import { verifyPayment } from "@/app/actions/subscription-actions"

export default function PaymentCallbackPage() {
  const [verifying, setVerifying] = useState(true)
  const [success, setSuccess] = useState(false)
  const [message, setMessage] = useState("")
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  useEffect(() => {
    const reference = searchParams.get("reference")

    if (!reference) {
      setVerifying(false)
      setSuccess(false)
      setMessage("Invalid payment reference")
      return
    }

    const processPayment = async () => {
      try {
        const result = await verifyPayment(reference)

        setSuccess(result.success)
        setMessage(result.message)

        if (result.success) {
          toast({
            title: "Payment Successful",
            description: "Your subscription has been updated successfully.",
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

    processPayment()
  }, [searchParams, toast])

  return (
    <div className="container mx-auto py-16 px-4 flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 rounded-full w-12 h-12 flex items-center justify-center bg-primary/10">
            {verifying ? (
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            ) : success ? (
              <CheckCircle2 className="h-6 w-6 text-green-500" />
            ) : (
              <XCircle className="h-6 w-6 text-red-500" />
            )}
          </div>
          <CardTitle className="text-2xl">
            {verifying ? "Processing Payment" : success ? "Payment Successful" : "Payment Failed"}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          {verifying ? <p>Please wait while we verify your payment...</p> : <p>{message}</p>}
        </CardContent>
        <CardFooter className="flex justify-center">
          {!verifying && (
            <Button asChild>
              <Link href={success ? "/dashboard" : "/subscription"}>
                {success ? "Go to Dashboard" : "Back to Subscription"}
              </Link>
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}


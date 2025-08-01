"use client"

import React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { verifyUserEmail } from "@/app/actions/auth-actions"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"

export default function VerifyEmailTokenPage({ params }: { params: { token: string } }) {
  // Unwrap the params object using React.use()
  const unwrappedParams = React.use(params)
  const { token } = unwrappedParams
  const [verifying, setVerifying] = useState(true)
  const [verified, setVerified] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const verifyToken = async () => {
      try {
        const result = await verifyUserEmail(token)

        if (result.success) {
          setVerified(true)
          toast({
            title: "Email Verified",
            description: "Your email has been successfully verified.",
          })
        } else {
          toast({
            title: "Verification Failed",
            description: result.message || "Invalid or expired verification link.",
            variant: "destructive",
          })
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "An unexpected error occurred.",
          variant: "destructive",
        })
      } finally {
        setVerifying(false)
      }
    }

    verifyToken()
  }, [token, toast])

  const handleContinue = () => {
    router.push("/dashboard")
  }

  const handleRetry = () => {
    router.push("/verify-email")
  }

  if (verifying) {
    return (
      <div className="container mx-auto py-16 px-4">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Verifying Your Email</CardTitle>
            <CardDescription>Please wait while we verify your email address...</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-8">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-16 px-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 rounded-full w-12 h-12 flex items-center justify-center bg-primary/10">
            {verified ? (
              <CheckCircle className="h-6 w-6 text-green-500" />
            ) : (
              <XCircle className="h-6 w-6 text-red-500" />
            )}
          </div>
          <CardTitle className="text-2xl">{verified ? "Email Verified" : "Verification Failed"}</CardTitle>
          <CardDescription>
            {verified
              ? "Your email has been successfully verified. You can now access all features of the application."
              : "We could not verify your email address. The link may be invalid or expired."}
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex justify-center">
          {verified ? (
            <Button onClick={handleContinue}>Continue to Dashboard</Button>
          ) : (
            <Button onClick={handleRetry} variant="outline">
              Try Again
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}

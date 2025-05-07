"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { resendVerificationEmail, isEmailVerified } from "@/app/actions/auth-actions"
import { AlertCircle, CheckCircle, Mail, RefreshCw, LogOut } from "lucide-react"

export default function VerifyEmailPage() {
  const [isResending, setIsResending] = useState(false)
  const [isChecking, setIsChecking] = useState(true)
  const [verified, setVerified] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams?.get("callbackUrl") || "/dashboard"
  const { toast } = useToast()

  useEffect(() => {
    const checkVerification = async () => {
      try {
        setIsChecking(true)
        const verified = await isEmailVerified()
        setVerified(verified)

        if (verified) {
          toast({
            title: "Email Verified",
            description: "Your email has been verified. You will be redirected shortly.",
          })

          // Redirect after a short delay
          setTimeout(() => {
            router.push(callbackUrl)
          }, 2000)
        }
      } catch (error) {
        console.error("Error checking verification:", error)
      } finally {
        setIsChecking(false)
      }
    }

    checkVerification()
  }, [router, callbackUrl, toast])

  const handleResendEmail = async () => {
    if (countdown > 0 || isResending) return

    setIsResending(true)
    try {
      const result = await resendVerificationEmail()

      if (result.success) {
        toast({
          title: "Verification Email Sent",
          description: "Please check your inbox for the verification link.",
        })

        // Start countdown for resend button (60 seconds)
        setCountdown(60)
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer)
              return 0
            }
            return prev - 1
          })
        }, 1000)
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to send verification email. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error resending verification email:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsResending(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      router.push("/login")
    } catch (error) {
      console.error("Error logging out:", error)
    }
  }

  if (isChecking) {
    return (
      <div className="container mx-auto py-16 px-4">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Checking Verification Status</CardTitle>
            <CardDescription>Please wait while we check your email verification status...</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-8">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (verified) {
    return (
      <div className="container mx-auto py-16 px-4">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 rounded-full w-12 h-12 flex items-center justify-center bg-green-100">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Email Verified</CardTitle>
            <CardDescription>
              Your email has been successfully verified. You can now access all features of the application.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Button onClick={() => router.push(callbackUrl)}>Continue to Dashboard</Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-16 px-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 bg-primary/10 p-3 rounded-full w-12 h-12 flex items-center justify-center">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Verify Your Email</CardTitle>
          <CardDescription>
            We've sent a verification link to your email address. Please check your inbox and click the link to verify
            your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Important</AlertTitle>
            <AlertDescription>
              You need to verify your email before you can access all features of the application.
            </AlertDescription>
          </Alert>

          <div className="mt-6">
            <h3 className="text-sm font-medium mb-2">Didn't receive the email?</h3>
            <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
              <li>Check your spam or junk folder</li>
              <li>Verify that you entered the correct email address</li>
              <li>Wait a few minutes for the email to arrive</li>
              <li>If you still don't see it, click the resend button below</li>
            </ul>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <Button onClick={handleResendEmail} className="w-full" disabled={isResending || countdown > 0}>
            {isResending ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : countdown > 0 ? (
              `Resend Email (${countdown}s)`
            ) : (
              "Resend Verification Email"
            )}
          </Button>
          <Button variant="outline" onClick={handleLogout} className="w-full">
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

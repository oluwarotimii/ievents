"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Mail, CheckCircle } from "lucide-react"
import { resendVerificationEmail } from "@/app/actions/auth-actions"

export default function VerifyEmailPage() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(0)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    // Check if user is logged in
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/user")
        if (response.ok) {
          const userData = await response.json()
          setUser(userData)

          // If email is already verified, redirect to dashboard
          if (userData.emailVerified) {
            router.push("/dashboard")
          }
        } else {
          // If not logged in, redirect to login
          router.push("/login")
        }
      } catch (error) {
        console.error("Error checking authentication:", error)
        router.push("/login")
      }
    }

    checkAuth()
  }, [router])

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const handleResendEmail = async () => {
    if (countdown > 0) return

    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const result = await resendVerificationEmail()

      if (result.success) {
        setSuccess(true)
        setCountdown(60) // 60 second cooldown
      } else {
        setError(result.message || "Failed to resend verification email")
      }
    } catch (error) {
      setError("An unexpected error occurred")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-blue-100 p-2 text-blue-600">
            <Mail className="h-8 w-8" />
          </div>
          <CardTitle className="text-2xl font-bold">Verify Your Email</CardTitle>
          <CardDescription>
            We've sent a verification email to {user?.email}. Please check your inbox and click the verification link.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {success && (
            <Alert className="bg-green-50 text-green-800 border-green-200">
              <CheckCircle className="h-4 w-4 mr-2" />
              <AlertDescription>Verification email sent successfully! Please check your inbox.</AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4 mr-2" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="bg-amber-50 border border-amber-200 rounded-md p-4 text-amber-800 text-sm">
            <p>
              <strong>Didn't receive the email?</strong> Check your spam folder or request a new verification email
              below.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button onClick={handleResendEmail} className="w-full" disabled={loading || countdown > 0}>
            {loading ? "Sending..." : countdown > 0 ? `Resend Email (${countdown}s)` : "Resend Verification Email"}
          </Button>

          <Button variant="outline" className="w-full" onClick={() => router.push("/")}>
            Back to Home
          </Button>

          <p className="text-center text-sm text-gray-500 mt-2">
            Need help? Contact our support team at support@eventflow.com
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}

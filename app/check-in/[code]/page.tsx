"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { CheckCircle2 } from "lucide-react"
import { getFormByCode } from "@/app/actions/form-actions"

export default function CheckInPage({ params }: { params: { code: string } }) {
  // Unwrap the params object using React.use()
  const unwrappedParams = React.use(params)
  const { code } = unwrappedParams

  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)
  const [formName, setFormName] = useState("")
  const [checkedIn, setCheckedIn] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    // Validate that code is 4 digits
    if (!/^\d{4}$/.test(code)) {
      toast({
        title: "Invalid Event Code",
        description: "Event code must be 4 digits.",
        variant: "destructive",
      })
      router.push("/")
      return
    }

    const loadForm = async () => {
      try {
        // Load form data from the database
        const form = await getFormByCode(code)

        if (form) {
          setFormName(form.name || "Event Registration")
        } else {
          toast({
            title: "Event Not Found",
            description: "No event found with this code. Please check and try again.",
            variant: "destructive",
          })
          router.push("/")
        }
      } catch (error) {
        console.error("Error loading form:", error)
        toast({
          title: "Error",
          description: "Failed to load the event. Please try again.",
          variant: "destructive",
        })
        router.push("/")
      }
    }

    loadForm()
  }, [code, router, toast])

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Validate inputs
    if (!email || !email.includes("@") || !name) {
      toast({
        title: "Invalid Information",
        description: "Please enter a valid email and name.",
        variant: "destructive",
      })
      setLoading(false)
      return
    }

    try {
      // Call API to check in
      const response = await fetch(`/api/forms/${code}/check-in`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, name }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to check in")
      }

      if (result.success) {
        toast({
          title: "Check-In Successful",
          description: "You have been checked in to the event.",
        })
        setCheckedIn(true)
      } else {
        toast({
          title: "Not Registered",
          description: result.message || "We couldn't find your registration. Please register first.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error during check-in:", error)
      toast({
        title: "Check-In Failed",
        description: error instanceof Error ? error.message : "Failed to check in. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (checkedIn) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">{formName}</CardTitle>
            <CardDescription className="text-center">Event Code: {code}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
            <h2 className="text-2xl font-bold text-center mb-2">Check-In Successful!</h2>
            <p className="text-center text-muted-foreground">You have been checked in to the event. Enjoy!</p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button variant="outline" asChild>
              <Link href={`/view/${code}`}>View Event Details</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-md">
      <Card>
        <CardHeader>
          <CardTitle className="text-center">{formName}</CardTitle>
          <CardDescription className="text-center">Event Code: {code}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCheckIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your registration email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Checking..." : "Check In"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button variant="link" asChild>
            <Link href={`/view/${code}`}>Need to register? Click here</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}


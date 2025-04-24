"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { ArrowRight, LogIn, FileText, Users, ChevronRight, Sparkles } from "lucide-react"
import { getFormByCode } from "./actions/form-actions"

export default function HomePage() {
  const [eventCode, setEventCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    // Check if user is logged in
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/user")
        if (response.ok) {
          setIsLoggedIn(true)
          // Redirect to dashboard if logged in
          router.push("/dashboard")
        } else {
          setIsLoggedIn(false)
        }
      } catch (error) {
        console.error("Error checking authentication:", error)
        setIsLoggedIn(false)
      }
    }

    checkAuth()
  }, [router])

  const handleJoinEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    if (eventCode.length !== 4) {
      toast({
        title: "Invalid Code",
        description: "Event code must be 4 digits.",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    try {
      // Check if the event code exists in the database
      const form = await getFormByCode(eventCode)

      if (form) {
        router.push(`/view/${eventCode}`)
      } else {
        toast({
          title: "Event Not Found",
          description: "No event found with this code. Please check and try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while checking the event code.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // If logged in, we'll redirect to dashboard
  if (isLoggedIn) {
    return null
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-primary/10 to-background pt-16 md:pt-24 pb-12 md:pb-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6">
            Create Event Forms in Minutes
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground mb-6 md:mb-8 max-w-2xl mx-auto">
            Simple, powerful event registration forms with a unique 4-digit code. No complicated setup required.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" onClick={() => router.push("/pricing")} className="w-full sm:w-auto">
              View Pricing
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => document.getElementById("get-started")?.scrollIntoView({ behavior: "smooth" })}
              className="w-full sm:w-auto"
            >
              Get Started
            </Button>
            <Button size="lg" variant="secondary" asChild className="w-full sm:w-auto group relative overflow-hidden">
              <Link href="/login" className="flex items-center justify-center">
                <div className="absolute inset-0 w-0 bg-primary/10 transition-all duration-300 ease-out group-hover:w-full"></div>
                <LogIn className="mr-2 h-5 w-5" />
                <span className="relative z-10">Login / Register</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-12 md:py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 md:mb-12">
            Everything You Need for Event Registration
          </h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
            <div className="bg-background p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Custom Forms</h3>
              <p className="text-muted-foreground">
                Create beautiful, customized forms for any type of event with our intuitive form builder.
              </p>
            </div>
            <div className="bg-background p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Easy Sharing</h3>
              <p className="text-muted-foreground">
                Share your form with a simple 4-digit code. No accounts needed for attendees to register.
              </p>
            </div>
            <div className="bg-background p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow sm:col-span-2 md:col-span-1">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-primary"
                >
                  <path d="M3 3v18h18"></path>
                  <path d="m19 9-5 5-4-4-3 3"></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Analytics</h3>
              <p className="text-muted-foreground">
                Track registrations and analyze form performance with our powerful analytics dashboard.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Get Started Section */}
      <div id="get-started" className="container mx-auto py-12 md:py-20 px-4">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-lg text-muted-foreground mb-6">
              Create your own event registration form or join an existing event. It only takes a minute to get started.
            </p>
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                  <span className="font-bold">1</span>
                </div>
                <p>Create an account or log in</p>
              </div>
              <div className="flex items-center">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                  <span className="font-bold">2</span>
                </div>
                <p>Build your custom event form</p>
              </div>
              <div className="flex items-center">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                  <span className="font-bold">3</span>
                </div>
                <p>Share your unique 4-digit code</p>
              </div>
            </div>
            <div className="mt-6">
              <Button asChild size="lg" className="group relative overflow-hidden">
                <Link href="/login" className="flex items-center">
                  <div className="absolute inset-0 w-0 bg-primary/20 transition-all duration-300 ease-out group-hover:w-full"></div>
                  <span className="relative z-10">Create Your First Form</span>
                  <ArrowRight className="ml-2 h-4 w-4 relative z-10 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>
          </div>

          <Card className="shadow-lg border-2 hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle>Join an Event</CardTitle>
              <CardDescription>Enter a 4-digit event code to join</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleJoinEvent} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="eventCode">Event Code</Label>
                  <Input
                    id="eventCode"
                    placeholder="Enter 4-digit event code"
                    value={eventCode}
                    onChange={(e) => setEventCode(e.target.value)}
                    maxLength={4}
                    className="text-center text-2xl tracking-widest h-14"
                  />
                </div>
                <Button type="submit" className="w-full h-12 text-lg" disabled={isLoading}>
                  {isLoading ? "Checking..." : "Join Event"}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex justify-center">
              <p className="text-sm text-muted-foreground">
                Want to create your own event?{" "}
                <Link href="/login" className="text-primary hover:underline font-medium">
                  Sign in
                </Link>
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-primary/5 py-12 md:py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to streamline your event registrations?</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of event organizers who use our platform to create seamless registration experiences.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild className="group relative overflow-hidden">
              <Link href="/login">
                <div className="absolute inset-0 w-0 bg-primary/20 transition-all duration-300 ease-out group-hover:w-full"></div>
                <span className="relative z-10">Get Started for Free</span>
                <Sparkles className="ml-2 h-4 w-4 relative z-10" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="group">
              <Link href="/pricing" className="flex items-center">
                View Pricing
                <ChevronRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

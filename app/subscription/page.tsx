"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Check, Loader2, AlertTriangle } from "lucide-react"
import { getUserSubscriptionDetails, initiatePayment } from "../actions/subscription-actions"
import type { PlanDetails } from "@/lib/subscription"
import SubscriptionLoading from "./loading"

export default function SubscriptionPage() {
  const [loading, setLoading] = useState(true)
  const [processingPayment, setProcessingPayment] = useState(false)
  const [currentPlan, setCurrentPlan] = useState<string>("FREE")
  const [subscriptionDetails, setSubscriptionDetails] = useState<any>(null)
  const [plans, setPlans] = useState<PlanDetails[]>([])
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    loadSubscriptionData()
  }, [])

  const loadSubscriptionData = async () => {
    try {
      const data = await getUserSubscriptionDetails()
      setCurrentPlan(data.currentPlan)
      setSubscriptionDetails(data.subscriptionDetails)
      setPlans(data.availablePlans)
    } catch (error) {
      console.error("Error loading subscription data:", error)
      toast({
        title: "Error",
        description: "Failed to load subscription details. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUpgrade = async (planId: string) => {
    setProcessingPayment(true)
    try {
      const result = await initiatePayment(planId)

      if (result.success && result.paymentUrl) {
        // Redirect to payment page
        window.location.href = result.paymentUrl
      } else {
        throw new Error(result.message || "Failed to initiate payment")
      }
    } catch (error) {
      console.error("Error initiating payment:", error)
      toast({
        title: "Payment Error",
        description: error instanceof Error ? error.message : "Failed to process payment. Please try again.",
        variant: "destructive",
      })
    } finally {
      setProcessingPayment(false)
    }
  }

  if (loading) {
    return (
      <SubscriptionLoading />
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Subscription Management</h1>
          <p className="text-muted-foreground">Manage your subscription and billing details</p>
        </div>

        {subscriptionDetails && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Current Plan</CardTitle>
              <CardDescription>Your current subscription details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row justify-between">
                <div>
                  <h3 className="text-xl font-bold mb-2 flex items-center">
                    {plans.find((p) => p.id === currentPlan)?.name}
                    {currentPlan !== "FREE" && (
                      <Badge variant="success" className="ml-2">
                        {subscriptionDetails.status}
                      </Badge>
                    )}
                  </h3>

                  <div className="space-y-2 text-sm">
                    {currentPlan === "FREE" ? (
                      <>
                        <p>
                          <span className="font-medium">Forms:</span> {subscriptionDetails.formCount} /{" "}
                          {subscriptionDetails.formLimit}
                        </p>
                        <p>
                          <span className="font-medium">Responses per form:</span> {subscriptionDetails.responseLimit}
                        </p>
                      </>
                    ) : (
                      <>
                        <p>
                          <span className="font-medium">Forms:</span> Unlimited
                        </p>
                        <p>
                          <span className="font-medium">Responses:</span> Unlimited
                        </p>
                        {subscriptionDetails.endDate && (
                          <p>
                            <span className="font-medium">Next billing date:</span>{" "}
                            {new Date(subscriptionDetails.endDate).toLocaleDateString()}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {currentPlan === "FREE" && (
                  <div className="mt-4 md:mt-0">
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-md flex items-start">
                      <AlertTriangle className="h-5 w-5 text-amber-500 mr-2 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm text-amber-800">
                          You're on the Free plan with limited features. Upgrade to unlock unlimited forms and
                          responses.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" asChild>
                <Link href="/dashboard">Back to Dashboard</Link>
              </Button>
            </CardFooter>
          </Card>
        )}

        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card key={plan.id} className={`flex flex-col ${currentPlan === plan.id ? "border-primary" : ""}`}>
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-3xl font-bold">
                    {plan.price === 0 ? "Free" : `₦${plan.price.toLocaleString()}`}
                  </span>
                  {plan.isRecurring && <span className="text-sm text-muted-foreground ml-1">/month</span>}
                </div>
              </CardHeader>
              <CardContent className="flex-grow">
                <ul className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                {currentPlan === plan.id ? (
                  <Button className="w-full" disabled>
                    Current Plan
                  </Button>
                ) : (
                  <Button className="w-full" onClick={() => handleUpgrade(plan.id)} disabled={processingPayment}>
                    {processingPayment ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : plan.price === 0 ? (
                      "Downgrade to Free"
                    ) : (
                      "Upgrade"
                    )}
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}


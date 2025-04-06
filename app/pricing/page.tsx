"use client"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"

export default function PricingPage() {
  const router = useRouter()

  const handleSelectPlan = (plan: string) => {
    // Redirect to subscription page
    router.push("/subscription")
  }

  return (
    <div className="container mx-auto py-16 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Choose the perfect plan for your event registration needs. All plans include our core features.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {/* Free Plan */}
        <Card className="flex flex-col border-muted-foreground/20">
          <CardHeader>
            <CardTitle className="text-2xl">Free</CardTitle>
            <div className="mt-4 flex items-baseline text-5xl font-extrabold">
              $0<span className="ml-1 text-2xl font-medium text-muted-foreground">/mo</span>
            </div>
            <CardDescription className="mt-5">Perfect for small events and personal gatherings.</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            <ul className="space-y-3">
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 shrink-0 mr-3" />
                <span>Up to 3 event forms</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 shrink-0 mr-3" />
                <span>Basic form fields</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 shrink-0 mr-3" />
                <span>Up to 50 responses per form</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 shrink-0 mr-3" />
                <span>CSV export</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 shrink-0 mr-3" />
                <span>Email notifications</span>
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button onClick={() => handleSelectPlan("Free")} className="w-full" variant="outline">
              Get Started
            </Button>
          </CardFooter>
        </Card>

        {/* Pro Plan */}
        <Card className="flex flex-col relative border-primary/50 shadow-lg">
          <div className="absolute top-0 right-0 transform translate-x-2 -translate-y-2 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
            POPULAR
          </div>
          <CardHeader>
            <CardTitle className="text-2xl">Pro</CardTitle>
            <div className="mt-4 flex items-baseline text-5xl font-extrabold">
              $29<span className="ml-1 text-2xl font-medium text-muted-foreground">/mo</span>
            </div>
            <CardDescription className="mt-5">For professionals managing multiple events.</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            <ul className="space-y-3">
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 shrink-0 mr-3" />
                <span>Unlimited event forms</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 shrink-0 mr-3" />
                <span>Advanced form fields</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 shrink-0 mr-3" />
                <span>Up to 1,000 responses per form</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 shrink-0 mr-3" />
                <span>Payment processing</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 shrink-0 mr-3" />
                <span>Custom branding</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 shrink-0 mr-3" />
                <span>Analytics dashboard</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 shrink-0 mr-3" />
                <span>Priority support</span>
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button onClick={() => handleSelectPlan("Pro")} className="w-full">
              Subscribe to Pro
            </Button>
          </CardFooter>
        </Card>

        {/* Enterprise Plan */}
        <Card className="flex flex-col border-muted-foreground/20">
          <CardHeader>
            <CardTitle className="text-2xl">Enterprise</CardTitle>
            <div className="mt-4 flex items-baseline text-5xl font-extrabold">
              $99<span className="ml-1 text-2xl font-medium text-muted-foreground">/mo</span>
            </div>
            <CardDescription className="mt-5">For organizations with advanced needs.</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            <ul className="space-y-3">
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 shrink-0 mr-3" />
                <span>Everything in Pro</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 shrink-0 mr-3" />
                <span>Unlimited responses</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 shrink-0 mr-3" />
                <span>Team collaboration</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 shrink-0 mr-3" />
                <span>Advanced analytics</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 shrink-0 mr-3" />
                <span>API access</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 shrink-0 mr-3" />
                <span>Dedicated account manager</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 shrink-0 mr-3" />
                <span>Custom integrations</span>
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button onClick={() => handleSelectPlan("Enterprise")} className="w-full" variant="outline">
              Contact Sales
            </Button>
          </CardFooter>
        </Card>
      </div>

      <div className="mt-16 text-center">
        <h2 className="text-2xl font-bold mb-4">All Plans Include</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
          <div className="p-4">
            <div className="flex justify-center mb-2">
              <Check className="h-6 w-6 text-green-500" />
            </div>
            <h3 className="font-medium">Secure Data Storage</h3>
          </div>
          <div className="p-4">
            <div className="flex justify-center mb-2">
              <Check className="h-6 w-6 text-green-500" />
            </div>
            <h3 className="font-medium">99.9% Uptime</h3>
          </div>
          <div className="p-4">
            <div className="flex justify-center mb-2">
              <Check className="h-6 w-6 text-green-500" />
            </div>
            <h3 className="font-medium">Email Support</h3>
          </div>
          <div className="p-4">
            <div className="flex justify-center mb-2">
              <Check className="h-6 w-6 text-green-500" />
            </div>
            <h3 className="font-medium">Regular Updates</h3>
          </div>
        </div>
      </div>
    </div>
  )
}


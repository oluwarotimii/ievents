import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function PaymentGuide() {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Understanding Payment Options</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-4">There are two ways to collect payments from your registrants:</p>

        <Tabs defaultValue="form-level">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="form-level">Form-Level Payment</TabsTrigger>
            <TabsTrigger value="payment-fields">Payment Fields</TabsTrigger>
          </TabsList>

          <TabsContent value="form-level" className="space-y-4">
            <div className="border rounded-md p-4">
              <h3 className="font-semibold text-lg mb-2">Form-Level Payment</h3>
              <p className="text-muted-foreground mb-3">
                This is a single payment amount that applies to all registrants. Enable it in the Payment Settings tab
                by toggling "Enable payment collection".
              </p>
              <div className="bg-muted p-3 rounded-md">
                <p className="text-sm">
                  <strong>Best for:</strong> Simple event registrations with a standard fee for everyone
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="payment-fields" className="space-y-4">
            <div className="border rounded-md p-4">
              <h3 className="font-semibold text-lg mb-2">Payment Fields</h3>
              <p className="text-muted-foreground mb-3">
                These are individual payment items that you add to your form in the Form Builder tab. Click "Add Field"
                and select "Payment Item" to add them.
              </p>
              <div className="bg-muted p-3 rounded-md">
                <p className="text-sm">
                  <strong>Best for:</strong> Complex events with multiple ticket types, merchandise, or optional add-ons
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-md">
          <h3 className="font-medium text-blue-800 mb-2">How They Work Together</h3>
          <p className="text-sm text-blue-700">
            You can use either payment method or both together. If both are enabled, the total amount collected will be
            the sum of the form-level payment plus any payment fields the registrant selects.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

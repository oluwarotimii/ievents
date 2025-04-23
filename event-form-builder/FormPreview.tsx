"use client"
import type { FormField, PaymentField } from "./types"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent } from "@/components/ui/card"

interface FormPreviewProps {
  formName: string
  fields: FormField[]
  onClose: () => void
}

export default function FormPreview({ formName, fields, onClose }: FormPreviewProps) {
  // Calculate total of all required payment fields
  const calculateTotalPayment = () => {
    return fields
      .filter((field) => field.type === "payment" && !(field as PaymentField).isOptional)
      .reduce((total, field) => {
        const amount = (field as PaymentField).amount || 0
        return total + amount
      }, 0)
  }

  // Calculate platform fee (2% capped at ₦200)
  const calculatePlatformFee = (amount: number): number => {
    const fee = amount * 0.02
    return Math.min(fee, 200) // Cap at ₦200
  }

  const totalRequiredPayment = calculateTotalPayment()
  const platformFee = calculatePlatformFee(totalRequiredPayment)
  const grandTotal = totalRequiredPayment + platformFee

  const renderField = (field: FormField) => {
    switch (field.type) {
      case "text":
      case "email":
      case "phone":
      case "date":
        return (
          <div className="mb-4">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && "*"}
            </Label>
            <Input
              id={field.id}
              type={field.type}
              placeholder={`Enter ${field.label.toLowerCase()}`}
              required={field.required}
            />
          </div>
        )
      case "textarea":
        return (
          <div className="mb-4">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && "*"}
            </Label>
            <Textarea id={field.id} placeholder={`Enter ${field.label.toLowerCase()}`} required={field.required} />
          </div>
        )
      case "select":
        return (
          <div className="mb-4">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && "*"}
            </Label>
            <Select required={field.required}>
              <SelectTrigger id={field.id}>
                <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option, index) => (
                  <SelectItem key={index} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )
      case "radio":
        return (
          <div className="mb-4">
            <Label>
              {field.label}
              {field.required && "*"}
            </Label>
            <RadioGroup required={field.required}>
              {field.options?.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`${field.id}-${index}`} />
                  <Label htmlFor={`${field.id}-${index}`}>{option}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        )
      case "number":
        return (
          <div className="mb-4">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && "*"}
            </Label>
            <Input
              id={field.id}
              type="number"
              placeholder={`Enter ${field.label.toLowerCase()}`}
              required={field.required}
            />
          </div>
        )
      case "payment":
        const paymentField = field as PaymentField
        const isOptional = paymentField.isOptional || false
        const amount = paymentField.amount || 0
        const currency = paymentField.currency || "NGN"

        return (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor={field.id}>
                {field.label}
                {!isOptional && "*"}
              </Label>
              <div className="text-right">
                <span className="font-medium">
                  {currency} {amount.toLocaleString()}
                </span>
              </div>
            </div>

            {paymentField.description && (
              <p className="text-sm text-muted-foreground mb-2">{paymentField.description}</p>
            )}

            {isOptional && (
              <div className="flex items-center space-x-2 mt-2">
                <Checkbox id={`${field.id}-checkbox`} />
                <Label htmlFor={`${field.id}-checkbox`}>
                  Add this item ({currency} {amount.toLocaleString()})
                </Label>
              </div>
            )}
          </div>
        )
      default:
        return null
    }
  }

  // Check if there are any payment fields
  const hasPaymentFields = fields.some((field) => field.type === "payment")

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-auto">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">{formName}</h2>
        <form className="space-y-4">
          {fields.map((field) => (
            <div key={field.id}>{renderField(field)}</div>
          ))}

          {hasPaymentFields && (
            <Card className="mt-4">
              <CardContent className="pt-6">
                <h3 className="font-medium mb-2">Payment Summary</h3>
                <div className="space-y-2">
                  {fields
                    .filter((field) => field.type === "payment")
                    .map((field, index) => {
                      const paymentField = field as PaymentField
                      const amount = paymentField.amount || 0
                      const currency = paymentField.currency || "NGN"
                      return (
                        <div key={index} className="flex justify-between text-sm">
                          <span>
                            {field.label}
                            {paymentField.isOptional ? " (Optional)" : ""}
                          </span>
                          <span>
                            {currency} {amount.toLocaleString()}
                          </span>
                        </div>
                      )
                    })}

                  <div className="flex justify-between text-sm pt-2 border-t">
                    <span>Platform Fee (2%)</span>
                    <span>NGN {platformFee.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between font-medium pt-2 border-t">
                    <span>Total</span>
                    <span>NGN {grandTotal.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Button type="submit" className="w-full">
            Submit
          </Button>
        </form>
        <Button onClick={onClose} variant="outline" className="mt-4 w-full">
          Close Preview
        </Button>
      </div>
    </div>
  )
}

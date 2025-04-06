"use client"
import type { FormField, PaymentField } from "./types"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

interface FormPreviewProps {
  formName: string
  fields: FormField[]
  onClose: () => void
}

export default function FormPreview({ formName, fields, onClose }: FormPreviewProps) {
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
        return (
          <div className="mb-4">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && "*"}
            </Label>
            <div className="flex space-x-2">
              <Input id={field.id} type="number" placeholder="Enter amount" required={field.required} />
              <Select defaultValue={paymentField.currency}>
                <SelectTrigger id={`${field.id}-currency`}>
                  <SelectValue placeholder="Currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">{formName}</h2>
        <form className="space-y-4">
          {fields.map((field) => (
            <div key={field.id}>{renderField(field)}</div>
          ))}
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


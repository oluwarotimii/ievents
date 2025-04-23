"use client"

import { Textarea } from "@/components/ui/textarea"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { PlusCircle, Trash2, Eye } from "lucide-react"
import { eventCategories, type EventCategory } from "./eventCategories"
import type { FormField, PaymentField, FieldType } from "./types"
import FormPreview from "./FormPreview"
import { useToast } from "@/hooks/use-toast"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

interface EventFormBuilderProps {
  eventId?: string
  fields: FormField[]
  onChange: (fields: FormField[]) => void
  onNameChange?: (name: string) => void
  onCategoryChange?: (category: string | null) => void
  initialFormName?: string
  initialCategory?: string | null
}

export default function EventFormBuilder({
  eventId,
  fields,
  onChange,
  onNameChange,
  onCategoryChange,
  initialFormName,
  initialCategory,
}: EventFormBuilderProps) {
  const [formName, setFormName] = useState<string>(initialFormName || "Untitled Event Registration Form")
  const [selectedCategory, setSelectedCategory] = useState<EventCategory | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const { toast } = useToast()

  // Set initial category if provided
  useEffect(() => {
    if (initialCategory) {
      const category = eventCategories.find((c) => c.name === initialCategory)
      if (category) {
        setSelectedCategory(category)
      }
    }
  }, [initialCategory])

  // Update form name when initialFormName changes
  useEffect(() => {
    if (initialFormName) {
      setFormName(initialFormName)
    }
  }, [initialFormName])

  const handleFormNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value
    setFormName(newName)
    if (onNameChange) {
      onNameChange(newName)
    }
  }

  const handleCategoryChange = (category: EventCategory) => {
    setSelectedCategory(category)
    onChange(category.defaultFields)
    if (onCategoryChange) {
      onCategoryChange(category.name)
    }
  }

  const addField = (type: FieldType) => {
    const newField: FormField = {
      id: Date.now().toString(),
      type,
      label: `New ${type} field`,
      required: false,
      options: type === "select" || type === "radio" ? ["Option 1"] : undefined,
    }

    if (type === "payment") {
      ;(newField as PaymentField).currency = "NGN"
      ;(newField as PaymentField).amount = 0
      ;(newField as PaymentField).isOptional = false
      ;(newField as PaymentField).itemType = "registration"
      ;(newField as PaymentField).description = "Registration fee for the event"
    }

    onChange([...fields, newField])
  }

  const updateField = (id: string, updates: Partial<FormField>) => {
    onChange(fields.map((f) => (f.id === id ? { ...f, ...updates } : f)))
  }

  const removeField = (id: string) => {
    onChange(fields.filter((f) => f.id !== id))
  }

  const addOption = (fieldId: string) => {
    onChange(
      fields.map((f) => {
        if (f.id === fieldId && (f.type === "select" || f.type === "radio")) {
          return { ...f, options: [...(f.options || []), `Option ${(f.options?.length || 0) + 1}`] }
        }
        return f
      }),
    )
  }

  const updateOption = (fieldId: string, optionIndex: number, value: string) => {
    onChange(
      fields.map((f) => {
        if (f.id === fieldId && (f.type === "select" || f.type === "radio") && f.options) {
          const newOptions = [...f.options]
          newOptions[optionIndex] = value
          return { ...f, options: newOptions }
        }
        return f
      }),
    )
  }

  const removeOption = (fieldId: string, optionIndex: number) => {
    onChange(
      fields.map((f) => {
        if (f.id === fieldId && (f.type === "select" || f.type === "radio") && f.options) {
          const newOptions = f.options.filter((_, index) => index !== optionIndex)
          return { ...f, options: newOptions }
        }
        return f
      }),
    )
  }

  const renderFieldInput = (field: FormField) => {
    switch (field.type) {
      case "text":
      case "email":
      case "phone":
        return <Input placeholder={`Enter ${field.label}`} disabled />
      case "textarea":
        return <Textarea placeholder={`Enter ${field.label}`} disabled />
      case "select":
      case "radio":
        return (
          <div className="space-y-2">
            {field.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Input
                  value={option}
                  onChange={(e) => updateOption(field.id, index, e.target.value)}
                  placeholder={`Option ${index + 1}`}
                />
                <Button variant="ghost" size="icon" onClick={() => removeOption(field.id, index)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => addOption(field.id)}>
              <PlusCircle className="h-4 w-4 mr-2" /> Add Option
            </Button>
          </div>
        )
      case "date":
        return <Input type="date" disabled />
      case "number":
        return <Input type="number" placeholder={`Enter ${field.label}`} disabled />
      case "payment":
        const paymentField = field as PaymentField
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor={`amount-${field.id}`}>Amount</Label>
                <Input
                  id={`amount-${field.id}`}
                  type="number"
                  placeholder="Enter amount"
                  value={paymentField.amount || ""}
                  onChange={(e) => updateField(field.id, { amount: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor={`currency-${field.id}`}>Currency</Label>
                <Select
                  value={paymentField.currency || "NGN"}
                  onValueChange={(value) => updateField(field.id, { currency: value })}
                >
                  <SelectTrigger id={`currency-${field.id}`}>
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NGN">NGN</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor={`description-${field.id}`}>Description</Label>
              <Textarea
                id={`description-${field.id}`}
                placeholder="Describe what this payment is for"
                value={paymentField.description || ""}
                onChange={(e) => updateField(field.id, { description: e.target.value })}
              />
            </div>

            <div>
              <Label>Payment Type</Label>
              <RadioGroup
                value={paymentField.itemType || "registration"}
                onValueChange={(value) =>
                  updateField(field.id, {
                    itemType: value as "registration" | "merchandise" | "donation" | "other",
                  })
                }
              >
                <div className="flex items-center space-x-2 mt-2">
                  <RadioGroupItem value="registration" id={`type-registration-${field.id}`} />
                  <Label htmlFor={`type-registration-${field.id}`}>Registration Fee</Label>
                </div>
                <div className="flex items-center space-x-2 mt-2">
                  <RadioGroupItem value="merchandise" id={`type-merchandise-${field.id}`} />
                  <Label htmlFor={`type-merchandise-${field.id}`}>Merchandise</Label>
                </div>
                <div className="flex items-center space-x-2 mt-2">
                  <RadioGroupItem value="donation" id={`type-donation-${field.id}`} />
                  <Label htmlFor={`type-donation-${field.id}`}>Donation</Label>
                </div>
                <div className="flex items-center space-x-2 mt-2">
                  <RadioGroupItem value="other" id={`type-other-${field.id}`} />
                  <Label htmlFor={`type-other-${field.id}`}>Other</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="flex items-center space-x-2 mt-2">
              <Switch
                id={`optional-${field.id}`}
                checked={paymentField.isOptional || false}
                onCheckedChange={(checked) => updateField(field.id, { isOptional: checked })}
              />
              <Label htmlFor={`optional-${field.id}`}>Optional Payment (attendees can choose whether to pay)</Label>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="container mx-auto p-4">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>
            <Input
              value={formName}
              onChange={handleFormNameChange}
              className="text-2xl font-bold"
              placeholder="Enter form name"
            />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={selectedCategory?.name}
            onValueChange={(value) =>
              handleCategoryChange(eventCategories.find((c) => c.name === value) as EventCategory)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select event category" />
            </SelectTrigger>
            <SelectContent>
              {eventCategories.map((category) => (
                <SelectItem key={category.name} value={category.name}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {fields.map((field) => (
          <Card key={field.id}>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Input
                    value={field.label}
                    onChange={(e) => updateField(field.id, { label: e.target.value })}
                    placeholder="Enter field label"
                    className="text-lg font-semibold"
                  />
                  <Button variant="ghost" size="icon" onClick={() => removeField(field.id)}>
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </div>
                {renderFieldInput(field)}
                {field.type !== "payment" && (
                  <div className="flex items-center space-x-2">
                    <Switch
                      id={`required-${field.id}`}
                      checked={field.required}
                      onCheckedChange={(checked) => updateField(field.id, { required: checked })}
                    />
                    <Label htmlFor={`required-${field.id}`}>Required</Label>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Add Field</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Button onClick={() => addField("text")}>Text</Button>
            <Button onClick={() => addField("textarea")}>Long Text</Button>
            <Button onClick={() => addField("select")}>Dropdown</Button>
            <Button onClick={() => addField("radio")}>Radio</Button>
            <Button onClick={() => addField("email")}>Email</Button>
            <Button onClick={() => addField("phone")}>Phone</Button>
            <Button onClick={() => addField("date")}>Date</Button>
            <Button onClick={() => addField("number")}>Number</Button>
            <Button onClick={() => addField("payment")} className="col-span-2">
              Payment Item
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 space-x-4">
        <Button onClick={() => setShowPreview(true)} variant="outline">
          <Eye className="h-4 w-4 mr-2" /> Preview Form
        </Button>
      </div>

      {showPreview && <FormPreview formName={formName} fields={fields} onClose={() => setShowPreview(false)} />}
    </div>
  )
}

"use client"

import { Textarea } from "@/components/ui/textarea"

import type React from "react"
import { useState } from "react"
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

interface EventFormBuilderProps {
  eventId?: string
  fields: FormField[]
  onChange: (fields: FormField[]) => void
  onNameChange?: (name: string) => void
  onCategoryChange?: (category: string | null) => void
}

export default function EventFormBuilder({
  eventId,
  fields,
  onChange,
  onNameChange,
  onCategoryChange,
}: EventFormBuilderProps) {
  const [formName, setFormName] = useState<string>("Untitled Event Registration Form")
  const [selectedCategory, setSelectedCategory] = useState<EventCategory | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const { toast } = useToast()

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
      ;(newField as PaymentField).currency = "USD"
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
        return (
          <div className="space-y-2">
            <Input type="number" placeholder="Enter amount" disabled />
            <Select disabled>
              <SelectTrigger>
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
                <SelectItem value="GBP">GBP</SelectItem>
              </SelectContent>
            </Select>
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
                <div className="flex items-center space-x-2">
                  <Switch
                    id={`required-${field.id}`}
                    checked={field.required}
                    onCheckedChange={(checked) => updateField(field.id, { required: checked })}
                  />
                  <Label htmlFor={`required-${field.id}`}>Required</Label>
                </div>
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
            <Button onClick={() => addField("payment")}>Payment</Button>
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


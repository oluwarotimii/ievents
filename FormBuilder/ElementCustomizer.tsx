"use client"

import type React from "react"
import type { FormElement } from "@/types/formBuilder"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ElementCustomizerProps {
  element: FormElement
  onUpdate: (updatedElement: FormElement) => void
}

const eventSpecificFields = [
  { value: "name", label: "Full Name" },
  { value: "email", label: "Email Address" },
  { value: "phone", label: "Phone Number" },
  { value: "ticket_type", label: "Ticket Type" },
  { value: "dietary_requirements", label: "Dietary Requirements" },
  { value: "tshirt_size", label: "T-Shirt Size" },
  { value: "workshop_preference", label: "Workshop Preference" },
]

export default function ElementCustomizer({ element, onUpdate }: ElementCustomizerProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    onUpdate({
      ...element,
      [name]: type === "checkbox" ? checked : value,
    })
  }

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...(element.options || [])]
    newOptions[index] = value
    onUpdate({
      ...element,
      options: newOptions,
    })
  }

  const addOption = () => {
    onUpdate({
      ...element,
      options: [...(element.options || []), `Option ${(element.options?.length || 0) + 1}`],
    })
  }

  const removeOption = (index: number) => {
    const newOptions = [...(element.options || [])]
    newOptions.splice(index, 1)
    onUpdate({
      ...element,
      options: newOptions,
    })
  }

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="label">Label</Label>
        <Input id="label" name="label" value={element.label} onChange={handleChange} />
      </div>
      <div>
        <Label htmlFor="field_type">Field Type</Label>
        <Select value={element.field_type || ""} onValueChange={(value) => onUpdate({ ...element, field_type: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Select a field type" />
          </SelectTrigger>
          <SelectContent>
            {eventSpecificFields.map((field) => (
              <SelectItem key={field.value} value={field.value}>
                {field.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox
          id="required"
          name="required"
          checked={element.required}
          onCheckedChange={(checked) => onUpdate({ ...element, required: checked as boolean })}
        />
        <Label htmlFor="required">Required</Label>
      </div>
      {(element.type === "select" || element.type === "radio") && (
        <div>
          <Label>Options</Label>
          {element.options?.map((option, index) => (
            <div key={index} className="flex items-center space-x-2 mt-2">
              <Input value={option} onChange={(e) => handleOptionChange(index, e.target.value)} />
              <Button variant="ghost" onClick={() => removeOption(index)}>
                Remove
              </Button>
            </div>
          ))}
          <Button onClick={addOption} className="mt-2">
            Add Option
          </Button>
        </div>
      )}
    </div>
  )
}


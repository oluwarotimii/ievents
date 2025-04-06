"use client"

import { useState } from "react"
import { DndProvider } from "react-dnd"
import { HTML5Backend } from "react-dnd-html5-backend"
import { v4 as uuidv4 } from "uuid"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import AvailableElements from "./AvailableElements"
import FormPreview from "./FormPreview"
import ElementCustomizer from "./ElementCustomizer"
import useFormBuilder from "@/hooks/useFormBuilder"
import type { FormElement } from "@/types/formBuilder"

export default function FormBuilder() {
  const { formElements, addElement, updateElement, removeElement, moveElement } = useFormBuilder()

  const [selectedElement, setSelectedElement] = useState<FormElement | null>(null)
  const [formName, setFormName] = useState<string>("Untitled Event Registration Form")

  const handleDrop = (item: { type: string }) => {
    const newElement: FormElement = {
      id: uuidv4(),
      type: item.type,
      label: `New ${item.type}`,
      required: false,
      options: item.type === "select" || item.type === "radio" ? ["Option 1", "Option 2"] : undefined,
      field_type: "",
    }
    addElement(newElement)
  }

  const handleSave = () => {
    const formData = {
      name: formName,
      elements: formElements,
    }
    console.log("Event registration form saved:", formData)
    // Here you would typically send this data to your backend
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="container mx-auto p-4">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>
              <Input value={formName} onChange={(e) => setFormName(e.target.value)} className="text-2xl font-bold" />
            </CardTitle>
          </CardHeader>
        </Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Form Elements</CardTitle>
            </CardHeader>
            <CardContent>
              <AvailableElements />
            </CardContent>
          </Card>
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Event Registration Form Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <FormPreview
                elements={formElements}
                onDrop={handleDrop}
                onElementSelect={setSelectedElement}
                onElementMove={moveElement}
                onElementRemove={removeElement}
              />
            </CardContent>
          </Card>
        </div>
        {selectedElement && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Customize Form Element</CardTitle>
            </CardHeader>
            <CardContent>
              <ElementCustomizer
                element={selectedElement}
                onUpdate={(updatedElement) => {
                  updateElement(updatedElement)
                  setSelectedElement(updatedElement)
                }}
              />
            </CardContent>
          </Card>
        )}
        <Button onClick={handleSave} className="mt-6">
          Save Event Registration Form
        </Button>
      </div>
    </DndProvider>
  )
}


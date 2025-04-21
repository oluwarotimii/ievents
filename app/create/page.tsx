"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import EventFormBuilder from "@/event-form-builder/EventFormBuilder"
import type { FormField } from "@/event-form-builder/types"
import { ArrowLeft } from "lucide-react"
import { createForm } from "../actions/form-actions"

export default function CreateFormPage() {
  const [formFields, setFormFields] = useState<FormField[]>([])
  const [formName, setFormName] = useState("Untitled Event Registration Form")
  const [category, setCategory] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleFormChange = (fields: FormField[]) => {
    setFormFields(fields)
  }

  const handleFormNameChange = (name: string) => {
    setFormName(name)
  }

  const handleCategoryChange = (newCategory: string | null) => {
    setCategory(newCategory)
  }

  const handleSaveForm = async () => {
    if (formFields.length === 0) {
      toast({
        title: "Form Empty",
        description: "Please add at least one field to your form.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const form = await createForm(formName, category, formFields)

      toast({
        title: "Form Created",
        description: `Your form has been created with code: ${form.code}`,
      })

      router.push(`/create/${form.code}`)
    } catch (error) {
      console.error("Error creating form:", error)
      toast({
        title: "Error",
        description: "Failed to create the form. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBackToDashboard = () => {
    router.push("/dashboard")
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8">
      <Card className="mb-6 max-w-full">
        <CardHeader>
          <CardTitle className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <span>Create New Event Form</span>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" asChild onClick={handleBackToDashboard}>
                <Link href="/dashboard">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
              <Button onClick={handleSaveForm} disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Form"}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Design your event registration form below. Once created, you'll get a unique 4-digit code to share with
            attendees.
          </p>
        </CardContent>
      </Card>

      <div className="w-full max-w-full overflow-x-hidden">
        <EventFormBuilder
          fields={formFields}
          onChange={handleFormChange}
          onNameChange={handleFormNameChange}
          onCategoryChange={handleCategoryChange}
        />
      </div>
    </div>
  )
}

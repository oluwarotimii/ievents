"use server"

import { revalidatePath } from "next/cache"
import prisma from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import type { FormField } from "@/event-form-builder/types"

// Generate a random 4-digit code
function generateEventCode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString()
}

// Check if a code already exists
async function codeExists(code: string): Promise<boolean> {
  const existingForm = await prisma.form.findUnique({
    where: { code },
  })
  return !!existingForm
}

// Generate a unique code
async function generateUniqueCode(): Promise<string> {
  let code = generateEventCode()
  while (await codeExists(code)) {
    code = generateEventCode()
  }
  return code
}

// Create a new form
export async function createForm(formName: string, category: string | null, fields: FormField[]) {
  try {
    const user = await requireAuth()

    const code = await generateUniqueCode()

    const form = await prisma.form.create({
      data: {
        code,
        name: formName,
        category,
        userId: user.id,
        fields: {
          create: fields.map((field, index) => ({
            fieldId: field.id,
            type: field.type,
            label: field.label,
            required: field.required,
            options: field.options ? JSON.stringify(field.options) : null,
            position: index,
          })),
        },
      },
      include: {
        fields: true,
      },
    })

    revalidatePath("/dashboard")
    return form
  } catch (error) {
    console.error("Error creating form:", error)
    throw new Error("Failed to create form")
  }
}

// Update an existing form
export async function updateForm(code: string, formName: string, category: string | null, fields: FormField[]) {
  try {
    const user = await requireAuth()

    // Check if form exists and belongs to user
    const existingForm = await prisma.form.findFirst({
      where: {
        code,
        userId: user.id,
      },
      include: {
        fields: true,
      },
    })

    if (!existingForm) {
      throw new Error("Form not found or you do not have permission to edit it")
    }

    // Update form
    await prisma.form.update({
      where: { id: existingForm.id },
      data: {
        name: formName,
        category,
        updatedAt: new Date(),
      },
    })

    // Delete existing fields
    await prisma.formField.deleteMany({
      where: { formId: existingForm.id },
    })

    // Create new fields
    await prisma.formField.createMany({
      data: fields.map((field, index) => ({
        formId: existingForm.id,
        fieldId: field.id,
        type: field.type,
        label: field.label,
        required: field.required,
        options: field.options ? JSON.stringify(field.options) : null,
        position: index,
      })),
    })

    revalidatePath(`/create/${code}`)
    revalidatePath("/dashboard")

    return { success: true }
  } catch (error) {
    console.error("Error updating form:", error)
    throw new Error("Failed to update form")
  }
}

// Get form by code
export async function getFormByCode(code: string) {
  try {
    const form = await prisma.form.findUnique({
      where: { code },
      include: {
        fields: {
          orderBy: {
            position: "asc",
          },
        },
      },
    })

    if (!form) return null

    // Transform fields to match the expected format
    const formattedFields = form.fields.map((field) => ({
      id: field.fieldId,
      type: field.type as any,
      label: field.label,
      required: field.required,
      options: field.options ? JSON.parse(field.options as string) : undefined,
    }))

    return {
      ...form,
      fields: formattedFields,
    }
  } catch (error) {
    console.error("Error getting form by code:", error)
    throw new Error("Failed to get form")
  }
}

// Submit form response
export async function submitFormResponse(code: string, formData: Record<string, any>) {
  try {
    const form = await prisma.form.findUnique({
      where: { code },
    })

    if (!form) {
      throw new Error("Form not found")
    }

    // Create response
    const response = await prisma.response.create({
      data: {
        formId: form.id,
        data: {
          create: Object.entries(formData).map(([fieldId, value]) => ({
            fieldId,
            value: typeof value === "object" ? JSON.stringify(value) : String(value),
          })),
        },
      },
    })

    revalidatePath(`/responses/${code}`)
    return { success: true, responseId: response.id }
  } catch (error) {
    console.error("Error submitting form response:", error)
    throw new Error("Failed to submit form response")
  }
}

// Get user's forms
export async function getUserForms() {
  try {
    const user = await requireAuth()

    const forms = await prisma.form.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        _count: {
          select: {
            responses: true,
          },
        },
      },
    })

    return forms
  } catch (error) {
    console.error("Error getting user forms:", error)
    throw new Error("Failed to get user forms")
  }
}

// Delete form
export async function deleteForm(code: string) {
  try {
    const user = await requireAuth()

    const form = await prisma.form.findFirst({
      where: {
        code,
        userId: user.id,
      },
    })

    if (!form) {
      throw new Error("Form not found or you do not have permission to delete it")
    }

    await prisma.form.delete({
      where: { id: form.id },
    })

    revalidatePath("/dashboard")
    return { success: true }
  } catch (error) {
    console.error("Error deleting form:", error)
    throw new Error("Failed to delete form")
  }
}

// Get form responses
export async function getFormResponses(code: string) {
  try {
    const user = await requireAuth()

    const form = await prisma.form.findFirst({
      where: {
        code,
        userId: user.id,
      },
    })

    if (!form) {
      throw new Error("Form not found or you do not have permission to access it")
    }

    const responses = await prisma.response.findMany({
      where: {
        formId: form.id,
      },
      include: {
        data: true,
      },
      orderBy: {
        submittedAt: "desc",
      },
    })

    // Transform responses to match the expected format
    const formattedResponses = responses.map((response) => {
      const responseData: Record<string, any> = {}

      response.data.forEach((data) => {
        try {
          // Try to parse as JSON first
          responseData[data.fieldId] = JSON.parse(data.value || "")
        } catch {
          // If not valid JSON, use as is
          responseData[data.fieldId] = data.value
        }
      })

      return {
        id: response.id.toString(),
        submittedAt: response.submittedAt.toISOString(),
        checkedIn: response.checkedIn,
        checkInTime: response.checkInTime?.toISOString(),
        data: responseData,
      }
    })

    return formattedResponses
  } catch (error) {
    console.error("Error getting form responses:", error)
    throw new Error("Failed to get form responses")
  }
}

// Check in attendee
export async function checkInAttendee(code: string, responseId: string) {
  try {
    const user = await requireAuth()

    const form = await prisma.form.findFirst({
      where: {
        code,
        userId: user.id,
      },
    })

    if (!form) {
      throw new Error("Form not found or you do not have permission to access it")
    }

    await prisma.response.update({
      where: {
        id: Number.parseInt(responseId),
        formId: form.id,
      },
      data: {
        checkedIn: true,
        checkInTime: new Date(),
      },
    })

    revalidatePath(`/manual-check-in/${code}`)
    revalidatePath(`/responses/${code}`)

    return { success: true }
  } catch (error) {
    console.error("Error checking in attendee:", error)
    throw new Error("Failed to check in attendee")
  }
}


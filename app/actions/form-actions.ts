"use server"

import { revalidatePath } from "next/cache"
import prisma from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import type { FormField } from "@/event-form-builder/types"
import { canCreateForm } from "@/lib/subscription"
import { canReceiveResponse } from "@/lib/subscription"

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
export async function createForm(
  formName: string,
  category: string | null,
  fields: FormField[],
  collectsPayments = false,
  paymentAmount: number | null = null,
  paymentTitle: string | null = null,
  paymentDescription: string | null = null,
) {
  try {
    const user = await requireAuth()

    // Check if user can create more forms based on subscription
    const canCreate = await canCreateForm(user.id)
    if (!canCreate) {
      throw new Error(
        "You have reached the maximum number of forms allowed on your current plan. Please upgrade to create more forms.",
      )
    }

    const code = await generateUniqueCode()

    const form = await prisma.form.create({
      data: {
        code,
        name: formName,
        category,
        userId: user.id,
        collectsPayments,
        paymentAmount,
        paymentTitle,
        paymentDescription,
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
    throw new Error(error instanceof Error ? error.message : "Failed to create form")
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

/**
 * Check if an email has already been used for registration
 */
export async function checkDuplicateRegistration(code: string, email: string): Promise<boolean> {
  try {
    if (!email || typeof email !== "string") {
      console.log("Invalid email provided for duplicate check:", email)
      return false // Can't check duplicates without a valid email
    }

    console.log(`Checking for duplicate registration with email: ${email}`)

    // Find the form
    const form = await prisma.form.findUnique({
      where: { code },
      include: {
        fields: {
          where: {
            type: "email",
          },
        },
      },
    })

    if (!form) {
      console.error(`Form not found with code: ${code}`)
      throw new Error("Form not found")
    }

    // Get email field IDs
    const emailFieldIds = form.fields.map((field) => field.fieldId)

    if (emailFieldIds.length === 0) {
      // No email fields in the form, can't check for duplicates
      console.log("No email fields in form, skipping duplicate check")
      return false
    }

    console.log(`Checking response data for email fields: ${emailFieldIds.join(", ")}`)

    // Check for existing responses with this email
    const existingResponses = await prisma.response.findMany({
      where: {
        formId: form.id,
        data: {
          some: {
            fieldId: {
              in: emailFieldIds,
            },
            value: {
              equals: email,
              mode: "insensitive", // Case insensitive comparison
            },
          },
        },
      },
    })

    const isDuplicate = existingResponses.length > 0
    console.log(`Duplicate check result: ${isDuplicate ? "Duplicate found" : "No duplicate"}`)

    return isDuplicate
  } catch (error) {
    console.error("Error checking duplicate registration:", error)
    throw new Error("Failed to check duplicate registration")
  }
}

// Submit form response
export async function submitFormResponse(code: string, formData: Record<string, any>) {
  try {
    console.log("submitFormResponse called with code:", code)
    console.log("Form data:", formData)

    // Validate the code format
    if (!/^\d{4}$/.test(code)) {
      console.error("Invalid event code format:", code)
      return {
        success: false,
        message: "Invalid event code format",
      }
    }

    // Find the form
    const form = await prisma.form.findUnique({
      where: { code },
      include: {
        fields: true,
      },
    })

    if (!form) {
      console.error("Form not found with code:", code)
      return {
        success: false,
        message: "Form not found",
      }
    }

    console.log("Form found:", form.id, form.name)

    // Check for email fields in the form data
    const emailFields = form.fields.filter((field) => field.type === "email")
    console.log(`Found ${emailFields.length} email fields in form`)

    for (const emailField of emailFields) {
      const email = formData[emailField.fieldId]
      if (email) {
        console.log(`Checking if email already exists: ${email}`)
        try {
          // Check if this email has already been used
          const isDuplicate = await checkDuplicateRegistration(code, email)
          if (isDuplicate) {
            console.log(`Duplicate email detected: ${email}`)
            return {
              success: false,
              message: "This email has already been registered for this event.",
            }
          }
        } catch (error) {
          console.error("Error in duplicate email check:", error)
          // Continue with form submission even if duplicate check fails
        }
      }
    }

    // Check if form can receive more responses based on subscription
    const canReceive = await canReceiveResponse(form.id)
    if (!canReceive) {
      console.error("Form has reached maximum responses limit")
      return {
        success: false,
        message:
          "This form has reached its maximum number of responses. The form owner needs to upgrade their plan to receive more responses.",
      }
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

    console.log("Response created successfully:", response.id)
    revalidatePath(`/responses/${code}`)

    return {
      success: true,
      responseId: response.id,
      message: "Form submitted successfully",
    }
  } catch (error) {
    console.error("Error submitting form response:", error)
    return {
      success: false,
      message:
        error instanceof Error
          ? `An error occurred: ${error.message}`
          : "An error occurred while submitting your response. Please try again.",
    }
  }
}

// Get user's forms
export async function getUserForms() {
  try {
    const user = await requireAuth()
    if (!user) {
      throw new Error("Authentication required. Please log in to view your forms.")
    }

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
    if (error instanceof Error) {
      throw new Error(error.message)
    }
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

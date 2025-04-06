"use server"
import { requireAuth } from "@/lib/auth"
import { sendMassEmail } from "@/lib/email-notifications"
import prisma from "@/lib/prisma"
import { z } from "zod"

const massEmailSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  content: z.string().min(1, "Content is required"),
})

/**
 * Send a mass email to all registrants of an event
 */
export async function sendEventMassEmail(formCode: string, formData: FormData) {
  try {
    const user = await requireAuth()

    // Validate form data
    const subject = formData.get("subject") as string
    const content = formData.get("content") as string

    const validatedData = massEmailSchema.safeParse({ subject, content })
    if (!validatedData.success) {
      return {
        success: false,
        message: validatedData.error.errors[0].message,
      }
    }

    // Check if the user owns this form
    const form = await prisma.form.findFirst({
      where: {
        code: formCode,
        userId: user.id,
      },
    })

    if (!form) {
      return {
        success: false,
        message: "Form not found or you don't have permission to access it",
      }
    }

    // Send the mass email
    const result = await sendMassEmail(formCode, subject, content, user.id)

    if (result.success) {
      return {
        success: true,
        sent: result.sent,
        failed: result.failed,
        message: result.message,
      }
    } else {
      return {
        success: false,
        message: result.message || "Failed to send mass email",
      }
    }
  } catch (error) {
    console.error("Error sending mass email:", error)
    return {
      success: false,
      message: "An error occurred while sending mass email",
    }
  }
}

/**
 * Get email statistics for an event
 */
export async function getEmailStatistics(formCode: string) {
  try {
    const user = await requireAuth()

    // Check if the user owns this form
    const form = await prisma.form.findFirst({
      where: {
        code: formCode,
        userId: user.id,
      },
      include: {
        responses: {
          include: {
            data: true,
          },
        },
      },
    })

    if (!form) {
      return {
        success: false,
        message: "Form not found or you don't have permission to access it",
      }
    }

    // Get form fields to identify email fields
    const formFields = await prisma.formField.findMany({
      where: { formId: form.id },
    })

    const emailFieldIds = formFields.filter((field) => field.type === "email").map((field) => field.fieldId)

    // Count responses with valid emails
    let totalRegistrants = 0
    let emailsCollected = 0

    for (const response of form.responses) {
      totalRegistrants++

      // Check if response has a valid email
      const hasEmail = response.data.some((d) => emailFieldIds.includes(d.fieldId) && d.value && d.value.includes("@"))

      if (hasEmail) {
        emailsCollected++
      }
    }

    return {
      success: true,
      statistics: {
        totalRegistrants,
        emailsCollected,
      },
    }
  } catch (error) {
    console.error("Error getting email statistics:", error)
    return {
      success: false,
      message: "An error occurred while getting email statistics",
    }
  }
}


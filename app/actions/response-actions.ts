"use server"

import { revalidatePath } from "next/cache"
import prisma from "@/lib/prisma"

// Submit form response
export async function submitFormResponse(code: string, formData: Record<string, any>) {
  try {
    // Validate the code format
    if (!/^\d{4}$/.test(code)) {
      return {
        success: false,
        message: "Invalid event code format",
      }
    }

    // Find the form
    const form = await prisma.form.findUnique({
      where: { code },
    })

    if (!form) {
      return {
        success: false,
        message: "Form not found",
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
      message: "An error occurred while submitting your response. Please try again.",
    }
  }
}


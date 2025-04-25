"use server"

import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { canReceiveResponse } from "@/lib/subscription"

// Update the submitFormResponse function in response-actions.ts

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
    })

    if (!form) {
      console.error("Form not found with code:", code)
      return {
        success: false,
        message: "Form not found",
      }
    }

    console.log("Form found:", form.id, form.name)

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
      message: "An error occurred while submitting your response. Please try again.",
    }
  }
}

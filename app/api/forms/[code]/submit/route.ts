import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function POST(request: NextRequest, { params }: { params: { code: string } }) {
  try {
    const { code } = params
    const { data } = await request.json()

    // Validate the code format
    if (!/^\d{4}$/.test(code)) {
      return NextResponse.json({ success: false, error: "Invalid event code format" }, { status: 400 })
    }

    // Find the form
    const form = await prisma.form.findUnique({
      where: { code },
    })

    if (!form) {
      return NextResponse.json({ success: false, error: "Form not found" }, { status: 404 })
    }

    // Create a new response
    const response = await prisma.response.create({
      data: {
        formId: form.id,
        data: {
          create: Object.entries(data).map(([fieldId, value]) => ({
            fieldId,
            value: typeof value === "object" ? JSON.stringify(value) : String(value),
          })),
        },
      },
    })

    return NextResponse.json({
      success: true,
      responseId: response.id,
      message: "Form submitted successfully",
    })
  } catch (error) {
    console.error("Error submitting form:", error)
    return NextResponse.json({ success: false, error: "Failed to submit form" }, { status: 500 })
  }
}


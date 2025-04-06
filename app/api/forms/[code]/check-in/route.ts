import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function POST(request: NextRequest, { params }: { params: { code: string } }) {
  try {
    const { code } = params
    const { email, name } = await request.json()

    // Validate the code format
    if (!/^\d{4}$/.test(code)) {
      return NextResponse.json({ success: false, error: "Invalid event code format" }, { status: 400 })
    }

    // Find the form
    const form = await prisma.form.findUnique({
      where: { code },
      include: {
        responses: {
          include: {
            data: true,
          },
        },
      },
    })

    if (!form) {
      return NextResponse.json({ success: false, error: "Form not found" }, { status: 404 })
    }

    // Find the attendee in the responses
    const attendee = form.responses.find((response) => {
      // Look for email in the response data
      return response.data.some((data) => {
        // Check if the data contains an email that matches
        return (
          (data.fieldId.toLowerCase().includes("email") && data.value?.toLowerCase() === email.toLowerCase()) ||
          // Also check if name matches as a fallback
          data.value
            ?.toLowerCase()
            .includes(name.toLowerCase())
        )
      })
    })

    if (!attendee) {
      return NextResponse.json({ success: false, message: "No registration found with this email" }, { status: 404 })
    }

    // Update the attendee's check-in status
    await prisma.response.update({
      where: { id: attendee.id },
      data: {
        checkedIn: true,
        checkInTime: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      message: "Check-in successful",
    })
  } catch (error) {
    console.error("Error during check-in:", error)
    return NextResponse.json({ success: false, error: "Failed to process check-in" }, { status: 500 })
  }
}


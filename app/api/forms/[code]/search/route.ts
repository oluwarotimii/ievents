import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"

export async function GET(request: Request, { params }: { params: { code: string } }) {
  try {
    const user = await requireAuth()
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")

    if (!query) {
      return NextResponse.json({ results: [] })
    }

    // Find the form
    const form = await prisma.form.findFirst({
      where: {
        code: params.code,
        userId: user.id,
      },
    })

    if (!form) {
      return NextResponse.json(
        { success: false, error: "Form not found or you don't have permission to access it" },
        { status: 404 },
      )
    }

    // Get all responses for this form
    const responses = await prisma.response.findMany({
      where: {
        formId: form.id,
      },
      include: {
        data: true,
      },
    })

    // Format responses
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

    // Filter responses based on search query
    const results = formattedResponses.filter((response) => {
      // Search in all fields
      return Object.values(response.data).some((value) => {
        if (typeof value === "string") {
          return value.toLowerCase().includes(query.toLowerCase())
        }
        if (typeof value === "object" && value !== null) {
          return Object.values(value).some(
            (v) => typeof v === "string" && v.toLowerCase().includes(query.toLowerCase()),
          )
        }
        return false
      })
    })

    return NextResponse.json({ results })
  } catch (error) {
    console.error("Error searching attendees:", error)
    return NextResponse.json({ success: false, error: "Failed to search attendees" }, { status: 500 })
  }
}


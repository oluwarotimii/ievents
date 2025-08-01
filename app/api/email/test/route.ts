import { NextResponse } from "next/server"
import { testBrevoConnection } from "@/lib/brevo"

export async function GET() {
  try {
    const result = await testBrevoConnection()

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.message || "Failed to connect to Brevo API",
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: result.message || "Brevo API connection successful",
    })
  } catch (error) {
    console.error("Error testing Brevo connection:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

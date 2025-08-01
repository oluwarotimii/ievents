import { type NextRequest, NextResponse } from "next/server"
import { sendEmail } from "@/lib/email"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { to, subject, template, data, customHtml } = body

    if (!to || !subject) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    const result = await sendEmail({
      to,
      subject,
      template,
      data,
      customHtml,
    })

    if (!result.success) {
      console.error("Error sending email:", result.error)
      return NextResponse.json({ success: false, error: result.error }, { status: 500 })
    }

    return NextResponse.json({ success: true, messageId: result.messageId })
  } catch (error) {
    console.error("Error in email API route:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  try {
    const result = await verifyEmailConfig()

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

// Import at the end to avoid circular dependencies
import { verifyEmailConfig } from "@/lib/email"

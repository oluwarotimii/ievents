export const runtime = "nodejs"

import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { sendEmailToRegistrants } from "@/lib/email-utils"
import { getUserFromRequest } from "@/lib/auth"

export async function POST(request: NextRequest, { params }: { params: { formId: string } }) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const formId = Number.parseInt(params.formId)

    // Check if form belongs to user
    const form = await prisma.form.findUnique({
      where: {
        id: formId,
        userId: user.id,
      },
    })

    if (!form) {
      return NextResponse.json({ success: false, error: "Form not found" }, { status: 404 })
    }

    const body = await request.json()
    const { subject, template, htmlContent, scheduledAt } = body

    if (!subject || !htmlContent) {
      return NextResponse.json({ success: false, error: "Subject and HTML content are required" }, { status: 400 })
    }

    const result = await sendEmailToRegistrants({
      formId,
      subject,
      template: template || "custom",
      htmlContent,
      useApi: true,
      scheduledAt,
      senderName: user.username,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error sending emails:", error)
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 })
  }
}

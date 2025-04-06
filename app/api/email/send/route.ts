export const runtime = "nodejs"

import { type NextRequest, NextResponse } from "next/server"
import nodemailer from "nodemailer"
import { render } from "@react-email/render"
import VerificationEmail from "@/emails/verification-email"
import PasswordResetEmail from "@/emails/password-reset-email"
import WelcomeEmail from "@/emails/welcome-email"

// Create a transporter using SMTP
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp-relay.brevo.com",
  port: Number.parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
})

export type EmailTemplate = "verification" | "password-reset" | "welcome"

export interface SendEmailOptions {
  to: string
  subject: string
  template: EmailTemplate
  data: Record<string, any>
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SendEmailOptions
    const { to, subject, template, data } = body

    // Select the appropriate email template
    let htmlContent: string

    switch (template) {
      case "verification":
        htmlContent = render(VerificationEmail({ ...data }))
        break
      case "password-reset":
        htmlContent = render(PasswordResetEmail({ ...data }))
        break
      case "welcome":
        htmlContent = render(WelcomeEmail({ ...data }))
        break
      default:
        return NextResponse.json({ success: false, error: `Unknown email template: ${template}` }, { status: 400 })
    }

    // Send the email
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"Event Form Builder" <noreply@eventformbuilder.com>',
      to,
      subject,
      html: htmlContent,
    })

    console.log(`Email sent: ${info.messageId}`)
    return NextResponse.json({ success: true, messageId: info.messageId })
  } catch (error) {
    console.error("Error sending email:", error)
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 })
  }
}

// Verify SMTP connection
export async function GET() {
  try {
    await transporter.verify()
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Email configuration error:", error)
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 })
  }
}


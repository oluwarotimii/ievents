export const runtime = "nodejs"

import { type NextRequest, NextResponse } from "next/server"
import nodemailer from "nodemailer"
import { render } from "@react-email/render"
import VerificationEmail from "@/emails/verification-email"
import PasswordResetEmail from "@/emails/password-reset-email"
import WelcomeEmail from "@/emails/welcome-email"
import EventRegistrationEmail from "@/emails/event-registration-email"
import EventCheckInEmail from "@/emails/event-check-in-email"
import { sendTransactionalEmail } from "@/lib/brevo"

// Validate email configuration
const SMTP_HOST = process.env.SMTP_HOST || "smtp-relay.brevo.com"
const SMTP_PORT = Number.parseInt(process.env.SMTP_PORT || "587")
const SMTP_SECURE = process.env.SMTP_SECURE === "true"
const SMTP_USER = process.env.SMTP_USER
const SMTP_PASSWORD = process.env.SMTP_PASSWORD

// Log email configuration (without password)
console.log(`Email configuration: ${SMTP_HOST}:${SMTP_PORT} (secure: ${SMTP_SECURE}) with user: ${SMTP_USER}`)

if (!SMTP_USER || !SMTP_PASSWORD) {
  console.warn("SMTP credentials are missing! Email functionality may not work correctly.")
}

// Create a transporter using SMTP
const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_SECURE,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASSWORD,
  },
  // Add debug option for development
  ...(process.env.NODE_ENV !== "production" && { debug: true }),
})

export type EmailTemplate =
  | "verification"
  | "password-reset"
  | "welcome"
  | "event-registration"
  | "event-check-in"
  | "custom"

export interface SendEmailOptions {
  to: string
  subject: string
  template: EmailTemplate
  data: Record<string, any>
  useApi?: boolean // Whether to use the Brevo API instead of SMTP
  cc?: string[]
  bcc?: string[]
  replyTo?: string
  attachments?: { filename: string; content: string; encoding?: string }[]
  customHtml?: string // Only used when template is "custom"
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SendEmailOptions
    const { to, subject, template, data, useApi = false, cc, bcc, replyTo, attachments, customHtml } = body

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
      case "event-registration":
        htmlContent = render(EventRegistrationEmail({ ...data }))
        break
      case "event-check-in":
        htmlContent = render(EventCheckInEmail({ ...data }))
        break
      case "custom":
        if (!customHtml) {
          return NextResponse.json(
            { success: false, error: "Custom HTML content is required for custom template" },
            { status: 400 },
          )
        }
        htmlContent = customHtml
        break
      default:
        return NextResponse.json({ success: false, error: `Unknown email template: ${template}` }, { status: 400 })
    }

    // Use Brevo API if specified
    if (useApi) {
      const apiResult = await sendTransactionalEmail({
        to: [{ email: to }],
        subject,
        htmlContent,
        ...(cc && { cc: cc.map((email) => ({ email })) }),
        ...(bcc && { bcc: bcc.map((email) => ({ email })) }),
        ...(replyTo && { replyTo: { email: replyTo } }),
        ...(attachments && {
          attachment: attachments.map((attachment) => ({
            name: attachment.filename,
            content: attachment.content,
            url: "",
          })),
        }),
      })

      if (!apiResult.success) {
        console.error("Error sending email via Brevo API:", apiResult.error)
        return NextResponse.json({ success: false, error: apiResult.error }, { status: 500 })
      }

      return NextResponse.json({ success: true, messageId: apiResult.data.messageId })
    }

    // Otherwise, use SMTP
    const fromEmail = process.env.EMAIL_FROM || "noreply@orionis.com"

    try {
      // Send the email
      const info = await transporter.sendMail({
        from: fromEmail,
        to,
        subject,
        html: htmlContent,
        cc,
        bcc,
        replyTo,
        attachments,
      })

      console.log(`Email sent: ${info.messageId}`)
      return NextResponse.json({ success: true, messageId: info.messageId })
    } catch (emailError) {
      console.error("SMTP sending error:", emailError)
      // Try fallback to Brevo API if SMTP fails
      const apiResult = await sendTransactionalEmail({
        to: [{ email: to }],
        subject,
        htmlContent,
        ...(cc && { cc: cc.map((email) => ({ email })) }),
        ...(bcc && { bcc: bcc.map((email) => ({ email })) }),
        ...(replyTo && { replyTo: { email: replyTo } }),
        ...(attachments && {
          attachment: attachments.map((attachment) => ({
            name: attachment.filename,
            content: attachment.content,
            url: "",
          })),
        }),
      })

      if (!apiResult.success) {
        console.error("Fallback API sending error:", apiResult.error)
        return NextResponse.json(
          { success: false, error: "Failed to send email via both SMTP and API" },
          { status: 500 },
        )
      }

      return NextResponse.json({ success: true, messageId: apiResult.data.messageId, method: "api-fallback" })
    }
  } catch (error) {
    console.error("Error sending email:", error)
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 })
  }
}

// Verify SMTP connection
export async function GET() {
  try {
    await transporter.verify()
    return NextResponse.json({ success: true, message: "SMTP connection verified successfully" })
  } catch (error) {
    console.error("Email configuration error:", error)
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 })
  }
}

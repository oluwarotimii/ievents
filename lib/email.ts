"use server"

import { render } from "@react-email/render"
import VerificationEmail from "@/emails/verification-email"
import PasswordResetEmail from "@/emails/password-reset-email"
import WelcomeEmail from "@/emails/welcome-email"
import EventRegistrationEmail from "@/emails/event-registration-email"
import EventCheckInEmail from "@/emails/event-check-in-email"
import PaymentReceiptEmail from "@/emails/payment-receipt-email"
import MassEmailTemplate from "@/emails/mass-email-template"

// Email templates
export type EmailTemplate =
  | "verification"
  | "password-reset"
  | "welcome"
  | "event-registration"
  | "event-check-in"
  | "payment-receipt"
  | "mass-email"
  | "custom"

// Email sending options
export interface SendEmailOptions {
  to: string
  subject: string
  template?: EmailTemplate
  data?: Record<string, any>
  customHtml?: string
  cc?: string[]
  bcc?: string[]
  replyTo?: string
  attachments?: { filename: string; content: string; encoding?: string }[]
  useApi?: boolean
}

// Render email template
function renderEmailTemplate(template: EmailTemplate, data: Record<string, any> = {}): string {
  console.log(`Rendering email template: ${template}`)

  switch (template) {
    case "verification":
      return render(VerificationEmail(data))
    case "password-reset":
      return render(PasswordResetEmail(data))
    case "welcome":
      return render(WelcomeEmail(data))
    case "event-registration":
      return render(EventRegistrationEmail(data))
    case "event-check-in":
      return render(EventCheckInEmail(data))
    case "payment-receipt":
      return render(PaymentReceiptEmail(data))
    case "mass-email":
      return render(MassEmailTemplate(data))
    case "custom":
      return data.customHtml || "<p>Custom email content</p>"
    default:
      throw new Error(`Unknown email template: ${template}`)
  }
}

// Send email using Brevo API
export async function sendEmail({
  to,
  subject,
  template,
  data = {},
  customHtml,
  cc,
  bcc,
  replyTo,
  attachments,
  useApi = true,
}: SendEmailOptions): Promise<{ success: boolean; messageId?: string; error?: any }> {
  console.log(`Sending email to ${to} with subject "${subject}"`)

  try {
    // Determine the HTML content
    let html = customHtml || ""

    if (template && !customHtml) {
      html = renderEmailTemplate(template, data)
    }

    if (!html) {
      throw new Error("No HTML content provided for email")
    }

    // Prepare Brevo API request
    const apiKey = process.env.BREVO_API_KEY
    if (!apiKey) {
      throw new Error("BREVO_API_KEY is not set")
    }

    // Prepare email data for Brevo
    const emailData = {
      sender: {
        name: "Event Form Builder",
        email: process.env.EMAIL_FROM || "noreply@example.com",
      },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }

    // Add CC if provided
    if (cc && cc.length > 0) {
      emailData.cc = cc.map((email) => ({ email }))
    }

    // Add BCC if provided
    if (bcc && bcc.length > 0) {
      emailData.bcc = bcc.map((email) => ({ email }))
    }

    // Add reply-to if provided
    if (replyTo) {
      emailData.replyTo = { email: replyTo }
    }

    // Add attachments if provided
    if (attachments && attachments.length > 0) {
      emailData.attachment = attachments.map((attachment) => ({
        name: attachment.filename,
        content: attachment.content,
      }))
    }

    // Send email using Brevo API
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify(emailData),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Brevo API error (${response.status}):`, errorText)

      try {
        const errorJson = JSON.parse(errorText)
        return { success: false, error: errorJson.message || `API error: ${response.status}` }
      } catch (e) {
        return { success: false, error: `API error: ${response.status}` }
      }
    }

    const result = await response.json()
    console.log(`Email sent successfully with Brevo: ${result.messageId}`)

    return { success: true, messageId: result.messageId }
  } catch (error) {
    console.error("Error sending email:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

// Verify email configuration
export async function verifyEmailConfig(): Promise<{ success: boolean; error?: any }> {
  try {
    // Check if Brevo API key is set
    const apiKey = process.env.BREVO_API_KEY
    if (!apiKey) {
      return { success: false, error: "BREVO_API_KEY is not set" }
    }

    // Test Brevo API connection
    const response = await fetch("https://api.brevo.com/v3/account", {
      method: "GET",
      headers: {
        Accept: "application/json",
        "api-key": apiKey,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Brevo API error (${response.status}):`, errorText)
      return { success: false, error: `API error: ${response.status}` }
    }

    return { success: true }
  } catch (error) {
    console.error("Error verifying email config:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

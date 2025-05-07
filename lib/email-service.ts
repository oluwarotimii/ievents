import { render } from "@react-email/render"
import VerificationEmail from "@/emails/verification-email"
import PasswordResetEmail from "@/emails/password-reset-email"
import WelcomeEmail from "@/emails/welcome-email"
import EventRegistrationEmail from "@/emails/event-registration-email"
import EventCheckInEmail from "@/emails/event-check-in-email"
import PaymentReceiptEmail from "@/emails/payment-receipt-email"
import MassEmailTemplate from "@/emails/mass-email-template"

export type EmailTemplate =
  | "verification"
  | "password-reset"
  | "welcome"
  | "event-registration"
  | "event-check-in"
  | "payment-receipt"
  | "mass-email"
  | "custom"

export interface SendEmailOptions {
  to: string
  subject: string
  template: EmailTemplate
  data: Record<string, any>
  cc?: string[]
  bcc?: string[]
  replyTo?: string
  attachments?: { filename: string; content: string; encoding?: string }[]
  customHtml?: string
  useApi?: boolean
}

/**
 * Renders an email template with the provided data
 */
export function renderEmailTemplate(template: EmailTemplate, data: Record<string, any>): string {
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

/**
 * Sends an email using the API
 */
export async function sendEmail({
  to,
  subject,
  template,
  data,
  cc,
  bcc,
  replyTo,
  attachments,
  customHtml,
  useApi = true, // Default to API for reliability
}: SendEmailOptions): Promise<{ success: boolean; messageId?: string; error?: any }> {
  try {
    console.log(`Sending ${template} email to ${to}`)

    // For custom templates, add the HTML to the data
    if (template === "custom" && customHtml) {
      data = { ...data, customHtml }
    }

    const response = await fetch("/api/email/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to,
        subject,
        template,
        data,
        cc,
        bcc,
        replyTo,
        attachments,
        customHtml,
        useApi,
      }),
    })

    if (!response.ok) {
      console.error(`Email API responded with status: ${response.status}`)
      const text = await response.text()
      console.error(`Response body: ${text}`)

      try {
        const errorJson = JSON.parse(text)
        return { success: false, error: errorJson.error || "Unknown error" }
      } catch (e) {
        return { success: false, error: `API error: ${response.status}` }
      }
    }

    const result = await response.json()

    if (!result.success) {
      console.error("Error sending email:", result.error)
      return { success: false, error: result.error }
    }

    console.log(`Email sent successfully with ID: ${result.messageId}`)
    return { success: true, messageId: result.messageId }
  } catch (error) {
    console.error("Error sending email:", error)
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}

/**
 * Sends an email directly from the server (for server actions)
 * This is the key function that needs to be used consistently across all email sending functions
 */
export async function sendEmailFromServer({
  to,
  subject,
  template,
  data,
  cc,
  bcc,
  replyTo,
  attachments,
  customHtml,
  useApi = true,
}: SendEmailOptions): Promise<{ success: boolean; messageId?: string; error?: any }> {
  try {
    console.log(`Sending ${template} email from server to ${to}`)

    // Get the base URL for the API
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

    // Make a direct request to the email API
    const response = await fetch(`${baseUrl}/api/email/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to,
        subject,
        template,
        data,
        cc,
        bcc,
        replyTo,
        attachments,
        customHtml,
        useApi,
      }),
    })

    if (!response.ok) {
      console.error(`Email API responded with status: ${response.status}`)
      const text = await response.text()
      console.error(`Response body: ${text}`)

      return { success: false, error: `API error: ${response.status}` }
    }

    const result = await response.json()

    if (!result.success) {
      console.error("Error sending email from server:", result.error)
      return { success: false, error: result.error }
    }

    console.log(`Email sent successfully from server with ID: ${result.messageId}`)
    return { success: true, messageId: result.messageId }
  } catch (error) {
    console.error("Error sending email from server:", error)
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}

/**
 * Verify email configuration
 */
export async function verifyEmailConfig(): Promise<{ success: boolean; error?: any }> {
  try {
    const response = await fetch("/api/email/test", {
      method: "GET",
    })

    const result = await response.json()

    if (!result.success) {
      console.error("Email configuration error:", result.error)
      return { success: false, error: result.error }
    }

    return { success: true }
  } catch (error) {
    console.error("Email configuration error:", error)
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}

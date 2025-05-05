export type EmailTemplate =
  | "verification"
  | "password-reset"
  | "welcome"
  | "event-registration"
  | "event-check-in"
  | "custom"
  | "payment-receipt"
  | "mass-email"

export interface SendEmailOptions {
  to: string
  subject: string
  template: EmailTemplate
  data: Record<string, any>
  cc?: string[]
  bcc?: string[]
  replyTo?: string
  attachments?: { filename: string; content: string; encoding?: string }[]
  customHtml?: string // Only used when template is "custom"
  useApi?: boolean // Whether to use the Brevo API instead of SMTP
}

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
  useApi,
}: SendEmailOptions) {
  try {
    console.log(`Sending ${template} email to ${to}`)

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

// Verify SMTP connection
export async function verifyEmailConfig() {
  try {
    const response = await fetch("/api/email/send", {
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
    return { success: false, error }
  }
}

// Test Brevo API connection
export async function testBrevoConnection() {
  try {
    const response = await fetch("/api/email/test", {
      method: "GET",
    })

    const result = await response.json()

    if (!result.success) {
      console.error("Brevo API error:", result.error)
      return { success: false, error: result.error }
    }

    return { success: true, message: result.message }
  } catch (error) {
    console.error("Brevo API error:", error)
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}

// Send a test email
export async function sendTestEmail(to: string, subject: string, content: string) {
  return sendEmail({
    to,
    subject,
    template: "custom",
    data: {},
    customHtml: content,
    useApi: true, // Force using the API for test emails
  })
}

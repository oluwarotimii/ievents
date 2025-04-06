export type EmailTemplate = "verification" | "password-reset" | "welcome"

export interface SendEmailOptions {
  to: string
  subject: string
  template: EmailTemplate
  data: Record<string, any>
}

export async function sendEmail({ to, subject, template, data }: SendEmailOptions) {
  try {
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
      }),
    })

    const result = await response.json()

    if (!result.success) {
      console.error("Error sending email:", result.error)
      return { success: false, error: result.error }
    }

    return { success: true, messageId: result.messageId }
  } catch (error) {
    console.error("Error sending email:", error)
    return { success: false, error }
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


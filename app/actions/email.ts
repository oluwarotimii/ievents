"use server"

import { sendTransactionalEmail } from "@/lib/brevo"

interface SendEmailOptions {
  to: string
  subject: string
  html: string
  cc?: string
  bcc?: string
  replyTo?: string
}

export async function sendEmail(options: SendEmailOptions) {
  try {
    const { to, subject, html, cc, bcc, replyTo } = options

    // Prepare recipients in Brevo format
    const recipients = [{ email: to }]
    const ccRecipients = cc ? [{ email: cc }] : undefined
    const bccRecipients = bcc ? [{ email: bcc }] : undefined
    const replyToContact = replyTo ? { email: replyTo } : undefined

    // Send email using Brevo API
    const result = await sendTransactionalEmail({
      to: recipients,
      cc: ccRecipients,
      bcc: bccRecipients,
      replyTo: replyToContact,
      subject,
      htmlContent: html,
    })

    if (!result.success) {
      console.error("Failed to send email:", result.error)
      return { success: false, error: result.error }
    }

    return { success: true, messageId: result.data?.messageId }
  } catch (error) {
    console.error("Error sending email:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

// Function to test email configuration
export async function testEmailConfig() {
  try {
    const result = await sendTransactionalEmail({
      to: [{ email: "test@example.com" }],
      subject: "Test Email Configuration",
      htmlContent: "<p>This is a test email to verify the email configuration.</p>",
    })

    return result
  } catch (error) {
    console.error("Error testing email configuration:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

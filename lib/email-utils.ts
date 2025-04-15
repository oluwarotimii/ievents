import { prisma } from "@/lib/db"
import type { EmailTemplate } from "@/app/api/email/send/route"

export interface SendBulkEmailOptions {
  formId: number
  subject: string
  template: EmailTemplate
  htmlContent?: string
  useApi?: boolean
  scheduledAt?: string
  senderName?: string
  senderEmail?: string
}

/**
 * Send a bulk email to all registrants of a form
 */
export async function sendEmailToRegistrants(options: SendBulkEmailOptions) {
  const { formId, subject, template, htmlContent, useApi = true, scheduledAt, senderName, senderEmail } = options

  try {
    // Get all unique email addresses from the form responses
    const emailResponses = await prisma.responseData.findMany({
      where: {
        response: {
          formId,
        },
        fieldId: {
          contains: "email",
        },
      },
      select: {
        value: true,
      },
    })

    const emails = Array.from(new Set(emailResponses.map((r) => r.value).filter(Boolean))) as string[]

    if (emails.length === 0) {
      return { success: false, error: "No email addresses found in form responses" }
    }

    // Get the form details
    const form = await prisma.form.findUnique({
      where: { id: formId },
      include: { user: true },
    })

    if (!form) {
      return { success: false, error: "Form not found" }
    }

    // Use the Brevo API for bulk emails
    if (useApi) {
      const response = await fetch("/api/email/campaign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: `${form.name} - ${subject}`,
          subject,
          htmlContent: htmlContent || `<p>Email from ${form.name}</p>`,
          emails,
          scheduledAt,
          sender: {
            name: senderName || form.user.username,
            email: senderEmail || process.env.EMAIL_FROM?.split("<")[1]?.replace(">", "") || "noreply@orionis.com",
          },
          tags: ["event-registration", form.name],
        }),
      })

      const result = await response.json()
      return result
    }

    // If not using API, send individual emails (not recommended for large lists)
    else {
      const results = []

      for (const email of emails) {
        const response = await fetch("/api/email/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            to: email,
            subject,
            template,
            data: {
              formName: form.name,
              formCode: form.code,
            },
            customHtml: htmlContent,
          }),
        })

        const result = await response.json()
        results.push(result)
      }

      return {
        success: true,
        results,
      }
    }
  } catch (error) {
    console.error("Error sending bulk email:", error)
    return { success: false, error: (error as Error).message }
  }
}

/**
 * Send an email to a specific registrant
 */
export async function sendEmailToRegistrant(
  responseId: number,
  subject: string,
  template: EmailTemplate,
  data?: Record<string, any>,
  customHtml?: string,
) {
  try {
    // Get the response data
    const response = await prisma.response.findUnique({
      where: { id: responseId },
      include: {
        form: true,
        data: true,
      },
    })

    if (!response) {
      return { success: false, error: "Response not found" }
    }

    // Find the email field
    const emailField = response.data.find((d) => d.fieldId.toLowerCase().includes("email"))

    if (!emailField || !emailField.value) {
      return { success: false, error: "No email address found in response" }
    }

    // Send the email
    const apiResponse = await fetch("/api/email/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: emailField.value,
        subject,
        template,
        data: {
          formName: response.form.name,
          formCode: response.form.code,
          ...data,
        },
        useApi: true,
        customHtml,
      }),
    })

    return await apiResponse.json()
  } catch (error) {
    console.error("Error sending email to registrant:", error)
    return { success: false, error: (error as Error).message }
  }
}

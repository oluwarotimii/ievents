import { render } from "@react-email/render"
import { prisma } from "@/lib/db"
import type { EmailTemplate } from "@/app/api/email/send/route"
import EventRegistrationEmail from "@/emails/event-registration-email"
import EventCheckInEmail from "@/emails/event-check-in-email"
import MassEmailTemplate from "@/emails/mass-email-template"

export interface SendBulkEmailOptions {
  formId: number
  subject: string
  template: EmailTemplate
  htmlContent?: string
  useApi?: boolean
  scheduledAt?: string
  senderName?: string
}

/**
 * Send a bulk email to all registrants of a form
 */
export async function sendEmailToRegistrants({
  formId,
  subject,
  template,
  htmlContent,
  useApi = true,
  scheduledAt,
  senderName,
}: {
  formId: number
  subject: string
  template: string
  htmlContent?: string
  useApi?: boolean
  scheduledAt?: string
  senderName?: string
}): Promise<{ success: boolean; sent: number; failed: number; message?: string }> {
  try {
    // Get form data
    const form = await prisma.form.findUnique({
      where: { id: formId },
    })

    if (!form) {
      return {
        success: false,
        sent: 0,
        failed: 0,
        message: "Form not found",
      }
    }

    // Get all responses with email addresses
    const responses = await prisma.response.findMany({
      where: { formId },
      include: {
        data: true,
      },
    })

    if (responses.length === 0) {
      return {
        success: false,
        sent: 0,
        failed: 0,
        message: "No registrants found for this event",
      }
    }

    // Get form fields to identify email fields
    const formFields = await prisma.formField.findMany({
      where: { formId },
    })

    const emailFieldIds = formFields.filter((field) => field.type === "email").map((field) => field.fieldId)

    // Import the unified email service
    const { sendUnifiedEmail } = await import("./email")

    // Process each response
    let sent = 0
    let failed = 0

    for (const response of responses) {
      try {
        // Find email in response data
        const emailData = response.data.find((d) => emailFieldIds.includes(d.fieldId))
        if (!emailData || !emailData.value) {
          failed++
          continue
        }

        const email = emailData.value

        // Find name in response data
        let name = "Attendee"
        const nameField = formFields.find((f) => f.label.toLowerCase().includes("name"))
        if (nameField) {
          const nameData = response.data.find((d) => d.fieldId === nameField.fieldId)
          if (nameData && nameData.value) {
            name = nameData.value
          }
        }

        // Create unsubscribe URL
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
        const unsubscribeUrl = `${baseUrl}/unsubscribe/${form.code}?email=${encodeURIComponent(email)}`

        // Prepare email data
        const massEmailData = {
          subject,
          eventName: form.name,
          recipientName: name,
          content: htmlContent || "",
          unsubscribeUrl,
          eventCode: form.code,
          senderName: senderName || "Event Organizer",
        }

        // Render the email
        const finalHtmlContent = template === "custom" ? htmlContent : render(MassEmailTemplate(massEmailData))

        // Send the email using our unified email service
        const result = await sendUnifiedEmail({
          to: email,
          subject,
          customHtml: finalHtmlContent,
        })

        if (result.success) {
          sent++
        } else {
          console.error(`Failed to send email to ${email}:`, result.error)
          failed++
        }
      } catch (error) {
        console.error(`Error sending email to response ${response.id}:`, error)
        failed++
      }
    }

    return {
      success: true,
      sent,
      failed,
      message: `Successfully sent ${sent} emails, ${failed} failed`,
    }
  } catch (error) {
    console.error("Error sending emails to registrants:", error)
    return {
      success: false,
      sent: 0,
      failed: 0,
      message: "An error occurred while sending emails",
    }
  }
}

/**
 * Send an email to a specific registrant
 */
export async function sendEmailToRegistrant({
  responseId,
  subject,
  template,
  htmlContent,
  useApi = true,
}: {
  responseId: number
  subject: string
  template: string
  htmlContent?: string
  useApi?: boolean
}): Promise<{ success: boolean; error?: string }> {
  try {
    // Get response data with form and form fields
    const response = await prisma.response.findUnique({
      where: { id: responseId },
      include: {
        form: true,
        data: true,
      },
    })

    if (!response) {
      return { success: false, error: `Response with ID ${responseId} not found` }
    }

    // Get form fields to match with response data
    const formFields = await prisma.formField.findMany({
      where: { formId: response.formId },
      orderBy: { position: "asc" },
    })

    // Extract attendee information
    let attendeeName = "Attendee"
    let attendeeEmail = ""
    const customFields: Record<string, string> = {}

    // Process response data
    for (const data of response.data) {
      const field = formFields.find((f) => f.fieldId === data.fieldId)
      if (!field) continue

      // Add to custom fields
      customFields[field.label] = data.value || ""

      // Extract email and name
      if (field.type === "email" && data.value) {
        attendeeEmail = data.value
      }
      if (field.label.toLowerCase().includes("name") && data.value) {
        attendeeName = data.value
      }
    }

    if (!attendeeEmail) {
      return { success: false, error: "No email found in registration data" }
    }

    // Import the unified email service
    const { sendUnifiedEmail } = await import("./email")

    // Send the email using our unified email service
    const result = await sendUnifiedEmail({
      to: attendeeEmail,
      subject,
      template: htmlContent ? undefined : (template as any),
      data: {
        formName: response.form.name,
        formCode: response.form.code,
        userName: attendeeName,
        customFields,
      },
      customHtml: htmlContent,
    })

    if (!result.success) {
      return { success: false, error: result.error }
    }

    return { success: true }
  } catch (error) {
    console.error("Error sending email to registrant:", error)
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}

/**
 * Send event registration email
 */
export async function sendEventRegistrationEmail(
  responseId: number,
  qrCodeUrl?: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get response data with form and form fields
    const response = await prisma.response.findUnique({
      where: { id: responseId },
      include: {
        form: true,
        data: true,
      },
    })

    if (!response) {
      return { success: false, error: `Response with ID ${responseId} not found` }
    }

    // Get form fields to match with response data
    const formFields = await prisma.formField.findMany({
      where: { formId: response.formId },
      orderBy: { position: "asc" },
    })

    // Extract attendee information
    let attendeeName = "Attendee"
    let attendeeEmail = ""
    const customFields: Record<string, string> = {}

    // Process response data
    for (const data of response.data) {
      const field = formFields.find((f) => f.fieldId === data.fieldId)
      if (!field) continue

      // Add to custom fields
      customFields[field.label] = data.value || ""

      // Extract email and name
      if (field.type === "email" && data.value) {
        attendeeEmail = data.value
      }
      if (field.label.toLowerCase().includes("name") && data.value) {
        attendeeName = data.value
      }
    }

    if (!attendeeEmail) {
      return { success: false, error: "No email found in registration data" }
    }

    // Extract event details from form metadata
    const formMetadata = response.form.metadata ? JSON.parse(response.form.metadata) : {}
    const eventDate = formMetadata.eventDate || ""
    const eventTime = formMetadata.eventTime || ""
    const eventLocation = formMetadata.eventLocation || ""

    // Prepare email data
    const emailData = {
      formName: response.form.name,
      formCode: response.form.code,
      userName: attendeeName,
      qrCodeUrl,
      registrationDate: new Date().toLocaleDateString(),
      eventDate,
      eventTime,
      eventLocation,
      customFields,
    }

    // Render the email
    const htmlContent = render(EventRegistrationEmail(emailData))

    // Import the unified email service
    const { sendUnifiedEmail } = await import("./email")

    // Send the email using our unified email service
    const result = await sendUnifiedEmail({
      to: attendeeEmail,
      subject: `Registration Confirmation: ${response.form.name}`,
      customHtml: htmlContent,
    })

    if (!result.success) {
      return { success: false, error: result.error }
    }

    return { success: true }
  } catch (error) {
    console.error("Error sending event registration email:", error)
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}

/**
 * Send event check-in email
 */
export async function sendEventCheckInEmail(
  responseId: number,
  additionalInfo?: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get response data with form and form fields
    const response = await prisma.response.findUnique({
      where: { id: responseId },
      include: {
        form: true,
        data: true,
      },
    })

    if (!response) {
      return { success: false, error: `Response with ID ${responseId} not found` }
    }

    // Get form fields to match with response data
    const formFields = await prisma.formField.findMany({
      where: { formId: response.formId },
      orderBy: { position: "asc" },
    })

    // Extract attendee information
    let attendeeName = "Attendee"
    let attendeeEmail = ""

    // Process response data
    for (const data of response.data) {
      const field = formFields.find((f) => f.fieldId === data.fieldId)
      if (!field) continue

      // Extract email and name
      if (field.type === "email" && data.value) {
        attendeeEmail = data.value
      }
      if (field.label.toLowerCase().includes("name") && data.value) {
        attendeeName = data.value
      }
    }

    if (!attendeeEmail) {
      return { success: false, error: "No email found in registration data" }
    }

    // Prepare email data
    const emailData = {
      formName: response.form.name,
      userName: attendeeName,
      checkInTime: new Date().toLocaleString(),
      additionalInfo,
    }

    // Render the email
    const htmlContent = render(EventCheckInEmail(emailData))

    // Import the unified email service
    const { sendUnifiedEmail } = await import("./email")

    // Send the email using our unified email service
    const result = await sendUnifiedEmail({
      to: attendeeEmail,
      subject: `Check-in Confirmation: ${response.form.name}`,
      customHtml: htmlContent,
    })

    if (!result.success) {
      return { success: false, error: result.error }
    }

    return { success: true }
  } catch (error) {
    console.error("Error sending event check-in email:", error)
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}

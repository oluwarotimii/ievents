"use server"

import { format } from "date-fns"
import { render } from "@react-email/render"
import prisma from "@/lib/prisma"
import RegistrationConfirmationEmail from "@/emails/registration-confirmation"
import PaymentReceiptEmail from "@/emails/payment-receipt-email"
import MassEmailTemplate from "@/emails/mass-email-template"
import { getFullShortUrl, createShortUrl } from "@/lib/url-shortener"
import { z } from "zod"

/**
 * Send registration confirmation email
 * This function is commented out initially as requested
 */
export async function sendRegistrationConfirmationEmail(responseId: number, formCode: string): Promise<boolean> {
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
      console.error(`Response with ID ${responseId} not found`)
      return false
    }

    // Extract attendee information
    let attendeeName = "Attendee"
    let attendeeEmail = ""
    const registrationDetails: Array<{ label: string; value: string }> = []

    // Get form fields to match with response data
    const formFields = await prisma.formField.findMany({
      where: { formId: response.formId },
      orderBy: { position: "asc" },
    })

    // Process response data
    for (const data of response.data) {
      const field = formFields.find((f) => f.fieldId === data.fieldId)
      if (!field) continue

      // Add to registration details
      registrationDetails.push({
        label: field.label,
        value: data.value || "",
      })

      // Extract email and name
      if (field.type === "email" && data.value) {
        attendeeEmail = data.value
      }
      if (field.label.toLowerCase().includes("name") && data.value) {
        attendeeName = data.value
      }
    }

    if (!attendeeEmail) {
      console.error("No email found in registration data")
      return false
    }

    // Create a short URL for the event view
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const viewUrl = `${baseUrl}/view/${formCode}`
    const shortCode = await createShortUrl(viewUrl)
    const shortViewUrl = getFullShortUrl(shortCode)

    // Prepare email data
    const emailData = {
      eventName: response.form.name,
      attendeeName,
      eventCode: formCode,
      registrationDetails,
      viewUrl: shortViewUrl,
    }

    // Render and send email
    const htmlContent = render(RegistrationConfirmationEmail(emailData))

    /*
    // Send the email - COMMENTED OUT AS REQUESTED
    const result = await sendEmail({
      to: attendeeEmail,
      subject: `Registration Confirmation: ${response.form.name}`,
      html: htmlContent,
    })

    return result.success
    */

    // Just log instead of sending
    console.log(`[MOCK] Registration confirmation email would be sent to ${attendeeEmail}`)
    return true
  } catch (error) {
    console.error("Error sending registration confirmation email:", error)
    return false
  }
}

/**
 * Send payment receipt email
 * This function is commented out initially as requested
 */
export async function sendPaymentReceiptEmail(transactionId: number): Promise<boolean> {
  try {
    // Get transaction data with response and form
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        response: {
          include: {
            form: true,
            data: true,
          },
        },
      },
    })

    if (!transaction) {
      console.error(`Transaction with ID ${transactionId} not found`)
      return false
    }

    // Extract attendee information
    const attendeeName = transaction.customerName || "Attendee"
    const attendeeEmail = transaction.customerEmail

    if (!attendeeEmail) {
      console.error("No email found in transaction data")
      return false
    }

    // Create a short URL for the payment receipt view
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const viewUrl = `${baseUrl}/payment/receipt/${transaction.reference}`
    const shortCode = await createShortUrl(viewUrl)
    const shortViewUrl = getFullShortUrl(shortCode)

    // Format payment date
    const paymentDate = transaction.paymentDate
      ? format(new Date(transaction.paymentDate), "MMMM d, yyyy h:mm a")
      : format(new Date(), "MMMM d, yyyy h:mm a")

    // Prepare email data
    const emailData = {
      eventName: transaction.formName,
      attendeeName,
      reference: transaction.reference,
      amount: transaction.netAmount,
      fee: transaction.fee,
      totalAmount: transaction.amount,
      currency: transaction.currency,
      paymentDate,
      viewUrl: shortViewUrl,
    }

    // Render and send email
    const htmlContent = render(PaymentReceiptEmail(emailData))

    // Send the email - UNCOMMENT THIS SECTION
    const sendEmail = await import("./email").then((module) => module.sendEmail)
    const result = await sendEmail({
      to: attendeeEmail,
      subject: `Payment Receipt: ${transaction.response.form.name}`,
      html: htmlContent,
    })

    return result.success

    // Just log instead of sending
    // console.log(`[MOCK] Payment receipt email would be sent to ${attendeeEmail}`)
    // return true
  } catch (error) {
    console.error("Error sending payment receipt email:", error)
    return false
  }
}

/**
 * Send mass email to all registrants of an event
 */
export async function sendMassEmail(
  formCode: string,
  subject: string,
  content: string,
  userId: number,
): Promise<{ success: boolean; sent: number; failed: number; message?: string }> {
  try {
    // Get form data
    const form = await prisma.form.findFirst({
      where: {
        code: formCode,
        userId, // Ensure the user owns this form
      },
    })

    if (!form) {
      return {
        success: false,
        sent: 0,
        failed: 0,
        message: "Form not found or you don't have permission to access it",
      }
    }

    // Get all responses with email addresses
    const responses = await prisma.response.findMany({
      where: { formId: form.id },
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
      where: { formId: form.id },
    })

    const emailFieldIds = formFields.filter((field) => field.type === "email").map((field) => field.fieldId)

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
        const unsubscribeUrl = `${baseUrl}/unsubscribe/${formCode}?email=${encodeURIComponent(email)}`

        // Prepare email data
        const massEmailData = {
          subject,
          eventName: form.name,
          recipientName: name,
          content,
          unsubscribeUrl,
          eventCode: formCode,
        }

        // Render email
        const htmlContent = render(MassEmailTemplate(massEmailData))

        /*
        // Send the email - COMMENTED OUT AS REQUESTED
        const result = await sendEmail({
          to: email,
          subject,
          html: htmlContent,
        })

        if (result.success) {
          sent++
        } else {
          failed++
        }
        */

        // Just log instead of sending
        console.log(`[MOCK] Mass email would be sent to ${email}`)
        sent++
      } catch (error) {
        console.error(`Error sending mass email to response ${response.id}:`, error)
        failed++
      }
    }

    return {
      success: true,
      sent,
      failed,
      message: `Successfully processed ${sent} emails, ${failed} failed`,
    }
  } catch (error) {
    console.error("Error sending mass email:", error)
    return {
      success: false,
      sent: 0,
      failed: 0,
      message: "An error occurred while sending mass email",
    }
  }
}

const massEmailSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  content: z.string().min(1, "Content is required"),
})

/**
 * Send a mass email to all registrants of an event
 */
export async function sendEventMassEmail(formCode: string, formData: FormData) {
  try {
    // Use dynamic import to avoid the static import error
    let user
    try {
      const authModule = await import("@/lib/auth")
      user = await authModule.requireAuth()
    } catch (error) {
      console.error("Authentication error:", error)
      return {
        success: false,
        message: "Authentication required. Please log in to continue.",
      }
    }

    // Validate form data
    const subject = formData.get("subject") as string
    const content = formData.get("content") as string

    const validatedData = massEmailSchema.safeParse({ subject, content })
    if (!validatedData.success) {
      return {
        success: false,
        message: validatedData.error.errors[0].message,
      }
    }

    // Check if the user owns this form
    const form = await prisma.form.findFirst({
      where: {
        code: formCode,
        userId: user.id,
      },
    })

    if (!form) {
      return {
        success: false,
        message: "Form not found or you don't have permission to access it",
      }
    }

    // Send the mass email
    const result = await sendMassEmail(formCode, subject, content, user.id)

    if (result.success) {
      return {
        success: true,
        sent: result.sent,
        failed: result.failed,
        message: result.message,
      }
    } else {
      return {
        success: false,
        message: result.message || "Failed to send mass email",
      }
    }
  } catch (error) {
    console.error("Error sending mass email:", error)
    return {
      success: false,
      message: "An error occurred while sending mass email",
    }
  }
}

// Update the getEmailStatistics function to properly retrieve emails from responses
export async function getEmailStatistics(formCode: string) {
  try {
    // Get form and responses with email data
    const form = await prisma.form.findUnique({
      where: { code: formCode },
      include: {
        responses: {
          select: {
            id: true,
            data: true,
          },
        },
      },
    })

    if (!form) {
      return {
        success: false,
        message: "Form not found",
        statistics: { totalRegistrants: 0, emailsCollected: 0 },
      }
    }

    // Count total responses
    const totalRegistrants = form.responses.length

    // Count responses with email fields
    // Look for email fields in the form data - check common field names
    const emailsCollected = form.responses.filter((response) => {
      const data = response.data as Record<string, any>
      // Check for common email field names in the response data
      return Object.entries(data).some(([key, value]) => {
        // Check if the field name contains 'email' and the value is a valid email
        const isEmailField = key.toLowerCase().includes("email")
        const isValidEmail = typeof value === "string" && value.includes("@") && value.trim().length > 0
        return isEmailField && isValidEmail
      })
    }).length

    return {
      success: true,
      statistics: {
        totalRegistrants,
        emailsCollected,
      },
    }
  } catch (error) {
    console.error("Error getting email statistics:", error)
    return {
      success: false,
      message: "Failed to get email statistics",
      statistics: { totalRegistrants: 0, emailsCollected: 0 },
    }
  }
}

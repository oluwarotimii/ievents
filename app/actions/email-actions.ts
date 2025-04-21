"use server"
import prisma from "@/lib/prisma"
import { getSession } from "@/lib/auth"

// Send a mass email to all registrants of an event
export async function sendEventMassEmail(code: string, formData: FormData) {
  try {
    // Validate the form code
    if (!/^\d{4}$/.test(code)) {
      return {
        success: false,
        message: "Invalid event code.",
      }
    }

    // Get the current user
    const session = await getSession()
    if (!session?.user) {
      return {
        success: false,
        message: "You must be logged in to send emails.",
      }
    }

    // Get the form
    const form = await prisma.form.findUnique({
      where: { code },
    })

    if (!form) {
      return {
        success: false,
        message: "Event not found.",
      }
    }

    // Check if the user owns the form
    if (form.userId !== session.user.id) {
      return {
        success: false,
        message: "You don't have permission to send emails for this event.",
      }
    }

    // Validate the email content
    const subject = formData.get("subject") as string
    const content = formData.get("content") as string

    if (!subject || !content) {
      return {
        success: false,
        message: "Subject and content are required.",
      }
    }

    // Get all responses with email addresses
    const responses = await prisma.response.findMany({
      where: {
        formId: form.id,
        data: {
          path: ["$.email"],
          not: null,
        },
      },
      select: {
        id: form.id,
        data: true,
      },
    })

    // Extract email addresses
    const emails: string[] = []
    for (const response of responses) {
      try {
        const data = response.data as Record<string, any>
        // Find the email field in the response data
        for (const key in data) {
          const value = data[key]
          if (typeof value === "string" && value.includes("@") && value.includes(".")) {
            emails.push(value)
            break
          }
        }
      } catch (error) {
        console.error("Error parsing response data:", error)
      }
    }

    if (emails.length === 0) {
      return {
        success: false,
        message: "No email addresses found for this event.",
      }
    }

    // Get the base URL for the application
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

    // Send emails in batches of 50
    const batchSize = 50
    let sent = 0

    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize)

      // Send email to each recipient individually to avoid exposing other emails
      for (const email of batch) {
        try {
          const response = await fetch(`${baseUrl}/api/email/send`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              to: email,
              subject,
              template: "custom",
              customHtml: content,
              data: {},
            }),
          })

          if (response.ok) {
            sent++
          } else {
            console.error(`Failed to send email to ${email}:`, await response.text())
          }
        } catch (error) {
          console.error(`Error sending email to ${email}:`, error)
        }
      }
    }

    // Log the email campaign
    await prisma.emailCampaign.create({
      data: {
        formId: form.id,
        subject,
        content,
        recipientCount: emails.length,
        sentCount: sent,
        userId: session.user.id,
      },
    })

    return {
      success: true,
      message: `Successfully sent ${sent} out of ${emails.length} emails.`,
      sent,
      total: emails.length,
    }
  } catch (error) {
    console.error("Error sending mass email:", error)
    return {
      success: false,
      message: "An error occurred while sending emails.",
    }
  }
}

// Get email statistics for an event
export async function getEmailStatistics(code: string) {
  try {
    // Validate the form code
    if (!/^\d{4}$/.test(code)) {
      return {
        success: false,
        message: "Invalid event code.",
      }
    }

    // Get the current user
    const session = await getSession()
    if (!session?.user) {
      return {
        success: false,
        message: "You must be logged in to view email statistics.",
      }
    }

    // Get the form
    const form = await prisma.form.findUnique({
      where: { code },
      include: {
        responses: true,
      },
    })

    if (!form) {
      return {
        success: false,
        message: "Event not found.",
      }
    }

    // Check if the user owns the form
    if (form.userId !== session.user.id) {
      return {
        success: false,
        message: "You don't have permission to view statistics for this event.",
      }
    }

    // Count total registrants
    const totalRegistrants = form.responses.length

    // Count responses with email addresses
    let emailsCollected = 0
    for (const response of form.responses) {
      try {
        const data = response.data as Record<string, any>
        // Find the email field in the response data
        for (const key in data) {
          const value = data[key]
          if (typeof value === "string" && value.includes("@") && value.includes(".")) {
            emailsCollected++
            break
          }
        }
      } catch (error) {
        console.error("Error parsing response data:", error)
      }
    }

    // Get email campaigns
    const campaigns = await prisma.emailCampaign.findMany({
      where: {
        formId: form.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return {
      success: true,
      statistics: {
        totalRegistrants,
        emailsCollected,
        campaigns: campaigns.map((campaign) => ({
          id: campaign.id,
          subject: campaign.subject,
          sentCount: campaign.sentCount,
          recipientCount: campaign.recipientCount,
          createdAt: campaign.createdAt,
        })),
      },
    }
  } catch (error) {
    console.error("Error getting email statistics:", error)
    return {
      success: false,
      message: "An error occurred while getting email statistics.",
      statistics: {
        totalRegistrants: 0,
        emailsCollected: 0,
        campaigns: [],
      },
    }
  }
}

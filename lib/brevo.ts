// Brevo API integration
// https://developers.brevo.com/reference/sendtransacemail

interface BrevoEmailContact {
  email: string
  name?: string
}

interface BrevoEmailAttachment {
  url: string
  content: string
  name: string
}

interface BrevoEmailParams {
  to: BrevoEmailContact[]
  cc?: BrevoEmailContact[]
  bcc?: BrevoEmailContact[]
  replyTo?: BrevoEmailContact
  subject: string
  htmlContent: string
  textContent?: string
  attachment?: BrevoEmailAttachment[]
  headers?: Record<string, string>
}

interface BrevoApiResponse {
  messageId?: string
  code?: string
  message?: string
}

export async function sendTransactionalEmail(params: BrevoEmailParams): Promise<{
  success: boolean
  error?: string
  data?: { messageId: string }
}> {
  try {
    const apiKey = process.env.BREVO_API_KEY

    if (!apiKey) {
      console.error("BREVO_API_KEY is not defined")
      return { success: false, error: "API key is not configured" }
    }

    // Set sender information
    const senderEmail = process.env.EMAIL_FROM || "noreply@orionis.com"
    const senderName = "Orionis Events"

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify({
        sender: {
          name: senderName,
          email: senderEmail,
        },
        to: params.to,
        cc: params.cc,
        bcc: params.bcc,
        replyTo: params.replyTo,
        subject: params.subject,
        htmlContent: params.htmlContent,
        textContent: params.textContent,
        attachment: params.attachment,
        headers: params.headers,
      }),
    })

    if (!response.ok) {
      const errorData: BrevoApiResponse = await response.json()
      console.error("Brevo API error:", errorData)
      return { success: false, error: errorData.message || `API error: ${response.status}` }
    }

    const data: BrevoApiResponse = await response.json()
    return { success: true, data: { messageId: data.messageId || "unknown" } }
  } catch (error) {
    console.error("Error sending email via Brevo:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

// Add missing functions for email campaigns
interface EmailCampaignParams {
  name: string
  subject: string
  htmlContent: string
  type: "classic" | "trigger"
  recipients: {
    listIds: number[]
  }
  sender?: {
    name: string
    email: string
  }
  scheduledAt?: string
  tags?: string[]
}

export async function createEmailCampaign(params: EmailCampaignParams): Promise<{
  success: boolean
  error?: string
  data?: any
}> {
  try {
    const apiKey = process.env.BREVO_API_KEY

    if (!apiKey) {
      console.error("BREVO_API_KEY is not defined")
      return { success: false, error: "API key is not configured" }
    }

    const response = await fetch("https://api.brevo.com/v3/emailCampaigns", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify(params),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("Brevo API error:", errorData)
      return { success: false, error: errorData.message || `API error: ${response.status}` }
    }

    const data = await response.json()
    return { success: true, data }
  } catch (error) {
    console.error("Error creating email campaign:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

export async function createList(name: string): Promise<{
  success: boolean
  error?: string
  data?: any
}> {
  try {
    const apiKey = process.env.BREVO_API_KEY

    if (!apiKey) {
      console.error("BREVO_API_KEY is not defined")
      return { success: false, error: "API key is not configured" }
    }

    const response = await fetch("https://api.brevo.com/v3/contacts/lists", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify({
        name,
        folderId: 1, // Default folder
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("Brevo API error:", errorData)
      return { success: false, error: errorData.message || `API error: ${response.status}` }
    }

    const data = await response.json()
    return { success: true, data }
  } catch (error) {
    console.error("Error creating list:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

export async function addContactsToList(
  listId: number,
  emails: string[],
): Promise<{
  success: boolean
  error?: string
  data?: any
}> {
  try {
    const apiKey = process.env.BREVO_API_KEY

    if (!apiKey) {
      console.error("BREVO_API_KEY is not defined")
      return { success: false, error: "API key is not configured" }
    }

    // Create contacts first if they don't exist
    for (const email of emails) {
      await createContact({ email })
    }

    // Add contacts to list
    const response = await fetch(`https://api.brevo.com/v3/contacts/lists/${listId}/contacts/add`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify({
        emails,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("Brevo API error:", errorData)
      return { success: false, error: errorData.message || `API error: ${response.status}` }
    }

    return { success: true }
  } catch (error) {
    console.error("Error adding contacts to list:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

export async function createContact(params: {
  email: string
  attributes?: Record<string, any>
  listIds?: number[]
  updateEnabled?: boolean
}): Promise<{
  success: boolean
  error?: string
  data?: any
}> {
  try {
    const apiKey = process.env.BREVO_API_KEY

    if (!apiKey) {
      console.error("BREVO_API_KEY is not defined")
      return { success: false, error: "API key is not configured" }
    }

    const response = await fetch("https://api.brevo.com/v3/contacts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify(params),
    })

    // If contact already exists, this is not an error
    if (response.status === 400) {
      const errorData = await response.json()
      if (errorData.code === "duplicate_parameter") {
        return { success: true }
      }
      return { success: false, error: errorData.message || `API error: ${response.status}` }
    }

    if (!response.ok) {
      const errorData = await response.json()
      console.error("Brevo API error:", errorData)
      return { success: false, error: errorData.message || `API error: ${response.status}` }
    }

    const data = await response.json()
    return { success: true, data }
  } catch (error) {
    console.error("Error creating contact:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

export async function getContact(email: string): Promise<{
  success: boolean
  error?: string
  data?: any
}> {
  try {
    const apiKey = process.env.BREVO_API_KEY

    if (!apiKey) {
      console.error("BREVO_API_KEY is not defined")
      return { success: false, error: "API key is not configured" }
    }

    const response = await fetch(`https://api.brevo.com/v3/contacts/${email}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey,
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("Brevo API error:", errorData)
      return { success: false, error: errorData.message || `API error: ${response.status}` }
    }

    const data = await response.json()
    return { success: true, data }
  } catch (error) {
    console.error("Error getting contact:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

// Function to test Brevo connection
export async function testBrevoConnection(): Promise<{
  success: boolean
  message: string
}> {
  try {
    const apiKey = process.env.BREVO_API_KEY

    if (!apiKey) {
      return { success: false, message: "BREVO_API_KEY is not defined" }
    }

    const response = await fetch("https://api.brevo.com/v3/account", {
      method: "GET",
      headers: {
        "api-key": apiKey,
        Accept: "application/json",
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      return { success: false, message: errorData.message || `API error: ${response.status}` }
    }

    return { success: true, message: "Brevo API connection successful" }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error connecting to Brevo API",
    }
  }
}

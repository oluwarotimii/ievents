/**
 * Brevo API integration for email campaigns and transactional emails
 */

const BREVO_API_KEY =
  process.env.BREVO_API_KEY ||
  "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"
const BREVO_API_URL = "https://api.brevo.com/v3"

export interface BrevoContact {
  email: string
  attributes?: Record<string, any>
  listIds?: number[]
  updateEnabled?: boolean
}

export interface BrevoTransactionalEmailParams {
  to: { email: string; name?: string }[]
  templateId?: number
  params?: Record<string, any>
  subject?: string
  htmlContent?: string
  sender?: { email: string; name?: string }
  replyTo?: { email: string; name?: string }
  headers?: Record<string, string>
  attachment?: { url: string; content: string; name: string }[]
}

export interface BrevoCampaignParams {
  name: string
  subject: string
  sender: { name: string; email: string }
  type: "classic" | "trigger"
  htmlContent: string
  recipients: { listIds?: number[]; segmentIds?: number[]; emails?: string[] }
  scheduledAt?: string
  inlineImageActivation?: boolean
  mirrorActive?: boolean
  recurring?: boolean
  footer?: string
  header?: string
  utmCampaign?: string
  params?: Record<string, any>
  tags?: string[]
}

/**
 * Create a contact in Brevo
 */
export async function createContact(contact: BrevoContact): Promise<any> {
  try {
    const response = await fetch(`${BREVO_API_URL}/contacts`, {
      method: "POST",
      headers: {
        "api-key": BREVO_API_KEY,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(contact),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("Brevo API error:", errorData)
      return { success: false, error: errorData }
    }

    return { success: true, data: await response.json() }
  } catch (error) {
    console.error("Error creating contact:", error)
    return { success: false, error: (error as Error).message }
  }
}

/**
 * Get contact details from Brevo
 */
export async function getContact(email: string): Promise<any> {
  try {
    const response = await fetch(`${BREVO_API_URL}/contacts/${encodeURIComponent(email)}`, {
      method: "GET",
      headers: {
        "api-key": BREVO_API_KEY,
        Accept: "application/json",
      },
    })

    if (response.status === 404) {
      return { success: false, error: "Contact not found" }
    }

    if (!response.ok) {
      const errorData = await response.json()
      console.error("Brevo API error:", errorData)
      return { success: false, error: errorData }
    }

    return { success: true, data: await response.json() }
  } catch (error) {
    console.error("Error retrieving contact:", error)
    return { success: false, error: (error as Error).message }
  }
}

/**
 * Create a contact list in Brevo
 */
export async function createList(name: string, folderId?: number): Promise<any> {
  try {
    const response = await fetch(`${BREVO_API_URL}/contacts/lists`, {
      method: "POST",
      headers: {
        "api-key": BREVO_API_KEY,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        name,
        folderId,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("Brevo API error:", errorData)
      return { success: false, error: errorData }
    }

    return { success: true, data: await response.json() }
  } catch (error) {
    console.error("Error creating list:", error)
    return { success: false, error: (error as Error).message }
  }
}

/**
 * Add contacts to a list in Brevo
 */
export async function addContactsToList(listId: number, emails: string[]): Promise<any> {
  try {
    const response = await fetch(`${BREVO_API_URL}/contacts/lists/${listId}/contacts/add`, {
      method: "POST",
      headers: {
        "api-key": BREVO_API_KEY,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        emails,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("Brevo API error:", errorData)
      return { success: false, error: errorData }
    }

    return { success: true, data: await response.json() }
  } catch (error) {
    console.error("Error adding contacts to list:", error)
    return { success: false, error: (error as Error).message }
  }
}

/**
 * Send a transactional email using Brevo API
 */
export async function sendTransactionalEmail(params: BrevoTransactionalEmailParams): Promise<any> {
  try {
    // Set default sender if not provided
    if (!params.sender) {
      params.sender = {
        email: process.env.EMAIL_FROM?.split("<")[1]?.replace(">", "") || "noreply@orionis.com",
        name: process.env.EMAIL_FROM?.split("<")[0]?.trim() || "Orionis",
      }
    }

    const response = await fetch(`${BREVO_API_URL}/smtp/email`, {
      method: "POST",
      headers: {
        "api-key": BREVO_API_KEY,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(params),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("Brevo API error:", errorData)
      return { success: false, error: errorData }
    }

    return { success: true, data: await response.json() }
  } catch (error) {
    console.error("Error sending transactional email:", error)
    return { success: false, error: (error as Error).message }
  }
}

/**
 * Create and send an email campaign using Brevo API
 */
export async function createEmailCampaign(params: BrevoCampaignParams): Promise<any> {
  try {
    // Set default sender if not provided
    if (!params.sender) {
      params.sender = {
        email: process.env.EMAIL_FROM?.split("<")[1]?.replace(">", "") || "noreply@orionis.com",
        name: process.env.EMAIL_FROM?.split("<")[0]?.trim() || "Orionis",
      }
    }

    const response = await fetch(`${BREVO_API_URL}/emailCampaigns`, {
      method: "POST",
      headers: {
        "api-key": BREVO_API_KEY,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(params),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("Brevo API error:", errorData)
      return { success: false, error: errorData }
    }

    return { success: true, data: await response.json() }
  } catch (error) {
    console.error("Error creating email campaign:", error)
    return { success: false, error: (error as Error).message }
  }
}

/**
 * Test Brevo API connection
 */
export async function testBrevoConnection(): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(`${BREVO_API_URL}/account`, {
      method: "GET",
      headers: {
        "api-key": BREVO_API_KEY,
        Accept: "application/json",
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      return { success: false, message: `Brevo API error: ${JSON.stringify(errorData)}` }
    }

    const data = await response.json()
    return { success: true, message: `Brevo API connected successfully. Account: ${data.email}` }
  } catch (error) {
    return { success: false, message: `Brevo API connection failed: ${(error as Error).message}` }
  }
}

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


export const createList = () => {
  // your code here
};

export const addContactsToList = () => {
  // your code here
};

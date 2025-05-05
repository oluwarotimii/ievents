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
      console.error("BREVO_API_KEY is not defined in environment variables")
      return { success: false, error: "API key is not configured" }
    }

    // Set sender information
    const senderEmail = process.env.EMAIL_FROM || "noreply@orionis.com"
    const senderName = "Orionis Events"

    console.log(`Sending email via Brevo API to: ${params.to.map((t) => t.email).join(", ")}`)
    console.log(`Subject: ${params.subject}`)

    const payload = {
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
    }

    console.log(
      "Brevo API request payload:",
      JSON.stringify({
        ...payload,
        htmlContent: "[HTML content omitted for brevity]",
      }),
    )

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify(payload),
    })

    const responseText = await response.text()
    console.log(`Brevo API response status: ${response.status}`)

    if (responseText) {
      try {
        console.log(`Brevo API response: ${responseText}`)
      } catch (e) {
        console.log("Could not log response text")
      }
    }

    if (!response.ok) {
      let errorData: BrevoApiResponse = { message: "Unknown error" }
      try {
        errorData = JSON.parse(responseText) as BrevoApiResponse
      } catch (e) {
        console.error("Failed to parse error response:", e)
      }
      console.error("Brevo API error:", errorData)
      return { success: false, error: errorData.message || `API error: ${response.status}` }
    }

    let data: BrevoApiResponse = { messageId: "unknown" }
    try {
      data = JSON.parse(responseText) as BrevoApiResponse
    } catch (e) {
      console.error("Failed to parse success response:", e)
    }

    console.log("Email sent successfully with message ID:", data.messageId)
    return { success: true, data: { messageId: data.messageId || "unknown" } }
  } catch (error) {
    console.error("Error sending email via Brevo:", error)
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
      console.error("BREVO_API_KEY is not defined")
      return { success: false, message: "BREVO_API_KEY is not defined in environment variables" }
    }

    console.log("Testing Brevo API connection...")

    const response = await fetch("https://api.brevo.com/v3/account", {
      method: "GET",
      headers: {
        "api-key": apiKey,
        Accept: "application/json",
      },
    })

    console.log(`Brevo API test response status: ${response.status}`)

    if (!response.ok) {
      const responseText = await response.text()
      console.error(`Brevo API test error response: ${responseText}`)

      let errorData
      try {
        errorData = JSON.parse(responseText)
        return { success: false, message: errorData.message || `API error: ${response.status}` }
      } catch (e) {
        return { success: false, message: `API error: ${response.status}` }
      }
    }

    console.log("Brevo API connection successful")
    return { success: true, message: "Brevo API connection successful" }
  } catch (error) {
    console.error("Error testing Brevo connection:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error connecting to Brevo API",
    }
  }
}

import crypto from "crypto"

// Get Paystack API keys from environment variables
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || ""
const PAYSTACK_PUBLIC_KEY = process.env.PAYSTACK_PUBLIC_KEY || ""

interface PaystackInitializeResponse {
  status: boolean
  message: string
  data: {
    authorization_url: string
    access_code: string
    reference: string
  }
}

interface PaystackVerifyResponse {
  status: boolean
  message: string
  data: {
    id: number
    domain: string
    status: string
    reference: string
    amount: number
    message: string | null
    gateway_response: string
    paid_at: string
    created_at: string
    channel: string
    currency: string
    customer: {
      id: number
      first_name: string | null
      last_name: string | null
      email: string
      customer_code: string
      phone: string | null
    }
  }
}

// Function to test Paystack API connection
export async function testPaystackConnection(): Promise<{ success: boolean; message: string }> {
  try {
    if (!PAYSTACK_SECRET_KEY) {
      return { success: false, message: "Paystack secret key is not configured" }
    }

    // Make a simple API call to verify the key works
    const response = await fetch("https://api.paystack.co/transaction/verify/invalid_but_just_testing_auth", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      },
    })

    // We expect a 404 error for an invalid reference, but the auth should work
    // If we get a 401/403, the API key is invalid
    if (response.status === 401 || response.status === 403) {
      return { success: false, message: "Invalid Paystack API key" }
    }

    return { success: true, message: "Paystack API connection successful" }
  } catch (error) {
    console.error("Paystack connection test error:", error)
    return { 
      success: false, 
      message: error instanceof Error ? error.message : "Failed to connect to Paystack API" 
    }
  }
}

export async function initializeTransaction(
  email: string,
  amount: number,
  reference: string,
  callbackUrl: string,
  metadata: Record<string, any> = {},
  subaccount?: string,
): Promise<PaystackInitializeResponse> {
  if (!PAYSTACK_SECRET_KEY) {
    throw new Error("Paystack secret key is not configured")
  }

  const payload: any = {
    email,
    amount: Math.round(amount * 100), // Paystack expects amount in kobo (smallest currency unit)
    reference,
    callback_url: callbackUrl,
    metadata,
    currency: "NGN", // Only supporting Naira
  }

  // If subaccount is provided, add split payment details
  if (subaccount) {
    payload.subaccount = subaccount
    // The subaccount gets the base amount, platform fee is kept by the main account
    payload.transaction_charge = 0 // No additional charge from Paystack
    payload.bearer = "account" // The main account bears the transaction fee
  }

  try {
    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`Failed to initialize transaction: ${response.statusText}. ${errorData.message || ''}`)
    }

    return response.json()
  } catch (error) {
    console.error("Paystack initialize transaction error:", error)
    throw error
  }
}

export async function verifyTransaction(reference: string): Promise<PaystackVerifyResponse> {
  if (!PAYSTACK_SECRET_KEY) {
    throw new Error("Paystack secret key is not configured")
  }

  try {
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`Failed to verify transaction: ${response.statusText}. ${errorData.message || ''}`)
    }

    return response.json()
  } catch (error) {
    console.error("Paystack verify transaction error:", error)
    throw error
  }
}

export function verifyWebhookSignature(signature: string, payload: string): boolean {
  if (!PAYSTACK_SECRET_KEY) {
    console.error("Paystack secret key is not configured")
    return false
  }

  try {
    const hash = crypto.createHmac("sha512", PAYSTACK_SECRET_KEY).update(payload).digest("hex")
    return hash === signature
  } catch (error) {
    console.error("Paystack webhook signature verification error:", error)
    return false
  }
}

export function generateTransactionReference(): string {
  return `EVT_${Date.now()}_${Math.floor(Math.random() * 1000000)}`
}

// Create a subaccount for an event organizer
export async function createSubaccount(
  businessName: string,
  settlementBank: string,
  accountNumber: string,
  description: string,
  email: string,
): Promise<any> {
  if (!PAYSTACK_SECRET_KEY) {
    throw new Error("Paystack secret key is not configured")
  }

  try {
    const response = await fetch("https://api.paystack.co/subaccount", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        business_name: businessName,
        settlement_bank: settlementBank,
        account_number: accountNumber,
        percentage_charge: 100, // 100% goes to the subaccount, platform fee is handled separately
        description,
        primary_contact_email: email,
        primary_contact_name: businessName,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`Failed to create subaccount: ${response.statusText}. ${errorData.message || ''}`)
    }

    return response.json()
  } catch (error) {
    console.error("Paystack create subaccount error:", error)
    throw error
  }
}

// List banks supported by Paystack
export async function listBanks(): Promise<any> {
  if (!PAYSTACK_SECRET_KEY) {
    throw new Error("Paystack secret key is not configured")
  }

  try {
    const response = await fetch("https://api.paystack.co/bank?country=nigeria", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`Failed to fetch banks: ${response.statusText}. ${errorData.message || ''}`)
    }

    return response.json()
  } catch (error) {
    console.error("Paystack list banks error:", error)
    throw error
  }
}

export { PAYSTACK_PUBLIC_KEY }

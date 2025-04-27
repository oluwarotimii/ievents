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
      message: error instanceof Error ? error.message : "Failed to connect to Paystack API",
    }
  }
}

// Update the Paystack class to ensure it's properly handling the callback URL

export class Paystack {
  private secretKey: string
  private baseUrl = "https://api.paystack.co"

  constructor(secretKey: string) {
    this.secretKey = secretKey
  }

  async initializeTransaction(data: {
    email: string
    amount: number
    reference: string
    callback_url: string
    metadata?: any
    subaccount?: string
    transaction_charge?: number
    bearer?: string
    plan?: string
  }) {
    try {
      console.log("Initializing Paystack transaction with data:", {
        ...data,
        amount: data.amount / 100, // Log in naira for readability
        callback_url: data.callback_url, // Log the callback URL
      })

      const response = await fetch(`${this.baseUrl}/transaction/initialize`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Paystack API error:", errorText)
        throw new Error(`Paystack API error: ${response.status} ${errorText}`)
      }

      const result = await response.json()
      console.log("Paystack initialization successful:", result)

      return result
    } catch (error) {
      console.error("Error in Paystack.initializeTransaction:", error)
      throw error
    }
  }

  async verifyTransaction(reference: string) {
    try {
      console.log(`Verifying Paystack transaction with reference: ${reference}`)

      const response = await fetch(`${this.baseUrl}/transaction/verify/${reference}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Paystack verification API error:", errorText)
        throw new Error(`Paystack API error: ${response.status} ${errorText}`)
      }

      const result = await response.json()
      console.log("Paystack verification result:", result)

      return result
    } catch (error) {
      console.error("Error in Paystack.verifyTransaction:", error)
      throw error
    }
  }

  // Create a subscription plan
  async createPlan(data: {
    name: string
    amount: number
    interval: string
    description?: string
  }) {
    try {
      console.log("Creating Paystack plan:", data)

      const response = await fetch(`${this.baseUrl}/plan`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Paystack API error:", errorText)
        throw new Error(`Paystack API error: ${response.status} ${errorText}`)
      }

      const result = await response.json()
      console.log("Paystack plan creation successful:", result)

      return result
    } catch (error) {
      console.error("Error in Paystack.createPlan:", error)
      throw error
    }
  }

  // List all plans
  async listPlans() {
    try {
      const response = await fetch(`${this.baseUrl}/plan`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Paystack API error:", errorText)
        throw new Error(`Paystack API error: ${response.status} ${errorText}`)
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error("Error in Paystack.listPlans:", error)
      throw error
    }
  }

  // Create a subscription
  async createSubscription(data: {
    customer: string
    plan: string
    authorization: string
  }) {
    try {
      console.log("Creating Paystack subscription:", data)

      const response = await fetch(`${this.baseUrl}/subscription`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Paystack API error:", errorText)
        throw new Error(`Paystack API error: ${response.status} ${errorText}`)
      }

      const result = await response.json()
      console.log("Paystack subscription creation successful:", result)

      return result
    } catch (error) {
      console.error("Error in Paystack.createSubscription:", error)
      throw error
    }
  }

  // Cancel a subscription
  async cancelSubscription(subscriptionCode: string) {
    try {
      console.log(`Canceling Paystack subscription: ${subscriptionCode}`)

      const response = await fetch(`${this.baseUrl}/subscription/disable`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: subscriptionCode,
          token: "token", // This should be the email token sent to the customer
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Paystack API error:", errorText)
        throw new Error(`Paystack API error: ${response.status} ${errorText}`)
      }

      const result = await response.json()
      console.log("Paystack subscription cancellation successful:", result)

      return result
    } catch (error) {
      console.error("Error in Paystack.cancelSubscription:", error)
      throw error
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
  plan?: string,
): Promise<PaystackInitializeResponse> {
  if (!PAYSTACK_SECRET_KEY) {
    throw new Error("Paystack secret key is not configured")
  }

  // Log the callback URL for debugging
  console.log(`Initializing transaction with callback URL: ${callbackUrl}`)

  const payload: any = {
    email,
    amount: Math.round(amount * 100), // Paystack expects amount in kobo (smallest currency unit)
    reference,
    callback_url: callbackUrl,
    metadata,
    currency: "NGN", // Only supporting Naira
  }

  // If plan is provided, add it for subscription payments
  if (plan) {
    payload.plan = plan
  }

  // If subaccount is provided, add split payment details
  if (subaccount) {
    payload.subaccount = subaccount
    // The platform fee is 2% capped at ₦200
    const platformFee = Math.min(amount * 0.02, 200) * 100 // Convert to kobo
    payload.transaction_charge = platformFee
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
      throw new Error(`Failed to initialize transaction: ${response.statusText}. ${errorData.message || ""}`)
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
      throw new Error(`Failed to verify transaction: ${response.statusText}. ${errorData.message || ""}`)
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
        percentage_charge: 98, // 98% goes to the subaccount, 2% platform fee
        description,
        primary_contact_email: email,
        primary_contact_name: businessName,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`Failed to create subaccount: ${response.statusText}. ${errorData.message || ""}`)
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
      throw new Error(`Failed to fetch banks: ${response.statusText}. ${errorData.message || ""}`)
    }

    return response.json()
  } catch (error) {
    console.error("Paystack list banks error:", error)
    throw error
  }
}

// Create a plan for subscription
export async function createPlan(
  name: string,
  amount: number,
  interval: "monthly" | "annually" | "biannually" | "weekly" | "daily",
  description?: string,
): Promise<any> {
  if (!PAYSTACK_SECRET_KEY) {
    throw new Error("Paystack secret key is not configured")
  }

  try {
    const response = await fetch("https://api.paystack.co/plan", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        amount: Math.round(amount * 100), // Convert to kobo
        interval,
        description: description || `${name} - ${interval} subscription`,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`Failed to create plan: ${response.statusText}. ${errorData.message || ""}`)
    }

    return response.json()
  } catch (error) {
    console.error("Paystack create plan error:", error)
    throw error
  }
}

// List all plans
export async function listPlans(): Promise<any> {
  if (!PAYSTACK_SECRET_KEY) {
    throw new Error("Paystack secret key is not configured")
  }

  try {
    const response = await fetch("https://api.paystack.co/plan", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`Failed to fetch plans: ${response.statusText}. ${errorData.message || ""}`)
    }

    return response.json()
  } catch (error) {
    console.error("Paystack list plans error:", error)
    throw error
  }
}

export { PAYSTACK_PUBLIC_KEY }

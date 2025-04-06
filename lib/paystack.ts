import crypto from "crypto"

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

export async function initializeTransaction(
  email: string,
  amount: number,
  reference: string,
  callbackUrl: string,
  metadata: Record<string, any> = {},
): Promise<PaystackInitializeResponse> {
  const response = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      amount: amount * 100, // Paystack expects amount in kobo (smallest currency unit)
      reference,
      callback_url: callbackUrl,
      metadata,
    }),
  })

  if (!response.ok) {
    throw new Error(`Failed to initialize transaction: ${response.statusText}`)
  }

  return response.json()
}

export async function verifyTransaction(reference: string): Promise<PaystackVerifyResponse> {
  const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to verify transaction: ${response.statusText}`)
  }

  return response.json()
}

export function verifyWebhookSignature(signature: string, payload: string): boolean {
  const hash = crypto.createHmac("sha512", PAYSTACK_SECRET_KEY).update(payload).digest("hex")
  return hash === signature
}

export function generateTransactionReference(): string {
  return `EVT_${Date.now()}_${Math.floor(Math.random() * 1000000)}`
}

export { PAYSTACK_PUBLIC_KEY }


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
  subaccount?: string,
): Promise<PaystackInitializeResponse> {
  const payload: any = {
    email,
    amount: amount * 100, // Paystack expects amount in kobo (smallest currency unit)
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

  const response = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
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

// Create a subaccount for an event organizer
export async function createSubaccount(
  businessName: string,
  settlementBank: string,
  accountNumber: string,
  description: string,
  email: string,
): Promise<any> {
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
    throw new Error(`Failed to create subaccount: ${response.statusText}`)
  }

  return response.json()
}

// List banks supported by Paystack
export async function listBanks(): Promise<any> {
  const response = await fetch("https://api.paystack.co/bank?country=nigeria", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch banks: ${response.statusText}`)
  }

  return response.json()
}

export { PAYSTACK_PUBLIC_KEY }


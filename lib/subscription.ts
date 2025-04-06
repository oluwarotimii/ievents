import prisma from "./prisma"
import type { PlanType } from "@prisma/client"

export interface PlanDetails {
  id: PlanType
  name: string
  description: string
  price: number
  currency: string
  features: string[]
  eventLimit: number | null
  responseLimit: number | null
  isRecurring: boolean
}

export const PLANS: Record<PlanType, PlanDetails> = {
  FREE: {
    id: "FREE",
    name: "Free Plan",
    description: "Perfect for small events and personal gatherings",
    price: 0,
    currency: "NGN",
    features: [
      "Up to 2 event forms",
      "Up to 20 responses per form",
      "Basic form fields",
      "CSV export",
      "Email notifications",
    ],
    eventLimit: 2,
    responseLimit: 20,
    isRecurring: false,
  },
  MONTHLY: {
    id: "MONTHLY",
    name: "Monthly Subscription",
    description: "For professionals managing multiple events",
    price: 5000,
    currency: "NGN",
    features: [
      "Unlimited event forms",
      "Unlimited responses",
      "Advanced form fields",
      "Payment processing",
      "Custom branding",
      "Analytics dashboard",
      "Priority support",
    ],
    eventLimit: null,
    responseLimit: null,
    isRecurring: true,
  },
  LIFETIME: {
    id: "LIFETIME",
    name: "Lifetime Access",
    description: "One-time payment for unlimited access",
    price: 6000,
    currency: "NGN",
    features: [
      "Unlimited event forms",
      "Unlimited responses",
      "Advanced form fields",
      "Payment processing",
      "Custom branding",
      "Analytics dashboard",
      "Priority support",
      "Lifetime updates",
    ],
    eventLimit: null,
    responseLimit: null,
    isRecurring: false,
  },
}

// Get user's current subscription
export async function getUserSubscription(userId: number) {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  })

  if (!subscription) {
    // Create a free subscription if none exists
    return createFreeSubscription(userId)
  }

  return subscription
}

// Create a free subscription for a new user
export async function createFreeSubscription(userId: number) {
  const startDate = new Date()
  // Free subscriptions don't expire
  const endDate = null

  return prisma.subscription.create({
    data: {
      userId,
      planType: "FREE",
      status: "ACTIVE",
      startDate,
      endDate,
    },
  })
}

// Check if user can create more forms
export async function canCreateForm(userId: number): Promise<boolean> {
  const subscription = await getUserSubscription(userId)
  const plan = PLANS[subscription.planType]

  // If plan has no event limit, user can create forms
  if (plan.eventLimit === null) {
    return true
  }

  // Count user's forms
  const formCount = await prisma.form.count({
    where: { userId },
  })

  return formCount < plan.eventLimit
}

// Check if a form can receive more responses
export async function canReceiveResponse(formId: number): Promise<boolean> {
  const form = await prisma.form.findUnique({
    where: { id: formId },
    include: {
      user: {
        include: {
          subscription: true,
        },
      },
    },
  })

  if (!form) {
    return false
  }

  const subscription = form.user.subscription
  if (!subscription) {
    return false
  }

  const plan = PLANS[subscription.planType]

  // If plan has no response limit, form can receive responses
  if (plan.responseLimit === null) {
    return true
  }

  // Count form's responses
  const responseCount = await prisma.response.count({
    where: { formId },
  })

  return responseCount < plan.responseLimit
}

// Upgrade user's subscription
export async function upgradeSubscription(
  userId: number,
  planType: PlanType,
  paymentDetails: {
    amount: number
    paymentMethod: string
    transactionId?: string
  },
) {
  const startDate = new Date()
  let endDate: Date | null = null

  // Set end date for monthly subscription
  if (planType === "MONTHLY") {
    endDate = new Date()
    endDate.setMonth(endDate.getMonth() + 1)
  }

  // Create or update subscription
  const subscription = await prisma.subscription.upsert({
    where: { userId },
    update: {
      planType,
      status: "ACTIVE",
      startDate,
      endDate,
      cancelAtPeriodEnd: false,
    },
    create: {
      userId,
      planType,
      status: "ACTIVE",
      startDate,
      endDate,
    },
  })

  // Record payment
  await prisma.payment.create({
    data: {
      subscriptionId: subscription.id,
      amount: paymentDetails.amount,
      currency: "NGN",
      paymentMethod: paymentDetails.paymentMethod,
      transactionId: paymentDetails.transactionId,
      status: "COMPLETED",
      paymentDate: new Date(),
    },
  })

  return subscription
}

// Cancel subscription
export async function cancelSubscription(userId: number) {
  return prisma.subscription.update({
    where: { userId },
    data: {
      cancelAtPeriodEnd: true,
    },
  })
}

// Get subscription limits for a user
export async function getSubscriptionLimits(userId: number) {
  const subscription = await getUserSubscription(userId)
  const plan = PLANS[subscription.planType]

  const formCount = await prisma.form.count({
    where: { userId },
  })

  return {
    plan: subscription.planType,
    formLimit: plan.eventLimit,
    formCount,
    responseLimit: plan.responseLimit,
    isActive: subscription.status === "ACTIVE",
  }
}


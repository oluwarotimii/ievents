"use server"

import { revalidatePath } from "next/cache"
import prisma from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { PLANS, getUserSubscription, upgradeSubscription } from "@/lib/subscription"
import { initializeTransaction, generateTransactionReference, verifyTransaction } from "@/lib/paystack"
import type { PlanType } from "@prisma/client"

// Get user's subscription details
export async function getUserSubscriptionDetails() {
  try {
    const user = await requireAuth()

    // Get user's subscription
    const subscription = await getUserSubscription(user.id)

    // Get form count
    const formCount = await prisma.form.count({
      where: { userId: user.id },
    })

    // Get subscription details
    const subscriptionDetails = {
      id: subscription.id,
      planType: subscription.planType,
      status: subscription.status,
      startDate: subscription.startDate,
      endDate: subscription.endDate,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      formCount,
      formLimit: PLANS[subscription.planType].eventLimit,
      responseLimit: PLANS[subscription.planType].responseLimit,
    }

    return {
      success: true,
      currentPlan: subscription.planType,
      subscriptionDetails,
      availablePlans: Object.values(PLANS),
    }
  } catch (error) {
    console.error("Error getting subscription details:", error)
    throw new Error("Failed to get subscription details")
  }
}

// Initiate payment for plan upgrade
export async function initiatePayment(planId: string) {
  try {
    const user = await requireAuth()
    const plan = PLANS[planId as PlanType]

    if (!plan) {
      return {
        success: false,
        message: "Invalid plan selected",
      }
    }

    // Free plan doesn't require payment
    if (plan.price === 0) {
      await upgradeSubscription(user.id, planId as PlanType, {
        amount: 0,
        paymentMethod: "free",
      })

      revalidatePath("/subscription")
      revalidatePath("/dashboard")

      return {
        success: true,
        message: "Downgraded to free plan successfully",
      }
    }

    // Generate reference for the transaction
    const reference = generateTransactionReference()

    // Store payment intent in database
    await prisma.paymentIntent.create({
      data: {
        userId: user.id,
        planType: planId as PlanType,
        amount: plan.price,
        currency: plan.currency,
        reference,
        status: "PENDING",
      },
    })

    // Initialize transaction with Paystack
    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/subscription/callback`
    const metadata = {
      userId: user.id,
      planId,
      isRecurring: plan.isRecurring,
    }

    const transaction = await initializeTransaction(user.email, plan.price, reference, callbackUrl, metadata)

    return {
      success: true,
      paymentUrl: transaction.data.authorization_url,
      reference,
    }
  } catch (error) {
    console.error("Error initiating payment:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to initiate payment",
    }
  }
}

// Cancel subscription
export async function cancelSubscription() {
  try {
    const user = await requireAuth()

    // Get user's subscription
    const subscription = await getUserSubscription(user.id)

    // Only monthly subscriptions can be canceled
    if (subscription.planType !== "MONTHLY") {
      return {
        success: false,
        message: "Only monthly subscriptions can be canceled",
      }
    }

    // Update subscription to cancel at period end
    await prisma.subscription.update({
      where: { userId: user.id },
      data: {
        cancelAtPeriodEnd: true,
      },
    })

    revalidatePath("/subscription")

    return {
      success: true,
      message: "Subscription will be canceled at the end of the current billing period",
    }
  } catch (error) {
    console.error("Error canceling subscription:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to cancel subscription",
    }
  }
}

// Verify payment callback
export async function verifyPayment(reference: string) {
  try {
    const paymentIntent = await prisma.paymentIntent.findUnique({
      where: { reference },
    })

    if (!paymentIntent) {
      return {
        success: false,
        message: "Invalid payment reference",
      }
    }

    // If payment is already processed, return the status
    if (paymentIntent.status !== "PENDING") {
      return {
        success: paymentIntent.status === "COMPLETED",
        message: paymentIntent.status === "COMPLETED" ? "Payment was successful" : "Payment failed or was canceled",
      }
    }

    // Verify transaction with Paystack
    const transaction = await verifyTransaction(reference)

    if (!transaction.status || transaction.data.status !== "success") {
      // Update payment intent status
      await prisma.paymentIntent.update({
        where: { id: paymentIntent.id },
        data: {
          status: "FAILED",
        },
      })

      return {
        success: false,
        message: "Payment was not successful",
      }
    }

    // Payment was successful, update subscription
    await upgradeSubscription(paymentIntent.userId, paymentIntent.planType, {
      amount: paymentIntent.amount,
      paymentMethod: "paystack",
      transactionId: reference,
    })

    // Update payment intent status
    await prisma.paymentIntent.update({
      where: { id: paymentIntent.id },
      data: {
        status: "COMPLETED",
      },
    })

    revalidatePath("/subscription")
    revalidatePath("/dashboard")

    return {
      success: true,
      message: "Payment successful! Your subscription has been updated.",
    }
  } catch (error) {
    console.error("Error verifying payment:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to verify payment",
    }
  }
}


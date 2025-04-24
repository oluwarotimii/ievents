"use server"

import { revalidatePath } from "next/cache"
import prisma from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import {
  createSubaccount,
  listBanks,
  initializeTransaction,
  verifyTransaction,
  generateTransactionReference,
  testPaystackConnection,
} from "@/lib/paystack"

// Save payment settings
export async function savePaymentSettings(formData: FormData) {
  try {
    const user = await requireAuth()

    const businessName = formData.get("businessName") as string
    const bankCode = formData.get("bankCode") as string
    const bankName = formData.get("bankName") as string
    const accountNumber = formData.get("accountNumber") as string
    const accountName = formData.get("accountName") as string

    // Validate inputs
    if (!businessName || !bankCode || !bankName || !accountNumber || !accountName) {
      return {
        success: false,
        message: "All fields are required",
      }
    }

    // Test Paystack connection
    const connectionTest = await testPaystackConnection()
    if (!connectionTest.success) {
      return {
        success: false,
        message: `Paystack connection failed: ${connectionTest.message}`,
      }
    }

    // Check if user already has payment settings
    const existingSettings = await prisma.paymentSettings.findUnique({
      where: { userId: user.id },
    })

    let paystackSubaccountId = existingSettings?.paystackSubaccountId
    let paystackSubaccountCode = existingSettings?.paystackSubaccountCode

    // If no existing subaccount, create one with Paystack
    if (!existingSettings?.paystackSubaccountId) {
      try {
        const subaccountResponse = await createSubaccount(
          businessName,
          bankCode,
          accountNumber,
          `Subaccount for ${user.email}`,
          user.email,
        )

        if (subaccountResponse.status) {
          paystackSubaccountId = subaccountResponse.data.id.toString()
          paystackSubaccountCode = subaccountResponse.data.subaccount_code
        } else {
          return {
            success: false,
            message: "Failed to create Paystack subaccount: " + subaccountResponse.message,
          }
        }
      } catch (error) {
        console.error("Error creating Paystack subaccount:", error)
        return {
          success: false,
          message:
            error instanceof Error
              ? `Failed to create Paystack subaccount: ${error.message}`
              : "Failed to create Paystack subaccount. Please try again.",
        }
      }
    }

    // Create or update payment settings
    await prisma.paymentSettings.upsert({
      where: { userId: user.id },
      update: {
        businessName,
        bankName,
        bankCode,
        accountNumber,
        accountName,
        paystackSubaccountId,
        paystackSubaccountCode,
        updatedAt: new Date(),
      },
      create: {
        userId: user.id,
        businessName,
        bankName,
        bankCode,
        accountNumber,
        accountName,
        paystackSubaccountId,
        paystackSubaccountCode,
      },
    })

    revalidatePath("/payment-settings")

    return {
      success: true,
      message: "Payment settings saved successfully",
    }
  } catch (error) {
    console.error("Error saving payment settings:", error)
    return {
      success: false,
      message:
        error instanceof Error
          ? `An error occurred: ${error.message}`
          : "An error occurred while saving payment settings",
    }
  }
}

// Get user's payment settings
export async function getPaymentSettings() {
  try {
    const user = await requireAuth()

    const settings = await prisma.paymentSettings.findUnique({
      where: { userId: user.id },
    })

    return {
      success: true,
      settings,
    }
  } catch (error) {
    console.error("Error getting payment settings:", error)
    return {
      success: false,
      message:
        error instanceof Error ? `Failed to get payment settings: ${error.message}` : "Failed to get payment settings",
    }
  }
}

// Get list of banks from Paystack
export async function getBanks() {
  try {
    const banksResponse = await listBanks()

    if (!banksResponse.status) {
      return {
        success: false,
        message: `Failed to fetch banks: ${banksResponse.message || "Unknown error"}`,
      }
    }

    return {
      success: true,
      banks: banksResponse.data,
    }
  } catch (error) {
    console.error("Error fetching banks:", error)
    return {
      success: false,
      message: error instanceof Error ? `Failed to fetch banks: ${error.message}` : "Failed to fetch banks",
    }
  }
}

// Enable payments for a form
export async function enableFormPayments(
  formCode: string,
  paymentAmount: number,
  paymentTitle: string,
  paymentDescription: string,
) {
  try {
    const user = await requireAuth()

    // Check if user has payment settings
    const paymentSettings = await prisma.paymentSettings.findUnique({
      where: { userId: user.id },
    })

    if (!paymentSettings) {
      return {
        success: false,
        message: "Please set up your payment settings first",
      }
    }

    // Find the form
    const form = await prisma.form.findFirst({
      where: {
        code: formCode,
        userId: user.id,
      },
    })

    if (!form) {
      return {
        success: false,
        message: "Form not found",
      }
    }

    // Update form with payment details
    await prisma.form.update({
      where: { id: form.id },
      data: {
        collectsPayments: true,
        paymentAmount,
        paymentCurrency: "NGN", // Only supporting Naira
        paymentTitle,
        paymentDescription,
      },
    })

    revalidatePath(`/create/${formCode}`)

    return {
      success: true,
      message: "Payment collection enabled for this form",
    }
  } catch (error) {
    console.error("Error enabling form payments:", error)
    return {
      success: false,
      message:
        error instanceof Error
          ? `Failed to enable payments: ${error.message}`
          : "Failed to enable payments for this form",
    }
  }
}

// Disable payments for a form
export async function disableFormPayments(formCode: string) {
  try {
    const user = await requireAuth()

    // Find the form
    const form = await prisma.form.findFirst({
      where: {
        code: formCode,
        userId: user.id,
      },
    })

    if (!form) {
      return {
        success: false,
        message: "Form not found",
      }
    }

    // Update form to disable payments
    await prisma.form.update({
      where: { id: form.id },
      data: {
        collectsPayments: false,
      },
    })

    revalidatePath(`/create/${formCode}`)

    return {
      success: true,
      message: "Payment collection disabled for this form",
    }
  } catch (error) {
    console.error("Error disabling form payments:", error)
    return {
      success: false,
      message:
        error instanceof Error
          ? `Failed to disable payments: ${error.message}`
          : "Failed to disable payments for this form",
    }
  }
}

// Calculate platform fee (2% capped at ₦200)
function calculatePlatformFee(amount: number): number {
  const fee = amount * 0.02
  return Math.min(fee, 200) // Cap at ₦200
}

// Initialize payment for form submission
export async function initializeFormPayment(formCode: string, email: string, name: string, responseId: number) {
  try {
    // Find the form
    const form = await prisma.form.findUnique({
      where: { code: formCode },
      include: {
        user: {
          include: {
            paymentSettings: true,
          },
        },
      },
    })

    if (!form) {
      return {
        success: false,
        message: "Form not found",
      }
    }

    // Find the response to get payment fields
    const response = await prisma.response.findUnique({
      where: { id: responseId },
      include: {
        data: true,
      },
    })

    if (!response) {
      return {
        success: false,
        message: "Response not found",
      }
    }

    // Calculate total from payment fields
    let paymentFieldsTotal = 0
    response.data.forEach((data) => {
      try {
        // Check if this is a payment field data
        if (data.value && data.value.startsWith("{") && data.value.includes("amount")) {
          const paymentData = JSON.parse(data.value)
          if (paymentData.amount) {
            paymentFieldsTotal += Number.parseFloat(paymentData.amount)
          }
        }
      } catch (e) {
        // Skip if not valid JSON
      }
    })

    // Add form-level payment amount if enabled
    const formPaymentAmount = form.collectsPayments && form.paymentAmount ? form.paymentAmount : 0

    // Total base amount is sum of both payment types
    const baseAmount = formPaymentAmount + paymentFieldsTotal

    // If no payment is required, return error
    if (baseAmount <= 0) {
      return {
        success: false,
        message: "No payment amount specified",
      }
    }

    // Check if user has payment settings
    if (!form.user.paymentSettings?.paystackSubaccountCode) {
      return {
        success: false,
        message: "The form owner has not set up payment collection properly",
      }
    }

    // Generate reference
    const reference = generateTransactionReference()

    // Calculate platform fee (2% capped at ₦200)
    const platformFee = calculatePlatformFee(baseAmount)
    const totalAmount = baseAmount + platformFee

    // Create transaction record
    const transaction = await prisma.transaction.create({
      data: {
        responseId,
        userId: form.userId,
        amount: totalAmount,
        fee: platformFee,
        netAmount: baseAmount,
        currency: form.paymentCurrency || "NGN",
        reference,
        status: "PENDING",
        paymentMethod: "card",
        customerEmail: email,
        customerName: name,
        formCode: form.code,
        formName: form.name,
      },
    })

    // Initialize transaction with Paystack
    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/payment/callback/${formCode}`
    const metadata = {
      formCode: form.code,
      responseId,
      transactionId: transaction.id,
      baseAmount,
      platformFee,
      formName: form.name,
      customerName: name,
      customerEmail: email,
    }

    try {
      const paystackResponse = await initializeTransaction(
        email,
        totalAmount,
        reference,
        callbackUrl,
        metadata,
        form.user.paymentSettings.paystackSubaccountCode,
      )

      if (!paystackResponse.status) {
        // Update transaction status to failed
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: {
            status: "FAILED",
          },
        })

        return {
          success: false,
          message: `Failed to initialize payment: ${paystackResponse.message || "Unknown error"}`,
        }
      }

      // Log successful payment initialization
      console.log(`Payment initialized: ${reference} for form ${formCode}, amount: ${totalAmount}`)

      return {
        success: true,
        paymentUrl: paystackResponse.data.authorization_url,
        reference,
      }
    } catch (error) {
      // Update transaction status to failed
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: "FAILED",
        },
      })

      throw error
    }
  } catch (error) {
    console.error("Error initializing form payment:", error)
    return {
      success: false,
      message:
        error instanceof Error ? `Failed to initialize payment: ${error.message}` : "Failed to initialize payment",
    }
  }
}

// Verify form payment
export async function verifyFormPayment(reference: string) {
  try {
    // Find the transaction
    const transaction = await prisma.transaction.findUnique({
      where: { reference },
      include: {
        response: {
          include: {
            form: true,
          },
        },
      },
    })

    if (!transaction) {
      return {
        success: false,
        message: "Transaction not found",
      }
    }

    // If transaction is already verified
    if (transaction.status !== "PENDING") {
      return {
        success: transaction.status === "COMPLETED",
        message: transaction.status === "COMPLETED" ? "Payment was successful" : "Payment failed or was canceled",
        transaction: transaction.status === "COMPLETED" ? transaction : null,
      }
    }

    try {
      // Verify with Paystack
      const paystackResponse = await verifyTransaction(reference)

      if (!paystackResponse.status || paystackResponse.data.status !== "success") {
        // Update transaction status to failed
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: {
            status: "FAILED",
          },
        })

        return {
          success: false,
          message: `Payment verification failed: ${paystackResponse.message || "Transaction was not successful"}`,
        }
      }

      // Update transaction status to completed
      const updatedTransaction = await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: "COMPLETED",
          paymentDate: new Date(),
        },
        include: {
          response: {
            include: {
              form: true,
            },
          },
        },
      })

      // Update response payment status
      await prisma.response.update({
        where: { id: transaction.responseId },
        data: {
          paymentStatus: "PAID",
          paymentReference: reference,
        },
      })

      revalidatePath(`/transactions`)
      revalidatePath(`/responses/${transaction.formCode}`)

      return {
        success: true,
        message: "Payment verified successfully",
        transaction: updatedTransaction,
      }
    } catch (error) {
      // Update transaction status to failed on verification error
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: "FAILED",
        },
      })

      throw error
    }
  } catch (error) {
    console.error("Error verifying form payment:", error)
    return {
      success: false,
      message: error instanceof Error ? `Failed to verify payment: ${error.message}` : "Failed to verify payment",
    }
  }
}

// Get user's transactions
export async function getUserTransactions() {
  try {
    const user = await requireAuth()

    const transactions = await prisma.transaction.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    // Calculate totals
    const totalAmount = transactions.reduce((sum, transaction) => {
      if (transaction.status === "COMPLETED") {
        return sum + transaction.amount
      }
      return sum
    }, 0)

    const totalFees = transactions.reduce((sum, transaction) => {
      if (transaction.status === "COMPLETED") {
        return sum + transaction.fee
      }
      return sum
    }, 0)

    const totalNetAmount = transactions.reduce((sum, transaction) => {
      if (transaction.status === "COMPLETED") {
        return sum + transaction.netAmount
      }
      return sum
    }, 0)

    return {
      success: true,
      transactions,
      summary: {
        totalAmount,
        totalFees,
        totalNetAmount,
        totalTransactions: transactions.filter((t) => t.status === "COMPLETED").length,
      },
    }
  } catch (error) {
    console.error("Error getting user transactions:", error)
    return {
      success: false,
      message: error instanceof Error ? `Failed to get transactions: ${error.message}` : "Failed to get transactions",
    }
  }
}

// Get transaction by reference
export async function getTransactionByReference(reference: string) {
  try {
    const transaction = await prisma.transaction.findUnique({
      where: { reference },
      include: {
        response: {
          include: {
            form: true,
          },
        },
      },
    })

    if (!transaction) {
      return {
        success: false,
        message: "Transaction not found",
      }
    }

    return {
      success: true,
      transaction,
    }
  } catch (error) {
    console.error("Error getting transaction:", error)
    return {
      success: false,
      message: error instanceof Error ? `Failed to get transaction: ${error.message}` : "Failed to get transaction",
    }
  }
}

// Test Paystack connection
export async function testPaystackIntegration() {
  try {
    const result = await testPaystackConnection()
    return result
  } catch (error) {
    console.error("Error testing Paystack integration:", error)
    return {
      success: false,
      message:
        error instanceof Error
          ? `Failed to test Paystack integration: ${error.message}`
          : "Failed to test Paystack integration",
    }
  }
}

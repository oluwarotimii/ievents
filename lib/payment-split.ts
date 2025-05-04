import prisma from "./prisma"
import { initializePaystack } from "./paystack"

// Platform fee percentage (e.g., 5% of the transaction amount)
const PLATFORM_FEE_PERCENTAGE = 5

// Calculate split amounts for a transaction
export async function calculateSplitAmounts(amount: number, userId: number) {
  // Get user's payment settings
  const paymentSettings = await prisma.paymentSettings.findUnique({
    where: { userId },
  })

  // Calculate platform fee
  const platformFeeAmount = (amount * PLATFORM_FEE_PERCENTAGE) / 100

  // Calculate organizer amount (total minus platform fee)
  const organizerAmount = amount - platformFeeAmount

  return {
    total: amount,
    platformFee: platformFeeAmount,
    organizerAmount,
    hasSubaccount: !!paymentSettings?.paystackSubaccountCode,
    subaccountCode: paymentSettings?.paystackSubaccountCode || null,
  }
}

// Create a Paystack subaccount for an organizer
export async function createPaystackSubaccount(userId: number) {
  try {
    const paystack = initializePaystack()

    // Get user's payment settings
    const paymentSettings = await prisma.paymentSettings.findUnique({
      where: { userId },
      include: { user: true },
    })

    if (!paymentSettings) {
      throw new Error("Payment settings not found")
    }

    // Check if subaccount already exists
    if (paymentSettings.paystackSubaccountCode) {
      return {
        success: true,
        subaccountCode: paymentSettings.paystackSubaccountCode,
        message: "Subaccount already exists",
      }
    }

    // Create subaccount in Paystack
    const response = await paystack.subaccounts.create({
      business_name: paymentSettings.businessName,
      settlement_bank: paymentSettings.bankCode,
      account_number: paymentSettings.accountNumber,
      percentage_charge: PLATFORM_FEE_PERCENTAGE,
      description: `Subaccount for ${paymentSettings.businessName}`,
      primary_contact_email: paymentSettings.user.email,
    })

    if (!response || !response.data) {
      throw new Error("Failed to create Paystack subaccount")
    }

    // Update payment settings with subaccount details
    await prisma.paymentSettings.update({
      where: { userId },
      data: {
        paystackSubaccountId: response.data.id.toString(),
        paystackSubaccountCode: response.data.subaccount_code,
      },
    })

    return {
      success: true,
      subaccountCode: response.data.subaccount_code,
      message: "Subaccount created successfully",
    }
  } catch (error) {
    console.error("Error creating Paystack subaccount:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to create subaccount",
    }
  }
}

// Update a Paystack subaccount for an organizer
export async function updatePaystackSubaccount(userId: number) {
  try {
    const paystack = initializePaystack()

    // Get user's payment settings
    const paymentSettings = await prisma.paymentSettings.findUnique({
      where: { userId },
    })

    if (!paymentSettings || !paymentSettings.paystackSubaccountCode) {
      throw new Error("Subaccount not found")
    }

    // Update subaccount in Paystack
    const response = await paystack.subaccounts.update(paymentSettings.paystackSubaccountCode, {
      business_name: paymentSettings.businessName,
      settlement_bank: paymentSettings.bankCode,
      account_number: paymentSettings.accountNumber,
      percentage_charge: PLATFORM_FEE_PERCENTAGE,
    })

    if (!response || !response.data) {
      throw new Error("Failed to update Paystack subaccount")
    }

    return {
      success: true,
      message: "Subaccount updated successfully",
    }
  } catch (error) {
    console.error("Error updating Paystack subaccount:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to update subaccount",
    }
  }
}

// Get transaction split details
export async function getTransactionSplitDetails(transactionId: number) {
  try {
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
    })

    if (!transaction) {
      throw new Error("Transaction not found")
    }

    return {
      success: true,
      total: transaction.amount,
      fee: transaction.fee,
      netAmount: transaction.netAmount,
      currency: transaction.currency,
    }
  } catch (error) {
    console.error("Error getting transaction split details:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to get transaction details",
    }
  }
}

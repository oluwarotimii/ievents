import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { verifyTransaction } from "@/lib/paystack"

// Update the verifyFormPayment function to send payment receipt email

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
        message: "Payment verification failed",
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

    // Send payment receipt email (commented out)
    // await sendPaymentReceiptEmail(transaction.id)

    revalidatePath(`/transactions`)
    revalidatePath(`/responses/${transaction.formCode}`)

    return {
      success: true,
      message: "Payment verified successfully",
      transaction: updatedTransaction,
    }
  } catch (error) {
    console.error("Error verifying form payment:", error)
    return {
      success: false,
      message: "Failed to verify payment",
    }
  }
}


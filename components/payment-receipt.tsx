"use client"

import { useState, useRef } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { Download, Share2, Check } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { QRCodeSVG } from "qrcode.react" // Fixed import
import html2canvas from "html2canvas"

interface PaymentReceiptProps {
  transaction: {
    id: number
    reference: string
    amount: number
    fee: number
    netAmount: number
    currency: string
    status: string
    customerName: string | null
    customerEmail: string
    formName: string
    paymentDate: string | null
    createdAt: string
  }
}

export default function PaymentReceipt({ transaction }: PaymentReceiptProps) {
  const [downloading, setDownloading] = useState(false)
  const receiptRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  const handleDownload = async () => {
    if (!receiptRef.current) return

    setDownloading(true)
    try {
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
      })

      const image = canvas.toDataURL("image/png")
      const link = document.createElement("a")
      link.href = image
      link.download = `receipt-${transaction.reference}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "Receipt Downloaded",
        description: "Your receipt has been downloaded successfully",
      })
    } catch (error) {
      console.error("Error downloading receipt:", error)
      toast({
        title: "Download Failed",
        description: "Failed to download receipt. Please try again.",
        variant: "destructive",
      })
    } finally {
      setDownloading(false)
    }
  }

  const handleShare = async () => {
    if (!receiptRef.current) return

    try {
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
      })

      const image = canvas.toDataURL("image/png")

      if (navigator.share) {
        const blob = await (await fetch(image)).blob()
        const file = new File([blob], `receipt-${transaction.reference}.png`, { type: "image/png" })

        await navigator.share({
          title: "Payment Receipt",
          text: `Receipt for ${transaction.formName}`,
          files: [file],
        })
      } else {
        toast({
          title: "Sharing Not Supported",
          description: "Your browser doesn't support sharing. Please download the receipt instead.",
        })
      }
    } catch (error) {
      console.error("Error sharing receipt:", error)
      toast({
        title: "Share Failed",
        description: "Failed to share receipt. Please try downloading instead.",
        variant: "destructive",
      })
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A"
    return format(new Date(dateString), "MMMM d, yyyy h:mm a")
  }

  return (
    <div className="max-w-md mx-auto w-full">
      <Card className="border-2 border-green-100 shadow-lg" ref={receiptRef}>
        <CardHeader className="bg-green-50 border-b border-green-100">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-xl text-green-800">Payment Receipt</CardTitle>
              <p className="text-sm text-green-700 mt-1">Thank you for your payment</p>
            </div>
            <div className="bg-white p-2 rounded-full border border-green-200">
              <Check className="h-6 w-6 text-green-500" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="flex justify-between">
            <div className="text-center mx-auto">
              <QRCodeSVG value={`${transaction.reference}`} size={120} />
              <p className="text-xs mt-1 font-mono break-all">{transaction.reference}</p>
            </div>
          </div>

          <div className="border-t border-dashed border-gray-200 pt-4 mt-4">
            <h3 className="text-lg font-semibold text-center mb-4">{transaction.formName}</h3>

            <div className="space-y-2">
              <div className="flex flex-wrap justify-between">
                <span className="text-sm text-gray-600">Paid By:</span>
                <span className="font-medium text-right">{transaction.customerName || transaction.customerEmail}</span>
              </div>

              <div className="flex flex-wrap justify-between">
                <span className="text-sm text-gray-600">Date:</span>
                <span className="text-right">{formatDate(transaction.paymentDate || transaction.createdAt)}</span>
              </div>

              <div className="flex flex-wrap justify-between">
                <span className="text-sm text-gray-600">Status:</span>
                <span className="text-green-600 font-medium">Paid</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Base Amount:</span>
              <span>₦{transaction.netAmount.toLocaleString()}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600">Platform Fee (2%):</span>
              <span>₦{transaction.fee.toLocaleString()}</span>
            </div>

            <div className="flex justify-between text-lg font-bold border-t border-gray-300 pt-2 mt-2">
              <span>Total:</span>
              <span>₦{transaction.amount.toLocaleString()}</span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-gray-50 border-t flex flex-wrap justify-between text-xs text-gray-500 py-3">
          <p>Receipt ID: {transaction.id}</p>
          <p>Secured by Paystack</p>
        </CardFooter>
      </Card>

      <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4 mt-4">
        <Button variant="outline" onClick={handleDownload} disabled={downloading} className="w-full sm:w-auto">
          <Download className="h-4 w-4 mr-2" />
          {downloading ? "Downloading..." : "Download Receipt"}
        </Button>
        <Button variant="outline" onClick={handleShare} className="w-full sm:w-auto">
          <Share2 className="h-4 w-4 mr-2" />
          Share
        </Button>
      </div>
    </div>
  )
}

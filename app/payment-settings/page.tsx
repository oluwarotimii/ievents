"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Loader2, AlertTriangle } from "lucide-react"
import { savePaymentSettings, getPaymentSettings, getBanks } from "../actions/payment-actions"

interface Bank {
  id: number
  name: string
  code: string
}

export default function PaymentSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [verifyingAccount, setVerifyingAccount] = useState(false)
  const [banks, setBanks] = useState<Bank[]>([])
  const [selectedBank, setSelectedBank] = useState<string>("")
  const [accountNumber, setAccountNumber] = useState<string>("")
  const [accountName, setAccountName] = useState<string>("")
  const [businessName, setBusinessName] = useState<string>("")
  const [hasExistingSettings, setHasExistingSettings] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // Load banks
      const banksResponse = await getBanks()
      if (banksResponse.success) {
        setBanks(banksResponse.banks)
      } else {
        toast({
          title: "Error",
          description: banksResponse.message || "Failed to load banks",
          variant: "destructive",
        })
      }

      // Load existing settings
      const settingsResponse = await getPaymentSettings()
      if (settingsResponse.success && settingsResponse.settings) {
        const settings = settingsResponse.settings
        setBusinessName(settings.businessName)
        setSelectedBank(settings.bankCode)
        setAccountNumber(settings.accountNumber)
        setAccountName(settings.accountName)
        setHasExistingSettings(true)
      }
    } catch (error) {
      console.error("Error loading data:", error)
      toast({
        title: "Error",
        description: "Failed to load payment settings",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyAccount = async () => {
    if (!selectedBank || !accountNumber) {
      toast({
        title: "Missing Information",
        description: "Please select a bank and enter an account number",
        variant: "destructive",
      })
      return
    }

    setVerifyingAccount(true)

    try {
      // In a real implementation, you would call Paystack's API to verify the account
      // For now, we'll simulate a successful verification
      setTimeout(() => {
        setAccountName("John Doe") // This would come from the API response
        toast({
          title: "Account Verified",
          description: "Account details verified successfully",
        })
        setVerifyingAccount(false)
      }, 1500)
    } catch (error) {
      console.error("Error verifying account:", error)
      toast({
        title: "Verification Failed",
        description: "Could not verify account details. Please check and try again.",
        variant: "destructive",
      })
      setVerifyingAccount(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const formData = new FormData()
      formData.append("businessName", businessName)
      formData.append("bankCode", selectedBank)
      formData.append("bankName", banks.find((bank) => bank.code === selectedBank)?.name || "")
      formData.append("accountNumber", accountNumber)
      formData.append("accountName", accountName)

      const result = await savePaymentSettings(formData)

      if (result.success) {
        toast({
          title: "Settings Saved",
          description: "Your payment settings have been saved successfully",
        })
        router.push("/dashboard")
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to save payment settings",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error saving payment settings:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="container flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin mb-4" />
        <p>Loading payment settings...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Payment Settings</CardTitle>
              <CardDescription>
                Set up your payment details to receive payments from event registrations
              </CardDescription>
            </div>
            <Button variant="outline" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="businessName">Business Name</Label>
              <Input
                id="businessName"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Enter your business name"
                required
              />
              <p className="text-sm text-muted-foreground">This name will appear on your customers' bank statements</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bank">Bank</Label>
              <Select value={selectedBank} onValueChange={setSelectedBank} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select your bank" />
                </SelectTrigger>
                <SelectContent>
                  {banks.map((bank) => (
                    <SelectItem key={bank.code} value={bank.code}>
                      {bank.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="accountNumber">Account Number</Label>
              <div className="flex space-x-2">
                <Input
                  id="accountNumber"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="Enter your account number"
                  required
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleVerifyAccount}
                  disabled={verifyingAccount || !selectedBank || !accountNumber}
                >
                  {verifyingAccount ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Verify"
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="accountName">Account Name</Label>
              <Input
                id="accountName"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="Account name will appear after verification"
                readOnly
                required
              />
            </div>

            {hasExistingSettings && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-md flex items-start">
                <AlertTriangle className="h-5 w-5 text-amber-500 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-amber-800">
                    Changing your payment settings will create a new subaccount. Any pending payments will still be
                    processed using your previous account details.
                  </p>
                </div>
              </div>
            )}
          </form>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" asChild>
            <Link href="/dashboard">Cancel</Link>
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || !accountName}>
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Payment Settings"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}


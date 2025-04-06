"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Loader2, RefreshCw, CheckCircle, XCircle, Clock } from "lucide-react"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { getUserTransactions } from "../actions/payment-actions"

interface Transaction {
  id: number
  amount: number
  fee: number
  netAmount: number
  currency: string
  reference: string
  status: string
  customerName: string | null
  customerEmail: string
  formCode: string
  formName: string
  paymentDate: string | null
  createdAt: string
}

interface TransactionSummary {
  totalAmount: number
  totalFees: number
  totalNetAmount: number
  totalTransactions: number
}

export default function TransactionsPage() {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [summary, setSummary] = useState<TransactionSummary>({
    totalAmount: 0,
    totalFees: 0,
    totalNetAmount: 0,
    totalTransactions: 0,
  })
  const [searchTerm, setSearchTerm] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    loadTransactions()
  }, [])

  const loadTransactions = async () => {
    setRefreshing(true)
    try {
      const result = await getUserTransactions()
      if (result.success) {
        setTransactions(result.transactions)
        setSummary(result.summary)
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to load transactions",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error loading transactions:", error)
      toast({
        title: "Error",
        description: "Failed to load transactions",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return (
          <Badge variant="success" className="flex items-center">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        )
      case "PENDING":
        return (
          <Badge variant="outline" className="flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        )
      case "FAILED":
        return (
          <Badge variant="destructive" className="flex items-center">
            <XCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        )
      default:
        return <Badge>{status}</Badge>
    }
  }

  const filteredTransactions = transactions.filter((transaction) => {
    if (!searchTerm) return true

    const searchLower = searchTerm.toLowerCase()
    return (
      transaction.reference.toLowerCase().includes(searchLower) ||
      transaction.formName.toLowerCase().includes(searchLower) ||
      transaction.customerEmail.toLowerCase().includes(searchLower) ||
      (transaction.customerName && transaction.customerName.toLowerCase().includes(searchLower))
    )
  })

  if (loading) {
    return (
      <div className="container flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin mb-4" />
        <p>Loading transactions...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>View all payments received from your event registrations</CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={loadTransactions} disabled={refreshing} title="Refresh transactions">
                <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              </Button>
              <Button variant="outline" asChild>
                <Link href="/dashboard">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{summary.totalTransactions}</div>
                <p className="text-sm text-muted-foreground">Total Transactions</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">₦{summary.totalAmount.toLocaleString()}</div>
                <p className="text-sm text-muted-foreground">Total Amount</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">₦{summary.totalFees.toLocaleString()}</div>
                <p className="text-sm text-muted-foreground">Platform Fees (2%)</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">₦{summary.totalNetAmount.toLocaleString()}</div>
                <p className="text-sm text-muted-foreground">Net Amount</p>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-between items-center mb-4">
            <Input
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">You haven't received any payments yet.</p>
              <Button asChild className="mt-4">
                <Link href="/payment-settings">Set Up Payment Settings</Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reference</TableHead>
                    <TableHead>Form</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Fee (2%)</TableHead>
                    <TableHead>Net Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-mono text-xs">{transaction.reference}</TableCell>
                      <TableCell>
                        <Link href={`/responses/${transaction.formCode}`} className="hover:underline">
                          {transaction.formName}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div>{transaction.customerName || "Unknown"}</div>
                          <div className="text-xs text-muted-foreground">{transaction.customerEmail}</div>
                        </div>
                      </TableCell>
                      <TableCell>₦{transaction.amount.toLocaleString()}</TableCell>
                      <TableCell>₦{transaction.fee.toLocaleString()}</TableCell>
                      <TableCell>₦{transaction.netAmount.toLocaleString()}</TableCell>
                      <TableCell>
                        {transaction.paymentDate
                          ? format(new Date(transaction.paymentDate), "MMM d, yyyy h:mm a")
                          : format(new Date(transaction.createdAt), "MMM d, yyyy h:mm a")}
                      </TableCell>
                      <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}


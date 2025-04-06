"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Search, CheckCircle2, Loader2 } from "lucide-react"

interface QuickCheckInCardProps {
  eventCode: string
  onCheckIn: (attendeeId: string) => void
}

export default function QuickCheckInCard({ eventCode, onCheckIn }: QuickCheckInCardProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [checkingIn, setCheckingIn] = useState<string | null>(null)
  const { toast } = useToast()

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setSearchResults([])
      return
    }

    setIsSearching(true)

    try {
      // Call API to search for attendees
      const response = await fetch(`/api/forms/${eventCode}/search?q=${encodeURIComponent(searchTerm)}`)

      if (!response.ok) {
        throw new Error("Failed to search attendees")
      }

      const data = await response.json()
      setSearchResults(data.results || [])

      if (data.results.length === 0) {
        toast({
          title: "No matches found",
          description: "Try a different search term or check the spelling.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error searching attendees:", error)
      toast({
        title: "Search Failed",
        description: "Failed to search for attendees. Please try again.",
        variant: "destructive",
      })
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const handleCheckInClick = (attendeeId: string) => {
    setCheckingIn(attendeeId)

    // Simulate a small delay to show loading state
    setTimeout(() => {
      onCheckIn(attendeeId)
      setCheckingIn(null)
    }, 500)
  }

  // Helper function to get attendee name from response data
  const getAttendeeName = (response: any): string => {
    // Look for name field in response data
    const data = response.data
    for (const key in data) {
      const value = data[key]
      if (typeof value === "string") {
        // Look for fields that might contain name
        const fieldKey = key.toLowerCase()
        if (fieldKey.includes("name") || fieldKey === "fullname" || fieldKey === "full_name") {
          return value
        }
      }
    }
    return "Unknown Attendee"
  }

  // Helper function to get attendee email from response data
  const getAttendeeEmail = (response: any): string => {
    // Look for email field in response data
    const data = response.data
    for (const key in data) {
      const value = data[key]
      if (typeof value === "string" && value.includes("@")) {
        const fieldKey = key.toLowerCase()
        if (fieldKey.includes("email")) {
          return value
        }
      }
    }
    return "No email"
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Quick Check-In</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch} disabled={isSearching}>
              {isSearching ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Searching...
                </>
              ) : (
                "Search"
              )}
            </Button>
          </div>

          {searchResults.length > 0 && (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {searchResults.map((result) => (
                <div
                  key={result.id}
                  className={`p-3 border rounded-md flex justify-between items-center ${
                    result.checkedIn ? "bg-green-50 border-green-200" : "bg-white"
                  }`}
                >
                  <div>
                    <div className="font-medium">{getAttendeeName(result)}</div>
                    <div className="text-sm text-muted-foreground">{getAttendeeEmail(result)}</div>
                  </div>
                  {result.checkedIn ? (
                    <div className="flex items-center text-green-600">
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      <span>Checked In</span>
                    </div>
                  ) : (
                    <Button size="sm" onClick={() => handleCheckInClick(result.id)} disabled={checkingIn === result.id}>
                      {checkingIn === result.id ? (
                        <>
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          Checking...
                        </>
                      ) : (
                        "Check In"
                      )}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}


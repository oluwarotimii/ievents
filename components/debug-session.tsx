"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function DebugSession() {
  const [sessionData, setSessionData] = useState<Record<string, string>>({})
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const data: Record<string, string> = {}
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i)
        if (key) {
          data[key] = sessionStorage.getItem(key) || ""
        }
      }
      setSessionData(data)
    }
  }, [visible])

  if (!visible) {
    return (
      <Button variant="outline" size="sm" className="fixed bottom-4 right-4 z-50" onClick={() => setVisible(true)}>
        Debug Session
      </Button>
    )
  }

  return (
    <Card className="fixed bottom-4 right-4 z-50 w-80">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex justify-between">
          <span>Session Storage Debug</span>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setVisible(false)}>
            ×
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="text-xs">
        {Object.keys(sessionData).length === 0 ? (
          <p>No session data found</p>
        ) : (
          <pre className="overflow-auto max-h-40">{JSON.stringify(sessionData, null, 2)}</pre>
        )}
        <div className="flex gap-2 mt-2">
          <Button
            size="sm"
            variant="outline"
            className="text-xs"
            onClick={() => {
              sessionStorage.setItem("loggedInEmail", "test@example.com")
              setSessionData({ ...sessionData, loggedInEmail: "test@example.com" })
            }}
          >
            Set Test Email
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-xs"
            onClick={() => {
              sessionStorage.clear()
              setSessionData({})
            }}
          >
            Clear All
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

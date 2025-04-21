"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export function useLoadingNavigation() {
  const [isNavigating, setIsNavigating] = useState(false)
  const router = useRouter()

  const navigate = (path: string) => {
    setIsNavigating(true)
    router.push(path)
  }

  return {
    isNavigating,
    navigate,
  }
}

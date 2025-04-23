"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"

interface LoadingContextType {
  isLoading: boolean
  startLoading: (id?: string) => void
  stopLoading: (id?: string) => void
  loadingId: string | null
}

const LoadingContext = createContext<LoadingContextType>({
  isLoading: false,
  startLoading: () => {},
  stopLoading: () => {},
  loadingId: null,
})

export const useLoading = () => useContext(LoadingContext)

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false)
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const startLoading = useCallback((id?: string) => {
    setIsLoading(true)
    if (id) setLoadingId(id)
  }, [])

  const stopLoading = useCallback(
    (id?: string) => {
      // Only stop loading if the id matches or no id was provided
      if (!id || id === loadingId) {
        setIsLoading(false)
        setLoadingId(null)
      }
    },
    [loadingId],
  )

  return (
    <LoadingContext.Provider value={{ isLoading, startLoading, stopLoading, loadingId }}>
      {children}
    </LoadingContext.Provider>
  )
}

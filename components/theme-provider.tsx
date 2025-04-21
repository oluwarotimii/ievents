"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"

type Theme = "dark" | "light" | "system"

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  forcedTheme?: Theme // Add this to force a specific theme
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = "system",
  forcedTheme, // Use this parameter
  storageKey = "theme",
  ...props
}: ThemeProviderProps) {
  // Use cookies instead of localStorage
  const [theme, setTheme] = useState<Theme>(defaultTheme)

  // Load theme from cookie on mount
  useEffect(() => {
    const getThemeFromCookie = () => {
      const cookies = document.cookie.split(";")
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim()
        if (cookie.startsWith(`${storageKey}=`)) {
          return cookie.substring(storageKey.length + 1) as Theme
        }
      }
      return defaultTheme
    }

    setTheme(getThemeFromCookie())
  }, [defaultTheme, storageKey])

  useEffect(() => {
    const root = window.document.documentElement

    root.classList.remove("light", "dark")

    if (forcedTheme) {
      // If a theme is forced, use that
      root.classList.add(forcedTheme)
      return
    }

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
      root.classList.add(systemTheme)
      return
    }

    root.classList.add(theme)
  }, [theme, forcedTheme])

  const value = {
    theme,
    setTheme: (newTheme: Theme) => {
      // Set cookie instead of localStorage
      document.cookie = `${storageKey}=${newTheme};path=/;max-age=31536000` // 1 year expiry
      setTheme(newTheme)
    },
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined) throw new Error("useTheme must be used within a ThemeProvider")

  return context
}

import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import Header from "@/components/Header"
import { LoadingProvider } from "@/components/loading-context"

export const metadata: Metadata = {
  title: "Eventflow",
  description: "Create and share event registration forms with a simple 4-digit code",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider attribute="class" defaultTheme="light">
          <LoadingProvider>
            <Header />
            <main>{children}</main>
          </LoadingProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

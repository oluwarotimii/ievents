"use client"

import type { ButtonHTMLAttributes, ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

interface LoadingButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  isLoading?: boolean
  loadingText?: string
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
  icon?: ReactNode
}

export function LoadingButton({
  children,
  isLoading = false,
  loadingText,
  variant = "default",
  size = "default",
  icon,
  ...props
}: LoadingButtonProps) {
  return (
    <Button variant={variant} size={size} disabled={isLoading || props.disabled} {...props}>
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {loadingText || "Loading..."}
        </>
      ) : (
        <>
          {icon && <span className="mr-2">{icon}</span>}
          {children}
        </>
      )}
    </Button>
  )
}

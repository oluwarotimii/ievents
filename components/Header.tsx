"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Menu, Plus, LogOut, User, Settings, CreditCard, BarChart3 } from "lucide-react"
import { logoutUser } from "@/app/actions/auth-actions"

export default function Header() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [username, setUsername] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const pathname = usePathname()

  useEffect(() => {
    // Check if user is logged in
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/user")
        if (response.ok) {
          const userData = await response.json()
          setIsLoggedIn(true)
          setUsername(userData.username || "User")
        } else {
          setIsLoggedIn(false)
        }
      } catch (error) {
        console.error("Error checking authentication:", error)
        setIsLoggedIn(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  // Don't show header on login/register pages
  if (pathname === "/login" || pathname === "/register" || pathname === "/forgot-password") {
    return null
  }

  const handleLogout = async () => {
    try {
      await logoutUser()
      // The logoutUser function should handle the redirect
    } catch (error) {
      console.error("Error logging out:", error)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <SheetHeader>
                <SheetTitle>Event Form Builder</SheetTitle>
                <SheetDescription>Create and manage your event registration forms</SheetDescription>
              </SheetHeader>
              <nav className="flex flex-col gap-4 mt-8">
                <Link href="/" className="text-sm font-medium hover:underline">
                  Home
                </Link>
                {isLoggedIn ? (
                  <>
                    <Link href="/dashboard" className="text-sm font-medium hover:underline">
                      Dashboard
                    </Link>
                    <Link href="/create" className="text-sm font-medium hover:underline">
                      Create Form
                    </Link>
                    <Link href="/transactions" className="text-sm font-medium hover:underline">
                      Transactions
                    </Link>
                    <Link href="/payment-settings" className="text-sm font-medium hover:underline">
                      Payment Settings
                    </Link>
                    <Link href="/subscription" className="text-sm font-medium hover:underline">
                      Subscription
                    </Link>
                    <button onClick={handleLogout} className="text-sm font-medium text-left hover:underline">
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/login" className="text-sm font-medium hover:underline">
                      Login
                    </Link>
                    <Link href="/register" className="text-sm font-medium hover:underline">
                      Register
                    </Link>
                  </>
                )}
              </nav>
            </SheetContent>
          </Sheet>

          <Link href="/" className="flex items-center space-x-2">
            <span className="font-bold text-xl">EventFlow</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 ml-6">
            <Link
              href="/"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                pathname === "/" ? "text-primary" : "text-muted-foreground"
              }`}
            >
              Home
            </Link>
            {isLoggedIn && (
              <>
                <Link
                  href="/dashboard"
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    pathname === "/dashboard" ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  href="/transactions"
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    pathname === "/transactions" ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  Transactions
                </Link>
              </>
            )}
            <Link
              href="/pricing"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                pathname === "/pricing" ? "text-primary" : "text-muted-foreground"
              }`}
            >
              Pricing
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {isLoggedIn ? (
            <>
              <Button asChild variant="outline" className="hidden md:flex">
                <Link href="/create">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Form
                </Link>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="/placeholder.svg" alt={username} />
                      <AvatarFallback>{getInitials(username)}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{username}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      <span>Dashboard</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/payment-settings" className="cursor-pointer">
                      <CreditCard className="mr-2 h-4 w-4" />
                      <span>Payment Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/subscription" className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Subscription</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/transactions" className="cursor-pointer">
                      <BarChart3 className="mr-2 h-4 w-4" />
                      <span>Transactions</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" className="hidden md:flex">
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild className="hidden md:flex">
                <Link href="/register">Register</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

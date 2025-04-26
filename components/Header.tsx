"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Menu, Plus, LogOut, User, Settings, CreditCard, BarChart3, Home, LayoutDashboard } from "lucide-react"
import { logoutUser } from "@/app/actions/auth-actions"

export default function Header() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [username, setUsername] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    // Check if user is logged in
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/user")
        if (response.ok) {
          const userData = await response.json()
          setIsLoggedIn(true)
          setUsername(userData.username || "User")

          // If user is logged in and on homepage, redirect to dashboard
          if (pathname === "/" && isLoggedIn) {
            router.push("/dashboard")
          }
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
  }, [pathname, router, isLoggedIn])

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

  const mobileMenuItems = [
    { href: "/", label: "Home", icon: <Home className="h-5 w-5 mr-3" />, showWhen: "always" },
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: <LayoutDashboard className="h-5 w-5 mr-3" />,
      showWhen: "loggedIn",
    },
    { href: "/create", label: "Create Form", icon: <Plus className="h-5 w-5 mr-3" />, showWhen: "loggedIn" },
    {
      href: "/transactions",
      label: "Transactions",
      icon: <BarChart3 className="h-5 w-5 mr-3" />,
      showWhen: "loggedIn",
    },
    {
      href: "/payment-settings",
      label: "Payment Settings",
      icon: <CreditCard className="h-5 w-5 mr-3" />,
      showWhen: "loggedIn",
    },
    { href: "/subscription", label: "Subscription", icon: <Settings className="h-5 w-5 mr-3" />, showWhen: "loggedIn" },
    { href: "/pricing", label: "Pricing", icon: <CreditCard className="h-5 w-5 mr-3" />, showWhen: "always" },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-2 sm:px-4 w-full max-w-full">
        <div className="flex items-center gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] sm:w-[350px] p-4">
              <SheetHeader className="pb-6 border-b">
                <SheetTitle className="text-xl">EventFlow</SheetTitle>
                <SheetDescription>
                  {isLoggedIn ? (
                    <div className="flex items-center mt-2">
                      <Avatar className="h-8 w-8 mr-2">
                        <AvatarImage src="/placeholder.svg" alt={username} />
                        <AvatarFallback>{getInitials(username)}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{username}</span>
                    </div>
                  ) : (
                    "Create and manage your event forms"
                  )}
                </SheetDescription>
              </SheetHeader>
              <nav className="flex flex-col gap-1 mt-6">
                {mobileMenuItems.map((item) => {
                  if (
                    item.showWhen === "always" ||
                    (item.showWhen === "loggedIn" && isLoggedIn) ||
                    (item.showWhen === "loggedOut" && !isLoggedIn)
                  ) {
                    return (
                      <SheetClose asChild key={item.href}>
                        <Link
                          href={item.href}
                          className={`flex items-center py-3 px-4 rounded-md hover:bg-muted transition-colors ${
                            pathname === item.href ? "bg-muted font-medium" : "text-muted-foreground"
                          }`}
                        >
                          {item.icon}
                          {item.label}
                        </Link>
                      </SheetClose>
                    )
                  }
                  return null
                })}

                {isLoggedIn ? (
                  <SheetClose asChild>
                    <button
                      onClick={handleLogout}
                      className="flex items-center py-3 px-4 rounded-md hover:bg-muted transition-colors text-muted-foreground mt-2"
                    >
                      <LogOut className="h-5 w-5 mr-3" />
                      Logout
                    </button>
                  </SheetClose>
                ) : (
                  <div className="flex flex-col gap-2 mt-4 px-4">
                    <SheetClose asChild>
                      <Button asChild size="lg" className="w-full">
                        <Link href="/login">Login</Link>
                      </Button>
                    </SheetClose>
                    <SheetClose asChild>
                      <Button asChild variant="outline" size="lg" className="w-full">
                        <Link href="/register">Register</Link>
                      </Button>
                    </SheetClose>
                  </div>
                )}
              </nav>
            </SheetContent>
          </Sheet>

          <Link href={isLoggedIn ? "/dashboard" : "/"} className="flex items-center space-x-2">
            <span className="font-bold text-xl">EventFlow</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 ml-6">
            {!isLoggedIn && (
              <Link
                href="/"
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  pathname === "/" ? "text-primary" : "text-muted-foreground"
                }`}
              >
                Home
              </Link>
            )}
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
              <div className="hidden md:flex space-x-2">
                <Button asChild variant="ghost">
                  <Link href="/login">Login</Link>
                </Button>
                <Button asChild>
                  <Link href="/register">Register</Link>
                </Button>
              </div>
              <Button asChild size="sm" className="md:hidden">
                <Link href="/login">Login</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

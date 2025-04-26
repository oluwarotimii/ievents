import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "./lib/auth"

// Define public paths that don't require authentication
const publicPaths = [
  "/",
  "/login",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/view",
  "/check-in",
  "/s",
  "/unsubscribe",
  "/payment/callback", // Add payment callback to public paths
]

// Define paths that require authentication
const protectedPaths = [
  "/dashboard",
  "/create",
  "/analytics",
  "/responses",
  "/manual-check-in",
  "/qr-codes",
  "/subscription",
  "/payment-settings",
  "/transactions",
  "/email-manager",
  "/pricing",
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if the path is for API routes
  if (pathname.startsWith("/api")) {
    // API routes are handled by their own authentication
    return NextResponse.next()
  }

  // Check if the path is for static files or _next
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".") ||
    pathname.startsWith("/images/")
  ) {
    return NextResponse.next()
  }

  // Check if the path is for payment callback - always public
  if (pathname.startsWith("/payment/callback")) {
    return NextResponse.next()
  }

  // Check if the path is for view, check-in, or s (short URLs) - always public
  if (
    pathname.startsWith("/view/") ||
    pathname.startsWith("/check-in/") ||
    pathname.startsWith("/s/") ||
    pathname.startsWith("/unsubscribe/")
  ) {
    return NextResponse.next()
  }

  // Check if the path is for verify-email or reset-password - always public
  if (pathname.startsWith("/verify-email/") || pathname.startsWith("/reset-password/")) {
    return NextResponse.next()
  }

  // Check if the path is public
  const isPublicPath = publicPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`))

  // Check if the path is protected
  const isProtectedPath = protectedPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`))

  // Get the session
  const session = await getSession(request)

  // If the path is protected and there's no session, redirect to login
  if (isProtectedPath && !session) {
    const url = new URL("/login", request.url)
    url.searchParams.set("callbackUrl", encodeURI(request.url))
    return NextResponse.redirect(url)
  }

  // If the path is login and there's a session, redirect to dashboard
  if (pathname === "/login" && session) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public directory)
     */
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
}

import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Define public routes that don't require authentication
const publicRoutes = ["/", "/login", "/register", "/forgot-password", "/reset-password", "/verify-email", "/api/auth"]

// Define routes that require authentication but not email verification
const authRoutes = ["/verify-email"]

// Define routes that require email verification
const verifiedRoutes = [
  "/dashboard",
  "/create",
  "/responses",
  "/analytics",
  "/qr-codes",
  "/manual-check-in",
  "/email-manager",
  "/subscription",
  "/payment-settings",
  "/transactions",
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if the route is public
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Get the session token from the cookies
  const sessionToken = request.cookies.get("session_token")?.value

  // If no session token, redirect to login
  if (!sessionToken) {
    const url = new URL("/login", request.url)
    url.searchParams.set("callbackUrl", encodeURI(request.url))
    return NextResponse.redirect(url)
  }

  // For API routes, return a 401 response instead of redirecting
  if (pathname.startsWith("/api/")) {
    if (!sessionToken) {
      return new NextResponse(JSON.stringify({ success: false, message: "Authentication required" }), {
        status: 401,
        headers: { "content-type": "application/json" },
      })
    }
    return NextResponse.next()
  }

  // For routes that require email verification
  if (verifiedRoutes.some((route) => pathname.startsWith(route))) {
    // Check if email is verified by making a request to the API
    try {
      const response = await fetch(new URL("/api/auth/user", request.url), {
        headers: {
          cookie: `session_token=${sessionToken}`,
        },
      })

      if (!response.ok) {
        const url = new URL("/login", request.url)
        return NextResponse.redirect(url)
      }

      const user = await response.json()

      if (!user.emailVerified) {
        const url = new URL("/verify-email", request.url)
        url.searchParams.set("callbackUrl", encodeURI(request.url))
        return NextResponse.redirect(url)
      }
    } catch (error) {
      console.error("Error checking email verification:", error)
      // If there's an error, redirect to login
      const url = new URL("/login", request.url)
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
}

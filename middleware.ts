import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Define public routes that don't require authentication
const publicRoutes = [
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/pricing",
  "/api/auth/session",
  "/api/user",
]

// Define routes that require authentication but not email verification
const authRoutes = ["/verify-email"]

// Check if a path matches any of the patterns
const matchesPattern = (path: string, patterns: string[]) => {
  return patterns.some((pattern) => {
    if (pattern.endsWith("*")) {
      return path.startsWith(pattern.slice(0, -1))
    }
    return path === pattern
  })
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for static files and API routes except specific ones
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    (pathname.startsWith("/api") && !pathname.startsWith("/api/auth") && !pathname.startsWith("/api/user"))
  ) {
    return NextResponse.next()
  }

  // Check if the route is public
  const isPublicRoute =
    matchesPattern(pathname, publicRoutes) ||
    pathname.startsWith("/reset-password/") ||
    pathname.startsWith("/verify-email/")

  if (isPublicRoute) {
    return NextResponse.next()
  }

  // Get session token from cookies
  const sessionToken = request.cookies.get("session_token")?.value

  // If no session token, redirect to login
  if (!sessionToken) {
    const url = new URL("/login", request.url)
    url.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(url)
  }

  // Check if user is authenticated and email is verified
  try {
    const response = await fetch(`${request.nextUrl.origin}/api/user`, {
      headers: {
        cookie: `session_token=${sessionToken}`,
      },
    })

    if (!response.ok) {
      // If not authenticated, redirect to login
      const url = new URL("/login", request.url)
      url.searchParams.set("callbackUrl", pathname)
      return NextResponse.redirect(url)
    }

    const userData = await response.json()

    // If email is not verified and the route requires verification
    if (!userData.emailVerified && !matchesPattern(pathname, authRoutes)) {
      return NextResponse.redirect(new URL("/verify-email", request.url))
    }

    return NextResponse.next()
  } catch (error) {
    console.error("Middleware error:", error)
    // On error, redirect to login
    const url = new URL("/login", request.url)
    url.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(url)
  }
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}

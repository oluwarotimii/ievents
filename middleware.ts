import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Add paths that should be accessible without authentication
const publicPaths = [
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/view",
  "/check-in",
  "/pricing",
  "/api", // Allow API routes to be accessed
  "/s", // Allow short URL redirects
  "/payment/callback", // Allow payment callback routes without authentication
  "/payment/receipt", // Allow payment receipt viewing without authentication
  "/unsubscribe", // Allow unsubscribe links
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if the path is public
  const isPublicPath = publicPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`))

  // Get the session cookie directly from request
  const sessionToken = request.cookies.get("session_token")?.value

  // If the path is not public and there's no session cookie, redirect to login
  if (!isPublicPath && !sessionToken) {
    const url = new URL("/login", request.url)
    url.searchParams.set("callbackUrl", encodeURI(request.url))
    return NextResponse.redirect(url)
  }

  // If there's a session cookie and trying to access login, redirect to dashboard
  if (sessionToken && pathname === "/login") {
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

import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Get the pathname
  const path = request.nextUrl.pathname

  // Define public paths that don't require authentication
  const isPublicPath =
    path === "/" ||
    path === "/login" ||
    path === "/signup" ||
    path === "/forgot-password" ||
    path.startsWith("/reset-password/") ||
    path.startsWith("/verify-email/") ||
    path.startsWith("/view/") ||
    path.startsWith("/s/") ||
    path.startsWith("/api/forms/") ||
    path.startsWith("/payment/callback/") ||
    path.startsWith("/api/s/") ||
    path.startsWith("/api/payment-webhook") ||
    path.startsWith("/unsubscribe/")

  // Check if the user is authenticated by looking for the session token
  const isAuthenticated = request.cookies.get("session_token")?.value

  // If the path is not public and the user is not authenticated, redirect to login
  if (!isPublicPath && !isAuthenticated) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // If the path is login or signup and the user is authenticated, redirect to dashboard
  if ((path === "/login" || path === "/signup") && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  // Continue with the request
  return NextResponse.next()
}

// Configure the middleware to run on specific paths
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

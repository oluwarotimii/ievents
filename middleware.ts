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
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if the path is public
  const isPublicPath = publicPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`))

  // Get the session cookie
  const sessionCookie = request.cookies.get("session_token")?.value

  // If the path is not public and there's no session cookie, redirect to login
  if (!isPublicPath && !sessionCookie) {
    const url = new URL("/login", request.url)
    url.searchParams.set("callbackUrl", encodeURI(request.url))
    url.searchParams.set("error", encodeURIComponent("You must be logged in to access this page"))
    return NextResponse.redirect(url)
  }

  // If there's a session cookie and trying to access login, redirect to dashboard
  if (sessionCookie && pathname === "/login") {
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

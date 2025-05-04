import { nanoid } from "nanoid"
import bcrypt from "bcryptjs"
import prisma from "./prisma"
import { createShortUrl, getFullShortUrl } from "./url-shortener"
import { cookies as nextCookies } from "next/headers"

// Helper function to get cookies that works in both App Router and Pages Router
async function getCookies() {
  // Check if we're in a browser environment
  if (typeof window !== "undefined") {
    // Client-side: Parse cookies from document.cookie
    const cookieStr = document.cookie
    return {
      get: (name) => {
        const match = cookieStr.match(new RegExp(`(^| )${name}=([^;]+)`))
        return match ? { value: match[2] } : undefined
      },
      set: (name, value, options) => {
        let cookieString = `${name}=${value}`
        if (options.expires) cookieString += `; expires=${options.expires.toUTCString()}`
        if (options.path) cookieString += `; path=${options.path}`
        if (options.httpOnly) cookieString += "; httpOnly"
        if (options.secure) cookieString += "; secure"
        if (options.sameSite) cookieString += `; sameSite=${options.sameSite}`
        document.cookie = cookieString
      },
      delete: (name) => {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
      },
    }
  }

  try {
    // Server-side in App Router: Use next/headers
    return nextCookies()
  } catch (e) {
    // Server-side in Pages Router: Return empty implementation
    // This will be handled by the API route using req/res
    return {
      get: () => undefined,
      set: () => {},
      delete: () => {},
    }
  }
}

// Hash a password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

// Compare a password with a hash
export async function comparePasswords(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

// Create a session for a user
export async function createSession(userId: number): Promise<void> {
  // Generate a random token
  const token = nanoid(32)

  // Set expiration to 30 days from now
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 30)

  // Create session in database
  await prisma.session.create({
    data: {
      userId,
      token,
      expiresAt,
    },
  })

  // Set session cookie
  const cookieStore = await getCookies()
  cookieStore.set("session_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  })
}

// Get the current session
export async function getSession() {
  const cookieStore = await getCookies()
  const sessionToken = cookieStore.get("session_token")?.value

  if (!sessionToken) {
    return null
  }

  const session = await prisma.session.findUnique({
    where: { token: sessionToken },
    include: { user: true },
  })

  if (!session || session.expiresAt < new Date()) {
    return null
  }

  return session
}

// Logout a user
export async function logout(): Promise<void> {
  const cookieStore = await getCookies()
  const sessionToken = cookieStore.get("session_token")?.value

  if (sessionToken) {
    // Delete session from database
    await prisma.session.delete({
      where: { token: sessionToken },
    })

    // Clear session cookie
    cookieStore.delete("session_token")
  }
}

// Get the current user from the session
export async function getCurrentUser() {
  const session = await getSession()
  return session?.user || null
}

// Require authentication - throws error if not authenticated
export async function requireAuth() {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error("Authentication required. Please log in to continue.")
  }

  return user
}

// Get user from request (for API routes)
export async function getUserFromRequest(request: Request) {
  const cookieHeader = request.headers.get("cookie")
  if (!cookieHeader) return null

  // Parse cookies
  const cookies = Object.fromEntries(
    cookieHeader.split("; ").map((cookie) => {
      const [name, value] = cookie.split("=")
      return [name, value]
    }),
  )

  const sessionToken = cookies.session_token
  if (!sessionToken) return null

  const session = await prisma.session.findUnique({
    where: { token: sessionToken },
    include: { user: true },
  })

  if (!session || session.expiresAt < new Date()) {
    return null
  }

  return session.user
}

// Send verification email
export async function sendVerificationEmail(user: { id: number; email: string; username: string }): Promise<boolean> {
  try {
    // Generate a verification token
    const token = nanoid(32)

    // Store token in database
    await prisma.verificationToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    })

    // Create a short URL for verification
    const shortCode = await createShortUrl(`/verify-email?token=${token}`)
    const verificationUrl = getFullShortUrl(shortCode)

    // Get the base URL for the application
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

    // Send email
    const response = await fetch(`${baseUrl}/api/email/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: user.email,
        subject: "Verify Your Email Address",
        template: "verification",
        data: {
          username: user.username,
          verificationUrl,
        },
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("Error sending verification email:", errorData)
      return false
    }

    return true
  } catch (error) {
    console.error("Error sending email:", error)
    return false
  }
}

// Verify email with token
export async function verifyEmail(token: string): Promise<boolean> {
  try {
    // Find the verification token
    const verificationToken = await prisma.verificationToken.findFirst({
      where: {
        token,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        user: true,
      },
    })

    if (!verificationToken) {
      return false
    }

    // Mark user as verified
    await prisma.user.update({
      where: {
        id: verificationToken.userId,
      },
      data: {
        emailVerified: true,
      },
    })

    // Delete the used token
    await prisma.verificationToken.delete({
      where: {
        id: verificationToken.id,
      },
    })

    return true
  } catch (error) {
    console.error("Error verifying email:", error)
    return false
  }
}

// Send password reset email
export async function sendPasswordResetEmail(email: string): Promise<boolean> {
  try {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      // Don't reveal that the user doesn't exist
      return true
    }

    // Generate a reset token
    const token = nanoid(32)

    // Store token in database
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 1 * 60 * 60 * 1000), // 1 hour
      },
    })

    // Create a short URL for reset
    const shortCode = await createShortUrl(`/reset-password?token=${token}`)
    const resetUrl = getFullShortUrl(shortCode)

    // Get the base URL for the application
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

    // Send email
    const response = await fetch(`${baseUrl}/api/email/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: user.email,
        subject: "Reset Your Password",
        template: "password-reset",
        data: {
          username: user.username,
          resetUrl,
        },
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("Error sending password reset email:", errorData)
      return false
    }

    return true
  } catch (error) {
    console.error("Error sending password reset email:", error)
    return false
  }
}

// Verify password reset token
export async function verifyPasswordResetToken(token: string): Promise<number | null> {
  try {
    // Find the reset token
    const resetToken = await prisma.passwordResetToken.findFirst({
      where: {
        token,
        expiresAt: {
          gt: new Date(),
        },
      },
    })

    if (!resetToken) {
      return null
    }

    return resetToken.userId
  } catch (error) {
    console.error("Error verifying reset token:", error)
    return null
  }
}

// Reset password
export async function resetPassword(userId: number, newPassword: string): Promise<boolean> {
  try {
    // Hash the new password
    const passwordHash = await hashPassword(newPassword)

    // Update user's password
    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        passwordHash,
      },
    })

    // Delete all reset tokens for this user
    await prisma.passwordResetToken.deleteMany({
      where: {
        userId,
      },
    })

    return true
  } catch (error) {
    console.error("Error resetting password:", error)
    return false
  }
}

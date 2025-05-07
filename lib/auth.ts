import { nanoid } from "nanoid"
import bcrypt from "bcryptjs"
import prisma from "./prisma"
import { sendEmailFromServer } from "./email-service"

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

  // Set session cookie using the appropriate method based on environment
  if (typeof window === "undefined") {
    // Server-side: Use dynamic import to avoid the static import error
    try {
      const { cookies } = await import("next/headers")
      const cookieStore = cookies()
      cookieStore.set("session_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        expires: expiresAt,
        path: "/",
      })
    } catch (error) {
      // If next/headers is not available (Pages Router), handle it gracefully
      console.warn("Could not set cookie with next/headers, falling back to API route")
      // The cookie will be set by the API route or client-side
    }
  } else {
    // Client-side: Set cookie directly
    document.cookie = `session_token=${token}; path=/; expires=${expiresAt.toUTCString()}; ${
      process.env.NODE_ENV === "production" ? "secure;" : ""
    } samesite=lax;`
  }
}

// Get the current session
export async function getSession() {
  let sessionToken = null

  // Try to get the session token based on environment
  if (typeof window === "undefined") {
    // Server-side
    try {
      // Try App Router method first
      const { cookies } = await import("next/headers")
      sessionToken = cookies().get("session_token")?.value
    } catch (error) {
      // If next/headers is not available, we'll handle it in the API route
      return null
    }
  } else {
    // Client-side: Parse cookies from document.cookie
    const cookies = document.cookie.split("; ").reduce(
      (acc, cookie) => {
        const [name, value] = cookie.split("=")
        acc[name] = value
        return acc
      },
      {} as Record<string, string>,
    )

    sessionToken = cookies.session_token
  }

  if (!sessionToken) {
    return null
  }

  try {
    const session = await prisma.session.findUnique({
      where: { token: sessionToken },
      include: { user: true },
    })

    if (!session || session.expiresAt < new Date()) {
      return null
    }

    return session
  } catch (error) {
    console.error("Error getting session:", error)
    return null
  }
}

// Logout a user
export async function logout(): Promise<void> {
  const session = await getSession()

  if (session) {
    // Delete session from database
    await prisma.session.delete({
      where: { token: session.token },
    })
  }

  // Clear session cookie based on environment
  if (typeof window === "undefined") {
    // Server-side
    try {
      const { cookies } = await import("next/headers")
      cookies().delete("session_token")
    } catch (error) {
      // If next/headers is not available, we'll handle it in the API route
      console.warn("Could not delete cookie with next/headers, falling back to API route")
    }
  } else {
    // Client-side: Clear cookie
    document.cookie = "session_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;"
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

// Require verified email - throws error if not verified
export async function requireVerifiedEmail() {
  const user = await requireAuth()

  if (!user.emailVerified) {
    throw new Error("Email verification required. Please verify your email to continue.")
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

// Generate a verification token
export async function generateVerificationToken(userId: number): Promise<string> {
  console.log("Generating verification token for user:", userId)

  // Generate a random token
  const token = nanoid(32)

  // Store token in database
  await prisma.verificationToken.create({
    data: {
      userId,
      token,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    },
  })

  console.log("Verification token generated successfully")
  return token
}

// Send verification email
export async function sendVerificationEmail(user: { id: number; email: string; username: string }): Promise<boolean> {
  try {
    console.log("🚀 SENDING VERIFICATION EMAIL")
    console.log("👤 User:", user.id, user.email)

    // Generate a verification token
    const token = await generateVerificationToken(user.id)
    console.log("🔑 Generated verification token")

    // Create a verification URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const verificationUrl = `${baseUrl}/verify-email/${token}`
    console.log("🔗 Verification URL:", verificationUrl)

    // Send the email using our email service
    const result = await sendEmailFromServer({
      to: user.email,
      subject: "Verify Your Email Address",
      template: "verification",
      data: {
        username: user.username,
        verificationUrl,
      },
      useApi: true, // Force using API for reliability
    })

    if (!result.success) {
      console.error("❌ Failed to send verification email:", result.error)
      return false
    }

    console.log("✅ Verification email sent successfully")
    return true
  } catch (error) {
    console.error("❌ Error sending verification email:", error)
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

    // Send welcome email
    try {
      await sendEmailFromServer({
        to: verificationToken.user.email,
        subject: "Welcome to Event Form Builder",
        template: "welcome",
        data: {
          username: verificationToken.user.username,
        },
        useApi: true,
      })
    } catch (emailError) {
      console.error("Error sending welcome email:", emailError)
      // Continue even if welcome email fails
    }

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

    // Create reset URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const resetUrl = `${baseUrl}/reset-password/${token}`

    // Send the email
    const result = await sendEmailFromServer({
      to: user.email,
      subject: "Reset Your Password",
      template: "password-reset",
      data: {
        username: user.username,
        resetUrl,
      },
      useApi: true,
    })

    if (!result.success) {
      console.error("Failed to send password reset email:", result.error)
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

// Check if email is verified
export async function isEmailVerified(): Promise<boolean> {
  try {
    const user = await getCurrentUser()
    return user?.emailVerified || false
  } catch (error) {
    return false
  }
}

"use server"

import { redirect } from "next/navigation"
import { z } from "zod"
import prisma from "@/lib/prisma"

const registerSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(8),
})

const loginSchema = z.object({
  username: z.string(),
  password: z.string(),
})

const forgotPasswordSchema = z.object({
  email: z.string().email(),
})

const resetPasswordSchema = z
  .object({
    password: z.string().min(8),
    confirmPassword: z.string().min(8),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })

// Get the current session
export async function getSession() {
  try {
    // Use dynamic import to avoid the static import error
    const authModule = await import("@/lib/auth")
    return authModule.getSession()
  } catch (error) {
    console.error("Error getting session:", error)
    return null
  }
}

// Get the current user
export async function getCurrentUser() {
  try {
    const authModule = await import("@/lib/auth")
    return authModule.getCurrentUser()
  } catch (error) {
    console.error("Error getting current user:", error)
    return null
  }
}

// Check if email is verified
export async function isEmailVerified() {
  try {
    const authModule = await import("@/lib/auth")
    return authModule.isEmailVerified()
  } catch (error) {
    console.error("Error checking email verification:", error)
    return false
  }
}

// Get subscription info for the current user
export async function getCurrentUserSubscriptionInfo() {
  const user = await getCurrentUser()

  if (!user) {
    return {
      plan: "FREE",
      formLimit: 2,
      formCount: 0,
      isActive: false,
    }
  }

  // Get subscription info from database
  const subscription = await prisma.subscription.findUnique({
    where: { userId: user.id },
  })

  // Get form count
  const formCount = await prisma.form.count({
    where: { userId: user.id },
  })

  // Default to free plan if no subscription exists
  const plan = subscription?.planType || "FREE"

  // Set limits based on plan
  let formLimit = null
  if (plan === "FREE") {
    formLimit = 2
  }

  return {
    plan,
    formLimit,
    formCount,
    isActive: subscription?.status === "ACTIVE",
  }
}

export async function registerUser(formData: FormData) {
  try {
    const validatedFields = registerSchema.safeParse({
      username: formData.get("username"),
      email: formData.get("email"),
      password: formData.get("password"),
    })

    if (!validatedFields.success) {
      return {
        success: false,
        message: "Invalid input. Please check your information.",
      }
    }

    const { username, email, password } = validatedFields.data

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email }],
      },
    })

    if (existingUser) {
      return {
        success: false,
        message: "Username or email already exists.",
      }
    }

    // Use dynamic import for auth functions
    const authModule = await import("@/lib/auth")

    // Create new user
    const passwordHash = await authModule.hashPassword(password)
    const user = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
        emailVerified: false, // Set to false to require verification
      },
    })

    console.log("User created successfully:", user.id)

    // Send verification email
    try {
      console.log("Sending verification email to:", email)
      const emailSent = await authModule.sendVerificationEmail(user)

      if (!emailSent) {
        console.error("Failed to send verification email")
      } else {
        console.log("Verification email sent successfully")
      }
    } catch (emailError) {
      console.error("Error sending verification email:", emailError)
      // Continue with registration even if email fails
    }

    // Create session
    await authModule.createSession(user.id)

    return {
      success: true,
      requireVerification: true,
    }
  } catch (error) {
    console.error("Registration error:", error)
    return {
      success: false,
      message: "An error occurred during registration.",
    }
  }
}

export async function loginUser(formData: FormData) {
  try {
    const validatedFields = loginSchema.safeParse({
      username: formData.get("username"),
      password: formData.get("password"),
    })

    if (!validatedFields.success) {
      return {
        success: false,
        message: "Invalid username or password.",
      }
    }

    const { username, password } = validatedFields.data

    // Find user by username or email
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email: username }, // Allow login with email as well
        ],
      },
    })

    if (!user) {
      return {
        success: false,
        message: "Invalid username or password.",
      }
    }

    // Use dynamic import for auth functions
    const authModule = await import("@/lib/auth")

    // Verify password
    const passwordValid = await authModule.comparePasswords(password, user.passwordHash)
    if (!passwordValid) {
      return {
        success: false,
        message: "Invalid username or password.",
      }
    }

    // Create session
    await authModule.createSession(user.id)

    // Log successful login
    console.log(`User ${user.username} logged in successfully`)

    return {
      success: true,
      emailVerified: user.emailVerified,
    }
  } catch (error) {
    console.error("Login error:", error)
    return {
      success: false,
      message: "An error occurred during login.",
    }
  }
}

export async function logoutUser() {
  try {
    const authModule = await import("@/lib/auth")
    await authModule.logout()
    redirect("/")
  } catch (error) {
    console.error("Logout error:", error)
    redirect("/")
  }
}

export async function resendVerificationEmail() {
  try {
    const authModule = await import("@/lib/auth")
    const session = await authModule.getSession()

    if (!session) {
      return {
        success: false,
        message: "No active session found. Please log in again.",
      }
    }

    const user = await prisma.user.findFirst({
      where: {
        id: session.userId,
      },
    })

    if (!user) {
      return {
        success: false,
        message: "User not found.",
      }
    }

    console.log("Attempting to resend verification email to:", user.email)

    const emailSent = await authModule.sendVerificationEmail(user)

    if (!emailSent) {
      return {
        success: false,
        message: "Failed to send verification email. Please try again.",
      }
    }

    return { success: true }
  } catch (error) {
    console.error("Resend verification error:", error)
    return {
      success: false,
      message: "An error occurred while resending the verification email.",
    }
  }
}

export async function verifyUserEmail(token: string) {
  try {
    const authModule = await import("@/lib/auth")
    const verified = await authModule.verifyEmail(token)

    if (!verified) {
      return {
        success: false,
        message: "Invalid or expired verification link.",
      }
    }

    return { success: true }
  } catch (error) {
    console.error("Email verification error:", error)
    return {
      success: false,
      message: "An error occurred during email verification.",
    }
  }
}

export async function forgotPassword(formData: FormData) {
  try {
    const validatedFields = forgotPasswordSchema.safeParse({
      email: formData.get("email"),
    })

    if (!validatedFields.success) {
      return {
        success: false,
        message: "Please enter a valid email address.",
      }
    }

    const { email } = validatedFields.data
    console.log("Processing forgot password request for:", email)

    const authModule = await import("@/lib/auth")
    await authModule.sendPasswordResetEmail(email)

    // Always return success even if email doesn't exist for security reasons
    return { success: true }
  } catch (error) {
    console.error("Forgot password error:", error)
    return {
      success: false,
      message: "An error occurred. Please try again.",
    }
  }
}

export async function resetUserPassword(token: string, formData: FormData) {
  try {
    const validatedFields = resetPasswordSchema.safeParse({
      password: formData.get("password"),
      confirmPassword: formData.get("confirmPassword"),
    })

    if (!validatedFields.success) {
      return {
        success: false,
        message: validatedFields.error.errors[0].message,
      }
    }

    const { password } = validatedFields.data

    const authModule = await import("@/lib/auth")
    const userId = await authModule.verifyPasswordResetToken(token)

    if (!userId) {
      return {
        success: false,
        message: "Invalid or expired reset link.",
      }
    }

    const success = await authModule.resetPassword(userId, password)

    if (!success) {
      return {
        success: false,
        message: "Failed to reset password. Please try again.",
      }
    }

    return { success: true }
  } catch (error) {
    console.error("Password reset error:", error)
    return {
      success: false,
      message: "An error occurred during password reset.",
    }
  }
}

// Require verified email for protected actions
export async function requireVerifiedEmail() {
  try {
    const authModule = await import("@/lib/auth")
    return authModule.requireVerifiedEmail()
  } catch (error) {
    if (error instanceof Error && error.message.includes("Email verification required")) {
      redirect("/verify-email")
    }
    throw error
  }
}

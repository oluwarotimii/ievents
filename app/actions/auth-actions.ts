"use server"

import { redirect } from "next/navigation"
import { z } from "zod"
import prisma from "@/lib/prisma"
import {
  hashPassword,
  comparePasswords,
  createSession,
  logout,
  sendVerificationEmail,
  sendPasswordResetEmail,
  verifyEmail,
  verifyPasswordResetToken,
  resetPassword,
} from "@/lib/auth"
import { cookies } from "next/headers"

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
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get("session_token")?.value

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

// Get the current user
export async function getCurrentUser() {
  const session = await getSession()
  return session?.user || null
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

  try {
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

    // Create new user
    const passwordHash = await hashPassword(password)
    const user = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
        emailVerified: false, // Set to false to require verification
      },
    })

    // Send verification email
    await sendVerificationEmail(user)

    // Create session
    await createSession(user.id)

    return { success: true }
  } catch (error) {
    console.error("Registration error:", error)
    return {
      success: false,
      message: "An error occurred during registration.",
    }
  }
}

export async function loginUser(formData: FormData) {
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

  try {
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

    // Verify password
    const passwordValid = await comparePasswords(password, user.passwordHash)
    if (!passwordValid) {
      return {
        success: false,
        message: "Invalid username or password.",
      }
    }

    // Create session
    await createSession(user.id)

    // Log successful login
    console.log(`User ${user.username} logged in successfully`)

    return {
      success: true,
      emailVerified: true, // Always return true
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
  await logout()
  redirect("/")
}

export async function resendVerificationEmail() {
  try {
    const user = await prisma.user.findFirst({
      where: {
        id: (await getSession())?.userId,
        emailVerified: false,
      },
    })

    if (!user) {
      return {
        success: false,
        message: "User not found or already verified.",
      }
    }

    const emailSent = await sendVerificationEmail(user)

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
    const verified = await verifyEmail(token)

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

  try {
    const emailSent = await sendPasswordResetEmail(email)

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

  try {
    const userId = await verifyPasswordResetToken(token)

    if (!userId) {
      return {
        success: false,
        message: "Invalid or expired reset link.",
      }
    }

    const success = await resetPassword(userId, password)

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

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
  getSession,
} from "@/lib/auth"

const registerSchema = z
  .object({
    username: z.string().min(3).max(50),
    email: z.string().email(),
    password: z.string().min(8),
  })
  .refine(
    (data) => {
      // This will be checked in the function body since formData doesn't have the schema structure
      return true
    },
    {
      message: "Passwords don't match",
      path: ["confirmPassword"],
    },
  )

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

export async function registerUser(formData: FormData) {
  const username = formData.get("username") as string
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const confirmPassword = formData.get("confirmPassword") as string

  // Check if passwords match
  if (password !== confirmPassword) {
    return {
      success: false,
      message: "Passwords don't match.",
    }
  }

  const validatedFields = registerSchema.safeParse({
    username,
    email,
    password,
  })

  if (!validatedFields.success) {
    return {
      success: false,
      message: "Invalid input. Please check your information.",
    }
  }

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
        emailVerified: true, // Set to true to bypass verification
      },
    })

    // Comment out the email verification sending
    // await sendVerificationEmail(user)

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
  const rememberMe = formData.get("rememberMe") === "on"

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

    // Create session with rememberMe option
    await createSession(user.id, rememberMe)

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


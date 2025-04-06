import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { jwtVerify, SignJWT } from "jose"
import bcrypt from "bcryptjs"
import crypto from "crypto"
import prisma from "./prisma"
import { sendEmail } from "./email"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function comparePasswords(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export async function createSession(userId: number, rememberMe = false) {
  // Set expiration to 7 days (default) or 30 days if rememberMe is true
  const expirationDays = rememberMe ? 30 : 7
  const expires = new Date(Date.now() + expirationDays * 24 * 60 * 60 * 1000)

  const session = await new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(expires.getTime() / 1000)
    .sign(new TextEncoder().encode(JWT_SECRET))
  ;(await cookies()).set("session", session, {
    expires,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
  })

  return session
}

export async function getSession() {
  const session = (await cookies()).get("session")?.value
  if (!session) return null

  try {
    const { payload } = await jwtVerify(session, new TextEncoder().encode(JWT_SECRET), {
      algorithms: ["HS256"],
    })
    return payload
  } catch (error) {
    return null
  }
}

export async function getCurrentUser() {
  const session = await getSession()
  if (!session?.userId) return null

  const user = await prisma.user.findUnique({
    where: { id: Number(session.userId) },
    select: {
      id: true,
      username: true,
      email: true,
      emailVerified: true,
    },
  })

  // Disable email verification for local development
  if (process.env.NODE_ENV === "development") {
    return user // Skip email verification for development
  }

  return user
}

export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")
  return user
}

// Bypass email verification for now, you can comment/uncomment this based on your needs
// export async function requireVerifiedEmail() {
//   const user = await getCurrentUser()
//   if (!user) redirect("/login")

//   // For local development, skip email verification
//   if (process.env.NODE_ENV === "development") {
//     return user
//   }

//   // if (!user.emailVerified) redirect("/verify-email")
//   return user
// }

export async function logout() {
  ;(await cookies()).delete("session")
}

// Generate a random token
export function generateToken(): string {
  return crypto.randomBytes(32).toString("hex")
}

// Create a verification token for a user
export async function createVerificationToken(userId: number): Promise<string> {
  const token = generateToken()
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

  await prisma.user.update({
    where: { id: userId },
    data: {
      verificationToken: token,
      verificationTokenExpires: expires,
    },
  })

  return token
}

// Create a password reset token for a user
export async function createPasswordResetToken(email: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { email },
  })

  if (!user) return null

  const token = generateToken()
  const expires = new Date(Date.now() + 1 * 60 * 60 * 1000) // 1 hour

  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetPasswordToken: token,
      resetPasswordTokenExpires: expires,
    },
  })

  return token
}

// Verify a user's email with a token
export async function verifyEmail(token: string): Promise<boolean> {
  const user = await prisma.user.findFirst({
    where: {
      verificationToken: token,
      verificationTokenExpires: {
        gt: new Date(),
      },
    },
  })

  if (!user) return false

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: true,
      verificationToken: null,
      verificationTokenExpires: null,
    },
  })

  // Send welcome email
  await sendEmail({
    to: user.email,
    subject: "Welcome to Event Form Builder",
    template: "welcome",
    data: {
      username: user.username,
      loginUrl: `${BASE_URL}/login`,
    },
  })

  return true
}

// Verify a password reset token
export async function verifyPasswordResetToken(token: string): Promise<number | null> {
  const user = await prisma.user.findFirst({
    where: {
      resetPasswordToken: token,
      resetPasswordTokenExpires: {
        gt: new Date(),
      },
    },
  })

  if (!user) return null

  return user.id
}

// Reset a user's password
export async function resetPassword(userId: number, newPassword: string): Promise<boolean> {
  const passwordHash = await hashPassword(newPassword)

  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash,
      resetPasswordToken: null,
      resetPasswordTokenExpires: null,
    },
  })

  return true
}

// Send verification email
export async function sendVerificationEmail(user: { id: number; email: string; username: string }): Promise<boolean> {
  const token = await createVerificationToken(user.id)
  const verificationUrl = `${BASE_URL}/verify-email/${token}`

  const result = await sendEmail({
    to: user.email,
    subject: "Verify Your Email Address",
    template: "verification",
    data: {
      username: user.username,
      verificationUrl,
    },
  })

  return result.success
}

// Send password reset email
export async function sendPasswordResetEmail(email: string): Promise<boolean> {
  const token = await createPasswordResetToken(email)
  if (!token) return false

  const user = await prisma.user.findUnique({
    where: { email },
  })

  if (!user) return false

  const resetUrl = `${BASE_URL}/reset-password/${token}`

  const result = await sendEmail({
    to: email,
    subject: "Reset Your Password",
    template: "password-reset",
    data: {
      username: user.username,
      resetUrl,
    },
  })

  return result.success
}


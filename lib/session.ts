import { nanoid } from "nanoid"
import prisma from "./prisma"

// Get the current session from cookie header
export async function getSessionFromCookie(cookieHeader: string | null) {
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

  return session
}

// Create a session token
export async function createSessionToken(userId: number): Promise<{ token: string; expiresAt: Date }> {
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

  return { token, expiresAt }
}

// Delete a session by token
export async function deleteSession(token: string): Promise<boolean> {
  try {
    await prisma.session.delete({
      where: { token },
    })
    return true
  } catch (error) {
    console.error("Error deleting session:", error)
    return false
  }
}

// Get user from session token
export async function getUserFromSessionToken(token: string) {
  if (!token) return null

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  })

  if (!session || session.expiresAt < new Date()) {
    return null
  }

  return session.user
}

import type { NextApiRequest, NextApiResponse } from "next"
import prisma from "@/lib/prisma"
import { nanoid } from "nanoid"

// This API route handles session management for Pages Router
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Create session
  if (req.method === "POST") {
    try {
      const { userId } = req.body

      if (!userId) {
        return res.status(400).json({ success: false, message: "User ID is required" })
      }

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
      res.setHeader(
        "Set-Cookie",
        `session_token=${token}; HttpOnly; Path=/; ${
          process.env.NODE_ENV === "production" ? "Secure; " : ""
        }SameSite=Lax; Expires=${expiresAt.toUTCString()}`,
      )

      return res.status(200).json({ success: true })
    } catch (error) {
      console.error("Error creating session:", error)
      return res.status(500).json({ success: false, message: "Failed to create session" })
    }
  }

  // Get session
  if (req.method === "GET") {
    try {
      const sessionToken = req.cookies.session_token

      if (!sessionToken) {
        return res.status(401).json({ success: false, message: "No session found" })
      }

      const session = await prisma.session.findUnique({
        where: { token: sessionToken },
        include: { user: true },
      })

      if (!session || session.expiresAt < new Date()) {
        return res.status(401).json({ success: false, message: "Invalid or expired session" })
      }

      // Return user data without sensitive information
      const { passwordHash, ...safeUser } = session.user
      return res.status(200).json({ success: true, user: safeUser })
    } catch (error) {
      console.error("Error getting session:", error)
      return res.status(500).json({ success: false, message: "Failed to get session" })
    }
  }

  // Delete session (logout)
  if (req.method === "DELETE") {
    try {
      const sessionToken = req.cookies.session_token

      if (sessionToken) {
        // Delete session from database
        await prisma.session.delete({
          where: { token: sessionToken },
        })
      }

      // Clear session cookie
      res.setHeader("Set-Cookie", "session_token=; HttpOnly; Path=/; Max-Age=0")

      return res.status(200).json({ success: true })
    } catch (error) {
      console.error("Error deleting session:", error)
      return res.status(500).json({ success: false, message: "Failed to delete session" })
    }
  }

  return res.status(405).json({ success: false, message: "Method not allowed" })
}

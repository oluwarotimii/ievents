import type { NextApiRequest, NextApiResponse } from "next"
import { getSessionFromCookie } from "@/lib/session"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  try {
    const session = await getSessionFromCookie(req.headers.cookie || null)

    if (!session || !session.user) {
      return res.status(401).json({ error: "Unauthorized" })
    }

    // Return user without sensitive information
    const { passwordHash, ...safeUser } = session.user
    return res.status(200).json(safeUser)
  } catch (error) {
    console.error("Error getting user:", error)
    return res.status(500).json({ error: "Internal server error" })
  }
}

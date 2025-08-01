import type { NextApiRequest, NextApiResponse } from "next"
import { deleteSession } from "@/lib/session"
import { getSessionFromCookie } from "@/lib/session"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  try {
    const session = await getSessionFromCookie(req.headers.cookie || null)

    if (session) {
      await deleteSession(session.token)
    }

    // Clear the cookie
    res.setHeader("Set-Cookie", "session_token=; HttpOnly; Path=/; Max-Age=0")

    return res.status(200).json({ success: true })
  } catch (error) {
    console.error("Error logging out:", error)
    return res.status(500).json({ error: "Internal server error" })
  }
}

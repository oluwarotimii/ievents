import { NextResponse } from "next/server"
import { getOriginalUrl } from "@/lib/url-shortener"

export async function GET(request: Request, { params }: { params: { shortCode: string } }) {
  const { shortCode } = params

  try {
    const originalUrl = await getOriginalUrl(shortCode)

    if (!originalUrl) {
      return NextResponse.json({ error: "Short URL not found or has expired" }, { status: 404 })
    }

    // Return a redirect response
    return NextResponse.redirect(originalUrl)
  } catch (error) {
    console.error("Error resolving short URL:", error)
    return NextResponse.json({ error: "Failed to resolve short URL" }, { status: 500 })
  }
}


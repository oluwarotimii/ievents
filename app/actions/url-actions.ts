"use server"

import { createShortUrl, getFullShortUrl } from "@/lib/url-shortener"
import { getCurrentUser } from "@/lib/auth"

/**
 * Create a short URL for a given original URL
 */
export async function shortenUrl(originalUrl: string): Promise<string> {
  try {
    // Get the current user if available
    const user = await getCurrentUser()
    const userId = user?.id

    // Create the short URL
    const shortCode = await createShortUrl(originalUrl, userId)

    // Return the full short URL
    return getFullShortUrl(shortCode)
  } catch (error) {
    console.error("Error shortening URL:", error)
    throw new Error("Failed to shorten URL")
  }
}

/**
 * Create short URLs for event sharing
 */
export async function createEventShareUrls(eventCode: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

    // Create short URLs for different event-related pages
    const viewUrl = `${baseUrl}/view/${eventCode}`
    const checkInUrl = `${baseUrl}/check-in/${eventCode}`

    const shortViewUrl = await shortenUrl(viewUrl)
    const shortCheckInUrl = await shortenUrl(checkInUrl)

    return {
      success: true,
      viewUrl: shortViewUrl,
      checkInUrl: shortCheckInUrl,
    }
  } catch (error) {
    console.error("Error creating event share URLs:", error)
    return {
      success: false,
      message: "Failed to create share URLs",
    }
  }
}


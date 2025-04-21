import { nanoid } from "nanoid"
import prisma from "./prisma"

// Length of the short code
const SHORT_CODE_LENGTH = 12 // Increased for better security

/**
 * Generate a unique short code
 */
export async function generateUniqueShortCode(): Promise<string> {
  let shortCode: string
  let exists = true

  // Keep generating until we find a unique code
  while (exists) {
    shortCode = nanoid(SHORT_CODE_LENGTH)
    // Check if this code already exists
    const existingUrl = await prisma.shortUrl.count({
      where: { shortCode: shortCode },
    })
    exists = existingUrl > 0
  }

  return shortCode
}

/**
 * Create a short URL for a given original URL
 */
export async function createShortUrl(originalUrl: string, userId?: number): Promise<string> {
  try {
    // Check if we already have a short URL for this original URL and user
    const whereClause: any = { url: originalUrl }

    // Only include userId in the where clause if it's provided
    if (userId !== undefined) {
      whereClause.userId = userId
    }

    const existingUrl = await prisma.shortUrl.findFirst({
      where: whereClause,
    })

    if (existingUrl) {
      return existingUrl.shortCode
    }

    // Generate a new short code
    const shortCode = await generateUniqueShortCode()

    // Create the short URL record
    const data: any = {
      url: originalUrl,
      shortCode: shortCode,
      // Set expiration to 1 year from now
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    }

    if (userId !== undefined) {
      data.userId = userId
    }

    await prisma.shortUrl.create({
      data: data,
    })

    return shortCode
  } catch (error) {
    console.error("Error creating short URL:", error)
    // Fallback to just generating a unique code without database storage
    return nanoid(SHORT_CODE_LENGTH)
  }
}

/**
 * Get the original URL for a given short code
 */
export async function getOriginalUrl(shortCode: string): Promise<string | null> {
  try {
    const shortUrl = await prisma.shortUrl.findFirst({
      where: { shortCode: shortCode },
    })

    if (!shortUrl) {
      console.log(`Short URL not found: ${shortCode}`)
      return null
    }

    // Check if the URL has expired
    if (shortUrl.expiresAt && shortUrl.expiresAt < new Date()) {
      return null
    }

    // Increment the click count
    await prisma.shortUrl.update({
      where: { id: shortUrl.id },
      data: { clicks: { increment: 1 } },
    })

    return shortUrl.url
  } catch (error) {
    console.error("Error getting original URL:", error)
    return null
  }
}

/**
 * Generate a full short URL including the base URL
 */
export function getFullShortUrl(shortCode: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  return `${baseUrl}/s/${shortCode}`
}

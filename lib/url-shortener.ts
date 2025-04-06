import { nanoid } from "nanoid"
import prisma from "./prisma"

// Length of the short code
const SHORT_CODE_LENGTH = 10

/**
 * Generate a unique short code
 */
export async function generateUniqueShortCode(): Promise<string> {
  let shortCode: string
  let exists = true

  // Keep generating until we find a unique code
  while (exists) {
    shortCode = nanoid(SHORT_CODE_LENGTH)
    const existingUrl = await prisma.shortUrl.findUnique({
      where: { shortCode },
    })
    exists = !!existingUrl
  }

  return shortCode
}

/**
 * Create a short URL for a given original URL
 */
export async function createShortUrl(originalUrl: string, userId?: number): Promise<string> {
  // Check if we already have a short URL for this original URL and user
  const existingUrl = await prisma.shortUrl.findFirst({
    where: {
      originalUrl,
      userId: userId || null,
    },
  })

  if (existingUrl) {
    return existingUrl.shortCode
  }

  // Generate a new short code
  const shortCode = await generateUniqueShortCode()

  // Create the short URL record
  await prisma.shortUrl.create({
    data: {
      originalUrl,
      shortCode,
      userId: userId || null,
      // Set expiration to 1 year from now
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
  })

  return shortCode
}

/**
 * Get the original URL for a given short code
 */
export async function getOriginalUrl(shortCode: string): Promise<string | null> {
  const shortUrl = await prisma.shortUrl.findUnique({
    where: { shortCode },
  })

  if (!shortUrl) {
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

  return shortUrl.originalUrl
}

/**
 * Generate a full short URL including the base URL
 */
export function getFullShortUrl(shortCode: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  return `${baseUrl}/s/${shortCode}`
}


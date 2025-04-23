import { PrismaClient } from "@prisma/client"

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
const globalForPrisma = global as unknown as { prisma: PrismaClient }

// Check if we're in a browser environment
const isBrowser = typeof window !== "undefined"

// Only instantiate PrismaClient if we're on the server
export const prisma = isBrowser
  ? (null as unknown as PrismaClient) // Return null for browser
  : globalForPrisma.prisma || new PrismaClient()

if (process.env.NODE_ENV !== "production" && !isBrowser) globalForPrisma.prisma = prisma

export default prisma

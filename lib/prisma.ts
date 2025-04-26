import { PrismaClient } from "@prisma/client"

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
const globalForPrisma = global as unknown as { prisma: PrismaClient }

// Create a new PrismaClient instance
export const prisma = globalForPrisma.prisma || new PrismaClient()

// If we're not in production, attach the client to the global object
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

export default prisma

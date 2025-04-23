import { PrismaClient } from '@prisma/client'

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
// Learn more: https://pris.ly/d/help/next-js-best-practices

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Helper function to test database connection
export async function testDatabaseConnection() {
  try {
    await prisma.$connect()
    return { success: true, message: "Database connection successful" }
  } catch (error) {
    console.error("Database connection error:", error)
    return { 
      success: false, 
      message: error instanceof Error ? error.message : "Failed to connect to database" 
    }
  }
}

export default prisma

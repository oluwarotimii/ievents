// This file is just to force Prisma client regeneration
// Run this with: npx ts-node prisma/regenerate.ts

import { PrismaClient } from "@prisma/client"

async function main() {
  const prisma = new PrismaClient()

  // Test that the VerificationToken model exists
  try {
    // Just a simple query to test
    const count = await prisma.verificationToken.count()
    console.log(`VerificationToken count: ${count}`)
    console.log("Prisma client successfully regenerated with VerificationToken model!")
  } catch (error) {
    console.error("Error accessing VerificationToken model:", error)
  }

  await prisma.$disconnect()
}

main()

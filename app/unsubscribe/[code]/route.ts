import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(request: NextRequest, { params }: { params: { code: string } }) {
  const { code } = params
  const searchParams = request.nextUrl.searchParams
  const email = searchParams.get("email")

  if (!email) {
    return NextResponse.json({ success: false, message: "Email parameter is required" }, { status: 400 })
  }

  try {
    // Find the form
    const form = await prisma.form.findUnique({
      where: { code },
    })

    if (!form) {
      return NextResponse.json({ success: false, message: "Event not found" }, { status: 404 })
    }

    // Add email to unsubscribe list
    // In a real implementation, you would store unsubscribed emails in a database table
    // For now, we'll just return a success message

    return NextResponse.json({
      success: true,
      message: "You have been unsubscribed from emails for this event",
    })
  } catch (error) {
    console.error("Error unsubscribing:", error)
    return NextResponse.json({ success: false, message: "Failed to process unsubscribe request" }, { status: 500 })
  }
}


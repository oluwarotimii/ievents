import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth()
    const responseId = Number.parseInt(params.id)

    // Find the response and check if it belongs to a form owned by the user
    const response = await prisma.response.findUnique({
      where: { id: responseId },
      include: { form: true },
    })

    if (!response) {
      return NextResponse.json({ success: false, error: "Response not found" }, { status: 404 })
    }

    if (response.form.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: "You don't have permission to delete this response" },
        { status: 403 },
      )
    }

    // Delete the response
    await prisma.response.delete({
      where: { id: responseId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting response:", error)
    return NextResponse.json({ success: false, error: "Failed to delete response" }, { status: 500 })
  }
}


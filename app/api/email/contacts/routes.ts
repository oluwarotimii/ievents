export const runtime = "nodejs"

import { type NextRequest, NextResponse } from "next/server"
import { createContact, getContact } from "@/lib/brevo"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, attributes, listIds, updateEnabled = true } = body

    if (!email) {
      return NextResponse.json({ success: false, error: "Email is required" }, { status: 400 })
    }

    const result = await createContact({
      email,
      attributes,
      listIds,
      updateEnabled,
    })

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: result.data })
  } catch (error) {
    console.error("Error creating contact:", error)
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const email = url.searchParams.get("email")

    if (!email) {
      return NextResponse.json({ success: false, error: "Email parameter is required" }, { status: 400 })
    }

    const result = await getContact(email)

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: result.data })
  } catch (error) {
    console.error("Error retrieving contact:", error)
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 })
  }
}

export const runtime = "nodejs"

import { type NextRequest, NextResponse } from "next/server"
import { createEmailCampaign, createList, addContactsToList } from "@/lib/brevo"

export interface CampaignRequest {
  name: string
  subject: string
  htmlContent: string
  emails: string[]
  scheduledAt?: string
  sender?: {
    name: string
    email: string
  }
  tags?: string[]
  existingListId?: number
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CampaignRequest
    const { name, subject, htmlContent, emails, scheduledAt, sender, tags, existingListId } = body

    // Use existing list ID or create a new one
    let listId = existingListId

    if (!listId) {
      // Create a new list for this campaign
      const listResponse = await createList(`${name} - ${new Date().toISOString()}`)

      if (!listResponse.success) {
        return NextResponse.json(
          { success: false, error: `Failed to create contact list: ${listResponse.error}` },
          { status: 500 },
        )
      }

      listId = listResponse.data.id

      // Add contacts to the list
      const addContactsResponse = await addContactsToList(listId, emails)

      if (!addContactsResponse.success) {
        return NextResponse.json(
          { success: false, error: `Failed to add contacts to list: ${addContactsResponse.error}` },
          { status: 500 },
        )
      }
    }

    // Create and send campaign
    const campaignResponse = await createEmailCampaign({
      name,
      subject,
      htmlContent,
      type: "classic",
      recipients: {
        listIds: [listId],
      },
      ...(scheduledAt && { scheduledAt }),
      ...(sender && { sender }),
      ...(tags && { tags }),
    })

    if (!campaignResponse.success) {
      return NextResponse.json(
        { success: false, error: `Failed to create campaign: ${campaignResponse.error}` },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      campaignId: campaignResponse.data.id,
      listId,
    })
  } catch (error) {
    console.error("Error creating campaign:", error)
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 })
  }
}

// Get all campaigns
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const limit = Number.parseInt(url.searchParams.get("limit") || "10", 10)
    const offset = Number.parseInt(url.searchParams.get("offset") || "0", 10)

    const response = await fetch(`https://api.brevo.com/v3/emailCampaigns?limit=${limit}&offset=${offset}`, {
      method: "GET",
      headers: {
        "api-key": process.env.BREVO_API_KEY || "",
        Accept: "application/json",
      },
    })

    if (!response.ok) {
      const error = await response.json()
      return NextResponse.json({ success: false, error }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Error fetching campaigns:", error)
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 })
  }
}

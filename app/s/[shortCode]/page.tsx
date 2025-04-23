import { redirect } from "next/navigation"
import { getOriginalUrl } from "@/lib/url-shortener"
import { Loader2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function ShortUrlRedirectPage({
  params,
}: {
  params: { shortCode: string }
}) {
  const { shortCode } = params

  try {
    console.log(`Resolving short URL with code: ${shortCode}`)

    // Validate shortCode format
    if (!shortCode || shortCode.length < 5) {
      console.error(`Invalid short code format: ${shortCode}`)
      return (
        <div className="flex flex-col items-center justify-center min-h-screen">
          <h1 className="text-2xl font-bold mb-4">Invalid Link</h1>
          <p>The link format is invalid. Please check the URL and try again.</p>
          <Button asChild className="mt-4">
            <Link href="/">Go to Homepage</Link>
          </Button>
        </div>
      )
    }

    // Get the original URL
    const originalUrl = await getOriginalUrl(shortCode)

    // If the URL doesn't exist, show a 404 page
    if (!originalUrl) {
      console.error(`Short URL not found: ${shortCode}`)
      return (
        <div className="flex flex-col items-center justify-center min-h-screen">
          <h1 className="text-2xl font-bold mb-4">Link Not Found</h1>
          <p>The link you're trying to access doesn't exist or has expired.</p>
          <Button asChild className="mt-4">
            <Link href="/">Go to Homepage</Link>
          </Button>
        </div>
      )
    }

    console.log(`Redirecting to: ${originalUrl}`)

    // Redirect to the original URL
    redirect(originalUrl)

    // This is just a fallback in case the redirect doesn't work
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin mb-4" />
        <p>Redirecting to {originalUrl}...</p>
        <p className="text-sm text-muted-foreground mt-2">
          If you are not redirected automatically, please click{" "}
          <a href={originalUrl} className="text-primary underline">
            here
          </a>
        </p>
      </div>
    )
  } catch (error) {
    console.error(`Error resolving short URL: ${error}`)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold mb-4">Error</h1>
        <p>An error occurred while processing your request. Please try again later.</p>
        <Button asChild className="mt-4">
          <Link href="/">Go to Homepage</Link>
        </Button>
      </div>
    )
  }
}

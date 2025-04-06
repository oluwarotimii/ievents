import { Loader2 } from "lucide-react"

export default function Loading() {
  return (
    <div className="container flex flex-col items-center justify-center min-h-screen">
      <Loader2 className="h-8 w-8 animate-spin mb-4" />
      <p>Loading responses...</p>
    </div>
  )
}


import { 
  SkeletonText, 
  SkeletonButton,
  SkeletonCard
} from "@/components/ui/skeleton"

export default function SubscriptionCallbackLoading() {
  return (
    <div className="container mx-auto py-16 px-4 flex items-center justify-center min-h-screen">
      <SkeletonCard className="w-full max-w-md h-[300px]" />
    </div>
  )
}

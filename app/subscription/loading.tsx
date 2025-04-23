import { 
    SkeletonText, 
    SkeletonButton,
    SkeletonCard
  } from "@/components/ui/skeleton"
  
  export default function SubscriptionLoading() {
    return (
      <div className="container mx-auto py-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8 space-y-2">
            <SkeletonText className="h-8 w-64" />
            <SkeletonText className="h-4 w-80" />
          </div>
          
          <SkeletonCard className="mb-8 h-[150px]" />
          
          <div className="grid md:grid-cols-3 gap-6">
            {Array(3)
              .fill(null)
              .map((_, i) => (
                <SkeletonCard key={i} className="h-[400px]" />
              ))}
          </div>
          
          <div className="mt-16 text-center">
            <SkeletonText className="h-6 w-64 mx-auto mb-4" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
              {Array(4)
                .fill(null)
                .map((_, i) => (
                  <SkeletonCard key={i} className="h-[100px]" />
                ))}
            </div>
          </div>
        </div>
      </div>
    )
  }
  
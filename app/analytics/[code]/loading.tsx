import { 
    SkeletonText, 
    SkeletonButton,
    SkeletonCard
  } from "@/components/ui/skeleton"
  
  export default function AnalyticsLoading() {
    return (
      <div className="container mx-auto py-8">
        <div className="mb-6 space-y-4">
          <div className="flex justify-between items-center">
            <div className="space-y-2">
              <SkeletonText className="h-8 w-64" />
              <SkeletonText className="h-4 w-40" />
            </div>
            <SkeletonButton className="h-10 w-32" />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {Array(4)
            .fill(null)
            .map((_, i) => (
              <SkeletonCard key={i} className="h-[100px]" />
            ))}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonCard className="h-[400px]" />
          <SkeletonCard className="h-[400px]" />
        </div>
      </div>
    )
  }
  
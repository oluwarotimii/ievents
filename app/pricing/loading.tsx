import { 
    SkeletonText, 
    SkeletonButton,
    SkeletonCard
  } from "@/components/ui/skeleton"
  
  export default function PricingLoading() {
    return (
      <div className="container mx-auto py-16 px-4">
        <div className="text-center mb-12">
          <SkeletonText className="h-8 w-64 mx-auto mb-4" />
          <SkeletonText className="h-4 w-96 mx-auto" />
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {Array(3)
            .fill(null)
            .map((_, i) => (
              <SkeletonCard key={i} className="h-[500px]" />
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
    )
  }
  
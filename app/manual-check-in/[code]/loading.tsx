import { 
  SkeletonText, 
  SkeletonButton,
  SkeletonCard
} from "@/components/ui/skeleton"

export default function ManualCheckInLoading() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-6 space-y-4">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <SkeletonText className="h-8 w-64" />
            <SkeletonText className="h-4 w-40" />
          </div>
          <div className="flex space-x-2">
            <SkeletonButton className="h-10 w-10" />
            <SkeletonButton className="h-10 w-32" />
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <SkeletonCard className="h-[300px]" />
        </div>
        <div className="md:col-span-2">
          <div className="flex items-center space-x-2 mb-6">
            <SkeletonText className="h-10 w-full" />
            <SkeletonText className="h-4 w-32" />
          </div>
          
          <div className="rounded-lg border">
            <div className="border-b px-4 py-3 flex items-center space-x-4">
              {Array(4)
                .fill(null)
                .map((_, i) => (
                  <SkeletonText key={i} className={`h-4 ${i === 0 ? "w-[20%]" : "w-[20%]"}`} />
                ))}
            </div>
            
            {Array(6)
              .fill(null)
              .map((_, i) => (
                <div key={i} className="px-4 py-3 flex items-center space-x-4">
                  {Array(4)
                    .fill(null)
                    .map((_, j) => (
                      <SkeletonText key={j} className={`h-4 ${j === 0 ? "w-[20%]" : "w-[20%]"}`} />
                    ))}
                </div>
              ))}
          </div>
        </div>
      </div>
      
      <div className="flex justify-between items-center mt-6">
        <SkeletonButton className="h-10 w-40" />
        <SkeletonButton className="h-10 w-40" />
      </div>
    </div>
  )
}

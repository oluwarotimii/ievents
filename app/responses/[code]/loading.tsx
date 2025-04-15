import { 
  SkeletonText, 
  SkeletonButton 
} from "@/components/ui/skeleton"

export default function ResponsesLoading() {
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
        
        <div className="flex justify-between items-center">
          <SkeletonText className="h-10 w-64" />
          <SkeletonButton className="h-10 w-40" />
        </div>
      </div>
      
      <div className="rounded-lg border">
        <div className="border-b px-4 py-3 flex items-center space-x-4">
          {Array(5)
            .fill(null)
            .map((_, i) => (
              <SkeletonText key={i} className={`h-4 ${i === 0 ? "w-[5%]" : "w-[20%]"}`} />
            ))}
        </div>
        
        {Array(8)
          .fill(null)
          .map((_, i) => (
            <div key={i} className="px-4 py-3 flex items-center space-x-4">
              {Array(5)
                .fill(null)
                .map((_, j) => (
                  <SkeletonText key={j} className={`h-4 ${j === 0 ? "w-[5%]" : "w-[20%]"}`} />
                ))}
            </div>
          ))}
        
        {Array(8)
          .fill(null)
          .map((_, i) => (
            <div key={i} className="px-4 py-3 flex items-center space-x-4">
              {Array(5)
                .fill(null)
                .map((_, j) => (
                  <SkeletonText key={j} className={`h-4 ${j === 0 ? "w-[5%]" : "w-[20%]"}`} />
                ))}
            </div>
          ))}
      </div>
      
      <div className="flex justify-between items-center mt-4">
        <SkeletonText className="h-4 w-[20%]" />
        <div className="flex space-x-2">
          <SkeletonButton className="h-8 w-24" />
          <SkeletonButton className="h-8 w-24" />
        </div>
      </div>
    </div>
  )
}

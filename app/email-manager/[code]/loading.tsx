import { 
    SkeletonText, 
    SkeletonButton,
    SkeletonCard
  } from "@/components/ui/skeleton"
  
  export default function EmailManagerLoading() {
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <SkeletonCard className="h-[100px]" />
          <SkeletonCard className="h-[100px]" />
        </div>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <SkeletonText className="h-4 w-[30%]" />
            <SkeletonText className="h-10 w-full" />
          </div>
          
          <div className="space-y-2">
            <SkeletonText className="h-4 w-[30%]" />
            <SkeletonText className="h-40 w-full" />
            <SkeletonText className="h-4 w-[50%]" />
          </div>
          
          <div className="flex justify-end space-x-2">
            <SkeletonButton className="h-10 w-24" />
            <SkeletonButton className="h-10 w-40" />
          </div>
        </div>
      </div>
    )
  }
  
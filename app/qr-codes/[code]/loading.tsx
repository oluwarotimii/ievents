import { 
    SkeletonText, 
    SkeletonButton,
    SkeletonCard
  } from "@/components/ui/skeleton"
  
  export default function QRCodesLoading() {
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
        
        <div className="space-y-4">
          <div className="flex justify-center space-x-4">
            <SkeletonButton className="h-10 w-32" />
            <SkeletonButton className="h-10 w-32" />
          </div>
          
          <div className="max-w-md mx-auto">
            <SkeletonText className="h-4 w-full mb-4" />
            <SkeletonCard className="h-[300px] w-[300px] mx-auto" />
            <div className="flex justify-center space-x-2 mt-4">
              <SkeletonButton className="h-10 w-32" />
              <SkeletonButton className="h-10 w-32" />
            </div>
          </div>
        </div>
      </div>
    )
  }
  
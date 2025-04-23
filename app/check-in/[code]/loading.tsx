import { 
    SkeletonText, 
    SkeletonButton,
    SkeletonForm
  } from "@/components/ui/skeleton"
  
  export default function CheckInLoading() {
    return (
      <div className="container mx-auto py-8 px-4 max-w-md">
        <div className="rounded-lg border p-6 space-y-6">
          <div className="space-y-2">
            <SkeletonText className="h-6 w-[80%]" />
            <SkeletonText className="h-4 w-[50%]" />
          </div>
          
          <SkeletonForm rows={2} />
          
          <SkeletonButton className="w-full h-10" />
          
          <div className="flex justify-center">
            <SkeletonButton className="h-10 w-40" />
          </div>
        </div>
      </div>
    )
  }
  
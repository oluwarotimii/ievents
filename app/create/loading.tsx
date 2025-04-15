import { 
    SkeletonText, 
    SkeletonButton,
    SkeletonFormBuilder
  } from "@/components/ui/skeleton"
  
  export default function CreateFormLoading() {
    return (
      <div className="container mx-auto py-8">
        <div className="mb-6 space-y-4">
          <div className="flex justify-between items-center">
            <SkeletonText className="h-8 w-64" />
            <div className="flex space-x-2">
              <SkeletonButton className="h-10 w-32" />
              <SkeletonButton className="h-10 w-32" />
            </div>
          </div>
          <SkeletonText className="h-4 w-full" />
        </div>
        
        <SkeletonFormBuilder />
      </div>
    )
  }
  
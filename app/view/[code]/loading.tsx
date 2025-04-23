import { 
    SkeletonText, 
    SkeletonButton,
    SkeletonForm,
    SkeletonCard
  } from "@/components/ui/skeleton"
  
  export default function ViewFormLoading() {
    return (
      <div className="container mx-auto py-8 px-4 max-w-md">
        <div className="rounded-lg border p-6 space-y-6">
          <div className="space-y-2">
            <SkeletonText className="h-6 w-[80%]" />
            <SkeletonText className="h-4 w-[50%]" />
          </div>
          
          <SkeletonCard className="h-[100px]" />
          
          <SkeletonForm rows={5} />
          
          <SkeletonButton className="w-full h-10" />
        </div>
      </div>
    )
  }
  
import { 
    SkeletonText, 
    SkeletonButton,
    SkeletonForm
  } from "@/components/ui/skeleton"
  
  export default function PaymentSettingsLoading() {
    return (
      <div className="container mx-auto py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6 space-y-4">
            <div className="flex justify-between items-center">
              <div className="space-y-2">
                <SkeletonText className="h-8 w-64" />
                <SkeletonText className="h-4 w-80" />
              </div>
              <SkeletonButton className="h-10 w-32" />
            </div>
          </div>
          
          <SkeletonForm rows={5} />
          
          <div className="flex justify-between mt-6">
            <SkeletonButton className="h-10 w-24" />
            <SkeletonButton className="h-10 w-48" />
          </div>
        </div>
      </div>
    )
  }
  
import { 
  SkeletonText, 
  SkeletonButton, 
  SkeletonDashboardCard 
} from "@/components/ui/skeleton"

export default function DashboardLoading() {
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
            <SkeletonButton className="h-10 w-32" />
          </div>
        </div>
        
        <div className="flex justify-between items-center p-3 bg-muted rounded-md">
          <div className="space-y-1">
            <SkeletonText className="h-5 w-40" />
            <SkeletonText className="h-4 w-32" />
          </div>
          <SkeletonButton className="h-9 w-36" />
        </div>
        
        <div className="flex justify-between items-center">
          <SkeletonText className="h-10 w-64" />
          <SkeletonButton className="h-10 w-40" />
        </div>
      </div>
      
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array(6)
          .fill(null)
          .map((_, i) => (
            <SkeletonDashboardCard key={i} />
          ))}
      </div>
    </div>
  )
}

import { SkeletonDashboardCard } from "@/components/ui/skeleton"

export default function FormsLoading() {
  return (
    <div className="container py-8">
      <div className="mb-8">
        <div className="h-8 w-48 bg-muted animate-pulse rounded-md mb-2" />
        <div className="h-4 w-96 bg-muted animate-pulse rounded-md" />
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

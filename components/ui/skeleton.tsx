import { cn } from "@/lib/utils"

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

export function SkeletonText({ className, ...props }: SkeletonProps) {
  return (
    <Skeleton
      className={cn("h-4 w-full", className)}
      {...props}
    />
  )
}

export function SkeletonCircle({ className, ...props }: SkeletonProps) {
  return (
    <Skeleton
      className={cn("h-10 w-10 rounded-full", className)}
      {...props}
    />
  )
}

export function SkeletonButton({ className, ...props }: SkeletonProps) {
  return (
    <Skeleton
      className={cn("h-10 w-24", className)}
      {...props}
    />
  )
}

export function SkeletonCard({ className, ...props }: SkeletonProps) {
  return (
    <Skeleton
      className={cn("h-[180px] w-full rounded-xl", className)}
      {...props}
    />
  )
}

export function SkeletonAvatar({ className, ...props }: SkeletonProps) {
  return (
    <Skeleton
      className={cn("h-12 w-12 rounded-full", className)}
      {...props}
    />
  )
}

export function SkeletonTableRow({ columns = 4, className, ...props }: SkeletonProps & { columns?: number }) {
  return (
    <div className={cn("flex w-full items-center space-x-4 py-3", className)} {...props}>
      {Array(columns)
        .fill(null)
        .map((_, i) => (
          <SkeletonText key={i} className={`h-4 ${i === 0 ? "w-[20%]" : "w-full"}`} />
        ))}
    </div>
  )
}

export function SkeletonForm({ rows = 4, className, ...props }: SkeletonProps & { rows?: number }) {
  return (
    <div className={cn("space-y-6", className)} {...props}>
      {Array(rows)
        .fill(null)
        .map((_, i) => (
          <div key={i} className="space-y-2">
            <SkeletonText className="h-4 w-[30%]" />
            <SkeletonText className="h-10 w-full" />
          </div>
        ))}
      <SkeletonButton className="mt-4" />
    </div>
  )
}

export function SkeletonDashboardCard({ className, ...props }: SkeletonProps) {
  return (
    <div className={cn("rounded-lg border p-4", className)} {...props}>
      <SkeletonText className="h-6 w-[60%] mb-4" />
      <SkeletonText className="h-10 w-[40%] mb-2" />
      <SkeletonText className="h-4 w-[80%]" />
    </div>
  )
}

export function SkeletonFormBuilder({ className, ...props }: SkeletonProps) {
  return (
    <div className={cn("space-y-6", className)} {...props}>
      <SkeletonText className="h-8 w-[50%]" />
      <div className="space-y-4">
        {Array(3)
          .fill(null)
          .map((_, i) => (
            <div key={i} className="rounded-lg border p-4">
              <div className="flex justify-between mb-4">
                <SkeletonText className="h-6 w-[40%]" />
                <SkeletonButton className="h-8 w-20" />
              </div>
              <SkeletonText className="h-10 w-full mb-2" />
              <SkeletonText className="h-4 w-[70%]" />
            </div>
          ))}
      </div>
      <div className="flex justify-end space-x-2">
        <SkeletonButton />
        <SkeletonButton />
      </div>
    </div>
  )
}

export function SkeletonResponseList({ className, rows = 5, ...props }: SkeletonProps & { rows?: number }) {
  return (
    <div className={cn("space-y-4", className)} {...props}>
      <div className="flex justify-between items-center">
        <SkeletonText className="h-6 w-[30%]" />
        <SkeletonButton className="h-9 w-32" />
      </div>
      <div className="rounded-lg border">
        <div className="border-b px-4 py-3 flex items-center space-x-4">
          {Array(4)
            .fill(null)
            .map((_, i) => (
              <SkeletonText key={i} className={`h-4 ${i === 0 ? "w-[5%]" : "w-[20%]"}`} />
            ))}
        </div>
        {Array(rows)
          .fill(null)
          .map((_, i) => (
            <div key={i} className="px-4 py-3 flex items-center space-x-4">
              {Array(4)
                .fill(null)
                .map((_, j) => (
                  <SkeletonText key={j} className={`h-4 ${j === 0 ? "w-[5%]" : "w-[20%]"}`} />
                ))}
            </div>
          ))}
      </div>
      <div className="flex justify-between items-center">
        <SkeletonText className="h-4 w-[20%]" />
        <div className="flex space-x-2">
          <SkeletonButton className="h-8 w-8" />
          <SkeletonButton className="h-8 w-8" />
        </div>
      </div>
    </div>
  )
}

import React from 'react'
import { Skeleton } from "@/components/ui/skeleton";

const SkeletonLoader = () => {
  return (
     <div className="p-4 md:p-6 space-y-4">
        <Skeleton className="h-10 w-1/3" />
        <div className="flex flex-col md:flex-row items-center gap-4">
          <Skeleton className="h-32 w-32 rounded-full" />
          <div className="space-y-2 flex-1 w-full">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-full" />{" "}
            {/* Skeleton for company_name */}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      </div>
  )
}

export default SkeletonLoader
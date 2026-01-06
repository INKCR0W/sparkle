import React from 'react'
import { Skeleton } from '@heroui/react'

export const PageSkeleton: React.FC = () => (
  <div className="w-full h-full p-4">
    <Skeleton className="h-8 w-48 rounded-lg mb-4" />
    <Skeleton className="h-4 w-32 rounded-lg mb-6" />
    <div className="space-y-3">
      <Skeleton className="h-16 w-full rounded-lg" />
      <Skeleton className="h-16 w-full rounded-lg" />
      <Skeleton className="h-16 w-full rounded-lg" />
    </div>
  </div>
)

export const CardSkeleton: React.FC<{ iconOnly?: boolean }> = ({ iconOnly }) => {
  if (iconOnly) {
    return <Skeleton className="w-10 h-10 rounded-lg mx-auto" />
  }
  return <Skeleton className="h-[76px] w-full rounded-lg" />
}

export const ChartSkeleton: React.FC = () => (
  <Skeleton className="absolute top-0 left-0 h-full w-full rounded-[14px]" />
)

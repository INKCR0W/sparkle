import React, { useMemo, lazy, Suspense } from 'react'
import { ChartSkeleton } from '@renderer/components/base/skeleton'

export interface TrafficChartProps {
  data: Array<{ traffic: number; index: number }>
  isActive: boolean
}

const RechartsChart = lazy(() => import('./recharts-chart'))

const TrafficChart: React.FC<TrafficChartProps> = (props) => {
  const { data, isActive } = props

  const gradientId = useMemo(
    () => `traffic-gradient-${isActive ? 'active' : 'inactive'}`,
    [isActive]
  )

  const validData = useMemo(() => {
    if (!data || data.length === 0) {
      return Array(10)
        .fill(0)
        .map((v, i) => ({ traffic: v, index: i }))
    }
    return data.slice()
  }, [data])

  const chartColor = useMemo(() => {
    return isActive ? 'hsl(var(--heroui-primary-foreground))' : 'hsl(var(--heroui-foreground))'
  }, [isActive])

  return (
    <Suspense fallback={<ChartSkeleton />}>
      <RechartsChart data={validData} gradientId={gradientId} chartColor={chartColor} />
    </Suspense>
  )
}

export default React.memo(TrafficChart, (prevProps, nextProps) => {
  return (
    prevProps.isActive === nextProps.isActive &&
    JSON.stringify(prevProps.data) === JSON.stringify(nextProps.data)
  )
})

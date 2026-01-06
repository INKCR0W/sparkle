import React from 'react'
import { Area, AreaChart, ResponsiveContainer } from 'recharts'

export interface RechartsChartProps {
  data: Array<{ traffic: number; index: number }>
  gradientId: string
  chartColor: string
}

const RechartsChart: React.FC<RechartsChartProps> = ({ data, gradientId, chartColor }) => {
  return (
    <ResponsiveContainer
      height="100%"
      width="100%"
      minWidth={1}
      minHeight={1}
      className="absolute top-0 left-0 pointer-events-none rounded-[14px]"
    >
      <AreaChart data={data} margin={{ top: 50, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={chartColor} stopOpacity={0.8} />
            <stop offset="100%" stopColor={chartColor} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          isAnimationActive={false}
          type="monotone"
          dataKey="traffic"
          stroke="none"
          fill={`url(#${gradientId})`}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export default RechartsChart

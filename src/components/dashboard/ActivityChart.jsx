import React from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

const data = [
  { name: 'Seg', uploads: 4, views: 2400 },
  { name: 'Ter', uploads: 3, views: 1398 },
  { name: 'Qua', uploads: 7, views: 9800 },
  { name: 'Qui', uploads: 5, views: 3908 },
  { name: 'Sex', uploads: 8, views: 4800 },
  { name: 'Sáb', uploads: 12, views: 8200 },
  { name: 'Dom', uploads: 6, views: 4300 },
]

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card rounded-lg p-3 border border-white/10">
        <p className="text-sm font-medium text-kamui-white mb-2">{label}</p>
        <div className="space-y-1">
          <p className="text-xs text-kamui-red-light">
            Uploads: {payload[0]?.value}
          </p>
          <p className="text-xs text-kamui-white-muted">
            Views: {payload[1]?.value?.toLocaleString()}
          </p>
        </div>
      </div>
    )
  }
  return null
}

function ActivityChart() {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorUploads" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#c41e3a" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#c41e3a" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3a3a3a" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#3a3a3a" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="rgba(255,255,255,0.05)" 
            vertical={false}
          />
          <XAxis 
            dataKey="name" 
            stroke="#a0a0a0" 
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            stroke="#a0a0a0" 
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="uploads"
            stroke="#c41e3a"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorUploads)"
          />
          <Area
            type="monotone"
            dataKey="views"
            stroke="#3a3a3a"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorViews)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export default ActivityChart

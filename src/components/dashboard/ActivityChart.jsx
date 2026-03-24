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

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const byKey = Object.fromEntries(payload.map((p) => [p.dataKey, p.value]))
    return (
      <div className="glass-card rounded-lg p-3 border border-white/10">
        <p className="text-sm font-medium text-kamui-white mb-2">{label}</p>
        <div className="space-y-1">
          <p className="text-xs text-kamui-red-light">
            Uploads (YouTube): {byKey.uploads ?? 0}
          </p>
          <p className="text-xs text-amber-300">
            Exclusoes (YouTube): {byKey.youtubeDeleted ?? 0}
          </p>
          <p className="text-xs text-kamui-white-muted">
            Exclusoes (local): {byKey.localDeleted ?? 0}
          </p>
        </div>
      </div>
    )
  }
  return null
}

function ActivityChart({ data = [] }) {
  if (!data.length) {
    return (
      <div className="flex h-64 min-h-64 items-center justify-center text-sm text-kamui-white-muted">
        Sem dados de atividade para os últimos dias.
      </div>
    )
  }

  const chartData = data.map((d) => ({
    name: d.name,
    uploads: d.uploads_youtube ?? d.uploads ?? 0,
    youtubeDeleted: d.youtube_deleted ?? 0,
    localDeleted: d.local_deleted ?? 0,
  }))

  return (
    <div className="h-full min-h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorUploads" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#c41e3a" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#c41e3a" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorDeletedYoutube" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorDeletedLocal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#7b8292" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#7b8292" stopOpacity={0} />
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
            dataKey="youtubeDeleted"
            stroke="#f59e0b"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorDeletedYoutube)"
          />
          <Area
            type="monotone"
            dataKey="localDeleted"
            stroke="#7b8292"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorDeletedLocal)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export default ActivityChart

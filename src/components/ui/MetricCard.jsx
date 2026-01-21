import React from 'react'
import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown } from 'lucide-react'

function MetricCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend, 
  trendValue,
  className 
}) {
  const isPositive = trend === 'up'
  
  return (
    <div className={cn(
      'metric-card glass-card rounded-xl p-5 relative overflow-hidden group',
      className
    )}>
      {/* Background Gradient */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-kamui-red/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="flex items-start justify-between relative z-10">
        <div className="flex-1">
          <p className="text-sm text-kamui-white-muted mb-1">{title}</p>
          <p className="text-3xl font-bold text-kamui-white mb-1">{value}</p>
          {subtitle && (
            <p className="text-xs text-kamui-white-muted">{subtitle}</p>
          )}
          {trend && trendValue && (
            <div className={cn(
              'flex items-center gap-1 mt-2 text-xs',
              isPositive ? 'text-green-400' : 'text-red-400'
            )}>
              {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              <span>{trendValue}</span>
            </div>
          )}
        </div>
        
        {Icon && (
          <div className="w-12 h-12 rounded-lg bg-kamui-red/10 flex items-center justify-center group-hover:bg-kamui-red/20 transition-colors">
            <Icon className="w-6 h-6 text-kamui-red" />
          </div>
        )}
      </div>
    </div>
  )
}

export default MetricCard

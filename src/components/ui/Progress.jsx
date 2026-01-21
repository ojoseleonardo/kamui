import React from 'react'
import { cn } from '@/lib/utils'

function Progress({ value = 0, max = 100, className, showLabel = false }) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100))
  
  return (
    <div className={cn('w-full', className)}>
      <div className="h-2 bg-kamui-gray rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-kamui-red-dark to-kamui-red transition-all duration-500 ease-out rounded-full relative"
          style={{ width: `${percentage}%` }}
        >
          {/* Glow effect */}
          <div className="absolute inset-0 bg-kamui-red-glow/30 blur-sm" />
        </div>
      </div>
      {showLabel && (
        <div className="flex justify-between mt-1 text-xs text-kamui-white-muted">
          <span>{value}</span>
          <span>{max}</span>
        </div>
      )}
    </div>
  )
}

export default Progress

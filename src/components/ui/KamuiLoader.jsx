import React from 'react'
import { cn } from '@/lib/utils'

function KamuiLoader({ size = 'md', className }) {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
  }

  return (
    <div className={cn('relative flex items-center justify-center', sizes[size], className)}>
      {/* Outer Spiral */}
      <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-kamui-red animate-spin" />
      
      {/* Middle Spiral */}
      <div 
        className="absolute inset-2 rounded-full border-2 border-transparent border-t-kamui-red-glow animate-spin"
        style={{ animationDuration: '0.8s', animationDirection: 'reverse' }}
      />
      
      {/* Inner Spiral */}
      <div 
        className="absolute inset-4 rounded-full border-2 border-transparent border-t-kamui-red-light animate-spin"
        style={{ animationDuration: '0.5s' }}
      />
      
      {/* Center Dot */}
      <div className="w-2 h-2 rounded-full bg-kamui-red animate-pulse" />
      
      {/* Vortex Effect */}
      <svg className="absolute inset-0 w-full h-full animate-spin" style={{ animationDuration: '3s' }}>
        <defs>
          <linearGradient id="vortexGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(196, 30, 58, 0)" />
            <stop offset="50%" stopColor="rgba(196, 30, 58, 0.5)" />
            <stop offset="100%" stopColor="rgba(196, 30, 58, 0)" />
          </linearGradient>
        </defs>
        <path
          d="M50,10 Q90,50 50,90 Q10,50 50,10"
          fill="none"
          stroke="url(#vortexGradient)"
          strokeWidth="1"
          className="opacity-50"
          transform="translate(-26, -26)"
        />
      </svg>
    </div>
  )
}

export default KamuiLoader

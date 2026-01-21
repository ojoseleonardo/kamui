import React from 'react'
import { cn } from '@/lib/utils'

function SharinganIcon({ size = 40, animated = false, className }) {
  return (
    <div 
      className={cn(
        'relative flex items-center justify-center',
        animated && 'sharingan-pulse',
        className
      )}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 100 100"
        className={cn('w-full h-full', animated && 'sharingan-spin')}
      >
        {/* Outer Ring */}
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="url(#sharinganGradient)"
          strokeWidth="3"
        />
        
        {/* Iris Background */}
        <circle
          cx="50"
          cy="50"
          r="42"
          fill="#1a0000"
        />
        
        {/* Red Iris */}
        <circle
          cx="50"
          cy="50"
          r="38"
          fill="url(#irisGradient)"
        />
        
        {/* Inner Black Ring */}
        <circle
          cx="50"
          cy="50"
          r="25"
          fill="none"
          stroke="#0a0a0a"
          strokeWidth="2"
        />
        
        {/* Pupil */}
        <circle
          cx="50"
          cy="50"
          r="12"
          fill="#0a0a0a"
        />
        
        {/* Tomoe 1 */}
        <g transform="rotate(0, 50, 50)">
          <path
            d="M50 20 Q60 30 50 35 Q40 30 50 20"
            fill="#0a0a0a"
          />
          <circle cx="50" cy="25" r="4" fill="#0a0a0a" />
        </g>
        
        {/* Tomoe 2 */}
        <g transform="rotate(120, 50, 50)">
          <path
            d="M50 20 Q60 30 50 35 Q40 30 50 20"
            fill="#0a0a0a"
          />
          <circle cx="50" cy="25" r="4" fill="#0a0a0a" />
        </g>
        
        {/* Tomoe 3 */}
        <g transform="rotate(240, 50, 50)">
          <path
            d="M50 20 Q60 30 50 35 Q40 30 50 20"
            fill="#0a0a0a"
          />
          <circle cx="50" cy="25" r="4" fill="#0a0a0a" />
        </g>
        
        {/* Highlight */}
        <ellipse
          cx="40"
          cy="40"
          rx="5"
          ry="3"
          fill="rgba(255,255,255,0.2)"
          transform="rotate(-30, 40, 40)"
        />
        
        {/* Gradients */}
        <defs>
          <radialGradient id="irisGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ff2d55" />
            <stop offset="50%" stopColor="#c41e3a" />
            <stop offset="100%" stopColor="#8b0000" />
          </radialGradient>
          <linearGradient id="sharinganGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#c41e3a" />
            <stop offset="50%" stopColor="#ff2d55" />
            <stop offset="100%" stopColor="#c41e3a" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  )
}

export default SharinganIcon

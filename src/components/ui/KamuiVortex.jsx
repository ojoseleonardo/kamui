import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

function KamuiVortex({ isActive = false, children, className }) {
  return (
    <div className={cn('relative', className)}>
      {isActive && (
        <>
          {/* Outer Vortex Ring */}
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-kamui-red/30"
            animate={{
              rotate: 360,
              scale: [1, 1.1, 1],
            }}
            transition={{
              rotate: { duration: 3, repeat: Infinity, ease: 'linear' },
              scale: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
            }}
          />
          
          {/* Middle Vortex Ring */}
          <motion.div
            className="absolute inset-2 rounded-full border-2 border-kamui-red/50"
            animate={{
              rotate: -360,
              scale: [1, 0.95, 1],
            }}
            transition={{
              rotate: { duration: 2, repeat: Infinity, ease: 'linear' },
              scale: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' },
            }}
          />
          
          {/* Inner Vortex Ring */}
          <motion.div
            className="absolute inset-4 rounded-full border-2 border-kamui-red-glow/70"
            animate={{
              rotate: 360,
              scale: [1, 1.05, 1],
            }}
            transition={{
              rotate: { duration: 1.5, repeat: Infinity, ease: 'linear' },
              scale: { duration: 1, repeat: Infinity, ease: 'easeInOut' },
            }}
          />
          
          {/* Spiral Effect */}
          <motion.div
            className="absolute inset-0"
            style={{
              background: `conic-gradient(from 0deg, transparent 0deg, rgba(196, 30, 58, 0.3) 30deg, transparent 60deg)`,
            }}
            animate={{ rotate: 360 }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        </>
      )}
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}

// Kamui Teleport Animation Overlay
function KamuiTeleport({ isActive, onComplete }) {
  if (!isActive) return null

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="relative w-64 h-64"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        {/* Outer Spiral */}
        <motion.svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 100 100"
          animate={{ rotate: 720 }}
          transition={{ duration: 2, ease: 'easeInOut' }}
          onAnimationComplete={onComplete}
        >
          <defs>
            <linearGradient id="vortexGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#c41e3a" />
              <stop offset="100%" stopColor="#ff2d55" />
            </linearGradient>
          </defs>
          
          {[0, 1, 2, 3, 4].map((i) => (
            <motion.circle
              key={i}
              cx="50"
              cy="50"
              r={45 - i * 8}
              fill="none"
              stroke="url(#vortexGradient)"
              strokeWidth="2"
              strokeDasharray="10 5"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1 - i * 0.15, scale: 1 }}
              transition={{ delay: i * 0.1 }}
            />
          ))}
        </motion.svg>
        
        {/* Center Point */}
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-kamui-red rounded-full"
          animate={{
            scale: [1, 1.5, 0],
            opacity: [1, 1, 0],
          }}
          transition={{
            duration: 2,
            ease: 'easeInOut',
          }}
        />
      </motion.div>
      
      {/* Text */}
      <motion.p
        className="absolute bottom-1/4 text-kamui-white text-lg font-display tracking-wider"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        KAMUI
      </motion.p>
    </motion.div>
  )
}

// Loading Dots with Kamui Style
function KamuiDots({ className }) {
  return (
    <div className={cn('flex items-center gap-1', className)}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 bg-kamui-red rounded-full"
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: i * 0.2,
          }}
        />
      ))}
    </div>
  )
}

export { KamuiVortex, KamuiTeleport, KamuiDots }

import React from 'react'
import { cn } from '@/lib/utils'

const variants = {
  default: 'bg-kamui-gray hover:bg-kamui-gray-light text-kamui-white',
  primary: 'bg-gradient-to-r from-kamui-red-dark to-kamui-red hover:shadow-kamui text-white',
  outline: 'border border-kamui-gray-light hover:border-kamui-red/50 hover:bg-kamui-red/10 text-kamui-white',
  ghost: 'hover:bg-white/5 text-kamui-white-muted hover:text-kamui-white',
  danger: 'bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-600/30',
}

const sizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
  icon: 'p-2',
}

function Button({ 
  children, 
  variant = 'default', 
  size = 'md', 
  className, 
  disabled,
  loading,
  ...props 
}) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-300',
        'focus:outline-none focus:ring-2 focus:ring-kamui-red/50 focus:ring-offset-2 focus:ring-offset-kamui-black',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {children}
    </button>
  )
}

export default Button

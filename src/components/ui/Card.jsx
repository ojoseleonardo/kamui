import React from 'react'
import { cn } from '@/lib/utils'

function Card({ children, className, hover = true, ...props }) {
  return (
    <div
      className={cn(
        'glass-card rounded-xl p-5',
        hover && 'hover:border-kamui-red/30 hover:shadow-kamui transition-all duration-300',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

function CardHeader({ children, className }) {
  return (
    <div className={cn('mb-4', className)}>
      {children}
    </div>
  )
}

function CardTitle({ children, className }) {
  return (
    <h3 className={cn('text-lg font-semibold text-kamui-white', className)}>
      {children}
    </h3>
  )
}

function CardDescription({ children, className }) {
  return (
    <p className={cn('text-sm text-kamui-white-muted mt-1', className)}>
      {children}
    </p>
  )
}

function CardContent({ children, className }) {
  return (
    <div className={cn('', className)}>
      {children}
    </div>
  )
}

export { Card, CardHeader, CardTitle, CardDescription, CardContent }

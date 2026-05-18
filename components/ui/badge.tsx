import * as React from 'react'
import { cn } from '@/lib/utils'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'amber' | 'green' | 'red' | 'blue'
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        {
          'bg-white/10 text-white/70': variant === 'default',
          'bg-amber-500/20 text-amber-400': variant === 'amber',
          'bg-green-500/20 text-green-400': variant === 'green',
          'bg-red-500/20 text-red-400': variant === 'red',
          'bg-blue-500/20 text-blue-400': variant === 'blue',
        },
        className
      )}
      {...props}
    />
  )
}

export { Badge }

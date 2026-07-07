import * as React from 'react'
import { cn } from '@/lib/utils'

export function Input({ className, type, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type={type}
      className={cn(
        'w-full rounded-xl border border-line bg-white px-4 py-2.5 text-sm text-ink placeholder:text-ghost',
        'focus:outline-none focus:ring-2 focus:ring-accent/70 focus:border-accent transition-all duration-200',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-muted-fill',
        className
      )}
      {...props}
    />
  )
}

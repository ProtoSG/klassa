import * as React from 'react'
import { cn } from '@/lib/utils'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'accent'
  size?: 'sm' | 'md' | 'lg'
}

const base =
  'inline-flex items-center justify-center gap-2 rounded-xl text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50 disabled:pointer-events-none hover:scale-[1.02] active:scale-[0.98]'

const variants: Record<NonNullable<ButtonProps['variant']>, string> = {
  default: 'bg-ink text-white shadow-card hover:shadow-hover',
  outline: 'bg-white border border-trim text-ink hover:bg-muted-fill',
  ghost: 'text-prose hover:bg-muted-fill',
  accent: 'bg-accent text-ink shadow-card hover:shadow-hover',
}

const sizes: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-5 py-2.5',
  lg: 'px-6 py-3 text-base',
}

export function Button({
  className,
  variant = 'default',
  size = 'md',
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    />
  )
}

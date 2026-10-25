import { A } from './A'
import type { ReactNode } from 'react'

const VARIANTS = {
  primary: 'bg-primary text-white hover:bg-primary-dark',
  secondary: 'border border-primary bg-surface text-primary hover:bg-primary-50',
  inverse: 'border border-white text-white hover:bg-white/10',
} as const

export function Button({
  href,
  children,
  variant = 'primary',
  className = '',
}: {
  href: string
  children: ReactNode
  variant?: keyof typeof VARIANTS
  className?: string
}) {
  return (
    <A
      href={href}
      className={`inline-flex min-h-11 items-center justify-center rounded-md px-4 text-sm font-medium no-underline ${VARIANTS[variant]} ${className}`}
    >
      {children}
    </A>
  )
}

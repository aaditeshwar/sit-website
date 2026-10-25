import type { ReactNode } from 'react'

export function Section({
  children,
  alternate = false,
  className = '',
}: {
  children: ReactNode
  alternate?: boolean
  className?: string
}) {
  return (
    <section className={`${alternate ? 'bg-surface-alt' : 'bg-surface'} py-14 md:py-24 ${className}`}>
      <div className="mx-auto max-w-page px-4 md:px-6">{children}</div>
    </section>
  )
}

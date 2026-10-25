import { forwardRef, type AnchorHTMLAttributes } from 'react'
import { useLocation } from 'react-router-dom'
import { publicHref } from '../lib/url'

export function usePublicHref(): (href: string) => string {
  const { pathname } = useLocation()
  return (href: string) => publicHref(pathname, href)
}

export const A = forwardRef<HTMLAnchorElement, AnchorHTMLAttributes<HTMLAnchorElement>>(function A(
  { href, ...props },
  ref,
) {
  const { pathname } = useLocation()
  const resolved = typeof href === 'string' ? publicHref(pathname, href) : href
  return <a ref={ref} {...props} href={resolved} />
})

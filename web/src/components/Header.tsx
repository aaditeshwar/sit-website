import { A } from './A'
import { Menu, Search, X } from 'lucide-react'
import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { useLocation } from 'react-router-dom'
import { normalisePath, site } from '../lib/content'
import { publicHref } from '../lib/url'
import { featuredFor } from '../lib/document'
import { StageBadge } from './Badge'
import { Button } from './Button'
import { ResponsiveImage } from './ResponsiveImage'

function covers(href: string, path: string): boolean {
  if (href === '/') return path === '/'
  return path === href || path.startsWith(`${href}/`)
}

export function Header() {
  const { pathname } = useLocation()
  const path = normalisePath(pathname)
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mobileSection, setMobileSection] = useState<number | null>(null)
  const [shrunk, setShrunk] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const topRefs = useRef<Array<HTMLAnchorElement | null>>([])
  const panelRef = useRef<HTMLDivElement>(null)
  const drawerRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const focusPanel = useRef(false)

  const openItem = openIndex !== null ? site.nav[openIndex] : undefined
  const featured = openItem ? featuredFor(openItem.href) : undefined

  useEffect(() => {
    const onScroll = () => setShrunk(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setOpenIndex(null)
    setMobileOpen(false)
    setSearchOpen(false)
  }, [path])

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus()
  }, [searchOpen])

  useEffect(() => {
    if (!focusPanel.current || openIndex === null) return
    focusPanel.current = false
    panelRef.current?.querySelector('a')?.focus()
  }, [openIndex])

  useEffect(() => {
    const media = window.matchMedia('(min-width: 1024px)')
    const onChange = () => {
      if (media.matches) setMobileOpen(false)
    }
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    if (!mobileOpen) return
    const drawer = drawerRef.current
    if (!drawer) return
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const focusable = () =>
      [...drawer.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled])')].filter(
        (element) => !element.hasAttribute('disabled'),
      )
    focusable()[0]?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        setMobileOpen(false)
        return
      }
      if (event.key !== 'Tab') return
      const items = focusable()
      if (items.length === 0) return
      const first = items[0]
      const last = items[items.length - 1]
      if (!first || !last) return
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
      previous?.focus()
    }
  }, [mobileOpen])

  function focusTop(index: number) {
    const item = site.nav[index]
    setOpenIndex(item?.children?.length ? index : null)
    topRefs.current[index]?.focus()
  }

  function onTopKeyDown(event: ReactKeyboardEvent<HTMLAnchorElement>, index: number, hasChildren: boolean) {
    const last = site.nav.length - 1
    if (event.key === 'ArrowRight') {
      event.preventDefault()
      focusTop(index === last ? 0 : index + 1)
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault()
      focusTop(index === 0 ? last : index - 1)
    } else if (event.key === 'Home') {
      event.preventDefault()
      focusTop(0)
    } else if (event.key === 'End') {
      event.preventDefault()
      focusTop(last)
    } else if (event.key === 'ArrowDown' && hasChildren) {
      event.preventDefault()
      if (openIndex === index) panelRef.current?.querySelector('a')?.focus()
      else {
        focusPanel.current = true
        setOpenIndex(index)
      }
    } else if (event.key === 'Escape') {
      setOpenIndex(null)
    }
  }

  function onPanelKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (openIndex === null) return
    if (event.key === 'Escape') {
      event.preventDefault()
      const index = openIndex
      setOpenIndex(null)
      topRefs.current[index]?.focus()
      return
    }
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
    const links = [...(panelRef.current?.querySelectorAll('a') ?? [])]
    const current = links.findIndex((link) => link === document.activeElement)
    if (current < 0) return
    event.preventDefault()
    if (event.key === 'ArrowDown') links[current + 1]?.focus()
    else if (current === 0) topRefs.current[openIndex]?.focus()
    else links[current - 1]?.focus()
  }

  return (
    <header
      className="sticky top-0 z-40 bg-surface"
      data-pagefind-ignore
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpenIndex(null)
      }}
    >
      <div className="bg-dark text-white">
        <nav aria-label="Utility" className="mx-auto flex h-8 max-w-page items-center gap-4 px-4 text-[13px] md:px-6">
          {site.utility_nav.map((item) => (
            <A key={item.href} className="hover:underline" href={item.href}>
              {item.label}
            </A>
          ))}
        </nav>
      </div>
      <div className="relative border-b border-line" onMouseLeave={() => setOpenIndex(null)}>
        <div
          className={`mx-auto flex max-w-page items-center gap-3 px-4 md:px-6 ${shrunk ? 'py-2' : 'py-3'} transition-[padding] duration-200`}
        >
          <A
            href="/"
            aria-label={site.name}
            aria-current={path === '/' ? 'page' : undefined}
            className="flex min-w-0 items-center gap-2.5 bg-white"
            style={{ colorScheme: 'only light' }}
          >
            <ResponsiveImage
              src={site.logo}
              alt=""
              seed="logo"
              sizes="56px"
              className={`shrink-0 bg-white object-cover object-left ${shrunk ? 'h-9 w-9' : 'h-11 w-11 sm:h-14 sm:w-14'}`}
            />
            <span className="font-heading font-semibold leading-tight" style={{ color: '#1F2328' }}>
              <span className={`block whitespace-nowrap ${shrunk ? 'text-[11px]' : 'text-[11px] sm:text-sm'}`}>
                Amar Nath and Shashi Khosla
              </span>
              <span className={`block whitespace-nowrap ${shrunk ? 'text-[11px]' : 'text-[11px] sm:text-sm'}`}>
                School of Information Technology
              </span>
              <span className={`block font-medium ${shrunk ? 'text-[10px]' : 'text-[11px] sm:text-xs'}`}>IIT Delhi</span>
            </span>
          </A>
          <nav aria-label="Primary" className="hidden flex-1 items-center justify-center gap-1 lg:flex">
            {site.nav.map((item, index) => {
              const hasChildren = Boolean(item.children?.length)
              const active =
                covers(item.href, path) || item.children?.some((child) => covers(child.href, path))
              return (
                <A
                  key={item.href}
                  ref={(node) => {
                    topRefs.current[index] = node
                  }}
                  href={item.href}
                  aria-current={path === item.href ? 'page' : undefined}
                  aria-expanded={hasChildren ? openIndex === index : undefined}
                  aria-controls={hasChildren ? 'mega-panel' : undefined}
                  onMouseEnter={() => setOpenIndex(hasChildren ? index : null)}
                  onKeyDown={(event) => onTopKeyDown(event, index, hasChildren)}
                  className={`rounded-md px-2.5 py-2 text-sm font-medium ${active ? 'text-primary' : 'text-ink'} hover:text-primary`}
                >
                  {item.label}
                </A>
              )
            })}
          </nav>
          <form action={publicHref(pathname, '/search')} method="get" role="search" className="ml-auto flex items-center gap-1" onMouseEnter={() => setOpenIndex(null)}>
            <label htmlFor="site-search" className="sr-only">
              Search
            </label>
            <input
              ref={searchRef}
              id="site-search"
              name="q"
              type="search"
              placeholder="Search"
              onKeyDown={(event) => {
                if (event.key === 'Escape') setSearchOpen(false)
              }}
              className={`h-11 rounded-md border border-line px-3 text-sm text-ink ${searchOpen ? 'w-36 sm:w-48' : 'sr-only'}`}
            />
            <button
              type="submit"
              aria-label="Search"
              aria-expanded={searchOpen}
              aria-controls="site-search"
              className="inline-flex h-11 w-11 items-center justify-center rounded-md text-ink hover:text-primary"
              onClick={(event) => {
                if (searchOpen) return
                event.preventDefault()
                setOpenIndex(null)
                setSearchOpen(true)
              }}
            >
              <Search aria-hidden="true" className="h-5 w-5" />
            </button>
            <Button href={site.primary_cta.href} className="hidden sm:inline-flex">
              {site.primary_cta.label}
            </Button>
            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-md text-ink lg:hidden"
              aria-expanded={mobileOpen}
              aria-controls="mobile-menu"
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              onClick={() => {
                setOpenIndex(null)
                setMobileOpen((open) => !open)
              }}
            >
              {mobileOpen ? <X aria-hidden="true" className="h-6 w-6" /> : <Menu aria-hidden="true" className="h-6 w-6" />}
            </button>
          </form>
        </div>
        <div
          id="mega-panel"
          ref={panelRef}
          hidden={openIndex === null}
          aria-label={openItem ? `${openItem.label} menu` : undefined}
          onKeyDown={onPanelKeyDown}
          className="absolute left-0 right-0 top-full z-40 border-t border-line bg-surface shadow-lg"
        >
          {openItem?.children?.length ? (
            <div className="mx-auto grid max-w-page gap-8 px-6 py-8 lg:grid-cols-[minmax(0,1fr)_280px]">
              <ul className="grid max-w-xl content-start gap-x-6 gap-y-1 sm:grid-cols-2">
                {openItem.children.map((child) => (
                  <li key={child.href}>
                    <A
                      href={child.href}
                      aria-current={path === child.href ? 'page' : undefined}
                      className="block rounded-md px-3 py-2 text-sm font-medium text-ink hover:bg-surface-alt hover:text-primary"
                    >
                      {child.label}
                    </A>
                  </li>
                ))}
              </ul>
              {featured ? (
                <A href={featured.href} className="block rounded-lg border border-line hover:border-primary">
                  <div className="relative aspect-[3/2] overflow-hidden rounded-t-lg bg-surface-alt">
                    <ResponsiveImage
                      src={featured.image}
                      alt=""
                      seed={featured.seed}
                      tint={featured.tint}
                      fill
                      sizes="280px"
                    />
                  </div>
                  <div className="space-y-2 p-4">
                    {featured.stage ? <StageBadge stage={featured.stage} /> : null}
                    <p className="font-heading text-[18px] font-semibold leading-snug text-ink">{featured.title}</p>
                    {featured.text ? <p className="line-clamp-3 text-sm leading-relaxed">{featured.text}</p> : null}
                  </div>
                </A>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
      {mobileOpen ? (
        <div
          id="mobile-menu"
          ref={drawerRef}
          role="dialog"
          aria-modal="true"
          aria-label="Site menu"
          className="fixed inset-0 z-50 flex flex-col bg-surface lg:hidden"
        >
          <div className="flex h-14 items-center justify-between border-b border-line px-4">
            <span className="font-heading text-sm font-semibold text-ink">{site.short_name}</span>
            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-md text-ink"
              aria-label="Close menu"
              onClick={() => setMobileOpen(false)}
            >
              <X aria-hidden="true" className="h-6 w-6" />
            </button>
          </div>
          <nav aria-label="Primary" className="flex-1 overflow-y-auto px-4 py-4">
            <form action={publicHref(pathname, '/search')} method="get" role="search" className="mb-4">
              <label htmlFor="menu-search" className="sr-only">
                Search
              </label>
              <input
                id="menu-search"
                name="q"
                type="search"
                placeholder="Search"
                className="h-11 w-full rounded-md border border-line px-3 text-sm text-ink"
              />
            </form>
            <ul className="space-y-1">
              {site.nav.map((item, index) => {
                const hasChildren = Boolean(item.children?.length)
                const expanded = mobileSection === index
                return (
                  <li key={item.href} className="border-b border-line">
                    {hasChildren ? (
                      <>
                        <button
                          type="button"
                          className="flex min-h-11 w-full items-center justify-between py-2 text-left text-base font-medium text-ink"
                          aria-expanded={expanded}
                          aria-controls={`mobile-section-${index}`}
                          onClick={() => setMobileSection(expanded ? null : index)}
                        >
                          {item.label}
                          <span aria-hidden="true" className="text-body">
                            {expanded ? '−' : '+'}
                          </span>
                        </button>
                        {expanded ? (
                          <ul id={`mobile-section-${index}`} className="space-y-1 pb-3">
                            {item.children?.map((child) => (
                              <li key={child.href}>
                                <A
                                  href={child.href}
                                  aria-current={path === child.href ? 'page' : undefined}
                                  className="block rounded-md px-2 py-2 text-sm text-ink hover:bg-surface-alt hover:text-primary"
                                >
                                  {child.label}
                                </A>
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </>
                    ) : (
                      <A
                        href={item.href}
                        aria-current={path === item.href ? 'page' : undefined}
                        className="flex min-h-11 items-center text-base font-medium text-ink"
                      >
                        {item.label}
                      </A>
                    )}
                  </li>
                )
              })}
            </ul>
            <div className="mt-6">
              <Button href={site.primary_cta.href} className="w-full">
                {site.primary_cta.label}
              </Button>
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  )
}

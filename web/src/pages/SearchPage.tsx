import { useEffect, useRef, useState } from 'react'
import { pagefindRoot } from '../lib/url'

type PagefindConstructor = new (options: {
  element: HTMLElement
  bundlePath?: string
  showSubResults?: boolean
  showImages?: boolean
  pageSize?: number
}) => unknown

declare global {
  interface Window {
    PagefindUI?: PagefindConstructor
  }
}

export function SearchPage() {
  const ref = useRef<HTMLDivElement>(null)
  const [missing, setMissing] = useState(false)

  useEffect(() => {
    const root = ref.current
    if (!root) return
    let cancelled = false
    const query = new URLSearchParams(window.location.search).get('q') ?? ''

    async function mount() {
      const bundle = pagefindRoot()
      if (!document.querySelector('link[data-pagefind-ui]')) {
        const css = document.createElement('link')
        css.rel = 'stylesheet'
        css.href = `${bundle}pagefind-ui.css`
        css.dataset.pagefindUi = 'true'
        document.head.appendChild(css)
        await new Promise<void>((resolve) => {
          css.addEventListener('load', () => resolve(), { once: true })
          css.addEventListener('error', () => resolve(), { once: true })
        })
      }
      if (!window.PagefindUI) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script')
          script.src = `${bundle}pagefind-ui.js`
          script.onload = () => resolve()
          script.onerror = () => reject(new Error('pagefind missing'))
          document.body.appendChild(script)
        })
      }
      if (cancelled || !root || !window.PagefindUI) return
      root.replaceChildren()
      new window.PagefindUI({ element: root, bundlePath: bundle, showSubResults: true, showImages: false, pageSize: 20 })
      if (!query) return
      const input = root.querySelector('input')
      if (!input) return
      input.value = query
      input.dispatchEvent(new Event('input', { bubbles: true }))
    }

    mount().catch(() => {
      if (!cancelled) setMissing(true)
    })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div
      ref={ref}
      className="pagefind-ui"
      style={{
        ['--pagefind-ui-primary' as string]: '#C21717',
        ['--pagefind-ui-text' as string]: '#1F2328',
        ['--pagefind-ui-background' as string]: '#ffffff',
        ['--pagefind-ui-border' as string]: '#e6e1da',
        ['--pagefind-ui-font' as string]: 'Poppins, system-ui, sans-serif',
      }}
    >
      {missing ? <p>Search is available in the published site build.</p> : null}
    </div>
  )
}

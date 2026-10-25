import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import ReactMarkdown, { type Components } from 'react-markdown'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import rehypeSlug from 'rehype-slug'
import remarkDirective from 'remark-directive'
import remarkGfm from 'remark-gfm'
import { ImpactCollage } from '../components/ImpactCollage'
import { Lightbox } from '../components/Lightbox'
import { BLOCKS, type BlockProps } from '../components/markdown/blocks'
import { ResponsiveImage } from '../components/ResponsiveImage'
import { isComponentName } from './component-names'
import { bodyStartsWithH1 } from './document'
import { isEditorial, showEditorial } from './editorial'
import { remarkPrepare } from './remark-components'
import type { MarkdownScope } from './query'
import { MarkdownScopeContext } from './scope'
import { parseYamlList } from './yaml'

function classNames(value: unknown): string {
  if (typeof value === 'string') return value
  if (Array.isArray(value)) return value.filter((item) => typeof item === 'string').join(' ')
  return ''
}

function MarkdownLink({ href, children, className }: { href?: string; children?: ReactNode; className?: string }) {
  if (classNames(className).includes('heading-anchor')) {
    return (
      <a href={href} className="heading-anchor">
        {children}
      </a>
    )
  }
  if (href && isEditorial(href) && !showEditorial) return <>{children}</>
  return (
    <a href={href} className="text-primary underline decoration-primary/40 underline-offset-2">
      {children}
    </a>
  )
}

function MarkdownImage({ src, alt }: { src?: string; alt?: string }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button type="button" className="my-6 block max-w-3xl" onClick={() => setOpen(true)} aria-label={alt ? undefined : 'Enlarge image'}>
        <ResponsiveImage src={src} alt={alt ?? ''} seed={src || 'image'} className="h-auto w-full rounded-lg" sizes="(min-width: 768px) 720px, 100vw" />
      </button>
      <Lightbox open={open} onClose={() => setOpen(false)} src={src} alt={alt ?? ''} />
    </>
  )
}

function DirectiveView(props: Record<string, unknown>) {
  const name = String(props.component ?? '')
  if (!isComponentName(name)) throw new Error(`Unknown markdown component "${name}"`)
  const attrs: BlockProps['attrs'] = {}
  for (const [key, value] of Object.entries(props)) {
    if (key === 'component' || key === 'yaml' || key === 'node' || key === 'children' || value == null) continue
    attrs[key] = String(value)
  }
  const items = typeof props.yaml === 'string' ? parseYamlList(props.yaml, name) : []
  const Block = BLOCKS[name]
  const body = <Block attrs={attrs} items={items} />
  if (attrs.collapsed === 'true') {
    return (
      <details className="my-6 rounded-lg border border-line px-4 py-3">
        <summary className="cursor-pointer font-heading text-lg font-semibold text-ink">{attrs.summary || attrs.status || name}</summary>
        <div className="pt-4">{body}</div>
      </details>
    )
  }
  return body
}

function HomeBand({ className, children }: { className?: string | string[]; children?: ReactNode }) {
  const classes = classNames(className)
  if (classes.includes('home-collage')) {
    return (
      <section className={classes}>
        <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
          <div>{children}</div>
          <ImpactCollage />
        </div>
      </section>
    )
  }
  return <section className={classes}>{children}</section>
}

function useBandMotion(active: boolean) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const root = ref.current
    if (!active || !root) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const nodes = [...root.querySelectorAll<HTMLElement>('.home-band h2, .home-band article')]
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) {
            entry.target.classList.add('reveal-wait')
            continue
          }
          entry.target.classList.remove('reveal-wait')
          entry.target.classList.add('is-visible')
          observer.unobserve(entry.target)
        }
      },
      { threshold: 0.15 },
    )
    for (const node of nodes) {
      node.classList.add('reveal')
      observer.observe(node)
    }
    return () => observer.disconnect()
  }, [active])
  return ref
}

const markdownComponents = {
  section: HomeBand,
  directive: DirectiveView,
  a: MarkdownLink,
  img: ({ src, alt }: { src?: string; alt?: string }) => <MarkdownImage src={src} alt={alt} />,
  h1: ({ children, id }: { children?: ReactNode; id?: string }) => (
    <h1 id={id} className="mb-6 max-w-[18ch] font-heading text-[36px] font-semibold leading-[1.1] text-ink md:text-[48px]">
      {children}
    </h1>
  ),
  h2: ({ children, id }: { children?: ReactNode; id?: string }) => (
    <h2 id={id} className="md-heading mb-4 mt-10 font-heading text-[30px] font-semibold leading-tight">
      {children}
    </h2>
  ),
  h3: ({ children, id }: { children?: ReactNode; id?: string }) => (
    <h3 id={id} className="md-heading mb-3 mt-8 font-heading text-[24px] font-semibold leading-tight">
      {children}
    </h3>
  ),
  p: ({ children }: { children?: ReactNode }) => <p className="mb-4 max-w-prose">{children}</p>,
  ul: ({ children }: { children?: ReactNode }) => <ul className="mb-4 max-w-prose list-disc space-y-1 pl-5">{children}</ul>,
  ol: ({ children }: { children?: ReactNode }) => <ol className="mb-4 max-w-prose list-decimal space-y-1 pl-5">{children}</ol>,
  blockquote: ({ children }: { children?: ReactNode }) => <blockquote className="mb-4 max-w-prose border-l-4 border-line pl-4">{children}</blockquote>,
  hr: () => <hr className="my-8 border-line" />,
  pre: ({ children }: { children?: ReactNode }) => <pre className="my-4 overflow-x-auto rounded-lg bg-surface-alt p-4 text-sm">{children}</pre>,
  code: ({ children, className }: { children?: ReactNode; className?: string }) =>
    className ? <code className={className}>{children}</code> : <code className="rounded bg-surface-alt px-1 py-0.5 text-[0.9em]">{children}</code>,
  table: ({ children }: { children?: ReactNode }) => (
    <div className="markdown-table my-6 overflow-x-auto">
      <table className="w-full border-collapse text-left text-sm">{children}</table>
    </div>
  ),
  th: ({ children }: { children?: ReactNode }) => <th className="border-b border-line px-3 py-2 font-medium text-ink">{children}</th>,
  td: ({ children }: { children?: ReactNode }) => <td className="border-b border-line px-3 py-2 align-top">{children}</td>,
} as Components

export function Markdown({
  body,
  scope,
  home = false,
  title,
}: {
  body?: string
  scope?: MarkdownScope
  home?: boolean
  title?: string
}) {
  const prepare = useMemo(() => remarkPrepare(scope, home), [scope, home])
  const remarkPlugins = useMemo(() => [remarkGfm, remarkDirective, prepare], [prepare])
  const rehypePlugins = useMemo(
    () => [rehypeSlug, [rehypeAutolinkHeadings, { behavior: 'wrap', properties: { className: ['heading-anchor'] } }]],
    [],
  )
  const motionRef = useBandMotion(home)
  if (!body?.trim()) return null
  return (
    <MarkdownScopeContext.Provider value={scope}>
      {home && title && !bodyStartsWithH1(body) ? <h1 className="sr-only">{title}</h1> : null}
      <div ref={motionRef} className={home ? undefined : 'markdown'}>
        <ReactMarkdown remarkPlugins={remarkPlugins as never} rehypePlugins={rehypePlugins as never} components={markdownComponents}>
          {body}
        </ReactMarkdown>
      </div>
    </MarkdownScopeContext.Provider>
  )
}

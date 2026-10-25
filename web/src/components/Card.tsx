import type { ReactNode } from 'react'
import { ResponsiveImage } from './ResponsiveImage'

export function Card({
  href,
  title,
  text,
  image,
  seed,
  tint,
  badges,
}: {
  href?: string
  title: string
  text?: ReactNode
  image?: string
  seed: string
  tint?: string
  badges?: ReactNode
}) {
  return (
    <article className="flex h-full flex-col rounded-lg border border-line bg-surface">
      <div className="relative aspect-[3/2] overflow-hidden rounded-t-lg bg-surface-alt">
        <ResponsiveImage
          src={image}
          alt=""
          seed={seed}
          tint={tint}
          fill
          sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw"
        />
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        {badges ? <div className="flex flex-wrap gap-2">{badges}</div> : null}
        <h2 className="font-heading text-[20px] font-semibold leading-snug text-ink">
          {href ? (
            <a className="hover:text-primary" href={href}>
              {title}
            </a>
          ) : (
            title
          )}
        </h2>
        {text ? <p className="line-clamp-3 text-sm leading-relaxed">{text}</p> : null}
      </div>
    </article>
  )
}

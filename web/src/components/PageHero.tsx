import { isEditorial, publicText } from '../lib/editorial'
import type { PageMeta } from '../lib/document'
import { Pattern } from './Pattern'
import { ResponsiveImage } from './ResponsiveImage'
import { Reveal } from './Reveal'
import { StageBadge } from './Badge'
import { TodoBadge } from './TodoBadge'

export function PageHero({ meta }: { meta: PageMeta }) {
  const description = publicText(meta.description)
  const pending = isEditorial(meta.description)

  if (meta.layout === 'home' || meta.layout === 'story') return null

  if (meta.markdownH1 && meta.image) {
    return (
      <section className="relative h-[280px] overflow-hidden bg-dark md:h-[420px]">
        <ResponsiveImage src={meta.image} alt="" seed={meta.seed} tint={meta.tint} fill priority sizes="100vw" />
      </section>
    )
  }

  if (meta.markdownH1) return null

  if (meta.image) {
    return (
      <section className="relative h-[280px] overflow-hidden bg-dark md:h-[420px]">
        <ResponsiveImage
          src={meta.image}
          alt=""
          seed={meta.seed}
          tint={meta.tint}
          fill
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-dark via-dark/60 to-dark/25" aria-hidden="true" />
        <div className="relative z-10 mx-auto flex h-full max-w-page items-end px-4 pb-8 md:px-6 md:pb-10">
          <Reveal className="max-w-xl md:max-w-[55%]">
            {meta.stage ? (
              <div className="mb-3">
                <StageBadge stage={meta.stage} />
              </div>
            ) : null}
            <h1 className="font-heading text-[36px] font-semibold leading-[1.1] text-white md:text-[48px]">
              {meta.title}
            </h1>
            {description ? (
              <p className="mt-3 line-clamp-3 text-base leading-relaxed text-white/90 md:text-[18px]">
                {description} {pending ? <TodoBadge /> : null}
              </p>
            ) : null}
          </Reveal>
        </div>
      </section>
    )
  }

  return (
    <section className="relative overflow-hidden bg-surface-alt">
      <Pattern seed={meta.seed} tint={meta.tint} className="absolute inset-0 h-full w-full" />
      <div className="relative mx-auto max-w-page px-4 py-14 md:px-6 md:py-20">
        <Reveal>
          {meta.stage ? (
            <div className="mb-4">
              <StageBadge stage={meta.stage} />
            </div>
          ) : null}
          <h1 className="max-w-[18ch] font-heading text-[36px] font-semibold leading-[1.1] text-ink md:text-[48px]">
            {meta.title}
          </h1>
          {description ? (
            <p className="mt-4 max-w-prose text-[18px] leading-relaxed">
              {description} {pending ? <TodoBadge /> : null}
            </p>
          ) : null}
        </Reveal>
      </div>
    </section>
  )
}

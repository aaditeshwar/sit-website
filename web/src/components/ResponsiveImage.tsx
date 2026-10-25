import { useEffect, useRef } from 'react'
import { showPlaceholders } from '../lib/editorial'
import { lookupImage, type ImageVariant } from '../lib/images'
import { Pattern, patternSrc } from './Pattern'

type ResponsiveImageProps = {
  src?: string
  alt: string
  seed: string
  tint?: string
  sizes?: string
  priority?: boolean
  /** Fill a positioned parent. Otherwise `className` sizes the image itself. */
  fill?: boolean
  className?: string
}

function srcSet(variants: ImageVariant[]): string {
  return variants.map((variant) => `${variant.src} ${variant.width}w`).join(', ')
}

export function ResponsiveImage({
  src,
  alt,
  seed,
  tint = '#C21717',
  sizes = '100vw',
  priority = false,
  fill = false,
  className = '',
}: ResponsiveImageProps) {
  const entry = lookupImage(src)
  const showImage = Boolean(entry && (!entry.placeholder || showPlaceholders))

  if (!showImage) {
    if (fill) {
      return (
        <img
          src={patternSrc(seed || src || 'sit', tint)}
          alt={alt}
          width={120}
          height={80}
          className={`absolute inset-0 h-full w-full object-cover ${className}`}
        />
      )
    }
    const box = className
    return (
      <span className={box}>
        <Pattern seed={seed || src || 'sit'} tint={tint} className="h-full w-full" />
        {alt ? <span className="sr-only">{alt}</span> : null}
      </span>
    )
  }

  const webp = entry!.variants.filter((variant) => variant.format === 'webp')
  const fallback = entry!.variants.filter((variant) => variant.format !== 'webp')
  const fallbackSrc = (fallback.at(-1) ?? webp.at(-1))?.src
  if (!fallbackSrc) {
    return null
  }

  const pictureClass = fill ? 'absolute inset-0 block h-full w-full' : 'inline-block'
  const imageClass = fill ? 'h-full w-full object-cover' : className

  return <Picture webp={webp} fallback={fallback} fallbackSrc={fallbackSrc} entry={entry!} alt={alt} sizes={sizes} priority={priority} pictureClass={pictureClass} imageClass={imageClass} />
}

function Picture({
  webp,
  fallback,
  fallbackSrc,
  entry,
  alt,
  sizes,
  priority,
  pictureClass,
  imageClass,
}: {
  webp: ImageVariant[]
  fallback: ImageVariant[]
  fallbackSrc: string
  entry: { width: number; height: number }
  alt: string
  sizes: string
  priority: boolean
  pictureClass: string
  imageClass: string
}) {
  const ref = useRef<HTMLImageElement>(null)
  useEffect(() => {
    if (priority) ref.current?.setAttribute('fetchpriority', 'high')
  }, [priority])

  return (
    <picture className={pictureClass}>
      {webp.length > 0 ? <source type="image/webp" srcSet={srcSet(webp)} sizes={sizes} /> : null}
      <img
        ref={ref}
        src={fallbackSrc}
        srcSet={fallback.length > 0 ? srcSet(fallback) : undefined}
        sizes={sizes}
        width={entry!.width}
        height={entry!.height}
        alt={alt}
        {...(priority ? ({ fetchpriority: 'high' } as { fetchpriority: 'high' }) : {})}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        className={imageClass}
      />
    </picture>
  )
}

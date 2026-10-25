function hashSeed(seed: string): number {
  let hash = 2166136261
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function patternLines(seed: string): { y: number; amplitude: number }[] {
  const hash = hashSeed(seed || 'sit')
  return Array.from({ length: 7 }, (_, index) => {
    const shift = hash >>> ((index * 3) % 24)
    return { y: 10 + ((shift + index * 11) % 64), amplitude: 3 + ((shift >> 3) % 8) }
  })
}

function patternPaths(seed: string, tint: string): string {
  return patternLines(seed)
    .map((line, index) => {
      const end = line.y + (index % 2 === 0 ? 2 : -2)
      return `<path d="M0 ${line.y} Q 30 ${line.y - line.amplitude} 60 ${line.y} T 120 ${end}" fill="none" stroke="${tint}" stroke-opacity="0.45" stroke-width="0.7"/>`
    })
    .join('')
}

/** Inline image so a full-bleed pattern can be the largest paint. */
export function patternSrc(seed: string, tint: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 80" preserveAspectRatio="xMidYMid slice"><rect width="120" height="80" fill="${tint}" fill-opacity="0.14"/>${patternPaths(seed, tint)}</svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

/** Deterministic contour pattern used when a photograph is missing or suppressed. */
export function Pattern({ seed, tint, className = '' }: { seed: string; tint: string; className?: string }) {
  const lines = patternLines(seed)
  return (
    <svg className={className} viewBox="0 0 120 80" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="120" height="80" fill={tint} fillOpacity="0.14" />
      {lines.map((line, index) => (
        <path
          key={index}
          d={`M0 ${line.y} Q 30 ${line.y - line.amplitude} 60 ${line.y} T 120 ${line.y + (index % 2 === 0 ? 2 : -2)}`}
          fill="none"
          stroke={tint}
          strokeOpacity="0.45"
          strokeWidth="0.7"
        />
      ))}
    </svg>
  )
}

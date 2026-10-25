import { site } from '../lib/content'

export function NotFoundPage() {
  return (
    <article>
      <ul className="space-y-2">
        <li>
          <a className="text-ink underline decoration-primary/40 hover:text-primary" href="/">
            Home
          </a>
        </li>
        {site.nav.map((item) => (
          <li key={item.href}>
            <a className="text-ink underline decoration-primary/40 hover:text-primary" href={item.href}>
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </article>
  )
}

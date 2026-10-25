import { A } from '../components/A'
import { site } from '../lib/content'

export function NotFoundPage() {
  return (
    <article>
      <ul className="space-y-2">
        <li>
          <A className="text-ink underline decoration-primary/40 hover:text-primary" href="/">
            Home
          </A>
        </li>
        {site.nav.map((item) => (
          <li key={item.href}>
            <A className="text-ink underline decoration-primary/40 hover:text-primary" href={item.href}>
              {item.label}
            </A>
          </li>
        ))}
      </ul>
    </article>
  )
}

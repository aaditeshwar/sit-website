import { site } from '../lib/content'
import { isEditorial, publicText, showEditorial } from '../lib/editorial'
import { formatBuildDate } from '../lib/format'
import { Button } from './Button'
import { ResponsiveImage } from './ResponsiveImage'
import { TodoBadge } from './TodoBadge'

export function Footer() {
  const year = site.buildDate.slice(0, 4)
  const copyright = site.copyright.replaceAll('{year}', year)
  const email = publicText(site.contact.email)
  const emailPending = isEditorial(site.contact.email)
  const socials = [
    ['LinkedIn', site.social?.linkedin],
    ['X', site.social?.x],
    ['YouTube', site.social?.youtube],
  ].filter((entry): entry is [string, string] => Boolean(entry[1]))

  return (
    <footer className="bg-dark text-white" data-pagefind-ignore>
      <div className="mx-auto grid max-w-page gap-10 px-4 py-14 md:px-6 lg:grid-cols-[minmax(0,1.3fr)_repeat(3,minmax(0,1fr))]">
        <div className="space-y-4">
          <a href="/" aria-label={site.name} className="inline-block rounded-md bg-white px-2 py-1">
            <ResponsiveImage src={site.logo} alt="" seed="logo" sizes="48px" className="h-11 w-11 object-cover object-left" />
          </a>
          <p className="max-w-sm text-sm leading-relaxed text-white/80">{site.tagline}</p>
        </div>
        {site.footer.columns.map((column) => (
          <nav key={column.title} aria-label={column.title}>
            <h2 className="font-heading text-sm font-semibold uppercase tracking-wide">{column.title}</h2>
            <ul className="mt-4 space-y-2">
              {column.links.map((link) => (
                <li key={link.href}>
                  <a className="text-sm text-white/80 hover:text-white hover:underline" href={link.href}>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-white/15">
        <div className="mx-auto flex max-w-page flex-col gap-6 px-4 py-8 md:px-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2 text-sm text-white/80">
            <p>{site.contact.address}</p>
            <p>
              <a className="hover:text-white hover:underline" href={`tel:${site.contact.phone.replace(/[^\d+]/g, '')}`}>
                {site.contact.phone}
              </a>
            </p>
            {email ? (
              <p className="flex flex-wrap items-center gap-2">
                {emailPending && showEditorial ? <TodoBadge /> : null}
                {emailPending ? (
                  <span>{email}</span>
                ) : (
                  <a className="hover:text-white hover:underline" href={`mailto:${email}`}>
                    {email}
                  </a>
                )}
              </p>
            ) : null}
            {socials.length > 0 ? (
              <ul className="flex gap-4 pt-2">
                {socials.map(([label, href]) => (
                  <li key={label}>
                    <a className="hover:text-white hover:underline" href={href}>
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-3">
            {site.footer.ctas.map((cta, index) => (
              <Button key={cta.href} href={cta.href} variant={index === 0 ? 'primary' : 'inverse'}>
                {cta.label}
              </Button>
            ))}
          </div>
        </div>
      </div>
      <div className="border-t border-white/15">
        <div className="mx-auto flex max-w-page flex-col gap-2 px-4 py-4 text-xs text-white/70 md:flex-row md:items-center md:justify-between md:px-6">
          <p>{copyright}</p>
          <p>Last updated {formatBuildDate(site.buildDate)}</p>
        </div>
      </div>
    </footer>
  )
}

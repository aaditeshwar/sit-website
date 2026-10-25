import type { Crumb } from '../lib/document'

export function Breadcrumbs({ crumbs }: { crumbs: Crumb[] }) {
  if (crumbs.length === 0) return null
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
        {crumbs.map((crumb, index) => {
          const current = index === crumbs.length - 1
          return (
            <li key={`${crumb.href}-${crumb.label}`} className="flex items-center gap-2">
              {index > 0 ? (
                <span aria-hidden="true" className="text-body">
                  /
                </span>
              ) : null}
              {current ? (
                <span aria-current="page" className="font-medium text-ink">
                  {crumb.label}
                </span>
              ) : (
                <a className="text-body hover:text-primary" href={crumb.href}>
                  {crumb.label}
                </a>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

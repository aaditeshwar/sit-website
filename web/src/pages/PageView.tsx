import { useLocation } from 'react-router-dom'
import { normalisePath, pages } from '../lib/content'
import { Markdown } from '../lib/markdown'
import { NotFoundPage } from './NotFoundPage'

export function PageView() {
  const { pathname } = useLocation()
  const route = normalisePath(pathname)
  const page = pages.find((item) => item.route === route)
  if (!page) return <NotFoundPage />
  return <Markdown body={page.body} home={page.layout === 'home'} title={page.title} />
}

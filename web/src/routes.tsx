import type { RouteRecord } from 'vite-react-ssg'
import { SiteLayout } from './layouts/SiteLayout'
import { routeManifest } from './lib/content'
import { NotFoundPage } from './pages/NotFoundPage'
import { PageView } from './pages/PageView'
import { AreaPage, ImpactPage, NewsPage, ProjectPage } from './pages/RecordPages'
import { SearchPage } from './pages/SearchPage'

const dynamicRoutes: RouteRecord[] = [
  {
    path: 'impact/:slug',
    element: <ImpactPage />,
    getStaticPaths: () => routeManifest.impact.map((slug) => `impact/${slug}`),
  },
  {
    path: 'research/:area',
    element: <AreaPage />,
    getStaticPaths: () => routeManifest.areas.map((slug) => `research/${slug}`),
  },
  {
    path: 'research/projects/:id',
    element: <ProjectPage />,
    getStaticPaths: () => routeManifest.projects.map((id) => `research/projects/${id}`),
  },
  {
    path: 'news/:id',
    element: <NewsPage />,
    getStaticPaths: () => routeManifest.news.map((id) => `news/${id}`),
  },
]

export const routes: RouteRecord[] = [
  {
    path: '/',
    element: <SiteLayout />,
    children: [
      { index: true, element: <PageView /> },
      ...routeManifest.static
        .filter((route) => route !== '/')
        .map((route) => ({
          path: route.slice(1),
          element: <PageView />,
        })),
      ...dynamicRoutes,
      { path: 'search', element: <SearchPage /> },
      { path: '404', element: <NotFoundPage /> },
    ],
  },
]

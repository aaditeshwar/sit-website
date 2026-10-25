import { A } from '../components/A'
import { Outlet, useLocation } from 'react-router-dom'
import { Head } from 'vite-react-ssg'
import { Breadcrumbs } from '../components/Breadcrumbs'
import { Footer } from '../components/Footer'
import { Header } from '../components/Header'
import { PageHero } from '../components/PageHero'
import { Section } from '../components/Section'
import { normalisePath } from '../lib/content'
import { breadcrumbsFor, metaFor } from '../lib/document'
import { fontFaceCss, fontHref, preloadFonts } from '../lib/fonts'
import { canonicalUrl, ogImageUrl, pageDescription, pageTitle, serializeJsonLd, structuredData } from '../lib/seo'

export function SiteLayout() {
  const { pathname } = useLocation()
  const meta = metaFor(pathname)
  const crumbs = breadcrumbsFor(pathname, meta.title)
  const bare = meta.layout === 'home' || meta.layout === 'story'
  const story = meta.layout === 'story'
  const description = pageDescription(pathname)
  const title = pageTitle(pathname)
  const canonical = canonicalUrl(pathname)
  const image = ogImageUrl(pathname)
  const indexable = meta.path !== '/404' && meta.path !== '/search'
  const route = normalisePath(pathname)

  return (
    <div className="flex min-h-screen flex-col bg-surface text-body">
      <Head
        htmlAttributes={{
          'data-sit-route': route,
          ...(indexable ? {} : { 'data-pagefind-ignore': 'all' }),
        }}
      >
        <title>{title}</title>
        {description ? <meta name="description" content={description} /> : null}
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content={title} />
        {description ? <meta property="og:description" content={description} /> : null}
        <meta property="og:url" content={canonical} />
        <meta property="og:type" content={meta.path.startsWith('/news/') ? 'article' : 'website'} />
        {image ? <meta property="og:image" content={image} /> : null}
        {image ? <meta property="og:image:width" content="1200" /> : null}
        {image ? <meta property="og:image:height" content="630" /> : null}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        {description ? <meta name="twitter:description" content={description} /> : null}
        {image ? <meta name="twitter:image" content={image} /> : null}
        {preloadFonts.map((font) => (
          <link key={font.family} rel="preload" href={fontHref(pathname, font.href)} as="font" type="font/woff2" crossOrigin="anonymous" />
        ))}
        <style>{fontFaceCss(pathname)}</style>
      </Head>
      {structuredData(pathname).map((node, index) => (
        <script key={index} type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(node) }} />
      ))}
      <A
        href="#content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-surface focus:px-3 focus:py-2 focus:text-ink"
      >
        Skip to content
      </A>
      <Header />
      <main id="content" className="flex-1" data-pagefind-body>
        {bare ? null : <PageHero meta={meta} />}
        {crumbs.length > 0 && !story ? (
          <div className="border-b border-line bg-surface">
            <div className="mx-auto max-w-page px-4 py-3 md:px-6">
              <Breadcrumbs crumbs={crumbs} />
            </div>
          </div>
        ) : null}
        {bare ? <Outlet /> : (
          <Section>
            <Outlet />
          </Section>
        )}
      </main>
      <Footer />
    </div>
  )
}

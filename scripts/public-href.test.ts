import assert from 'node:assert/strict'
import { test } from 'node:test'
import { relativeToRoute, rewriteAssetUrl, rewriteBuiltHtml } from '../web/src/lib/relative-url.ts'
import { publicHref } from '../web/src/lib/url.ts'

test('relative links climb from the current page to the site root', () => {
  assert.equal(relativeToRoute('/', '/about'), 'about/')
  assert.equal(relativeToRoute('/about', '/'), '../')
  assert.equal(relativeToRoute('/about', '/people/faculty'), '../people/faculty/')
  assert.equal(relativeToRoute('/research/projects', '/_img/a.png'), '../../_img/a.png')
  assert.equal(relativeToRoute('/research/projects', '/research/projects?stage=project'), './?stage=project')
  assert.equal(relativeToRoute('/about/vision', '/about/vision/'), './')
  assert.equal(relativeToRoute('/', '/documents/sit.pdf'), 'documents/sit.pdf')
  assert.equal(relativeToRoute('/academics/admissions', '/why-sit/partners#support'), '../../why-sit/partners/#support')
})

test('production hrefs stay external, hashed, or already relative', () => {
  assert.equal(publicHref('/about', 'https://example.com/a', false), 'https://example.com/a')
  assert.equal(publicHref('/about', 'mailto:a@b.c', false), 'mailto:a@b.c')
  assert.equal(publicHref('/about', '#content', false), '#content')
  assert.equal(publicHref('/about', '../keep', false), '../keep')
  assert.equal(publicHref('/about', '/about', true), '/about')
})

test('built asset URLs are rewritten for the page depth', () => {
  const html = '<link href="./assets/app.css"><link rel="icon" href="/images/logos/favicon.ico"><img srcset="/_img/a.webp 320w, /_img/b.webp 640w"><a href="../impact/">Impact</a><a href="https://sit.iitd.ac.in/about/">Canonical</a>'
  const about = rewriteBuiltHtml('/about', html)
  assert.match(about, /href="\.\.\/assets\/app\.css"/)
  assert.match(about, /href="\.\.\/images\/logos\/favicon\.ico"/)
  assert.match(about, /srcset="\.\.\/_img\/a\.webp 320w, \.\.\/_img\/b\.webp 640w"/)
  assert.match(about, /href="\.\.\/impact\/"/)
  assert.match(about, /href="https:\/\/sit\.iitd\.ac\.in\/about\/"/)
  assert.equal(rewriteAssetUrl('/research/projects', './assets/app.css'), '../../assets/app.css')
  assert.equal(rewriteAssetUrl('/', './assets/app.css'), 'assets/app.css')
})

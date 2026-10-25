import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { after, before, test } from 'node:test'
import { expectedRedirects } from './redirects.ts'
import { repoRoot } from './lib/root.ts'

const port = 8088
const origin = `http://127.0.0.1:${port}`
const container = 'sit-redirects-test'
const dist = path.join(repoRoot, 'web/dist')

function docker(args: string[]): Promise<{ code: number; output: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn('docker', args, { stdio: ['ignore', 'pipe', 'pipe'] })
    let output = ''
    child.stdout.on('data', (chunk: Buffer) => {
      output += chunk.toString()
    })
    child.stderr.on('data', (chunk: Buffer) => {
      output += chunk.toString()
    })
    child.on('error', reject)
    child.on('close', (code) => resolve({ code: code ?? 1, output }))
  })
}

async function waitForSite(): Promise<void> {
  const deadline = Date.now() + 30000
  let last = ''
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${origin}/`)
      if (response.status < 500) return
      last = `status ${response.status}`
    } catch (error) {
      last = error instanceof Error ? error.message : String(error)
    }
    await new Promise((resolve) => setTimeout(resolve, 400))
  }
  const logs = await docker(['logs', container])
  throw new Error(`Apache did not start: ${last}\n${logs.output}`)
}

before(async () => {
  if (!fs.existsSync(path.join(dist, 'pagefind/pagefind-ui.js'))) {
    throw new Error('web/dist is missing the Pagefind index. Run pnpm build first.')
  }
  await docker(['rm', '-f', container])
  const started = await docker([
    'run',
    '-d',
    '--name',
    container,
    '-p',
    `${port}:80`,
    '-v',
    `${dist}:/usr/local/apache2/htdocs:ro`,
    'httpd:2.4',
    'sh',
    '-c',
    [
      "sed -i 's/^#LoadModule rewrite_module/LoadModule rewrite_module/' /usr/local/apache2/conf/httpd.conf",
      "sed -i 's/^#LoadModule deflate_module/LoadModule deflate_module/' /usr/local/apache2/conf/httpd.conf",
      "sed -i 's/^#LoadModule expires_module/LoadModule expires_module/' /usr/local/apache2/conf/httpd.conf",
      "sed -i 's/^#LoadModule headers_module/LoadModule headers_module/' /usr/local/apache2/conf/httpd.conf",
      "sed -i 's/AllowOverride None/AllowOverride All/g' /usr/local/apache2/conf/httpd.conf",
      "printf '\\nServerName localhost\\nSetEnv HTTPS on\\n' >> /usr/local/apache2/conf/httpd.conf",
      'exec httpd-foreground',
    ].join(' && '),
  ])
  if (started.code !== 0) throw new Error(started.output)
  await waitForSite()
})

after(async () => {
  await docker(['rm', '-f', container])
})

test('old URLs redirect to the new site', async () => {
  for (const expected of expectedRedirects()) {
    const response = await fetch(new URL(expected.from, origin), { redirect: 'manual' })
    assert.equal(response.status, expected.status, expected.from)
    if (!expected.to) continue
    const location = response.headers.get('location')
    assert.ok(location, `${expected.from} missing Location`)
    const landed = new URL(location, origin)
    assert.equal(`${landed.pathname}${landed.search}`, expected.to, expected.from)
  }
})

test('searching CoRE finds the impact story, the research area and the projects', async () => {
  const puppeteer = await import('puppeteer-core')
  const chrome = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  ].find((file) => fs.existsSync(file))
  assert.ok(chrome, 'Chrome is required to exercise Pagefind')
  const browser = await puppeteer.default.launch({ executablePath: chrome, headless: true, args: ['--no-sandbox'] })
  try {
    const page = await browser.newPage()
    await page.setViewport({ width: 1280, height: 900 })
    await page.goto(`${origin}/`, { waitUntil: 'networkidle0' })
    await page.click('[aria-label="Search"]')
    await page.waitForSelector('#site-search:not(.sr-only)')
    await page.type('#site-search', 'CoRE')
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
      page.keyboard.press('Enter'),
    ])
    await page.waitForSelector('.pagefind-ui__result-link', { timeout: 15000 })
    const hrefs = await page.$$eval('.pagefind-ui__result-link', (links) =>
      links.map((link) => (link as HTMLAnchorElement).getAttribute('href') ?? ''),
    )
    assert.ok(hrefs.some((href) => href.includes('/impact/core-stack')), hrefs.join('\n'))
    assert.ok(hrefs.some((href) => href.includes('/research/sustainability-and-social-development')), hrefs.join('\n'))
    assert.ok(hrefs.some((href) => href.includes('/research/projects')), hrefs.join('\n'))
  } finally {
    await browser.close()
  }
})

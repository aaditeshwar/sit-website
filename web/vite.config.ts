import fs from 'node:fs'
import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

function stripEditorial(value: unknown): unknown {
  if (typeof value === 'string') {
    if (!value.includes('TODO') && !value.includes('VERIFY')) return value
    if (value.includes('\n')) {
      return value
        .split('\n')
        .filter((line) => !line.includes('TODO') && !line.includes('VERIFY'))
        .join('\n')
    }
    return ''
  }
  if (Array.isArray(value)) return value.map(stripEditorial)
  if (value && typeof value === 'object') {
    const next: Record<string, unknown> = {}
    for (const [key, item] of Object.entries(value)) next[key] = stripEditorial(item)
    return next
  }
  return value
}

function stripGeneratedJson(): Plugin {
  return {
    name: 'strip-generated-json',
    apply: 'build',
    enforce: 'pre',
    transform(code, id) {
      const file = id.split('?')[0]?.replace(/\\/g, '/') ?? ''
      if (!file.includes('/src/generated/') || !file.endsWith('.json')) return null
      return JSON.stringify(stripEditorial(JSON.parse(code) as unknown))
    },
  }
}

function pagefindDev(): Plugin {
  return {
    name: 'pagefind-dev',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = (req.url ?? '').split('?')[0] ?? ''
        if (!url.startsWith('/pagefind/')) return next()
        const root = path.resolve(server.config.root, 'dist', 'pagefind')
        const file = path.resolve(server.config.root, 'dist', url.slice(1))
        if (!file.startsWith(root) || !fs.existsSync(file) || !fs.statSync(file).isFile()) return next()
        const types: Record<string, string> = {
          '.js': 'text/javascript',
          '.css': 'text/css',
          '.json': 'application/json',
          '.wasm': 'application/wasm',
        }
        res.setHeader('Content-Type', types[path.extname(file)] ?? 'application/octet-stream')
        res.end(fs.readFileSync(file))
      })
    },
  }
}

export default defineConfig({
  base: '/',
  plugins: [stripGeneratedJson(), pagefindDev(), react()],
  ssgOptions: {
    entry: 'src/main.tsx',
    dirStyle: 'nested',
    script: 'async',
    formatting: 'none',
    beastiesOptions: {},
    crittersOptions: false,
    onPageRendered(_route, html) {
      let replaced = false
      const next = html.replace(/<script\b([^>]*)><\/script>/g, (full, attrs) => {
        const src = attrs.match(/\bsrc="([^"]+)"/)
        if (!src || !/\btype="module"/.test(attrs) || !src[1].startsWith('/assets/')) return full
        replaced = true
        return `<script>requestAnimationFrame(function(){requestAnimationFrame(function(){var s=document.createElement("script");s.type="module";s.crossOrigin="anonymous";s.src="${src[1]}";document.body.appendChild(s)})})</script>`
      })
      if (!replaced && html.includes('/assets/') && html.includes('type="module"')) {
        throw new Error('Production page is missing the module script to defer until after first paint')
      }
      return next
    },
  },
})

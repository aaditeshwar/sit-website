import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import yaml from 'js-yaml'
import type { Config } from 'tailwindcss'

type ThemeFile = {
  theme: {
    primary: string
    primary_dark: string
    ink: string
    body: string
    surface: string
    surface_alt: string
    dark: string
    fonts: { heading: string; body: string }
  }
}

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const site = yaml.load(fs.readFileSync(path.join(repoRoot, 'content/site.yml'), 'utf8')) as ThemeFile

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      maxWidth: {
        page: '1280px',
        prose: '72ch',
      },
      colors: {
        primary: site.theme.primary,
        'primary-dark': site.theme.primary_dark,
        'primary-50': '#FDECEC',
        ink: site.theme.ink,
        body: site.theme.body,
        surface: site.theme.surface,
        'surface-alt': site.theme.surface_alt,
        dark: site.theme.dark,
        line: '#E5E2DD',
        stage: {
          project: '#E8A33D',
          initiative: '#2F7D6D',
          ecosystem: '#C21717',
        },
      },
      fontFamily: {
        heading: [site.theme.fonts.heading, 'system-ui', 'sans-serif'],
        sans: [site.theme.fonts.body, 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config

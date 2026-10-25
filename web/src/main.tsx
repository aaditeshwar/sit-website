import { ViteReactSSG } from 'vite-react-ssg'
import { routes } from './routes'
import { detectBasename } from './lib/url'
import './index.css'

export const createRoot = ViteReactSSG({ routes, basename: detectBasename() })

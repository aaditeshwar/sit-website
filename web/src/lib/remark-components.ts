import { isComponentName } from './component-names'
import { isEmptySection, type Attrs, type MarkdownScope } from './query'
import { parseYamlList } from './yaml'

type MdNode = {
  type: string
  name?: string
  value?: string
  lang?: string | null
  meta?: string | null
  depth?: number
  attributes?: Record<string, string | null | undefined>
  data?: { hName?: string; hProperties?: Record<string, unknown> }
  children?: MdNode[]
}

const OWN_BAND = new Set(['hero-carousel', 'stats-strip', 'partner-logos', 'cta-band'])

function componentName(node: MdNode): string | null {
  if (node.type === 'leafDirective' || node.type === 'containerDirective' || node.type === 'textDirective') {
    return node.name ?? null
  }
  const named = node.data?.hProperties?.component
  return typeof named === 'string' ? named : null
}

function attrsOf(node: MdNode): Attrs {
  const raw = { ...(node.attributes ?? {}), ...(node.data?.hProperties ?? {}) }
  const attrs: Attrs = {}
  for (const [key, value] of Object.entries(raw)) {
    if (key === 'component' || key === 'yaml' || value == null) continue
    attrs[key] = String(value)
  }
  return attrs
}

function plainText(node: MdNode): string {
  if (node.type === 'text' || node.type === 'inlineCode') return node.value ?? ''
  return (node.children ?? []).map(plainText).join('')
}

function transformNode(node: MdNode): MdNode {
  if (node.type === 'code' && node.lang === 'yaml' && node.meta?.trim()) {
    const name = node.meta.trim().split(/\s+/)[0] ?? ''
    if (!isComponentName(name)) throw new Error(`Unknown markdown component "${name}"`)
    parseYamlList(node.value ?? '', name)
    return {
      type: 'mdComponent',
      data: { hName: 'directive', hProperties: { component: name, yaml: node.value ?? '' } },
      children: [],
    }
  }
  if (node.type === 'leafDirective' || node.type === 'containerDirective' || node.type === 'textDirective') {
    const name = node.name ?? ''
    if (!isComponentName(name)) throw new Error(`Unknown markdown component "${name}"`)
    return {
      ...node,
      data: { hName: 'directive', hProperties: { ...(node.attributes ?? {}), component: name } },
      children: (node.children ?? []).map(transformNode),
    }
  }
  if (node.children) return { ...node, children: node.children.map(transformNode) }
  return node
}

function yamlItems(node: MdNode): Record<string, unknown>[] | undefined {
  if (node.type !== 'mdComponent') return undefined
  const name = componentName(node) ?? 'component'
  const source = node.data?.hProperties?.yaml
  return parseYamlList(typeof source === 'string' ? source : '', name)
}

function headingText(nodes: MdNode[]): string {
  const heading = nodes.find((node) => node.type === 'heading' && node.depth === 2)
  return heading ? plainText(heading).trim() : ''
}

function bandClasses(nodes: MdNode[], index: number): string[] {
  const names = nodes.map(componentName).filter((name): name is string => Boolean(name))
  const classes = ['home-band']
  if (names.includes('hero-carousel') || names.includes('cta-band')) classes.push('home-band-bleed')
  else if (names.includes('stats-strip')) classes.push('home-band-bleed', 'bg-dark', 'text-white', 'home-overlap')
  else if (names.includes('opportunities-band')) classes.push('bg-primary-50')
  else classes.push(index % 2 ? 'bg-surface-alt' : 'bg-surface')
  if (headingText(nodes) === 'Computing that leaves the lab') classes.push('home-collage')
  if (names.includes('stage-cards')) classes.push('home-stage')
  return classes
}

export function remarkPrepare(scope: MarkdownScope | undefined, home: boolean) {
  return function remarkComponents() {
    return function transformTree(tree: MdNode) {
    tree.children = (tree.children ?? []).map(transformNode)
    const children = tree.children ?? []
    const drop = new Set<MdNode>()
    for (let index = 0; index < children.length; index += 1) {
      const child = children[index]
      if (!child) continue
      const name = componentName(child)
      if (!name) continue
      const attrs = attrsOf(child)
      const items = yamlItems(child)
      if (isEmptySection(name, attrs, scope, items)) {
        drop.add(child)
        const previous = children[index - 1]
        if (previous && previous.type === 'heading' && (previous.depth === 2 || previous.depth === 3)) drop.add(previous)
        continue
      }
      if (attrs.collapsed === 'true') {
        const previous = children[index - 1]
        if (previous && !drop.has(previous) && previous.type === 'heading' && (previous.depth === 2 || previous.depth === 3)) {
          child.data = {
            hName: child.data?.hName,
            hProperties: { ...(child.data?.hProperties ?? {}), summary: plainText(previous) },
          }
          drop.add(previous)
        }
      }
    }
    let next = children.filter((child) => !drop.has(child))
    if (home) {
      const groups: MdNode[][] = []
      let current: MdNode[] | null = null
      const flush = () => {
        if (current?.length) groups.push(current)
        current = null
      }
      for (const child of next) {
        const name = componentName(child)
        if (name && OWN_BAND.has(name)) {
          flush()
          groups.push([child])
          continue
        }
        if (child.type === 'heading' && child.depth === 2) {
          flush()
          current = [child]
          continue
        }
        if (!current) current = []
        current.push(child)
      }
      flush()
      next = groups.map((nodes, index) => ({
        type: 'homeBand',
        children: nodes,
        data: { hName: 'section', hProperties: { className: bandClasses(nodes, index) } },
      }))
    }
    tree.children = next
    }
  }
}

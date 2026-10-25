import { createContext, useContext } from 'react'
import type { MarkdownScope } from './query'

export const MarkdownScopeContext = createContext<MarkdownScope | undefined>(undefined)

export function useMarkdownScope(): MarkdownScope | undefined {
  return useContext(MarkdownScopeContext)
}

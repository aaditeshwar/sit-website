import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { publicHref } from './url'

export function useReadySearch() {
  const { pathname } = useLocation()
  const [search, setSearch] = useState('')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const apply = () => setSearch(window.location.search)
    apply()
    setReady(true)
    window.addEventListener('popstate', apply)
    return () => window.removeEventListener('popstate', apply)
  }, [])

  const params = useMemo(() => (ready ? new URLSearchParams(search) : new URLSearchParams()), [ready, search])

  function setParams(next: URLSearchParams, mode: 'push' | 'replace' = 'push') {
    const query = next.toString()
    const target = query ? `${pathname}?${query}` : pathname
    const url = publicHref(pathname, target)
    if (mode === 'replace') window.history.replaceState(null, '', url)
    else window.history.pushState(null, '', url)
    setSearch(query ? `?${query}` : '')
    setReady(true)
  }

  return { pathname, params, setParams, ready }
}

export function withParam(pathname: string, params: URLSearchParams, key: string, value: string): string {
  const next = new URLSearchParams(params)
  if (next.get(key) === value) next.delete(key)
  else next.set(key, value)
  next.delete('page')
  const query = next.toString()
  return query ? `${pathname}?${query}` : pathname
}

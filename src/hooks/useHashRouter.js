import { useState, useEffect, useCallback } from 'react'

function parseHash(hash) {
  const h = (hash || '').replace('#', '').replace(/^\//, '')
  if (!h || h === 'home') return { page: 'home' }
  const parts = h.split('/')
  if (parts[0] === 'fiche' && parts[1]) return { page: 'fiche', ficheId: parts[1], modId: parts[2] || null }
  if (parts[0] === 'module' && parts[1]) return { page: 'module', modId: parts[1] }
  if (parts[0] === 'revision') return { page: 'revision' }
  if (parts[0] === 'perso') return { page: 'perso' }
  if (parts[0] === 'dashboard') return { page: 'dashboard' }
  if (parts[0] === 'zendesk') return { page: 'zendesk' }
  if (parts[0] === 'explorer') return { page: 'explorer' }
  return { page: 'home' }
}

function buildHash(page, params = {}) {
  if (page === 'home') return '#/'
  if (page === 'fiche') return `#/fiche/${params.ficheId}${params.modId ? '/' + params.modId : ''}`
  if (page === 'module') return `#/module/${params.modId}`
  if (page === 'form') return params.modId ? `#/module/${params.modId}/new` : '#/form'
  return `#/${page}`
}

export function useHashRouter() {
  const [route, setRoute] = useState(() => parseHash(window.location.hash))

  useEffect(() => {
    const handler = () => setRoute(parseHash(window.location.hash))
    window.addEventListener('hashchange', handler)
    return () => window.removeEventListener('hashchange', handler)
  }, [])

  const navigate = useCallback((page, params = {}) => {
    const hash = buildHash(page, params)
    window.location.hash = hash
    setRoute(parseHash(hash))
  }, [])

  const getShareUrl = useCallback((page, params = {}) => {
    return window.location.origin + window.location.pathname + buildHash(page, params)
  }, [])

  return { route, navigate, getShareUrl }
}

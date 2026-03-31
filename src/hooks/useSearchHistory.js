import { useState, useCallback } from 'react'

const KEY = 'lgpi-search-history'
const MAX = 8

function load() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') }
  catch { return [] }
}

export function useSearchHistory() {
  const [history, setHistory] = useState(load)

  const addSearch = useCallback((query) => {
    if (!query?.trim() || query.trim().length < 2) return
    setHistory(prev => {
      const filtered = prev.filter(q => q !== query.trim())
      const next = [query.trim(), ...filtered].slice(0, MAX)
      localStorage.setItem(KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const removeSearch = useCallback((query) => {
    setHistory(prev => {
      const next = prev.filter(q => q !== query)
      localStorage.setItem(KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const clearHistory = useCallback(() => {
    localStorage.removeItem(KEY)
    setHistory([])
  }, [])

  return { history, addSearch, removeSearch, clearHistory }
}

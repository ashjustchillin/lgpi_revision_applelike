import { useState, useCallback } from 'react'

const STORAGE_KEY = 'lgpi-history'
const MAX_HISTORY = 8

function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch { return [] }
}

export function useHistory() {
  const [history, setHistory] = useState(loadHistory)

  const addToHistory = useCallback((noteId) => {
    setHistory(prev => {
      const filtered = prev.filter(id => id !== noteId)
      const next = [noteId, ...filtered].slice(0, MAX_HISTORY)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const clearHistory = useCallback(() => {
    setHistory([])
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  return { history, addToHistory, clearHistory }
}

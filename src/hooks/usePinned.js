import { useState, useCallback } from 'react'

const STORAGE_KEY = 'lgpi-pinned'

function loadPinned() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch { return [] }
}

export function usePinned() {
  const [pinned, setPinned] = useState(loadPinned)

  const togglePin = useCallback((noteId) => {
    setPinned(prev => {
      const next = prev.includes(noteId)
        ? prev.filter(id => id !== noteId)
        : [...prev, noteId]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const isPinned = useCallback((noteId) => pinned.includes(noteId), [pinned])

  return { pinned, togglePin, isPinned }
}

import { useState, useCallback } from 'react'

const STORAGE_KEY = 'lgpi-mastery'

// Niveaux : 0=Nouveau, 1=Apprenti, 2=Intermédiaire, 3=Avancé, 4=Maîtrisé
export const MASTERY_LEVELS = [
  { id: 0, label: 'Nouveau',       emoji: '🌱', color: '#9ca3af', bg: '#f3f4f6' },
  { id: 1, label: 'Apprenti',      emoji: '📖', color: '#3b82f6', bg: '#dbeafe' },
  { id: 2, label: 'Intermédiaire', emoji: '⚡', color: '#f59e0b', bg: '#fef3c7' },
  { id: 3, label: 'Avancé',        emoji: '🔥', color: '#f97316', bg: '#ffedd5' },
  { id: 4, label: 'Maîtrisé',      emoji: '⭐', color: '#10b981', bg: '#d1fae5' },
]

function loadMastery() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') }
  catch { return {} }
}

export function useMastery() {
  const [mastery, setMastery] = useState(loadMastery)

  const getLevel = useCallback((noteId) => {
    return mastery[noteId] ?? 0
  }, [mastery])

  const getLevelInfo = useCallback((noteId) => {
    return MASTERY_LEVELS[mastery[noteId] ?? 0]
  }, [mastery])

  const setLevel = useCallback((noteId, level) => {
    setMastery(prev => {
      const next = { ...prev, [noteId]: Math.max(0, Math.min(4, level)) }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  // Mise à jour automatique après révision
  const updateFromRevision = useCallback((noteId, correct) => {
    setMastery(prev => {
      const current = prev[noteId] ?? 0
      // Correct → monte (max +1), Incorrect → descend (max -1)
      const next = correct
        ? Math.min(4, current + 1)
        : Math.max(0, current - 1)
      const updated = { ...prev, [noteId]: next }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      return updated
    })
  }, [])

  const getMasteryStats = useCallback((notes) => {
    return MASTERY_LEVELS.map(l => ({
      ...l,
      count: notes.filter(n => (mastery[n.id] ?? 0) === l.id).length,
    }))
  }, [mastery])

  const clearMastery = useCallback(() => {
    setMastery({})
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  return { mastery, getLevel, getLevelInfo, setLevel, updateFromRevision, getMasteryStats, clearMastery }
}

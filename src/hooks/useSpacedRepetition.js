import { useState, useCallback } from 'react'

const STORAGE_KEY = 'lgpi-srs'

function loadSRS() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') }
  catch { return {} }
}

function saveSRS(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

function getNextReview(card, correct) {
  const q = correct ? 4 : 1
  let { interval = 0, easiness = 2.5, repetitions = 0 } = card
  if (q >= 3) {
    if (repetitions === 0) interval = 1
    else if (repetitions === 1) interval = 6
    else interval = Math.round(interval * easiness)
    repetitions++
  } else {
    repetitions = 0
    interval = 1
  }
  easiness = Math.max(1.3, easiness + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  const nextDate = new Date()
  nextDate.setDate(nextDate.getDate() + interval)
  return {
    interval,
    easiness,
    repetitions,
    nextReview: nextDate.toISOString().slice(0, 10),
    lastReview: new Date().toISOString().slice(0, 10),
  }
}

export function useSpacedRepetition() {
  const [srs, setSRS] = useState(loadSRS)

  const isDue = useCallback((noteId) => {
    const card = srs[noteId]
    if (!card || !card.nextReview) return true
    return card.nextReview <= new Date().toISOString().slice(0, 10)
  }, [srs])

  const getDueCount = useCallback((noteIds) => {
    return noteIds.filter(id => isDue(id)).length
  }, [isDue])

  const updateCard = useCallback((noteId, correct) => {
    setSRS(prev => {
      const card = prev[noteId] || {}
      const updated = { ...prev, [noteId]: getNextReview(card, correct) }
      saveSRS(updated)
      return updated
    })
  }, [])

  const sortByPriority = useCallback((notes) => {
    const today = new Date().toISOString().slice(0, 10)
    return [...notes].sort((a, b) => {
      const aData = srs[a.id] || {}
      const bData = srs[b.id] || {}
      const aDue = !aData.nextReview || aData.nextReview <= today
      const bDue = !bData.nextReview || bData.nextReview <= today
      if (aDue && !bDue) return -1
      if (!aDue && bDue) return 1
      return (aData.nextReview || '') < (bData.nextReview || '') ? -1 : 1
    })
  }, [srs])

  const getDaysUntil = useCallback((noteId) => {
    const card = srs[noteId]
    if (!card || !card.nextReview) return 0
    const diff = Math.ceil((new Date(card.nextReview) - new Date()) / 86400000)
    return Math.max(0, diff)
  }, [srs])

  const clearSRS = useCallback(() => {
    setSRS({})
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  return { srs, isDue, getDueCount, updateCard, sortByPriority, getDaysUntil, clearSRS }
}

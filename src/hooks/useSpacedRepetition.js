import { useState, useCallback } from 'react'

const STORAGE_KEY = 'lgpi-srs'

function loadSRS() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') }
  catch { return {} }
}

function saveSRS(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function useSpacedRepetition() {
  const [srs, setSRS] = useState(loadSRS)

  const today = () => new Date().toISOString().slice(0, 10)

  const isDue = useCallback((noteId) => {
    const card = srs[noteId]
    if (!card || !card.nextReview) return true
    return card.nextReview <= today()
  }, [srs])

  const updateSRS = useCallback((noteId, correct) => {
    setSRS(prev => {
      const card = prev[noteId] || { interval: 0, easiness: 2.5, repetitions: 0 }
      const q = correct ? 4 : 1
      let { interval, easiness, repetitions } = card
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
      const updated = {
        ...prev,
        [noteId]: {
          interval, easiness, repetitions,
          nextReview: nextDate.toISOString().slice(0, 10),
          lastReview: today(),
        }
      }
      saveSRS(updated)
      return updated
    })
  }, [])

  const getDueNotes = useCallback((notes) => {
    const t = today()
    return notes.filter(n => {
      const card = srs[n.id]
      if (!card || !card.nextReview) return true
      return card.nextReview <= t
    }).sort((a, b) => {
      const aNext = srs[a.id]?.nextReview || ''
      const bNext = srs[b.id]?.nextReview || ''
      return aNext < bNext ? -1 : 1
    })
  }, [srs])

  const getSRSStats = useCallback((notes) => {
    const t = today()
    const due = notes.filter(n => {
      const card = srs[n.id]
      return !card || !card.nextReview || card.nextReview <= t
    }).length
    const learned = Object.keys(srs).filter(id => (srs[id].repetitions || 0) > 0).length
    const vals = Object.values(srs)
    const avgInterval = vals.length
      ? Math.round(vals.reduce((a, c) => a + (c.interval || 1), 0) / vals.length)
      : 0
    return { due, learned, avgInterval }
  }, [srs])

  const clearSRS = useCallback(() => {
    setSRS({})
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  return { srs, isDue, updateSRS, getDueNotes, getSRSStats, clearSRS }
}

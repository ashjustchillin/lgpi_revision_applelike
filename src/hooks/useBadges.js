import { useState, useEffect } from 'react'

const KEY = 'lgpi-badges'

export const BADGE_DEFS = [
  { id: 'first_fiche', icon: '🌱', label: 'Premiere fiche', desc: 'Tu as consulte ta premiere fiche', condition: (s) => s.totalViews >= 1 },
  { id: 'regular', icon: '📚', label: 'Regulier', desc: '10 fiches consultees', condition: (s) => s.totalViews >= 10 },
  { id: 'expert', icon: '🏆', label: 'Expert', desc: '50 fiches consultees', condition: (s) => s.totalViews >= 50 },
  { id: 'streak_3', icon: '🔥', label: 'En feu', desc: '3 jours consecutifs', condition: (s) => s.streak >= 3 },
  { id: 'streak_7', icon: '⚡', label: 'Inarretable', desc: '7 jours consecutifs', condition: (s) => s.streak >= 7 },
  { id: 'revisor', icon: '🃏', label: 'Reviseur', desc: '20 flashcards repondues', condition: (s) => s.totalReviewed >= 20 },
  { id: 'master', icon: '🎯', label: 'Maitre', desc: '5 fiches niveau Expert', condition: (s) => s.expertCount >= 5 },
  { id: 'commenter', icon: '💬', label: 'Actif', desc: 'Premier commentaire', condition: (s) => s.comments >= 1 },
]

function load() {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}') }
  catch { return {} }
}

export function useBadges(stats) {
  const [earned, setEarned] = useState(load)
  const [newBadge, setNewBadge] = useState(null)

  useEffect(() => {
    if (!stats) return
    const current = load()
    let changed = false
    const justEarned = []

    BADGE_DEFS.forEach(b => {
      if (!current[b.id] && b.condition(stats)) {
        current[b.id] = Date.now()
        justEarned.push(b)
        changed = true
      }
    })

    if (changed) {
      localStorage.setItem(KEY, JSON.stringify(current))
      setEarned(current)
      if (justEarned.length > 0) setNewBadge(justEarned[0])
    }
  }, [stats?.totalViews, stats?.streak, stats?.totalReviewed, stats?.expertCount])

  const clearNewBadge = () => setNewBadge(null)

  return {
    earned,
    newBadge,
    clearNewBadge,
    allBadges: BADGE_DEFS.map(b => ({ ...b, earnedAt: earned[b.id] || null })),
  }
}

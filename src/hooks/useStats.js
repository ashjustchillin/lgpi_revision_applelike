import { useState, useCallback } from 'react'

const STORAGE_KEY = 'lgpi-stats'

function loadStats() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
  } catch { return {} }
}

function saveStats(stats) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stats))
}

export function useStats() {
  const [stats, setStats] = useState(loadStats)

  // Enregistrer une session de révision
  const recordSession = useCallback((results) => {
    // results = [{ noteId, correct, moduleId }]
    setStats(prev => {
      const next = { ...prev }
      const today = new Date().toISOString().slice(0, 10)

      // Sessions par jour
      if (!next.sessions) next.sessions = {}
      if (!next.sessions[today]) next.sessions[today] = { ok: 0, ko: 0, total: 0 }
      results.forEach(r => {
        next.sessions[today].total++
        if (r.correct) next.sessions[today].ok++
        else next.sessions[today].ko++
      })

      // Stats par fiche
      if (!next.notes) next.notes = {}
      results.forEach(r => {
        if (!next.notes[r.noteId]) next.notes[r.noteId] = { ok: 0, ko: 0, total: 0 }
        next.notes[r.noteId].total++
        if (r.correct) next.notes[r.noteId].ok++
        else next.notes[r.noteId].ko++
      })

      // Stats par module
      if (!next.modules) next.modules = {}
      results.forEach(r => {
        if (!next.modules[r.moduleId]) next.modules[r.moduleId] = { ok: 0, ko: 0, total: 0 }
        next.modules[r.moduleId].total++
        if (r.correct) next.modules[r.moduleId].ok++
        else next.modules[r.moduleId].ko++
      })

      saveStats(next)
      return next
    })
  }, [])

  // Calculer le streak
  const getStreak = useCallback(() => {
    if (!stats.sessions) return 0
    const today = new Date()
    let streak = 0
    for (let i = 0; i < 365; i++) {
      const d = new Date(today)
      d.setDate(today.getDate() - i)
      const key = d.toISOString().slice(0, 10)
      if (stats.sessions[key] && stats.sessions[key].total > 0) streak++
      else if (i > 0) break
    }
    return streak
  }, [stats])

  // Derniers 7 jours pour le graphique
  const getLast7Days = useCallback(() => {
    const days = []
    const today = new Date()
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(today.getDate() - i)
      const key = d.toISOString().slice(0, 10)
      const session = stats.sessions?.[key] || { ok: 0, ko: 0, total: 0 }
      days.push({
        date: key,
        label: d.toLocaleDateString('fr', { weekday: 'short' }),
        ...session,
        pct: session.total > 0 ? Math.round((session.ok / session.total) * 100) : null,
      })
    }
    return days
  }, [stats])

  // Fiches les plus ratées
  const getWorstNotes = useCallback((notes, limit = 5) => {
    if (!stats.notes) return []
    return Object.entries(stats.notes)
      .filter(([, s]) => s.total >= 2)
      .map(([id, s]) => ({
        id,
        note: notes.find(n => n.id === id),
        pct: Math.round((s.ok / s.total) * 100),
        total: s.total,
      }))
      .filter(x => x.note)
      .sort((a, b) => a.pct - b.pct)
      .slice(0, limit)
  }, [stats])

  // Score moyen global
  const getGlobalScore = useCallback(() => {
    if (!stats.sessions) return null
    const all = Object.values(stats.sessions)
    if (!all.length) return null
    const total = all.reduce((a, s) => a + s.total, 0)
    const ok = all.reduce((a, s) => a + s.ok, 0)
    return total > 0 ? Math.round((ok / total) * 100) : null
  }, [stats])

  // Total fiches révisées
  const getTotalReviewed = useCallback(() => {
    if (!stats.sessions) return 0
    return Object.values(stats.sessions).reduce((a, s) => a + s.total, 0)
  }, [stats])

  const clearStats = useCallback(() => {
    setStats({})
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  return {
    stats,
    recordSession,
    getStreak,
    getLast7Days,
    getWorstNotes,
    getGlobalScore,
    getTotalReviewed,
    clearStats,
  }
}

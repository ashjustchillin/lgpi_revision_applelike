import { useState, useCallback } from 'react'

const STORAGE_KEY = 'lgpi-activity'

function loadActivity() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') }
  catch { return {} }
}

function saveActivity(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function useActivityStats(userId) {
  const [activity, setActivity] = useState(loadActivity)

  const recordView = useCallback((noteId, moduleId) => {
    if (!userId || !noteId) return
    setActivity(prev => {
      const next = JSON.parse(JSON.stringify(prev))
      const today = new Date().toISOString().slice(0, 10)

      // Par utilisateur
      if (!next[userId]) next[userId] = { views: {}, daily: {}, modules: {} }
      if (!next[userId].views[noteId]) next[userId].views[noteId] = 0
      next[userId].views[noteId]++

      // Par jour
      if (!next[userId].daily[today]) next[userId].daily[today] = 0
      next[userId].daily[today]++

      // Par module
      if (moduleId) {
        if (!next[userId].modules[moduleId]) next[userId].modules[moduleId] = 0
        next[userId].modules[moduleId]++
      }

      saveActivity(next)
      return next
    })
  }, [userId])

  // Stats globales pour admin
  const getGlobalStats = useCallback((accounts, notes, mods) => {
    const result = []
    Object.entries(accounts || {}).forEach(([uid, acc]) => {
      if (acc.role === 'admin') return
      const userActivity = activity[uid] || {}
      const totalViews = Object.values(userActivity.views || {}).reduce((a, b) => a + b, 0)

      // Fiche la plus vue
      const topNoteId = Object.entries(userActivity.views || {})
        .sort((a, b) => b[1] - a[1])[0]?.[0]
      const topNote = notes?.find(n => n.id === topNoteId)

      // Module favori
      const topModId = Object.entries(userActivity.modules || {})
        .sort((a, b) => b[1] - a[1])[0]?.[0]
      const topMod = mods?.find(m => m.id === topModId)

      // Jours actifs (7 derniers jours)
      const last7 = Array.from({ length: 7 }, (_, i) => {
        const d = new Date()
        d.setDate(d.getDate() - i)
        return d.toISOString().slice(0, 10)
      })
      const activeDays = last7.filter(d => userActivity.daily?.[d] > 0).length

      result.push({
        userId: uid,
        name: acc.name,
        color: acc.color,
        totalViews,
        activeDays,
        topNote,
        topMod,
        daily: userActivity.daily || {},
      })
    })
    return result.sort((a, b) => b.totalViews - a.totalViews)
  }, [activity])

  // Fiches les plus populaires globalement
  const getMostViewedNotes = useCallback((notes, limit = 5) => {
    const counts = {}
    Object.values(activity).forEach(userAct => {
      Object.entries(userAct.views || {}).forEach(([id, count]) => {
        counts[id] = (counts[id] || 0) + count
      })
    })
    return Object.entries(counts)
      .map(([id, count]) => ({ note: notes?.find(n => n.id === id), count }))
      .filter(x => x.note)
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
  }, [activity])

  return { recordView, getGlobalStats, getMostViewedNotes, activity }
}

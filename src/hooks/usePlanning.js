import { useState, useEffect } from 'react'
import { DEFAULT_SCHEDULE } from '../lib/firebase'
import { toSec, slotMins, pad2, fmtMin } from '../lib/utils'

const REF_MONDAY = new Date(2025, 2, 17)

export function getMondayOf(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + (d.getDay() === 0 ? -6 : 1 - d.getDay()))
  return d
}

export function getWeekType(date) {
  return Math.round((getMondayOf(date) - REF_MONDAY) / (7 * 24 * 3600 * 1000)) % 2 === 0 ? 'A' : 'B'
}

export function getISOWeek(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7)
  const w1 = new Date(d.getFullYear(), 0, 4)
  return 1 + Math.round(((d - w1) / 86400000 - 3 + (w1.getDay() + 6) % 7) / 7)
}

export function getFerieLabel(date) {
  const y = date.getFullYear(), ds = date.toDateString()
  const a = y % 19, b = Math.floor(y / 100), c = y % 100
  const d2 = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d2 - g + 15) % 30
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7
  const m2 = Math.floor((a + 11 * h + 22 * l) / 451)
  const p = new Date(y, Math.floor((h + l - 7 * m2 + 114) / 31) - 1, ((h + l - 7 * m2 + 114) % 31) + 1)
  const add = n => { const d = new Date(p); d.setDate(d.getDate() + n); return d }
  const fd = (m, d) => new Date(y, m - 1, d)
  const list = [
    { d: fd(1, 1), l: "Jour de l'an" }, { d: add(1), l: 'Lundi de Pâques' },
    { d: fd(5, 1), l: 'Fête du Travail' }, { d: fd(5, 8), l: 'Victoire 1945' },
    { d: add(39), l: 'Ascension' }, { d: add(50), l: 'Lundi de Pentecôte' },
    { d: fd(7, 14), l: 'Fête Nationale' }, { d: fd(8, 15), l: 'Assomption' },
    { d: fd(11, 1), l: 'Toussaint' }, { d: fd(11, 11), l: 'Armistice' },
    { d: fd(12, 25), l: 'Noël' },
  ]
  return list.find(x => x.d.toDateString() === ds)?.l || null
}

export function getSlotsForDay(dow, wt, schedule) {
  if (dow >= 1 && dow <= 4) return schedule[dow]?.slots || []
  if (dow === 5) return schedule[5]?.['type' + wt] || []
  return []
}

export function usePlanning() {
  const [schedule, setSchedule] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('lgpi-schedule') || 'null') || JSON.parse(JSON.stringify(DEFAULT_SCHEDULE))
    } catch { return JSON.parse(JSON.stringify(DEFAULT_SCHEDULE)) }
  })
  const [planningData, setPlanningData] = useState(null)

  const updateSchedule = s => {
    setSchedule(s)
    localStorage.setItem('lgpi-schedule', JSON.stringify(s))
  }

  useEffect(() => {
    const compute = () => {
      const now = new Date()
      const dow = now.getDay()
      const wt = getWeekType(now)
      const fl = getFerieLabel(now)
      const slots = (fl || dow === 0 || dow === 6) ? [] : getSlotsForDay(dow, wt, schedule)
      const nowSec = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds()

      // Progress bar
      let progressPct = 0, progressLabel = '', hoursLeft = ''
      if (fl) { progressLabel = '🎌 ' + fl }
      else if (!slots.length) { progressLabel = dow === 0 || dow === 6 ? 'Week-end 🌴' : 'Pas de travail' }
      else {
        const totalSec = slotMins(slots) * 60
        const dayStart = toSec(slots[0].s), dayEnd = toSec(slots[slots.length - 1].e)
        let worked = 0
        slots.forEach(s => {
          const ss = toSec(s.s), se = toSec(s.e)
          if (nowSec >= se) worked += se - ss
          else if (nowSec > ss) worked += nowSec - ss
        })
        const rem = Math.max(0, totalSec - worked)
        progressPct = nowSec < dayStart ? 0 : nowSec >= dayEnd ? 100 : Math.round((worked / totalSec) * 100)
        if (nowSec < dayStart) { progressLabel = 'Pas encore commencé' }
        else if (nowSec >= dayEnd) { progressLabel = 'Journée terminée ✓'; hoursLeft = fmtMin(slotMins(slots)) + ' travaillées' }
        else { progressLabel = 'Progression de la journée'; hoursLeft = `${Math.floor(rem / 3600)}h${pad2(Math.floor((rem % 3600) / 60))} restantes` }
      }

      // Countdown
      let cdIcon = '⏱️', cdLabel = '', cdValue = '---', cdStatus = '', cdStatusClass = ''
      let miniBarPct = 0, nextInfo = ''
      if (fl) {
        cdIcon = '🎌'; cdLabel = fl; cdValue = 'Férié'; cdStatus = 'Férié'; cdStatusClass = 'weekend'
      } else if (!slots.length) {
        cdIcon = '🌴'; cdLabel = 'Profite bien !'; cdValue = 'Week-end'; cdStatus = 'Repos'; cdStatusClass = 'weekend'
      } else {
        const s1s = toSec(slots[0].s), s1e = toSec(slots[0].e)
        const s2s = slots[1] ? toSec(slots[1].s) : null
        const s2e = slots[1] ? toSec(slots[1].e) : null
        let rem = 0, st = '', sc = ''
        if (nowSec < s1s) { rem = s1s - nowSec; cdLabel = 'Début dans'; st = 'Avant le travail'; sc = 'pause'; cdIcon = '☀️'; nextInfo = 'Début à ' + slots[0].s; miniBarPct = 0 }
        else if (nowSec < s1e) { rem = s1e - nowSec; cdLabel = 'Fin de matinée dans'; st = 'En cours'; sc = 'travail'; cdIcon = '💼'; nextInfo = 'Fin à ' + slots[0].e; miniBarPct = Math.round(((nowSec - s1s) / (s1e - s1s)) * 50) }
        else if (s2s && nowSec < s2s) { rem = s2s - nowSec; cdLabel = 'Reprise dans'; st = 'Pause déjeuner'; sc = 'pause'; cdIcon = '🍽️'; nextInfo = 'Reprise à ' + slots[1].s; miniBarPct = 50 }
        else if (s2s && nowSec < s2e) { rem = s2e - nowSec; cdLabel = 'Fin de journée dans'; st = 'En cours'; sc = 'travail'; cdIcon = '💼'; nextInfo = 'Fin à ' + slots[1].e; miniBarPct = 50 + Math.round(((nowSec - s2s) / (s2e - s2s)) * 50) }
        else { rem = 0; cdLabel = 'Journée terminée !'; st = 'Terminé'; sc = 'fini'; cdIcon = '✅'; miniBarPct = 100 }
        cdStatus = st; cdStatusClass = sc
        cdValue = rem > 0 ? `${pad2(Math.floor(rem / 3600))}h${pad2(Math.floor((rem % 3600) / 60))}m${pad2(rem % 60)}s` : '---'
      }

      // Week grid
      const monday = getMondayOf(now)
      const weekDays = Array.from({ length: 5 }, (_, i) => {
        const d = new Date(monday); d.setDate(monday.getDate() + i)
        const fl2 = getFerieLabel(d)
        const slots2 = fl2 ? [] : getSlotsForDay(d.getDay(), wt, schedule)
        const isToday = d.toDateString() === now.toDateString()
        const isPast = d < now && !isToday
        let dayProgressPct = 0
        if (isToday && slots2.length) {
          const totalSec2 = slotMins(slots2) * 60
          const dayStart2 = toSec(slots2[0].s), dayEnd2 = toSec(slots2[slots2.length - 1].e)
          let worked2 = 0
          slots2.forEach(s => { const ss = toSec(s.s), se = toSec(s.e); if (nowSec >= se) worked2 += se - ss; else if (nowSec > ss) worked2 += nowSec - ss })
          dayProgressPct = nowSec < dayStart2 ? 0 : nowSec >= dayEnd2 ? 100 : Math.round((worked2 / totalSec2) * 100)
        }
        return { date: d, label: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven'][i], color: ['#6C63FF', '#FF6584', '#43D9AD', '#FFB547', '#FF8C42'][i], slots: slots2, ferieLabel: fl2, isToday, isPast, dayProgressPct, total: fmtMin(slotMins(slots2)) }
      })

      const weekTotal = weekDays.reduce((a, d) => a + slotMins(d.slots), 0)

      setPlanningData({
        weekType: wt, isoWeek: getISOWeek(now),
        progressPct, progressLabel, hoursLeft,
        cdIcon, cdLabel, cdValue, cdStatus, cdStatusClass, miniBarPct, nextInfo,
        weekDays, weekTotal: fmtMin(weekTotal),
      })
    }
    compute()
    const interval = setInterval(compute, 1000)
    return () => clearInterval(interval)
  }, [schedule])

  return { planningData, schedule, updateSchedule }
}

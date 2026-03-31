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
    { d: fd(1, 1), l: "Jour de l'an" }, { d: add(1), l: 'Lundi de Paques' },
    { d: fd(5, 1), l: 'Fete du Travail' }, { d: fd(5, 8), l: 'Victoire 1945' },
    { d: add(39), l: 'Ascension' }, { d: add(50), l: 'Lundi de Pentecote' },
    { d: fd(7, 14), l: 'Fete Nationale' }, { d: fd(8, 15), l: 'Assomption' },
    { d: fd(11, 1), l: 'Toussaint' }, { d: fd(11, 11), l: 'Armistice' },
    { d: fd(12, 25), l: 'Noel' },
  ]
  return list.find(x => x.d.toDateString() === ds)?.l || null
}

export function getSlotsForDay(dow, wt, schedule) {
  if (dow >= 1 && dow <= 4) return schedule[dow]?.slots || []
  if (dow === 5) return schedule[5]?.['type' + wt] || []
  return []
}

// Label contextuel basé sur l'heure de fin du créneau
function getSlotPeriodLabel(endTime, slots, slotIndex) {
  const endHour = Math.floor(toSec(endTime) / 3600)
  const isLastSlot = slotIndex === slots.length - 1

  if (isLastSlot) {
    if (endHour < 13) return 'Fin de matinée dans'
    return 'Fin de journée dans'
  }
  if (endHour <= 12) return 'Fin de matinée dans'
  if (endHour <= 14) return 'Pause déjeuner dans'
  return "Fin d'après-midi dans"
}

function getSlotPeriodIcon(endTime, slots, slotIndex) {
  const endHour = Math.floor(toSec(endTime) / 3600)
  const isLastSlot = slotIndex === slots.length - 1

  if (isLastSlot) return endHour < 13 ? '🌤️' : '🌇'
  if (endHour <= 12) return '🌤️'
  if (endHour <= 14) return '🍽️'
  return '🌇'
}

// Clé localStorage par utilisateur
function getScheduleKey(userId) {
  return userId ? 'lgpi-schedule-' + userId : 'lgpi-schedule'
}

export function usePlanning(userId) {
  const storageKey = getScheduleKey(userId)

  const [schedule, setSchedule] = useState(() => {
    try {
      const userKey = localStorage.getItem(storageKey)
      if (userKey) return JSON.parse(userKey)
      const generic = localStorage.getItem('lgpi-schedule')
      if (generic) return JSON.parse(generic)
      return JSON.parse(JSON.stringify(DEFAULT_SCHEDULE))
    } catch { return JSON.parse(JSON.stringify(DEFAULT_SCHEDULE)) }
  })
  const [planningData, setPlanningData] = useState(null)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) setSchedule(JSON.parse(saved))
      else setSchedule(JSON.parse(JSON.stringify(DEFAULT_SCHEDULE)))
    } catch {}
  }, [storageKey])

  const updateSchedule = s => {
    setSchedule(s)
    localStorage.setItem(storageKey, JSON.stringify(s))
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
        if (nowSec < dayStart) { progressLabel = 'Pas encore commence' }
        else if (nowSec >= dayEnd) { progressLabel = 'Journee terminee ✓'; hoursLeft = fmtMin(slotMins(slots)) + ' travaillees' }
        else { progressLabel = 'Progression de la journee'; hoursLeft = `${Math.floor(rem / 3600)}h${pad2(Math.floor((rem % 3600) / 60))} restantes` }
      }

      // Countdown
      let cdIcon = '⏱️', cdLabel = '', cdValue = '---', cdStatus = '', cdStatusClass = ''
      let miniBarPct = 0, nextInfo = ''
      if (fl) {
        cdIcon = '🎌'; cdLabel = fl; cdValue = 'Ferie'; cdStatus = 'Ferie'; cdStatusClass = 'weekend'
      } else if (!slots.length) {
        if (dow === 0 || dow === 6) {
          cdIcon = '🌴'; cdLabel = 'Week-end'; cdValue = 'Repos'; cdStatus = 'Week-end'; cdStatusClass = 'weekend'
        } else {
          cdIcon = '📅'; cdLabel = 'Pas de travail'; cdValue = '---'
        }
      } else {
        const firstStart = toSec(slots[0].s)
        const lastEnd = toSec(slots[slots.length - 1].e)

        if (nowSec < firstStart) {
          const rem2 = firstStart - nowSec
          cdIcon = '🌅'; cdLabel = 'Debut dans'; cdStatus = 'Avant travail'; cdStatusClass = 'pause'
          cdValue = `${Math.floor(rem2 / 3600)}h${pad2(Math.floor((rem2 % 3600) / 60))}`
          miniBarPct = 0
        } else if (nowSec >= lastEnd) {
          cdIcon = '✅'; cdLabel = 'Journee terminee'; cdValue = fmtMin(slotMins(slots))
          cdStatus = 'Fini'; cdStatusClass = 'fini'; miniBarPct = 100
          const nextDay = new Date(now); nextDay.setDate(nextDay.getDate() + 1)
          const nd = nextDay.getDay()
          if (nd === 6 || nd === 0) nextInfo = 'Prochain : Lundi'
          else if (nd === 5) nextInfo = 'Prochain : Vendredi'
        } else {
          const pauseSlot = slots.find((s, i) => i > 0 && nowSec >= toSec(slots[i - 1].e) && nowSec < toSec(s.s))
          const activeSlot = slots.find(s => nowSec >= toSec(s.s) && nowSec < toSec(s.e))
          const activeSlotIndex = slots.findIndex(s => nowSec >= toSec(s.s) && nowSec < toSec(s.e))

          if (pauseSlot) {
            const rem2 = toSec(pauseSlot.s) - nowSec
            cdIcon = '☕'; cdLabel = 'Reprise dans'; cdStatus = 'Pause'; cdStatusClass = 'pause'
            cdValue = `${Math.floor(rem2 / 3600)}h${pad2(Math.floor((rem2 % 3600) / 60))}`
            miniBarPct = 50
            nextInfo = `Reprise à ${pauseSlot.s}`
          } else if (activeSlot) {
            const rem2 = toSec(activeSlot.e) - nowSec
            cdIcon = getSlotPeriodIcon(activeSlot.e, slots, activeSlotIndex)
            cdLabel = getSlotPeriodLabel(activeSlot.e, slots, activeSlotIndex)
            cdStatus = 'En cours'; cdStatusClass = 'travail'
            cdValue = `${Math.floor(rem2 / 3600)}h${pad2(Math.floor((rem2 % 3600) / 60))}`
            const total = toSec(activeSlot.e) - toSec(activeSlot.s)
            const elapsed = nowSec - toSec(activeSlot.s)
            miniBarPct = Math.round((elapsed / total) * 100)
            nextInfo = `Jusqu'à ${activeSlot.e}`
          }
        }
      }

      // Semaine
      const weekDays = []
      const monday = getMondayOf(now)
      const weekTotal = (() => {
        let tot = 0
        for (let d = 1; d <= 5; d++) {
          const dt = new Date(monday); dt.setDate(dt.getDate() + d - 1)
          const wt2 = getWeekType(dt)
          const fl2 = getFerieLabel(dt)
          const sl = fl2 ? [] : getSlotsForDay(d, wt2, schedule)
          tot += slotMins(sl)
        }
        return fmtMin(tot) + ' / semaine'
      })()

      const dayColors = ['#6C63FF', '#FF6584', '#43D9AD', '#FFB547', '#3B82F6']
      for (let d = 1; d <= 5; d++) {
        const dt = new Date(monday); dt.setDate(dt.getDate() + d - 1)
        const wt2 = getWeekType(dt)
        const fl2 = getFerieLabel(dt)
        const sl = fl2 ? [] : getSlotsForDay(d, wt2, schedule)
        const isToday = dt.toDateString() === now.toDateString()
        const isPast = dt < new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const dayMins = slotMins(sl)

        let dayProgressPct = 0
        if (isToday && sl.length) {
          const ds2 = toSec(sl[0].s), de2 = toSec(sl[sl.length - 1].e)
          dayProgressPct = nowSec < ds2 ? 0 : nowSec >= de2 ? 100 : Math.round(((nowSec - ds2) / (de2 - ds2)) * 100)
        } else if (isPast && sl.length) dayProgressPct = 100

        weekDays.push({
          date: dt, dow: d, label: ['', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven'][d],
          slots: sl, total: dayMins ? fmtMin(dayMins) : 'Repos',
          isToday, isPast, color: dayColors[d - 1],
          ferieLabel: fl2, dayProgressPct,
        })
      }

      setPlanningData({
        progressPct, progressLabel, hoursLeft,
        cdIcon, cdLabel, cdValue, cdStatus, cdStatusClass, miniBarPct, nextInfo,
        weekDays, weekTotal, weekType: wt, weekNum: getISOWeek(now),
      })
    }

    compute()
    const id = setInterval(compute, 30000)
    return () => clearInterval(id)
  }, [schedule])

  return { planningData, schedule, updateSchedule }
}

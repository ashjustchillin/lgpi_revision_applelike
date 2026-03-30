import { useState } from 'react'
import { motion, AnimatePresence } from '../lib/motion'
import { usePlanning } from '../hooks/usePlanning'

const STATUS_CLASSES = {
  travail: 'status-travail',
  pause: 'status-pause',
  fini: 'status-fini',
  weekend: 'status-weekend',
}

export default function Planning() {
  const { planningData, schedule, updateSchedule } = usePlanning()
  const [showSettings, setShowSettings] = useState(false)
  const [localSchedule, setLocalSchedule] = useState(null)

  if (!planningData) return null

  const {
    weekType, isoWeek,
    progressPct, progressLabel, hoursLeft,
    cdIcon, cdLabel, cdValue, cdStatus, cdStatusClass, miniBarPct, nextInfo,
    weekDays, weekTotal,
  } = planningData

  const handleOpenSettings = () => {
    setLocalSchedule(JSON.parse(JSON.stringify(schedule)))
    setShowSettings(true)
  }

  const handleSaveSettings = () => {
    updateSchedule(localSchedule)
    setShowSettings(false)
  }

  const updateSlot = (dow, idx, field, value, type = null) => {
    const s = JSON.parse(JSON.stringify(localSchedule))
    if (type) s[dow]['type' + type][idx][field] = value
    else s[dow].slots[idx][field] = value
    setLocalSchedule(s)
  }

  const DAYS_CONFIG = [
    { dow: 1, label: 'Lundi' }, { dow: 2, label: 'Mardi' },
    { dow: 3, label: 'Mercredi' }, { dow: 4, label: 'Jeudi' },
  ]

  return (
    <div className="mt-10 pt-8 border-t border-gray-200 dark:border-zinc-700">
      {/* Header planning */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
        <h2 className="text-base font-semibold tracking-tight text-gray-900 dark:text-zinc-100">
          📅 Mon planning
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-accent-soft text-accent">
            Sem. {weekType} · S{isoWeek}
          </span>
          <button
            onClick={handleOpenSettings}
            className="text-xs text-gray-400 hover:text-accent border border-gray-200 dark:border-zinc-700 rounded-lg px-2.5 py-1 transition-colors"
          >
            ⚙️ Horaires
          </button>
        </div>
      </div>

      {/* Settings panel */}
      <AnimatePresence>
        {showSettings && localSchedule && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-2xl p-5 mb-5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Mes horaires</span>
                <button onClick={handleSaveSettings} className="btn-accent text-xs px-3 py-1.5">
                  Enregistrer
                </button>
              </div>
              <div className="space-y-3">
                {DAYS_CONFIG.map(({ dow, label }) => (
                  <div key={dow} className="flex items-center gap-4 flex-wrap">
                    <span className="text-sm font-semibold text-gray-700 dark:text-zinc-300 w-24">{label}</span>
                    <div className="flex gap-3 flex-wrap">
                      {(localSchedule[dow]?.slots || []).map((slot, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-xs text-gray-500">
                          <input type="time" value={slot.s} onChange={e => updateSlot(dow, i, 's', e.target.value)}
                            className="input-base text-xs py-1 px-2 w-24" />
                          <span>-</span>
                          <input type="time" value={slot.e} onChange={e => updateSlot(dow, i, 'e', e.target.value)}
                            className="input-base text-xs py-1 px-2 w-24" />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {['A', 'B'].map(wt => (
                  <div key={wt} className="flex items-center gap-4 flex-wrap">
                    <span className="text-sm font-semibold text-gray-700 dark:text-zinc-300 w-24">Vendredi {wt}</span>
                    <div className="flex gap-3 flex-wrap">
                      {(localSchedule[5]?.['type' + wt] || []).map((slot, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-xs text-gray-500">
                          <input type="time" value={slot.s} onChange={e => updateSlot(5, i, 's', e.target.value, wt)}
                            className="input-base text-xs py-1 px-2 w-24" />
                          <span>-</span>
                          <input type="time" value={slot.e} onChange={e => updateSlot(5, i, 'e', e.target.value, wt)}
                            className="input-base text-xs py-1 px-2 w-24" />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress bar journée */}
      <div className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-2xl p-4 mb-3">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs text-gray-400 font-medium">{progressLabel}</span>
          <span className="text-xs font-semibold text-gray-700 dark:text-zinc-300">{progressPct}%</span>
        </div>
        <div className="h-1.5 bg-gray-100 dark:bg-zinc-700 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{
              background: 'linear-gradient(90deg, var(--accent), #43D9AD)',
              width: `${progressPct}%`,
              transition: 'width 0.9s ease-out',
            }}
          />
        </div>
        {hoursLeft && <p className="text-right text-xs text-gray-400 mt-1.5">{hoursLeft}</p>}
      </div>

      {/* Countdown */}
      <div className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-2xl p-4 mb-5">
        <div className="flex items-center gap-4">
          <span className="text-2xl flex-shrink-0">{cdIcon}</span>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-400 font-medium mb-0.5">{cdLabel}</p>
            <p className="text-xl font-semibold tracking-tight text-gray-900 dark:text-zinc-100">{cdValue}</p>
          </div>
          {cdStatus && (
            <span className={`text-xs font-semibold px-3 py-1.5 rounded-full flex-shrink-0 ${STATUS_CLASSES[cdStatusClass] || ''}`}>
              {cdStatus}
            </span>
          )}
        </div>
        {/* Mini barre */}
        <div className="h-1 bg-gray-100 dark:bg-zinc-700 rounded-full overflow-hidden mt-3">
          <div
            className="h-full rounded-full"
            style={{
              background: 'linear-gradient(90deg, var(--accent), #43D9AD)',
              width: `${miniBarPct}%`,
              transition: 'width 0.9s ease',
            }}
          />
        </div>
        {nextInfo && <p className="text-xs text-gray-400 mt-1.5">{nextInfo}</p>}
      </div>

      {/* Grille semaine */}
      <div className="grid grid-cols-5 max-sm:grid-cols-1 gap-2 mb-2">
        {weekDays.map((day, i) => (
          <motion.div
            key={i}
            className={`relative bg-white dark:bg-zinc-800 rounded-xl border overflow-hidden p-3 ${
              day.isToday
                ? 'border-accent shadow-sm'
                : 'border-gray-200 dark:border-zinc-700'
            } ${day.isPast ? 'opacity-40' : ''} ${day.ferieLabel ? 'opacity-50' : ''}`}
          >
            {/* Accent bar */}
            <div className="absolute top-0 left-0 right-0 h-0.5 max-sm:top-0 max-sm:left-0 max-sm:right-auto max-sm:bottom-0 max-sm:w-0.5 max-sm:h-auto" style={{ background: day.color }} />
            <div className={`text-xs font-semibold uppercase tracking-wide mb-0.5 ${day.isToday ? 'text-accent' : 'text-gray-400 dark:text-zinc-500'}`}>
              {day.label}
            </div>
            <div className="text-xs text-gray-400 dark:text-zinc-500 mb-2">
              {day.date.getDate()}/{String(day.date.getMonth() + 1).padStart(2, '0')}
            </div>
            {day.ferieLabel ? (
              <span className="text-[10px] font-semibold bg-pink-50 text-pink-500 px-2 py-0.5 rounded-full">
                🎌 {day.ferieLabel}
              </span>
            ) : day.slots.map((s, j) => (
              <div key={j} className="flex items-center gap-1 text-[11px] font-medium text-gray-600 dark:text-zinc-400 py-0.5 border-b border-gray-50 dark:border-zinc-700 last:border-0">
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: day.color }} />
                {s.s} – {s.e}
              </div>
            ))}
            {!day.ferieLabel && day.slots.length > 0 && (
              <>
                <p className="text-[11px] text-gray-400 mt-1.5">{day.total}</p>
                {day.isToday && (
                  <div className="h-0.5 bg-gray-100 dark:bg-zinc-700 rounded-full overflow-hidden mt-1.5">
                    <div
                      className="h-full rounded-full"
                      style={{
                        background: day.color,
                        width: `${day.dayProgressPct}%`,
                        transition: 'width 0.9s ease',
                      }}
                    />
                  </div>
                )}
              </>
            )}
          </motion.div>
        ))}
      </div>
      <p className="text-right text-xs text-gray-400 mt-1">{weekTotal}</p>
    </div>
  )
}


// Badges de progression
const BADGES = [
  { id: 'first5', label: '5 fiches lues', icon: '📖', condition: (stats) => stats.totalReviewed >= 5 },
  { id: 'first50', label: '50 fiches lues', icon: '🎓', condition: (stats) => stats.totalReviewed >= 50 },
  { id: 'streak3', label: 'Streak 3 jours', icon: '🔥', condition: (stats) => stats.streak >= 3 },
  { id: 'streak7', label: 'Streak 7 jours', icon: '⚡', condition: (stats) => stats.streak >= 7 },
  { id: 'streak30', label: 'Streak 30 jours', icon: '👑', condition: (stats) => stats.streak >= 30 },
  { id: 'score80', label: 'Score 80%+', icon: '🏆', condition: (stats) => stats.globalScore >= 80 },
]

import { motion, useSpring, useTransform, animate } from '../lib/motion'
import { useEffect, useRef, useState } from 'react'

function CountUp({ value, suffix = '' }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    if (!value && value !== 0) return
    const controls = animate(0, value, {
      duration: 1.2,
      ease: 'easeOut',
      onUpdate: v => setDisplay(Math.round(v))
    })
    return controls.stop
  }, [value])
  return <span>{display}{suffix}</span>
}

function Bar({ day, maxTotal }) {
  const height = maxTotal > 0 && day.total > 0
    ? Math.max(6, Math.round((day.total / maxTotal) * 88))
    : 0
  const color = day.pct === null ? 'var(--bar-empty, #e5e7eb)'
    : day.pct >= 70 ? '#43D9AD'
    : day.pct >= 40 ? '#FFB547'
    : '#FF6584'

  return (
    <div className="flex flex-col items-center gap-1.5 flex-1">
      <div className="flex flex-col justify-end items-center gap-1" style={{ height: 100 }}>
        {day.total > 0 && (
          <span className="text-[9px] font-semibold" style={{ color }}>
            {day.pct !== null ? day.pct + '%' : ''}
          </span>
        )}
        <motion.div
          initial={{ height: 0 }}
          animate={{ height }}
          transition={{ duration: .6, ease: 'easeOut' }}
          className="w-full rounded-lg"
          style={{ background: height > 0 ? color : '#f3f4f6', minWidth: 20, opacity: height > 0 ? 1 : 0.3 }}
        />
      </div>
      <span className="text-[10px] text-gray-400 font-medium capitalize">{day.label}</span>
      {day.total > 0 && <span className="text-[9px] text-gray-300 dark:text-zinc-600">{day.total}</span>}
    </div>
  )
}

export default function StatsPanel({ stats, streak, last7Days, globalScore, totalReviewed, worstNotes, mods, onFiche, onClear, srsStats }) {
  const maxTotal = Math.max(...last7Days.map(d => d.total), 1)
  const hasData = totalReviewed > 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-8 pt-6 border-t border-gray-200 dark:border-zinc-700"
    >
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-semibold tracking-tight text-gray-900 dark:text-zinc-100">
          📊 Statistiques de révision
        </h2>
        {hasData && (
          <button
            onClick={onClear}
            className="text-xs text-gray-400 hover:text-red-400 transition-colors"
          >
            Réinitialiser
          </button>
        )}
      </div>

      {!hasData ? (
        <div className="text-center py-8 text-gray-400">
          <div className="text-3xl mb-2">📈</div>
          <p className="text-sm">Lance une session de révision pour voir tes stats !</p>
        </div>
      ) : (
        <>
          {/* Chiffres clés */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            {/* Streak */}
            <div className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-2xl p-4 text-center">
              <div className="text-2xl mb-1">{streak > 0 ? '🔥' : '💤'}</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-zinc-100"><CountUp value={streak} /></div>
              <p className="text-[11px] text-gray-400 mt-0.5">jour{streak !== 1 ? 's' : ''} de suite</p>
            </div>

            {/* Score moyen */}
            <div className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-2xl p-4 text-center">
              <div className="text-2xl mb-1">🎯</div>
              <div
                className="text-2xl font-bold"
                style={{ color: globalScore >= 70 ? '#43D9AD' : globalScore >= 40 ? '#FFB547' : '#FF6584' }}
              >
                <CountUp value={globalScore} suffix="%" />
              </div>
              <p className="text-[11px] text-gray-400 mt-0.5">score moyen</p>
            </div>

            {/* Total révisées */}
            <div className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-2xl p-4 text-center">
              <div className="text-2xl mb-1">📚</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-zinc-100"><CountUp value={totalReviewed} /></div>
              <p className="text-[11px] text-gray-400 mt-0.5">révisions total</p>
            </div>
          </div>

          {/* SRS Stats */}
          {srsStats && srsStats.due > 0 && (
            <div className="mb-4 p-3 bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-2xl flex items-center gap-3">
              <span className="text-2xl">⏰</span>
              <div>
                <p className="text-sm font-semibold text-orange-700 dark:text-orange-300">
                  {srsStats.due} fiche{srsStats.due > 1 ? 's' : ''} a revoir aujourd'hui
                </p>
                <p className="text-xs text-orange-500">Mode repetition espacee</p>
              </div>
            </div>
          )}

          {/* Graphique 7 jours */}
          <div className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-2xl p-4 mb-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">7 derniers jours</p>
            <div className="flex gap-1 items-end">
              {last7Days.map((day, i) => (
                <Bar key={i} day={day} maxTotal={maxTotal} />
              ))}
            </div>
            {/* Légende couleurs */}
            <div className="flex items-center gap-4 mt-3 justify-center">
              {[
                { color: '#43D9AD', label: '≥ 70%' },
                { color: '#FFB547', label: '40–69%' },
                { color: '#FF6584', label: '< 40%' },
                { color: '#e5e7eb', label: 'Pas de révision' },
              ].map(({ color, label }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ background: color }} />
                  <span className="text-[10px] text-gray-400">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Fiches à retravailler */}
          {worstNotes.length > 0 && (
            <div className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-2xl p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">⚠️ À retravailler</p>
              <div className="space-y-2">
                {worstNotes.map(({ id, note, pct, total }) => {
                  const mod = mods.find(m => m.id === note.module)
                  return (
                    <motion.div
                      key={id}
                      whileTap={{ scale: .98 }}
                      onClick={() => onFiche(id, note.module)}
                      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-700 cursor-pointer transition-colors"
                    >
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={{
                          background: pct >= 40 ? '#FFF4DC' : '#FFF0F0',
                          color: pct >= 40 ? '#996600' : '#CC0022',
                        }}
                      >
                        {pct}%
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 dark:text-zinc-200 truncate">{note.title}</p>
                        <p className="text-xs text-gray-400">{mod?.icon} {mod?.label} · {total} tentative{total > 1 ? 's' : ''}</p>
                      </div>
                      <div className="w-16 h-1.5 bg-gray-100 dark:bg-zinc-700 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${pct}%`,
                            background: pct >= 70 ? '#43D9AD' : pct >= 40 ? '#FFB547' : '#FF6584',
                          }}
                        />
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Objectif quotidien */}
          {(() => {
            const today = new Date().toISOString().slice(0, 10)
            const todayCount = (last7Days.find(d => d.date === today) || {}).total || 0
            const goal = 5
            const pct = Math.min(100, Math.round((todayCount / goal) * 100))
            return (
              <div className="card-base p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold" style={{ color: 'var(--text-2)' }}>Objectif du jour</p>
                  <span className="text-xs font-bold" style={{ color: pct >= 100 ? '#22c55e' : 'var(--accent)' }}>
                    {todayCount} / {goal} revisions
                  </span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                  <div className="h-full rounded-full" style={{ width: pct + '%', background: pct >= 100 ? '#22c55e' : 'var(--accent)', transition: 'width .7s ease' }} />
                </div>
                {pct >= 100 && <p className="text-xs mt-1.5 text-center" style={{ color: '#22c55e' }}>Objectif atteint ! 🎉</p>}
              </div>
            )
          })()}

          {/* Badges */}
          {(() => {
            const earned = BADGES.filter(b => b.condition({ streak, totalReviewed, globalScore }))
            if (!earned.length) return null
            return (
              <div className="mb-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-3)' }}>Badges obtenus</p>
                <div className="flex flex-wrap gap-2">
                  {earned.map(b => (
                    <div key={b.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
                      style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}>
                      <span>{b.icon}</span><span>{b.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })()}
        </>
      )}
    </motion.div>
  )
}

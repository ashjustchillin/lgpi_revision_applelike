import { motion } from 'framer-motion'
import { BackButton } from '../components/UI'
import { ACCOUNTS } from '../lib/accounts'

const container = { hidden: {}, show: { transition: { staggerChildren: .06 } } }
const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }

function MiniBar({ days, color }) {
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return d.toISOString().slice(0, 10)
  })
  const max = Math.max(...last7.map(d => days[d] || 0), 1)
  return (
    <div className="flex items-end gap-0.5 h-8">
      {last7.map((d, i) => {
        const val = days[d] || 0
        const h = max > 0 ? Math.max(2, Math.round((val / max) * 28)) : 2
        return (
          <motion.div key={d}
            initial={{ height: 0 }} animate={{ height: h }}
            transition={{ delay: i * .05, duration: .3 }}
            className="flex-1 rounded-sm"
            style={{ background: val > 0 ? color : 'var(--border)' }}
            title={d + ': ' + val + ' vues'}
          />
        )
      })}
    </div>
  )
}

export default function AdminDashboard({ onBack, globalStats, mostViewed, notes, mods, onFiche }) {
  const totalViews = globalStats.reduce((a, s) => a + s.totalViews, 0)
  const activeUsers = globalStats.filter(s => s.activeDays > 0).length

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="pb-24 sm:pb-0">
      <BackButton label="Retour" onClick={onBack} />

      {/* Header */}
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--accent)' }}>
          Administration
        </p>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-1)', letterSpacing: '-.04em' }}>
          Tableau de bord
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-2)' }}>
          Activite de l'equipe sur les 7 derniers jours
        </p>
      </div>

      {/* KPIs globaux */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Consultations totales', value: totalViews, icon: '👁️' },
          { label: 'Utilisateurs actifs', value: activeUsers + '/' + globalStats.length, icon: '👥' },
          { label: 'Fiches populaires', value: mostViewed.length, icon: '⭐' },
        ].map((kpi, i) => (
          <motion.div key={i} variants={item}
            className="card-base p-4 text-center"
          >
            <div className="text-2xl mb-1">{kpi.icon}</div>
            <div className="text-xl font-bold" style={{ color: 'var(--text-1)', letterSpacing: '-.03em' }}>{kpi.value}</div>
            <p className="text-[10px] mt-0.5 leading-tight" style={{ color: 'var(--text-3)' }}>{kpi.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Stats par collegue */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-1)' }}>Par collegue</h2>
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-3">
          {globalStats.length === 0 ? (
            <div className="card-base p-6 text-center">
              <p className="text-sm" style={{ color: 'var(--text-3)' }}>Aucune activite pour le moment</p>
            </div>
          ) : globalStats.map(stat => (
            <motion.div key={stat.userId} variants={item} className="card-base p-4">
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                  style={{ background: stat.color }}>
                  {stat.name}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>{stat.name}</p>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold" style={{ color: stat.color }}>
                        {stat.totalViews} vue{stat.totalViews !== 1 ? 's' : ''}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full"
                        style={{ background: stat.activeDays > 0 ? stat.color + '22' : 'var(--surface-2)', color: stat.activeDays > 0 ? stat.color : 'var(--text-3)' }}>
                        {stat.activeDays}j actif{stat.activeDays > 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                  {/* Mini graphique 7 jours */}
                  <MiniBar days={stat.daily} color={stat.color} />
                  {/* Info supplementaires */}
                  <div className="flex items-center gap-3 mt-2">
                    {stat.topNote && (
                      <p className="text-[10px] truncate flex-1" style={{ color: 'var(--text-3)' }}>
                        Fav: <span style={{ color: 'var(--text-2)' }}>{stat.topNote.title}</span>
                      </p>
                    )}
                    {stat.topMod && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full flex-shrink-0"
                        style={{ background: stat.topMod.bg, color: stat.topMod.tc }}>
                        {stat.topMod.icon} {stat.topMod.label}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Fiches les plus vues */}
      {mostViewed.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-1)' }}>
            Fiches les plus consultees
          </h2>
          <div className="space-y-2">
            {mostViewed.map(({ note, count }, i) => {
              const mod = mods?.find(m => m.id === note.module)
              return (
                <motion.div key={note.id}
                  initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * .05 }}
                  onClick={() => onFiche(note.id, note.module)}
                  className="card-base p-3 cursor-pointer flex items-center gap-3"
                  whileHover={{ x: 3 }}
                >
                  <span className="text-lg font-bold w-6 text-right flex-shrink-0"
                    style={{ color: i === 0 ? '#f59e0b' : i === 1 ? '#9ca3af' : i === 2 ? '#92400e' : 'var(--text-3)' }}>
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text-1)' }}>{note.title}</p>
                    {mod && (
                      <span className="text-[10px] font-medium" style={{ color: mod.tc }}>{mod.icon} {mod.label}</span>
                    )}
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}>
                    {count} vue{count > 1 ? 's' : ''}
                  </span>
                </motion.div>
              )
            })}
          </div>
        </div>
      )}
    </motion.div>
  )
}

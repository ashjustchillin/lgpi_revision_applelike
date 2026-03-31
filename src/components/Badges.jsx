import { useEffect } from 'react'
import { motion, AnimatePresence } from '../lib/motion'
import { BADGE_DEFS } from '../hooks/useBadges'

// Notification flottante nouveau badge
export function BadgeNotification({ badge, onClose }) {
  useEffect(() => {
    if (!badge) return
    const t = setTimeout(onClose, 4000)
    return () => clearTimeout(t)
  }, [badge])

  return (
    <AnimatePresence>
      {badge && (
        <motion.div
          initial={{ opacity: 0, y: -20, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: -20, x: '-50%' }}
          className="fixed top-20 left-1/2 z-50 rounded-2xl px-5 py-3 flex items-center gap-3 border"
          style={{
            background: 'var(--surface)',
            borderColor: '#fbbf24',
            boxShadow: '0 8px 32px rgba(251,191,36,.2), var(--shadow-lg)',
          }}
          onClick={onClose}
        >
          <span className="text-2xl">{badge.icon}</span>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#f59e0b' }}>
              Nouveau badge !
            </p>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>{badge.label}</p>
            <p className="text-xs" style={{ color: 'var(--text-3)' }}>{badge.desc}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Panneau de tous les badges
export function BadgesPanel({ allBadges }) {
  const earned = allBadges.filter(b => b.earnedAt)
  const locked = allBadges.filter(b => !b.earnedAt)

  return (
    <div className="mb-6">
      <p className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-3)' }}>
        Badges · {earned.length}/{allBadges.length}
      </p>
      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
        {allBadges.map(b => (
          <div key={b.id} title={b.desc}
            className="flex flex-col items-center gap-1 p-2 rounded-xl text-center transition-all"
            style={{
              background: b.earnedAt ? 'var(--accent-bg)' : 'var(--surface-2)',
              opacity: b.earnedAt ? 1 : 0.35,
            }}>
            <span className="text-xl">{b.icon}</span>
            <p className="text-[9px] font-semibold leading-tight" style={{ color: b.earnedAt ? 'var(--accent)' : 'var(--text-3)' }}>
              {b.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

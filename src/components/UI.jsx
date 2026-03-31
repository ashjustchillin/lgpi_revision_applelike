import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from '../lib/motion'
import { TYPES } from '../lib/firebase'
import { getType } from '../lib/utils'

// ── SYNC DOT ─────────────────────────────────────────────
export function SyncDot({ state }) {
  return (
    <div
      className={`w-2 h-2 rounded-full flex-shrink-0 transition-all duration-500 sync-${state}`}
      title={state === 'ok' ? 'Synchronise' : state === 'syncing' ? 'Synchronisation...' : 'Erreur'}
    />
  )
}

// ── TOAST avec barre de progression ──────────────────────
export function Toast({ message, visible, duration = 2200 }) {
  const [progress, setProgress] = useState(100)
  const rafRef = useRef(null)
  const startRef = useRef(null)

  useEffect(() => {
    if (!visible) { setProgress(100); return }

    // Vibration haptique sur mobile
    if (navigator.vibrate) navigator.vibrate(40)

    setProgress(100)
    startRef.current = performance.now()

    const animate = (now) => {
      const elapsed = now - startRef.current
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100)
      setProgress(remaining)
      if (remaining > 0) rafRef.current = requestAnimationFrame(animate)
    }
    rafRef.current = requestAnimationFrame(animate)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [visible, message])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          className="fixed bottom-20 sm:bottom-6 left-1/2 z-50 overflow-hidden rounded-full"
          style={{
            transform: 'translateX(-50%)',
            background: 'rgba(15,15,16,.96)',
            boxShadow: '0 8px 32px rgba(0,0,0,.3), 0 2px 8px rgba(0,0,0,.2)',
            minWidth: 160,
          }}
        >
          <div className="px-5 py-2.5 text-white text-sm font-medium whitespace-nowrap text-center">
            {message}
          </div>
          <div className="h-0.5 w-full" style={{ background: 'rgba(255,255,255,.1)' }}>
            <div
              className="h-full"
              style={{
                width: progress + '%',
                background: 'var(--accent)',
                transition: 'none',
              }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ── BREADCRUMB NAV ────────────────────────────────────────
export function NavBreadcrumb({ crumbs }) {
  return (
    <div className="flex items-center gap-1.5 mb-4 flex-wrap">
      {crumbs.map((c, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <span className="text-[10px] font-medium" style={{ color: 'var(--text-3)' }}>›</span>}
          <span
            onClick={c.action}
            className="text-xs font-medium transition-colors duration-150"
            style={{
              color: i === crumbs.length - 1 ? 'var(--text-1)' : 'var(--text-3)',
              fontWeight: i === crumbs.length - 1 ? 600 : 500,
              cursor: c.action ? 'pointer' : 'default',
            }}
          >
            {c.label}
          </span>
        </span>
      ))}
    </div>
  )
}

// ── BACK BUTTON ────────────────────────────────────────────
export function BackButton({ label, onClick }) {
  return (
    <motion.button
      whileTap={{ scale: .95 }}
      onClick={onClick}
      className="flex items-center gap-1.5 text-xs font-medium mb-5 transition-colors"
      style={{ color: 'var(--text-3)' }}
      onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}
    >
      <span>←</span>
      {label}
    </motion.button>
  )
}

// ── TYPE BADGE ────────────────────────────────────────────
export function TypeBadge({ typeId, size = 'sm' }) {
  const tp = getType(typeId)
  const cls = size === 'lg'
    ? 'text-xs px-3 py-1 rounded-full font-semibold'
    : 'text-[10px] px-2 py-0.5 rounded-full font-semibold'
  return (
    <span className={cls} style={{ background: tp.bg, color: tp.color }}>
      {tp.emoji} {tp.label}
    </span>
  )
}

// ── MODULE PILL ────────────────────────────────────────────
export function ModulePill({ mod }) {
  if (!mod) return null
  return (
    <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold"
      style={{ background: mod.bg, color: mod.tc }}>
      {mod.icon} {mod.label}
    </span>
  )
}

// ── SKELETON CARD ─────────────────────────────────────────
export function SkeletonCard() {
  return (
    <div className="skeleton rounded-2xl p-4" style={{ minHeight: 120 }}>
      <div className="h-3 rounded-full mb-2" style={{ width: '40%', background: 'var(--border)' }} />
      <div className="h-4 rounded-full mb-2" style={{ width: '75%', background: 'var(--border)' }} />
      <div className="h-3 rounded-full mb-1" style={{ width: '90%', background: 'var(--border)' }} />
      <div className="h-3 rounded-full" style={{ width: '60%', background: 'var(--border)' }} />
    </div>
  )
}

// ── SKELETON TILE ─────────────────────────────────────────
export function SkeletonTile() {
  return (
    <div className="skeleton rounded-2xl" style={{ minHeight: 130 }}>
      <div className="p-4 space-y-2">
        <div className="w-10 h-10 rounded-xl" style={{ background: 'var(--border)' }} />
        <div className="h-4 rounded-full" style={{ width: '70%', background: 'var(--border)' }} />
        <div className="h-3 rounded-full" style={{ width: '40%', background: 'var(--border)' }} />
      </div>
    </div>
  )
}

// ── CONFIRM MODAL ─────────────────────────────────────────
export function ConfirmModal({ title, message, onConfirm, onCancel, confirmLabel = 'Supprimer', danger = true }) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(8px)' }}
        onClick={onCancel}
      >
        <motion.div
          initial={{ opacity: 0, y: 20, scale: .96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: .96 }}
          className="rounded-2xl p-6 w-full max-w-sm border"
          style={{
            backdropFilter: 'blur(24px)',
            background: 'rgba(255,255,255,.95)',
            borderColor: 'var(--border)',
            boxShadow: 'var(--shadow-xl)',
          }}
          onClick={e => e.stopPropagation()}
        >
          <h3 className="font-semibold mb-2" style={{ color: 'var(--text-1)', letterSpacing: '-.02em' }}>{title}</h3>
          {message && <p className="text-sm mb-5" style={{ color: 'var(--text-2)' }}>{message}</p>}
          <div className="flex gap-3">
            <button onClick={onCancel}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium border"
              style={{ color: 'var(--text-2)', borderColor: 'var(--border)' }}>
              Annuler
            </button>
            <motion.button whileTap={{ scale: .96 }} onClick={onConfirm}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ background: danger ? '#ef4444' : 'var(--accent)' }}>
              {confirmLabel}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// ── EMPTY STATE ───────────────────────────────────────────
export function EmptyState({ icon, title, subtitle, action, actionLabel }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-14 px-4"
    >
      <div className="text-4xl mb-3 animate-float">{icon}</div>
      <p className="font-semibold mb-1" style={{ color: 'var(--text-1)', letterSpacing: '-.02em' }}>{title}</p>
      {subtitle && <p className="text-sm mb-5 leading-relaxed" style={{ color: 'var(--text-2)' }}>{subtitle}</p>}
      {action && (
        <motion.button whileTap={{ scale: .96 }} onClick={action} className="btn-accent inline-flex items-center gap-2">
          {actionLabel}
        </motion.button>
      )}
    </motion.div>
  )
}

// ── SECTION TITLE ─────────────────────────────────────────
export function SectionTitle({ children, action, actionLabel }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-3)' }}>{children}</p>
      {action && (
        <button onClick={action} className="text-xs font-medium" style={{ color: 'var(--accent)' }}>{actionLabel}</button>
      )}
    </div>
  )
}

// ── VIEW TOGGLE ───────────────────────────────────────────
export function ViewToggle({ view, onChange }) {
  return (
    <div className="flex rounded-xl p-1 gap-1" style={{ background: 'var(--surface-2)' }}>
      {[
        { id: 'grid', icon: '⊞' },
        { id: 'list', icon: '☰' },
      ].map(v => (
        <button key={v.id} onClick={() => onChange(v.id)}
          className="w-8 h-7 rounded-lg flex items-center justify-center text-sm transition-all"
          style={view === v.id
            ? { background: 'var(--surface)', color: 'var(--accent)', boxShadow: 'var(--shadow-sm)' }
            : { color: 'var(--text-3)' }
          }>
          {v.icon}
        </button>
      ))}
    </div>
  )
}

// ── FOCUS MODE ────────────────────────────────────────────
export function FocusOverlay({ onClose }) {
  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-40" style={{ background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(2px)' }}
      onClick={onClose} />
  )
}

// ── KEYBOARD SHORTCUTS MODAL ──────────────────────────────
export function ShortcutsModal({ onClose }) {
  const shortcuts = [
    { key: 'Esc', desc: 'Retour / Fermer' },
    { key: 'N', desc: 'Nouvelle fiche (dans un module)' },
    { key: 'R', desc: 'Mode revision' },
    { key: 'D', desc: 'Toggle dark mode' },
    { key: '/', desc: 'Focus recherche' },
    { key: '?', desc: 'Afficher les raccourcis' },
  ]
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(8px)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: .95 }} animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl p-6 w-full max-w-sm border"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-xl)' }}
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold" style={{ color: 'var(--text-1)' }}>Raccourcis clavier</h3>
            <button onClick={onClose} style={{ color: 'var(--text-3)' }}>✕</button>
          </div>
          <div className="space-y-2">
            {shortcuts.map(s => (
              <div key={s.key} className="flex items-center justify-between">
                <span className="text-sm" style={{ color: 'var(--text-2)' }}>{s.desc}</span>
                <kbd className="text-xs px-2 py-1 rounded-lg font-mono font-semibold"
                  style={{ background: 'var(--surface-2)', color: 'var(--text-1)', border: '1px solid var(--border)' }}>
                  {s.key}
                </kbd>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

import { motion, AnimatePresence } from '../lib/motion'
import { TYPES } from '../lib/firebase'
import { getType } from '../lib/utils'

// ── SYNC DOT ─────────────────────────────────────────────
export function SyncDot({ state }) {
  return (
    <div
      className={`w-2 h-2 rounded-full flex-shrink-0 transition-all duration-500 sync-${state}`}
      title={state === 'ok' ? 'Synchronisé' : state === 'syncing' ? 'Synchronisation...' : 'Erreur'}
    />
  )
}

// ── TOAST ─────────────────────────────────────────────────
export function Toast({ message, visible }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 12, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: 8, x: '-50%' }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="fixed bottom-6 left-1/2 z-50 flex items-center gap-2 bg-gray-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm px-5 py-2.5 rounded-full shadow-2xl font-medium whitespace-nowrap"
          style={{ boxShadow: '0 8px 32px rgba(0,0,0,.25), 0 2px 8px rgba(0,0,0,.1)' }}
        >
          {message}
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
          {i > 0 && <span className="text-gray-300 dark:text-zinc-600 text-[10px] font-medium">›</span>}
          <span
            onClick={c.action}
            className={`text-xs font-medium transition-colors duration-150 ${
              i === crumbs.length - 1
                ? 'text-gray-700 dark:text-zinc-300 font-semibold cursor-default'
                : 'text-gray-400 dark:text-zinc-500 hover:text-accent cursor-pointer'
            }`}
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
      whileHover={{ x: -2 }}
      whileTap={{ scale: .97 }}
      onClick={onClick}
      className="flex items-center gap-2 mb-5 px-2.5 py-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors group"
    >
      <span className="text-gray-400 dark:text-zinc-500 text-sm transition-transform group-hover:-translate-x-0.5">←</span>
      <span className="text-sm font-medium text-gray-400 dark:text-zinc-500">{label}</span>
    </motion.button>
  )
}

// ── TYPE BADGE ─────────────────────────────────────────────
export function TypeBadge({ typeId, size = 'sm' }) {
  const tp = getType(typeId)
  const cls = size === 'lg'
    ? 'text-xs font-semibold px-3 py-1.5 rounded-full'
    : 'text-[10px] font-semibold px-2 py-0.5 rounded-full'
  return (
    <span className={`${cls} inline-flex items-center gap-1`} style={{ background: tp.bg, color: tp.color }}>
      <span>{tp.emoji}</span>
      {size === 'lg' && <span>{tp.label}</span>}
    </span>
  )
}

// ── MODULE PILL ────────────────────────────────────────────
export function ModulePill({ mod }) {
  if (!mod) return null
  return (
    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold"
      style={{ background: mod.bg, color: mod.tc }}>
      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: mod.color }} />
      {mod.label}
    </span>
  )
}

// ── SKELETON CARD ──────────────────────────────────────────
export function SkeletonCard() {
  return (
    <div className="skeleton p-4 min-h-[120px]">
      <div className="flex justify-between mb-3">
        <div className="h-3 w-3/4 rounded-full bg-gray-100 dark:bg-zinc-700" />
        <div className="h-5 w-14 rounded-full bg-gray-100 dark:bg-zinc-700" />
      </div>
      <div className="space-y-2">
        <div className="h-2.5 w-full rounded-full bg-gray-100 dark:bg-zinc-700" />
        <div className="h-2.5 w-4/5 rounded-full bg-gray-100 dark:bg-zinc-700" />
      </div>
      <div className="flex gap-1.5 mt-4">
        <div className="h-5 w-12 rounded-full bg-gray-100 dark:bg-zinc-700" />
        <div className="h-5 w-16 rounded-full bg-gray-100 dark:bg-zinc-700" />
      </div>
    </div>
  )
}

// ── SKELETON TILE ──────────────────────────────────────────
export function SkeletonTile() {
  return (
    <div className="skeleton p-4 min-h-[115px]">
      <div className="h-8 w-8 rounded-xl bg-gray-100 dark:bg-zinc-700 mb-3" />
      <div className="h-3 w-3/4 rounded-full bg-gray-100 dark:bg-zinc-700 mb-2" />
      <div className="h-2.5 w-1/2 rounded-full bg-gray-100 dark:bg-zinc-700" />
    </div>
  )
}

// ── CHIP (TAG) ─────────────────────────────────────────────
export function Chip({ label, onRemove }) {
  return (
    <motion.span
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      className="inline-flex items-center gap-1.5 bg-accent-soft text-accent text-xs px-2.5 py-1 rounded-full font-medium"
    >
      {label}
      {onRemove && (
        <button onClick={onRemove}
          className="opacity-40 hover:opacity-100 transition-opacity text-[10px] leading-none hover:text-red-500"
        >✕</button>
      )}
    </motion.span>
  )
}

// ── CONFIRM MODAL ──────────────────────────────────────────
export function ConfirmModal({ title, message, onConfirm, onCancel, confirmLabel = 'Supprimer', danger = true }) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,.45)', backdropFilter: 'blur(4px)' }}
        onClick={onCancel}
      >
        <motion.div
          initial={{ opacity: 0, scale: .97, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: .97, y: 8 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-white dark:bg-zinc-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl"
          onClick={e => e.stopPropagation()}
        >
          <h3 className="font-semibold text-gray-900 dark:text-zinc-100 mb-1.5 text-base">{title}</h3>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mb-5 leading-relaxed">{message}</p>
          <div className="flex gap-3">
            <button onClick={onCancel}
              className="flex-1 py-2.5 text-sm font-medium text-gray-500 dark:text-zinc-400 bg-gray-100 dark:bg-zinc-700 rounded-xl hover:bg-gray-200 dark:hover:bg-zinc-600 transition-colors"
            >Annuler</button>
            <motion.button
              whileTap={{ scale: .96 }}
              onClick={onConfirm}
              className={`flex-1 py-2.5 text-white text-sm font-semibold rounded-xl transition-colors ${danger ? 'bg-red-500 hover:bg-red-600' : 'hover:brightness-90'}`}
              style={!danger ? { background: 'var(--accent)' } : {}}
            >
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
      <div className="text-4xl mb-3">{icon}</div>
      <p className="font-semibold text-gray-700 dark:text-zinc-300 mb-1">{title}</p>
      {subtitle && <p className="text-sm text-gray-400 dark:text-zinc-500 mb-4 leading-relaxed">{subtitle}</p>}
      {action && (
        <motion.button
          whileTap={{ scale: .96 }}
          onClick={action}
          className="btn-accent inline-flex items-center gap-2"
        >
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
      <p className="text-[11px] font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">{children}</p>
      {action && (
        <button onClick={action} className="text-xs text-accent hover:underline font-medium">{actionLabel}</button>
      )}
    </div>
  )
}

import { motion } from 'framer-motion'
import { getType, relativeDate } from '../lib/utils'

export default function HistoryPanel({ history, notes, mods, onFiche }) {
  const historyNotes = history
    .map(id => notes.find(n => n.id === id))
    .filter(Boolean)

  if (!historyNotes.length) return null

  return (
    <div className="mb-5">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
        🕐 Récemment consulté
      </p>
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {historyNotes.map(n => {
          const m = mods.find(x => x.id === n.module) || { label: '?', icon: '?', bg: '#eee', tc: '#555' }
          const tp = getType(n.type)
          return (
            <motion.button
              key={n.id}
              whileTap={{ scale: .96 }}
              onClick={() => onFiche(n.id, n.module)}
              className="flex-shrink-0 text-left p-3 rounded-2xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 w-44 hover:border-accent transition-colors"
            >
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: m.bg, color: m.tc }}>
                  {m.icon} {m.label}
                </span>
              </div>
              <p className="text-xs font-semibold text-gray-800 dark:text-zinc-200 line-clamp-2 leading-snug mb-1">
                {n.title}
              </p>
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full" style={{ background: tp.bg, color: tp.color }}>
                {tp.emoji} {tp.label}
              </span>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}

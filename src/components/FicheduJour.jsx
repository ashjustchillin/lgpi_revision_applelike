import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getType } from '../lib/utils'
import { MasteryBadge } from './Mastery'

function getDailyNote(notes) {
  if (!notes.length) return null
  const today = new Date().toISOString().slice(0, 10)
  let hash = 0
  for (let i = 0; i < today.length; i++) hash = (hash * 31 + today.charCodeAt(i)) & 0xffffffff
  return notes[Math.abs(hash) % notes.length]
}

export default function FicheduJour({ notes, mods, onFiche, getLevel }) {
  const [visible, setVisible] = useState(true)
  const [flipped, setFlipped] = useState(false)

  const note = getDailyNote(notes)
  if (!note || !visible) return null

  const mod = mods.find(m => m.id === note.module) || { label: '?', icon: '?', bg: '#eee', tc: '#555', color: '#888' }
  const tp = getType(note.type)
  const level = getLevel(note.id)

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
        className="mb-5"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-sm">🎯</span>
            <p className="text-[11px] font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">Fiche du jour</p>
          </div>
          <button onClick={() => setVisible(false)}
            className="text-gray-300 dark:text-zinc-600 hover:text-gray-500 text-sm transition-colors"
          >✕</button>
        </div>

        <motion.div
          onClick={() => setFlipped(f => !f)}
          className="relative rounded-2xl border border-gray-200/80 dark:border-zinc-700/80 bg-white dark:bg-zinc-800 p-4 cursor-pointer overflow-hidden"
          whileTap={{ scale: .99 }}
          style={{ boxShadow: '0 2px 8px rgba(0,0,0,.05)' }}
        >
          {/* Barre couleur */}
          <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl" style={{ background: `linear-gradient(90deg, ${mod.color}, ${mod.color}88)` }} />

          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: mod.bg, color: mod.tc }}>
                  {mod.icon} {mod.label}
                </span>
                <MasteryBadge level={level} />
              </div>
              <p className="text-sm font-semibold text-gray-800 dark:text-zinc-200 leading-snug">{note.title}</p>

              <AnimatePresence>
                {flipped && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <p className="text-xs text-gray-500 dark:text-zinc-400 mt-2.5 leading-relaxed line-clamp-4 bg-gray-50 dark:bg-zinc-900 rounded-xl p-3">
                      {note.content || '—'}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex flex-col items-end gap-2 flex-shrink-0">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: tp.bg, color: tp.color }}>
                {tp.emoji}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-gray-100 dark:border-zinc-700">
            <p className="text-[11px] text-gray-400">{flipped ? 'Clique pour masquer' : '👆 Clique pour voir le contenu'}</p>
            <motion.button whileTap={{ scale: .95 }}
              onClick={e => { e.stopPropagation(); onFiche(note.id, note.module) }}
              className="text-[11px] font-semibold px-3 py-1 rounded-lg transition-all"
              style={{ color: 'var(--accent)', background: 'var(--accent-bg)' }}
            >
              Ouvrir →
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

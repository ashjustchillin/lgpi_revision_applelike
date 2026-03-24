import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { NavBreadcrumb, BackButton, TypeBadge, ModulePill, SkeletonCard, ConfirmModal } from '../components/UI'
import { getType, relativeDate } from '../lib/utils'
import { MasteryBadge } from '../components/Mastery'

const container = { hidden: {}, show: { transition: { staggerChildren: .04 } } }
const item = { hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0 } }

export default function ModulePage({ mod, notes, onBack, onFiche, onNewFiche, onDeleteNote, pinned, onTogglePin, getMasteryLevel }) {
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('date-desc')
  const [activeTags, setActiveTags] = useState([])
  const [confirmDel, setConfirmDel] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [scOpen, setScOpen] = useState(false)

  if (!mod) return null

  const modNotes = notes.filter(n => n.module === mod.id)
  const allTags = [...new Set(modNotes.flatMap(n => n.tags || []))]
  const toggleTag = t => setActiveTags(a => a.includes(t) ? a.filter(x => x !== t) : [...a, t])

  const filtered = modNotes
    .filter(n => {
      const q = search.toLowerCase()
      const mq = !q || n.title.toLowerCase().includes(q) || (n.content || '').toLowerCase().includes(q) || (n.tags || []).join(' ').includes(q)
      return mq && (activeTags.length === 0 || activeTags.every(t => (n.tags || []).includes(t)))
    })
    .sort((a, b) => {
      // Épinglées en premier
      const aPinned = pinned.includes(a.id), bPinned = pinned.includes(b.id)
      if (aPinned && !bPinned) return -1
      if (!aPinned && bPinned) return 1
      if (sort === 'date-desc') return (b.createdAt || 0) - (a.createdAt || 0)
      if (sort === 'date-asc') return (a.createdAt || 0) - (b.createdAt || 0)
      if (sort === 'alpha') return a.title.localeCompare(b.title, 'fr')
      if (sort === 'type') return (a.type || '').localeCompare(b.type || '')
      return 0
    })

  const handleDelete = async () => {
    if (!confirmDel) return
    setDeleting(confirmDel.id)
    setConfirmDel(null)
    setTimeout(async () => { await onDeleteNote(confirmDel.id); setDeleting(null) }, 300)
  }

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
      <NavBreadcrumb crumbs={[{ label: 'Accueil', action: onBack }, { label: mod.label }]} />
      <BackButton label="Tous les modules" onClick={onBack} />

      <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
        <ModulePill mod={mod} />
        <div className="flex items-center gap-2 flex-wrap">
          <select value={sort} onChange={e => setSort(e.target.value)}
            className="text-sm border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2 bg-white dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 outline-none"
          >
            <option value="date-desc">Plus récentes</option>
            <option value="date-asc">Plus anciennes</option>
            <option value="alpha">Alphabétique</option>
            <option value="type">Par type</option>
          </select>
          <motion.button whileTap={{ scale: .95 }} onClick={onNewFiche}
            className="px-4 py-2 text-white text-sm font-medium rounded-xl hover:brightness-90"
            style={{ background: mod.color }}
          >
            + Nouvelle fiche
          </motion.button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 items-center mb-5">
        <div className="relative flex-1 min-w-36">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none">⌕</span>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..."
            className="w-full pl-8 pr-3 py-2 text-sm bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl outline-none transition-all"
            onFocus={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-light)' }}
            onBlur={e => { e.target.style.borderColor = ''; e.target.style.boxShadow = '' }}
          />
        </div>
        {allTags.map(t => (
          <button key={t} onClick={() => toggleTag(t)}
            className="text-xs px-3 py-1.5 rounded-full font-medium transition-all"
            style={{ background: activeTags.includes(t) ? mod.color : mod.bg, color: activeTags.includes(t) ? '#fff' : mod.tc }}
          >{t}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12 text-gray-400">
          <div className="text-4xl mb-3">📝</div>
          <p className="text-sm mb-4">Aucune fiche dans ce module.</p>
          <motion.button whileTap={{ scale: .95 }} onClick={onNewFiche}
            className="px-4 py-2 text-white text-sm font-medium rounded-xl"
            style={{ background: mod.color }}
          >+ Créer la première fiche</motion.button>
        </motion.div>
      ) : (
        <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <AnimatePresence>
            {filtered.map(n => {
              const tp = getType(n.type)
              const pathSteps = n.path ? n.path.split('>').map(s => s.trim()).filter(Boolean) : []
              const isPinned = pinned.includes(n.id)
              return (
                <motion.div
                  key={n.id} variants={item} layout
                  animate={deleting === n.id ? { opacity: 0, scale: .94, y: -8 } : { opacity: 1, scale: 1, y: 0 }}
                  transition={deleting === n.id ? { duration: .3 } : {}}
                  onClick={() => onFiche(n.id)}
                  onContextMenu={e => { e.preventDefault(); setConfirmDel(n) }}
                  className="card-base p-4 cursor-pointer group relative hover:-translate-y-0.5 hover:shadow-md transition-all"
                >
                  <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl" style={{ background: mod.color }} />

                  {/* Bouton épingle */}
                  <button
                    onClick={e => { e.stopPropagation(); onTogglePin(n.id) }}
                    className={`absolute top-3 right-3 text-sm transition-all ${isPinned ? 'opacity-100' : 'opacity-0 group-hover:opacity-60'} hover:opacity-100`}
                    title={isPinned ? 'Désépingler' : 'Épingler'}
                  >
                    {isPinned ? '📌' : '📍'}
                  </button>

                  <div className="flex items-start justify-between gap-2 mt-1 mb-1.5 pr-6">
                    <motion.p
                      layoutId={"title-" + n.id}
                      className="text-sm font-semibold text-gray-800 dark:text-zinc-200 leading-snug flex-1"
                    >
                      {isPinned && <span className="text-[10px] mr-1">📌</span>}
                      {n.title}
                    </motion.p>
                    <motion.div layoutId={"badge-" + n.id}>
                      <TypeBadge typeId={n.type} />
                    </motion.div>
                  </div>

                  {pathSteps.length > 0 && (
                    <div className="flex items-center gap-1 flex-wrap mb-1.5">
                      {pathSteps.map((s, i) => (
                        <span key={i} className="flex items-center gap-1">
                          {i > 0 && <span className="text-gray-300 text-[10px]">›</span>}
                          <span className="text-[11px] font-medium text-accent">{s}</span>
                        </span>
                      ))}
                    </div>
                  )}

                  <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">{n.content}</p>

                  {(n.tags || []).length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {(n.tags || []).map(t => (
                        <span key={t} className="text-[11px] px-2 py-0.5 rounded-full font-medium" style={{ background: mod.bg, color: mod.tc }}>{t}</span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[11px] text-gray-400">{relativeDate(n.date)}</span>
                    {getMasteryLevel && <MasteryBadge level={getMasteryLevel(n.id)} />}
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Shortcuts */}
      <div className="fixed bottom-6 right-6 z-40 hidden sm:block">
        <button onClick={() => setScOpen(o => !o)}
          className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-1.5 text-xs text-gray-400 shadow-md hover:text-gray-600 transition-colors"
        >⌨️ Raccourcis</button>
        <AnimatePresence>
          {scOpen && (
            <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="absolute bottom-full right-0 mb-2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-2xl p-4 min-w-52 shadow-xl"
            >
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Raccourcis</p>
              {[['N', 'Nouvelle fiche'], ['/', 'Rechercher'], ['Échap', 'Retour'], ['R', 'Révision'], ['D', 'Mode sombre']].map(([k, l]) => (
                <div key={k} className="flex justify-between items-center py-1 border-b border-gray-50 dark:border-zinc-700 last:border-0">
                  <span className="text-xs text-gray-600 dark:text-zinc-400">{l}</span>
                  <kbd className="text-[10px] bg-gray-100 dark:bg-zinc-700 border border-gray-200 dark:border-zinc-600 rounded px-1.5 py-0.5 font-semibold text-gray-500">{k}</kbd>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {confirmDel && (
        <ConfirmModal
          title="Supprimer cette fiche ?"
          message={'"' + confirmDel.title + '" sera définitivement supprimée.'}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDel(null)}
        />
      )}
    </motion.div>
  )
}

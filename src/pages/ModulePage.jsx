import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { NavBreadcrumb, BackButton, TypeBadge, ModulePill, SkeletonCard, ConfirmModal } from '../components/UI'
import { getType, relativeDate } from '../lib/utils'
import { MasteryBadge } from '../components/Mastery'

const container = { hidden: {}, show: { transition: { staggerChildren: .04 } } }
const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { type: 'spring', damping: 22, stiffness: 300 } } }

export default function ModulePage({ mod, notes, onBack, onFiche, onNewFiche, onDeleteNote, pinned, onTogglePin, getMasteryLevel }) {
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('date-desc')
  const [activeTags, setActiveTags] = useState([])
  const [confirmDel, setConfirmDel] = useState(null)
  const [deleting, setDeleting] = useState(null)

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
      const ap = pinned.includes(a.id), bp = pinned.includes(b.id)
      if (ap && !bp) return -1
      if (!ap && bp) return 1
      if (sort === 'date-desc') return (b.createdAt || 0) - (a.createdAt || 0)
      if (sort === 'date-asc') return (a.createdAt || 0) - (b.createdAt || 0)
      if (sort === 'alpha') return a.title.localeCompare(b.title, 'fr')
      return 0
    })

  const handleDelete = async () => {
    if (!confirmDel) return
    setDeleting(confirmDel.id)
    setConfirmDel(null)
    setTimeout(async () => { await onDeleteNote(confirmDel.id); setDeleting(null) }, 300)
  }

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="pb-24 sm:pb-0">
      <NavBreadcrumb crumbs={[{ label: 'Accueil', action: onBack }, { label: mod.label }]} />
      <BackButton label="Modules" onClick={onBack} />

      {/* Module header V2 */}
      <div className="flex items-center gap-4 mb-6 p-5 rounded-2xl" style={{ background: mod.bg }}>
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl" style={{ background: 'rgba(255,255,255,.4)' }}>
          {mod.icon}
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold" style={{ color: mod.tc, letterSpacing: '-.03em' }}>{mod.label}</h2>
          <p className="text-sm" style={{ color: mod.tc, opacity: .6 }}>{modNotes.length} fiche{modNotes.length !== 1 ? 's' : ''}</p>
        </div>
        <motion.button whileTap={{ scale: .95 }} onClick={onNewFiche}
          className="px-4 py-2 rounded-full text-sm font-semibold text-white"
          style={{ background: mod.color }}
        >+ Nouvelle</motion.button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center mb-5">
        <div className="relative flex-1 min-w-36">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs pointer-events-none" style={{ color: 'var(--text-3)' }}>⌕</span>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..."
            className="input-base pl-8 pr-3 py-2 text-sm rounded-xl" />
        </div>
        <select value={sort} onChange={e => setSort(e.target.value)}
          className="text-sm rounded-xl px-3 py-2 border"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-2)' }}
        >
          <option value="date-desc">Recentes</option>
          <option value="date-asc">Anciennes</option>
          <option value="alpha">A-Z</option>
        </select>
        {allTags.map(t => (
          <button key={t} onClick={() => toggleTag(t)}
            className="text-xs px-3 py-1.5 rounded-full font-medium transition-all"
            style={{
              background: activeTags.includes(t) ? mod.color : mod.bg,
              color: activeTags.includes(t) ? '#fff' : mod.tc,
            }}
          >{t}</button>
        ))}
      </div>

      {/* Cards V2 */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-3">📝</div>
          <p className="text-sm mb-4" style={{ color: 'var(--text-2)' }}>Aucune fiche dans ce module.</p>
          <motion.button whileTap={{ scale: .95 }} onClick={onNewFiche}
            className="px-4 py-2 text-white text-sm font-medium rounded-full"
            style={{ background: mod.color }}
          >+ Creer la premiere fiche</motion.button>
        </div>
      ) : (
        <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <AnimatePresence>
            {filtered.map(n => {
              const tp = getType(n.type)
              const isPinned = pinned.includes(n.id)
              const level = getMasteryLevel ? getMasteryLevel(n.id) : 0
              const pathSteps = n.path ? n.path.split('>').map(s => s.trim()).filter(Boolean) : []

              return (
                <motion.div key={n.id} variants={item} layout
                  animate={deleting === n.id ? { opacity: 0, scale: .93 } : { opacity: 1, scale: 1 }}
                  onClick={() => onFiche(n.id)}
                  onContextMenu={e => { e.preventDefault(); setConfirmDel(n) }}
                  className="card-base p-4 cursor-pointer group"
                  whileHover={{ y: -3, boxShadow: 'var(--shadow-lg)' }}
                  whileTap={{ scale: .98 }}
                >
                  {/* Accent top bar colorée selon module */}
                  <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl" style={{ background: mod.color }} />

                  <div className="flex items-start justify-between gap-2 mt-1 mb-2 pr-6">
                    <motion.p layoutId={"title-" + n.id}
                      className="text-sm font-semibold leading-snug flex-1"
                      style={{ color: 'var(--text-1)', letterSpacing: '-.01em' }}
                    >
                      {isPinned && <span className="mr-1 text-[10px]">📌</span>}
                      {n.title}
                    </motion.p>
                    <motion.div layoutId={"badge-" + n.id}>
                      <TypeBadge typeId={n.type} />
                    </motion.div>
                  </div>

                  {/* Pin button */}
                  <button onClick={e => { e.stopPropagation(); onTogglePin(n.id) }}
                    className={`absolute top-3 right-3 text-sm transition-all ${isPinned ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`}
                  >{isPinned ? '📌' : '📍'}</button>

                  {/* Path */}
                  {pathSteps.length > 0 && (
                    <div className="flex items-center gap-1 flex-wrap mb-2">
                      {pathSteps.map((s, i) => (
                        <span key={i} className="flex items-center gap-1">
                          {i > 0 && <span className="text-[10px]" style={{ color: 'var(--text-3)' }}>›</span>}
                          <span className="text-[11px] font-medium text-accent">{s}</span>
                        </span>
                      ))}
                    </div>
                  )}

                  <p className="text-xs line-clamp-2 leading-relaxed mb-2" style={{ color: 'var(--text-2)' }}>{n.content}</p>

                  {(n.tags || []).length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {(n.tags || []).map(t => (
                        <span key={t} className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                          style={{ background: mod.bg, color: mod.tc }}>{t}</span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-[11px]" style={{ color: 'var(--text-3)' }}>{relativeDate(n.date)}</span>
                    <MasteryBadge level={level} />
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </motion.div>
      )}

      {confirmDel && (
        <ConfirmModal
          title="Supprimer cette fiche ?"
          message={'"' + confirmDel.title + '" sera definitivement supprimee.'}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDel(null)}
        />
      )}
    </motion.div>
  )
}

import { useState } from 'react'
import { motion, AnimatePresence } from '../lib/motion'
import { NavBreadcrumb, BackButton, TypeBadge, SkeletonCard, ConfirmModal, ViewToggle } from '../components/UI'
import { getType, relativeDate } from '../lib/utils'
import { resumeModule } from '../lib/groq'
import { MasteryBadge } from '../components/Mastery'
import { useSwipe } from '../hooks/useSwipe'
import { resumerModule } from '../lib/groq'

const SORT_OPTIONS = [
  { value: 'date-desc', label: 'Recentes' },
  { value: 'date-asc', label: 'Anciennes' },
  { value: 'alpha', label: 'A-Z' },
  { value: 'mastery-asc', label: 'A maitriser' },
  { value: 'mastery-desc', label: 'Bien maitrisees' },
]

const container = { hidden: {}, show: { transition: { staggerChildren: .04 } } }
const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }

export default function ModulePage({ mod, notes, onBack, onFiche, onNewFiche, onDeleteNote, pinned, onTogglePin, getMasteryLevel, isAdmin }) {
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('date-desc')
  const [activeTags, setActiveTags] = useState([])
  const [confirmDel, setConfirmDel] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [view, setView] = useState(() => localStorage.getItem('lgpi-module-view') || 'grid')
  const [moduleResume, setModuleResume] = useState(null)
  const [resumeLoading, setResumeLoading] = useState(false)
  const [moduleSummary, setModuleSummary] = useState(null)
  const [summaryLoading, setSummaryLoading] = useState(false)

  const handleResumerModule = async () => {
    if (moduleSummary) { setModuleSummary(null); return }
    setSummaryLoading(true)
    try {
      const result = await resumerModule(modNotes, mod.label)
      setModuleSummary(result)
    } catch { }
    finally { setSummaryLoading(false) }
  }

  // Swipe droite = retour
  const { onTouchStart, onTouchEnd } = useSwipe({
    onRight: () => onBack(),
    threshold: 80,
  })

  if (!mod) return null

  const modNotes = notes.filter(n => n.module === mod.id)
  const allTags = [...new Set(modNotes.flatMap(n => n.tags || []))]
  const toggleTag = t => setActiveTags(a => a.includes(t) ? a.filter(x => x !== t) : [...a, t])

  const changeView = (v) => { setView(v); localStorage.setItem('lgpi-module-view', v) }

  const handleResume = async () => {
    if (moduleResume) { setModuleResume(null); return }
    setResumeLoading(true)
    try {
      const text = await resumeModule(modNotes, mod.label)
      setModuleResume(text)
    } catch {}
    setResumeLoading(false)
  }

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
      if (sort === 'mastery-asc') return (getMasteryLevel?.(a.id) || 0) - (getMasteryLevel?.(b.id) || 0)
      if (sort === 'mastery-desc') return (getMasteryLevel?.(b.id) || 0) - (getMasteryLevel?.(a.id) || 0)
      return 0
    })

  const handleDelete = async () => {
    if (!confirmDel) return
    setDeleting(confirmDel.id)
    setConfirmDel(null)
    setTimeout(async () => { await onDeleteNote(confirmDel.id); setDeleting(null) }, 300)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      className="pb-24 sm:pb-0"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <NavBreadcrumb crumbs={[{ label: 'Accueil', action: onBack }, { label: mod.label }]} />
      <BackButton label="Modules" onClick={onBack} />

      {/* Header module */}
      <div className="flex items-center gap-4 mb-5 p-5 rounded-2xl" style={{ background: mod.bg }}>
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
          style={{ background: 'rgba(255,255,255,.4)' }}>{mod.icon}</div>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold" style={{ color: mod.tc, letterSpacing: '-.03em' }}>{mod.label}</h2>
          <p className="text-sm" style={{ color: mod.tc, opacity: .6 }}>{modNotes.length} fiche{modNotes.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <motion.button whileTap={{ scale: .95 }} onClick={handleResumerModule}
            disabled={summaryLoading}
            className="px-3 py-2 rounded-full text-xs font-semibold disabled:opacity-50"
            style={{ background: 'rgba(255,255,255,.3)', color: mod.tc }}>
            {summaryLoading ? '...' : moduleSummary ? '✕ Resume' : '✨ Resume'}
          </motion.button>
          {isAdmin && onNewFiche && (
            <motion.button whileTap={{ scale: .95 }} onClick={onNewFiche}
              className="px-4 py-2 rounded-full text-sm font-semibold text-white"
              style={{ background: 'rgba(0,0,0,.2)' }}>
              + Nouvelle
            </motion.button>
          )}
        </div>
      </div>

      {/* Résumé IA module */}
      {moduleSummary && (
        <div className="mb-5 p-4 rounded-2xl border" style={{ background: '#faf5ff', borderColor: '#d8b4fe' }}>
          <p className="text-xs font-semibold mb-2" style={{ color: '#7c3aed' }}>✨ Resume du module</p>
          <p className="text-sm leading-relaxed mb-3" style={{ color: '#4c1d95' }}>{moduleSummary.summary}</p>
          {moduleSummary.points?.length > 0 && (
            <div className="space-y-1.5 mb-3">
              {moduleSummary.points.map((p, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 mt-0.5"
                    style={{ background: '#7c3aed' }}>{i + 1}</span>
                  <p className="text-xs" style={{ color: '#4c1d95' }}>{p}</p>
                </div>
              ))}
            </div>
          )}
          {moduleSummary.keyFiches?.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold mb-1.5" style={{ color: '#7c3aed' }}>Fiches cles</p>
              <div className="flex flex-wrap gap-1.5">
                {moduleSummary.keyFiches.map((title, i) => {
                  const fiche = modNotes.find(n => n.title.toLowerCase().includes(title.toLowerCase()))
                  return fiche ? (
                    <button key={i} onClick={() => onFiche(fiche.id)}
                      className="text-xs px-2.5 py-1 rounded-full font-medium"
                      style={{ background: '#ede9fe', color: '#7c3aed' }}>
                      {fiche.title}
                    </button>
                  ) : null
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Résumé module IA */}
      {moduleResume && (
        <div className="mb-4 p-4 rounded-2xl border" style={{ background: '#faf5ff', borderColor: '#d8b4fe' }}>
          <p className="text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#7c3aed' }}>✨ Résumé du module</p>
          <p className="text-sm leading-relaxed" style={{ color: '#4c1d95' }}>{moduleResume}</p>
        </div>
      )}

      {/* Filtres */}
      <div className="flex flex-wrap gap-2 items-center mb-4">
        <div className="relative flex-1 min-w-36">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs pointer-events-none" style={{ color: 'var(--text-3)' }}>⌕</span>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher..."
            className="input-base pl-8 pr-3 py-2 text-sm rounded-xl" />
        </div>
        <select value={sort} onChange={e => setSort(e.target.value)}
          className="text-sm rounded-xl px-3 py-2 border"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-2)' }}>
          {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <ViewToggle view={view} onChange={changeView} />
      </div>

      {/* Tags */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {allTags.map(t => (
            <button key={t} onClick={() => toggleTag(t)}
              className="text-[11px] px-2.5 py-1 rounded-full font-medium transition-all"
              style={activeTags.includes(t)
                ? { background: 'var(--accent)', color: '#fff' }
                : { background: mod.bg, color: mod.tc }}>
              #{t}
            </button>
          ))}
        </div>
      )}

      {/* Cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-3">📝</div>
          <p className="text-sm mb-4" style={{ color: 'var(--text-2)' }}>Aucune fiche dans ce module.</p>
          {isAdmin && onNewFiche && (
            <motion.button whileTap={{ scale: .95 }} onClick={onNewFiche}
              className="px-4 py-2 text-white text-sm font-medium rounded-full"
              style={{ background: 'var(--accent)' }}>
              + Creer la premiere fiche
            </motion.button>
          )}
        </div>
      ) : view === 'grid' ? (
        <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <AnimatePresence>
            {filtered.map(n => <NoteCard key={n.id} n={n} mod={mod} variants={item}
              deleting={deleting === n.id} isPinned={pinned.includes(n.id)}
              level={getMasteryLevel?.(n.id) || 0}
              isAdmin={isAdmin}
              onFiche={onFiche} onTogglePin={onTogglePin} onDelete={setConfirmDel} />)}
          </AnimatePresence>
        </motion.div>
      ) : (
        // Vue liste compacte
        <div className="space-y-1.5">
          {filtered.map(n => (
            <motion.div key={n.id}
              initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
              animate={deleting === n.id ? { opacity: 0 } : { opacity: 1 }}
              onClick={() => onFiche(n.id)}
              className="flex items-center gap-3 p-3 rounded-xl cursor-pointer"
              style={{ background: 'var(--surface)' }}
              whileHover={{ x: 3 }}>
              <div className="w-1 h-8 rounded-full flex-shrink-0" style={{ background: 'var(--accent)' }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: 'var(--text-1)' }}>
                  {pinned.includes(n.id) && <span className="mr-1 text-[10px]">📌</span>}
                  {n.title}
                </p>
                {(n.tags || []).length > 0 && (
                  <p className="text-[10px]" style={{ color: 'var(--text-3)' }}>
                    {(n.tags || []).map(t => '#' + t).join(' ')}
                  </p>
                )}
              </div>
              <MasteryBadge level={getMasteryLevel?.(n.id) || 0} />
              <TypeBadge typeId={n.type} />
            </motion.div>
          ))}
        </div>
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

function NoteCard({ n, mod, variants, deleting, isPinned, level, isAdmin, onFiche, onTogglePin, onDelete }) {
  const pathSteps = n.path ? n.path.split('>').map(s => s.trim()).filter(Boolean) : []
  return (
    <motion.div variants={variants} layout
      animate={deleting ? { opacity: 0, scale: .93 } : { opacity: 1, scale: 1 }}
      onClick={() => onFiche(n.id)}
      onContextMenu={e => { e.preventDefault(); if (isAdmin) onDelete(n) }}
      className="card-base p-4 cursor-pointer group"
      whileHover={{ y: -3, boxShadow: 'var(--shadow-lg)' }}
      whileTap={{ scale: .98 }}>
      <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl" style={{ background: 'var(--accent)' }} />
      <div className="flex items-start justify-between gap-2 mt-1 mb-2 pr-6">
        <p className="text-sm font-semibold leading-snug flex-1" style={{ color: 'var(--text-1)', letterSpacing: '-.01em' }}>
          {isPinned && <span className="mr-1 text-[10px]">📌</span>}
          {n.title}
        </p>
        <TypeBadge typeId={n.type} />
      </div>
      {isAdmin && (
        <button onClick={e => { e.stopPropagation(); onTogglePin(n.id) }}
          className={`absolute top-3 right-3 text-sm transition-all ${isPinned ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`}>
          {isPinned ? '📌' : '📍'}
        </button>
      )}
      {pathSteps.length > 0 && (
        <div className="flex items-center gap-1 flex-wrap mb-2">
          {pathSteps.map((s, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <span className="text-[10px]" style={{ color: 'var(--text-3)' }}>›</span>}
              <span className="text-[11px] font-medium" style={{ color: 'var(--accent)' }}>{s}</span>
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
}

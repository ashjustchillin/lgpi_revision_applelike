import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from '../lib/motion'
import { BackButton, TypeBadge, ViewToggle } from '../components/UI'
import { getType, relativeDate } from '../lib/utils'
import { MasteryBadge } from '../components/Mastery'

const SORT_OPTIONS = [
  { value: 'date-desc', label: '📅 Récentes' },
  { value: 'date-asc', label: '📅 Anciennes' },
  { value: 'alpha', label: '🔤 A-Z' },
  { value: 'alpha-desc', label: '🔤 Z-A' },
  { value: 'mastery-asc', label: '📈 À maîtriser' },
  { value: 'module', label: '📦 Par module' },
]

const container = { hidden: {}, show: { transition: { staggerChildren: .03 } } }
const item = { hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0 } }

function ExplorerCard({ note, mod, tp, onFiche, getMasteryLevel, view }) {
  const mastery = getMasteryLevel ? getMasteryLevel(note.id) : 0

  if (view === 'list') {
    return (
      <motion.div variants={item} layout onClick={() => onFiche(note.id, note.module)}
        className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-all rounded-xl hover:shadow-sm group"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }} whileHover={{ x: 4 }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0" style={{ background: mod.bg, color: mod.tc }}>{mod.icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-1)' }}>{note.title}</p>
            <span className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0" style={{ background: tp.bg, color: tp.color }}>{tp.emoji} {tp.label}</span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px]" style={{ color: mod.tc }}>{mod.label}</span>
            {note.path && (<span className="text-[10px] truncate" style={{ color: 'var(--text-3)' }}>· 📂 {note.path}</span>)}
            {(note.tags || []).length > 0 && (<span className="text-[10px]" style={{ color: 'var(--text-3)' }}>· {note.tags.slice(0, 3).map(t => `#${t}`).join(' ')}</span>)}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {mastery > 0 && <MasteryBadge level={mastery} />}
          <span className="text-[10px]" style={{ color: 'var(--text-3)' }}>{relativeDate(note.date)}</span>
          <span className="text-xs opacity-0 group-hover:opacity-50 transition-opacity">→</span>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div variants={item} layout onClick={() => onFiche(note.id, note.module)}
      className="card-base p-4 cursor-pointer group relative overflow-hidden" whileHover={{ y: -3, boxShadow: 'var(--shadow-md)' }}>
      <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl" style={{ background: mod.tc || mod.color }} />
      <div className="flex items-start justify-between gap-2 mt-1 mb-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs" style={{ background: mod.bg, color: mod.tc }}>{mod.icon}</div>
          <span className="text-[10px] font-semibold" style={{ color: mod.tc }}>{mod.label}</span>
        </div>
        <span className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold" style={{ background: tp.bg, color: tp.color }}>{tp.emoji}</span>
      </div>
      <p className="text-sm font-semibold mb-1.5 line-clamp-2" style={{ color: 'var(--text-1)', letterSpacing: '-.01em' }}>{note.title}</p>
      {note.content && (<p className="text-[11px] mb-2 line-clamp-2 leading-relaxed" style={{ color: 'var(--text-3)' }}>{note.content.replace(/[#*`>-]/g, '').slice(0, 120)}</p>)}
      {note.path && (<p className="text-[10px] mb-2 truncate" style={{ color: 'var(--text-3)' }}>📂 {note.path}</p>)}
      {(note.tags || []).length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {note.tags.slice(0, 3).map(t => (<span key={t} className="text-[9px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: mod.bg, color: mod.tc }}>#{t}</span>))}
          {note.tags.length > 3 && (<span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: 'var(--surface-2)', color: 'var(--text-3)' }}>+{note.tags.length - 3}</span>)}
        </div>
      )}
      <div className="flex items-center justify-between mt-auto pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
        <span className="text-[10px]" style={{ color: 'var(--text-3)' }}>{relativeDate(note.date)}</span>
        {mastery > 0 && <MasteryBadge level={mastery} />}
      </div>
    </motion.div>
  )
}

export default function ExplorerPage({ notes, mods, onBack, onFiche, getMasteryLevel }) {
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('date-desc')
  const [activeModules, setActiveModules] = useState([])
  const [activeTypes, setActiveTypes] = useState([])
  const [activeTags, setActiveTags] = useState([])
  const [view, setView] = useState(() => localStorage.getItem('lgpi-explorer-view') || 'list')
  const [showFilters, setShowFilters] = useState(false)

  const changeView = useCallback((v) => { setView(v); localStorage.setItem('lgpi-explorer-view', v) }, [])
  const allTags = useMemo(() => [...new Set(notes.flatMap(n => n.tags || []))].sort(), [notes])

  const filteredNotes = useMemo(() => {
    let result = [...notes]
    if (search) { const q = search.toLowerCase(); result = result.filter(n => (n.title || '').toLowerCase().includes(q) || (n.content || '').toLowerCase().includes(q) || (n.tags || []).join(' ').toLowerCase().includes(q) || (n.path || '').toLowerCase().includes(q)) }
    if (activeModules.length > 0) result = result.filter(n => activeModules.includes(n.module))
    if (activeTypes.length > 0) result = result.filter(n => activeTypes.includes(n.type))
    if (activeTags.length > 0) result = result.filter(n => activeTags.some(t => (n.tags || []).includes(t)))
    switch (sort) {
      case 'date-desc': result.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)); break
      case 'date-asc': result.sort((a, b) => (a.updatedAt || 0) - (b.updatedAt || 0)); break
      case 'alpha': result.sort((a, b) => (a.title || '').localeCompare(b.title || '')); break
      case 'alpha-desc': result.sort((a, b) => (b.title || '').localeCompare(a.title || '')); break
      case 'mastery-asc': result.sort((a, b) => (getMasteryLevel?.(a.id) || 0) - (getMasteryLevel?.(b.id) || 0)); break
      case 'module': result.sort((a, b) => { const ma = mods.find(m => m.id === a.module); const mb = mods.find(m => m.id === b.module); return (ma?.label || '').localeCompare(mb?.label || '') }); break
    }
    return result
  }, [notes, search, activeModules, activeTypes, activeTags, sort, mods, getMasteryLevel])

  const activeFiltersCount = activeModules.length + activeTypes.length + activeTags.length
  const toggleModule = id => setActiveModules(a => a.includes(id) ? a.filter(x => x !== id) : [...a, id])
  const toggleType = id => setActiveTypes(a => a.includes(id) ? a.filter(x => x !== id) : [...a, id])
  const toggleTag = tag => setActiveTags(a => a.includes(tag) ? a.filter(x => x !== tag) : [...a, tag])
  const clearFilters = () => { setActiveModules([]); setActiveTypes([]); setActiveTags([]); setSearch('') }

  const groupedByModule = useMemo(() => {
    if (sort !== 'module') return null
    const groups = {}
    filteredNotes.forEach(n => {
      const mod = mods.find(m => m.id === n.module) || { id: 'unknown', label: 'Autre', icon: '❓', bg: '#eee', tc: '#555' }
      if (!groups[mod.id]) groups[mod.id] = { mod, notes: [] }
      groups[mod.id].notes.push(n)
    })
    return Object.values(groups)
  }, [sort, filteredNotes, mods])

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="pb-24 sm:pb-0">
      <BackButton label="Accueil" onClick={onBack} />
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-1)', letterSpacing: '-.03em' }}>📚 Explorer</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>{filteredNotes.length} fiche{filteredNotes.length !== 1 ? 's' : ''} sur {notes.length} au total</p>
        </div>
        <ViewToggle view={view} onChange={changeView} />
      </div>

      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm pointer-events-none" style={{ color: 'var(--text-3)' }}>⌕</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher par titre, contenu, tag, chemin…" className="input-base pl-10 pr-10 py-3 rounded-xl w-full" />
          {search && (<button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'var(--text-3)' }}>✕</button>)}
        </div>
        <motion.button whileTap={{ scale: .95 }} onClick={() => setShowFilters(f => !f)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all relative"
          style={showFilters || activeFiltersCount > 0 ? { background: 'var(--accent)', color: '#fff' } : { background: 'var(--surface)', color: 'var(--text-2)', border: '1px solid var(--border)' }}>
          ⚙️ Filtres
          {activeFiltersCount > 0 && (<span className="w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center" style={{ background: '#fff', color: 'var(--accent)' }}>{activeFiltersCount}</span>)}
        </motion.button>
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-4">
            <div className="rounded-2xl border p-4 space-y-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-3)' }}>Tri</p>
                <div className="flex flex-wrap gap-1.5">
                  {SORT_OPTIONS.map(s => (<button key={s.value} onClick={() => setSort(s.value)} className="text-[11px] font-medium px-2.5 py-1 rounded-full transition-all" style={sort === s.value ? { background: 'var(--accent)', color: '#fff' } : { background: 'var(--surface-2)', color: 'var(--text-2)' }}>{s.label}</button>))}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-3)' }}>Modules</p>
                <div className="flex flex-wrap gap-1.5">
                  {mods.map(m => { const count = notes.filter(n => n.module === m.id).length; return (
                    <button key={m.id} onClick={() => toggleModule(m.id)} className="text-[11px] font-medium px-2.5 py-1 rounded-full transition-all flex items-center gap-1"
                      style={activeModules.includes(m.id) ? { background: m.tc || m.color, color: '#fff' } : { background: m.bg || 'var(--surface-2)', color: m.tc || 'var(--text-2)' }}>{m.icon} {m.label} <span className="opacity-60">({count})</span></button>
                  )})}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-3)' }}>Types</p>
                <div className="flex flex-wrap gap-1.5">
                  {['procedure', 'astuce', 'attention', 'info'].map(typeId => { const tp = getType(typeId); const count = notes.filter(n => n.type === typeId).length; return (
                    <button key={typeId} onClick={() => toggleType(typeId)} className="text-[11px] font-medium px-2.5 py-1 rounded-full transition-all"
                      style={activeTypes.includes(typeId) ? { background: tp.color, color: '#fff' } : { background: tp.bg, color: tp.color }}>{tp.emoji} {tp.label} ({count})</button>
                  )})}
                </div>
              </div>
              {allTags.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-3)' }}>Tags</p>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                    {allTags.map(tag => (<button key={tag} onClick={() => toggleTag(tag)} className="text-[11px] font-medium px-2 py-0.5 rounded-full transition-all" style={activeTags.includes(tag) ? { background: 'var(--accent)', color: '#fff' } : { background: 'var(--surface-2)', color: 'var(--text-2)' }}>#{tag}</button>))}
                  </div>
                </div>
              )}
              {activeFiltersCount > 0 && (<button onClick={clearFilters} className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors" style={{ color: '#ef4444', background: '#fef2f2' }}>✕ Réinitialiser les filtres</button>)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {filteredNotes.length === 0 ? (
        <div className="text-center py-16">
          <span className="text-4xl block mb-3">📭</span>
          <p className="text-sm" style={{ color: 'var(--text-2)' }}>Aucune fiche ne correspond à tes filtres</p>
          {activeFiltersCount > 0 && (<button onClick={clearFilters} className="text-xs mt-2 font-medium" style={{ color: 'var(--accent)' }}>Réinitialiser les filtres</button>)}
        </div>
      ) : sort === 'module' && groupedByModule ? (
        <div className="space-y-6">
          {groupedByModule.map(({ mod, notes: modNotes }) => (
            <div key={mod.id}>
              <div className="flex items-center gap-2 mb-3 sticky top-0 z-10 py-2 -mx-4 px-4" style={{ backdropFilter: 'blur(12px)' }}>
                <div className="w-6 h-6 rounded-lg flex items-center justify-center text-xs" style={{ background: mod.bg, color: mod.tc }}>{mod.icon}</div>
                <span className="text-sm font-semibold" style={{ color: mod.tc }}>{mod.label}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: mod.bg, color: mod.tc }}>{modNotes.length}</span>
              </div>
              <motion.div variants={container} initial="hidden" animate="show" className={view === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3" : "space-y-2"}>
                {modNotes.map(note => (<ExplorerCard key={note.id} note={note} mod={mod} tp={getType(note.type)} onFiche={onFiche} getMasteryLevel={getMasteryLevel} view={view} />))}
              </motion.div>
            </div>
          ))}
        </div>
      ) : (
        <motion.div variants={container} initial="hidden" animate="show" className={view === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3" : "space-y-2"}>
          {filteredNotes.map(note => {
            const mod = mods.find(m => m.id === note.module) || { label: '?', icon: '?', bg: '#eee', tc: '#555' }
            return (<ExplorerCard key={note.id} note={note} mod={mod} tp={getType(note.type)} onFiche={onFiche} getMasteryLevel={getMasteryLevel} view={view} />)
          })}
        </motion.div>
      )}
    </motion.div>
  )
}

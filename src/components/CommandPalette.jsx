import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from '../lib/motion'
import { getType, relativeDate } from '../lib/utils'

function scoreMatch(note, query, mods) {
  const q = query.toLowerCase().trim()
  if (!q) return 0
  const words = q.split(/\s+/)
  let score = 0
  const title = (note.title || '').toLowerCase()
  const content = (note.content || '').toLowerCase()
  const tags = (note.tags || []).join(' ').toLowerCase()
  const path = (note.path || '').toLowerCase()
  const mod = mods.find(m => m.id === note.module)
  const modLabel = (mod?.label || '').toLowerCase()

  if (title === q) score += 100
  else if (title.startsWith(q)) score += 80
  else if (title.includes(q)) score += 60

  words.forEach(w => {
    if (title.includes(w)) score += 20
    if (content.includes(w)) score += 5
    if (tags.includes(w)) score += 15
    if (path.includes(w)) score += 10
    if (modLabel.includes(w)) score += 8
  })

  if (note.updatedAt) {
    const daysAgo = (Date.now() - note.updatedAt) / 86400000
    if (daysAgo < 7) score += 10
    else if (daysAgo < 30) score += 5
  }
  return score
}

function getExcerptAround(content, query, radius = 50) {
  if (!content || !query) return ''
  const idx = content.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return content.slice(0, 100)
  const start = Math.max(0, idx - radius)
  const end = Math.min(content.length, idx + query.length + radius)
  return (start > 0 ? '…' : '') + content.slice(start, end) + (end < content.length ? '…' : '')
}

function highlightText(text, query) {
  if (!query || !text) return text
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'))
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase()
      ? <mark key={i} className="bg-yellow-200 dark:bg-yellow-800 text-inherit rounded-sm px-0.5">{part}</mark>
      : part
  )
}

const FILTERS = [
  { id: 'all', label: 'Tout', icon: '🔍' },
  { id: 'procedure', label: 'Procédures', icon: '📋' },
  { id: 'astuce', label: 'Astuces', icon: '💡' },
  { id: 'attention', label: 'Attention', icon: '⚠️' },
  { id: 'info', label: 'Info', icon: 'ℹ️' },
]

export default function CommandPalette({ notes, mods, onFiche, onClose }) {
  const [query, setQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')
  const [activeIndex, setActiveIndex] = useState(0)
  const [activeModule, setActiveModule] = useState(null)
  const inputRef = useRef(null)
  const listRef = useRef(null)

  useEffect(() => {
    requestAnimationFrame(() => inputRef.current?.focus())
  }, [])

  const results = (() => {
    const q = query.trim()
    let filtered = notes
    if (activeModule) filtered = filtered.filter(n => n.module === activeModule)
    if (activeFilter && activeFilter !== 'all') filtered = filtered.filter(n => n.type === activeFilter)

    if (!q) {
      if (!activeModule && activeFilter === 'all') return []
      return filtered
        .map(n => ({ ...n, mod: mods.find(m => m.id === n.module) || { label: '?', icon: '?', bg: '#eee', tc: '#555' }, score: 0, excerpt: (n.content || '').slice(0, 100), matchField: 'titre' }))
        .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
        .slice(0, 30)
    }

    return filtered
      .map(n => {
        const score = scoreMatch(n, q, mods)
        const mod = mods.find(m => m.id === n.module) || { label: '?', icon: '?', bg: '#eee', tc: '#555' }
        const matchField = (n.title || '').toLowerCase().includes(q.toLowerCase()) ? 'titre' : (n.tags || []).join(' ').toLowerCase().includes(q.toLowerCase()) ? 'tag' : (n.path || '').toLowerCase().includes(q.toLowerCase()) ? 'chemin' : 'contenu'
        return { ...n, mod, score, excerpt: getExcerptAround(n.content, q), matchField }
      })
      .filter(n => n.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 25)
  })()

  useEffect(() => { setActiveIndex(0) }, [query, activeFilter, activeModule])
  useEffect(() => {
    const el = listRef.current?.children[activeIndex]
    if (el) el.scrollIntoView({ block: 'nearest' })
  }, [activeIndex])

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex(i => Math.min(i + 1, results.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex(i => Math.max(i - 1, 0)) }
    else if (e.key === 'Enter' && results[activeIndex]) { e.preventDefault(); onFiche(results[activeIndex].id, results[activeIndex].module); onClose() }
    else if (e.key === 'Escape') { e.preventDefault(); onClose() }
  }, [results, activeIndex, onFiche, onClose])

  const matchBadgeColor = {
    titre: { bg: '#dbeafe', color: '#1e40af' }, tag: { bg: '#fef3c7', color: '#92400e' },
    chemin: { bg: '#d1fae5', color: '#065f46' }, contenu: { bg: '#f3e8ff', color: '#6b21a8' },
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: .15 }}
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh] px-4"
      style={{ background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(8px)' }} onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: .96, y: -10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: .96, y: -10 }}
        transition={{ type: 'spring', damping: 28, stiffness: 450 }}
        className="w-full max-w-2xl rounded-2xl overflow-hidden border"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)', boxShadow: '0 25px 60px rgba(0,0,0,.3), 0 8px 20px rgba(0,0,0,.15)' }}
        onClick={e => e.stopPropagation()}>

        {/* Input */}
        <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <span className="text-lg opacity-40">⌕</span>
          <input ref={inputRef} type="text" value={query} onChange={e => setQuery(e.target.value)} onKeyDown={handleKeyDown}
            placeholder="Rechercher fiches, tags, chemins…" className="flex-1 bg-transparent outline-none text-sm font-medium" style={{ color: 'var(--text-1)' }} />
          <kbd className="hidden sm:inline-block text-[10px] px-1.5 py-0.5 rounded font-mono"
            style={{ background: 'var(--surface-2)', color: 'var(--text-3)', border: '1px solid var(--border)' }}>ESC</kbd>
        </div>

        {/* Filtres */}
        <div className="flex items-center gap-1.5 px-5 py-2.5 border-b overflow-x-auto" style={{ borderColor: 'var(--border)' }}>
          {FILTERS.map(f => (
            <button key={f.id} onClick={() => setActiveFilter(af => af === f.id ? 'all' : f.id)}
              className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap transition-all"
              style={activeFilter === f.id && f.id !== 'all' ? { background: 'var(--accent)', color: '#fff' } : { background: 'var(--surface-2)', color: 'var(--text-2)' }}>
              <span className="text-xs">{f.icon}</span> {f.label}
            </button>
          ))}
          <span className="text-[10px] mx-1" style={{ color: 'var(--text-3)' }}>│</span>
          <div className="flex gap-1">
            {mods.slice(0, 6).map(m => (
              <button key={m.id} onClick={() => setActiveModule(am => am === m.id ? null : m.id)}
                className="text-[11px] font-medium px-2 py-1 rounded-full whitespace-nowrap transition-all"
                style={activeModule === m.id ? { background: m.tc || m.color, color: '#fff' } : { background: m.bg || 'var(--surface-2)', color: m.tc || 'var(--text-2)' }}>
                {m.icon} {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Résultats */}
        <div ref={listRef} className="max-h-[50vh] overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
          {results.length === 0 && query && (
            <div className="flex flex-col items-center py-12 gap-2">
              <span className="text-3xl">🔍</span>
              <p className="text-sm" style={{ color: 'var(--text-2)' }}>Aucun résultat pour « {query} »</p>
              <p className="text-xs" style={{ color: 'var(--text-3)' }}>Essaie avec d'autres mots-clés</p>
            </div>
          )}
          {results.length === 0 && !query && !activeModule && activeFilter === 'all' && (
            <div className="flex flex-col items-center py-12 gap-2">
              <p className="text-sm" style={{ color: 'var(--text-2)' }}>Tape un mot-clé ou utilise les filtres</p>
              <div className="flex gap-3 mt-2">
                <span className="text-[10px] flex items-center gap-1" style={{ color: 'var(--text-3)' }}>
                  <kbd className="px-1 py-0.5 rounded font-mono" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>↑↓</kbd> naviguer
                </span>
                <span className="text-[10px] flex items-center gap-1" style={{ color: 'var(--text-3)' }}>
                  <kbd className="px-1 py-0.5 rounded font-mono" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>↩</kbd> ouvrir
                </span>
              </div>
            </div>
          )}
          {results.map((note, idx) => {
            const tp = getType(note.type)
            const badge = matchBadgeColor[note.matchField] || matchBadgeColor.contenu
            return (
              <motion.div key={note.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * .02 }}
                className="flex items-start gap-3 px-5 py-3 cursor-pointer transition-colors"
                style={{ background: idx === activeIndex ? 'var(--accent-bg)' : 'transparent', borderLeft: idx === activeIndex ? '3px solid var(--accent)' : '3px solid transparent' }}
                onClick={() => { onFiche(note.id, note.module); onClose() }} onMouseEnter={() => setActiveIndex(idx)}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm flex-shrink-0 mt-0.5" style={{ background: note.mod.bg, color: note.mod.tc }}>{note.mod.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-1)' }}>{highlightText(note.title, query)}</p>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0" style={{ background: badge.bg, color: badge.color }}>{note.matchField}</span>
                  </div>
                  {(note.tags || []).length > 0 && (
                    <div className="flex gap-1 mb-1 flex-wrap">
                      {note.tags.slice(0, 4).map(t => (<span key={t} className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: note.mod.bg, color: note.mod.tc }}>#{t}</span>))}
                    </div>
                  )}
                  {query && note.matchField === 'contenu' && (<p className="text-xs line-clamp-1" style={{ color: 'var(--text-3)' }}>{highlightText(note.excerpt, query)}</p>)}
                  {note.path && (<p className="text-[10px] mt-0.5 truncate" style={{ color: 'var(--text-3)' }}>📂 {note.path}</p>)}
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className="text-[10px]" style={{ color: note.mod.tc }}>{note.mod.label}</span>
                  <span className="text-[10px]" style={{ color: 'var(--text-3)' }}>{relativeDate(note.date)}</span>
                </div>
              </motion.div>
            )
          })}
        </div>

        {results.length > 0 && (
          <div className="flex items-center justify-between px-5 py-2 border-t text-[10px]" style={{ borderColor: 'var(--border)', color: 'var(--text-3)' }}>
            <span>{results.length} résultat{results.length > 1 ? 's' : ''}</span>
            <div className="flex gap-3">
              <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 rounded font-mono" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>↑↓</kbd> naviguer</span>
              <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 rounded font-mono" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>↩</kbd> ouvrir</span>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

import { useState, useEffect, useCallback } from 'react'

export function useSearch(notes, mods, delay = 200) {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [results, setResults] = useState([])

  // Debounce
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), delay)
    return () => clearTimeout(timer)
  }, [query, delay])

  // Recherche
  useEffect(() => {
    if (!debouncedQuery.trim()) { setResults([]); return }
    const q = debouncedQuery.toLowerCase()
    const found = notes
      .filter(n =>
        n.title.toLowerCase().includes(q) ||
        (n.content || '').toLowerCase().includes(q) ||
        (n.tags || []).join(' ').toLowerCase().includes(q) ||
        (n.path || '').toLowerCase().includes(q)
      )
      .map(n => ({
        ...n,
        mod: mods.find(m => m.id === n.module) || { label: '?', icon: '?', bg: '#eee', tc: '#555' },
        // Highlight : trouver l'extrait pertinent
        excerpt: getExcerpt(n, q),
        matchField: getMatchField(n, q),
      }))
      .slice(0, 20)
    setResults(found)
  }, [debouncedQuery, notes, mods])

  const clear = useCallback(() => { setQuery(''); setResults([]) }, [])

  return { query, setQuery, results, debouncedQuery, clear }
}

function getExcerpt(note, q) {
  const content = note.content || ''
  const idx = content.toLowerCase().indexOf(q)
  if (idx === -1) return content.slice(0, 100)
  const start = Math.max(0, idx - 40)
  const end = Math.min(content.length, idx + q.length + 60)
  return (start > 0 ? '...' : '') + content.slice(start, end) + (end < content.length ? '...' : '')
}

function getMatchField(note, q) {
  if (note.title.toLowerCase().includes(q)) return 'titre'
  if ((note.tags || []).join(' ').toLowerCase().includes(q)) return 'tag'
  if ((note.path || '').toLowerCase().includes(q)) return 'chemin'
  return 'contenu'
}

// Highlight d'un texte
export function highlight(text, query) {
  if (!query || !text) return text
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return text
  return (
    text.slice(0, idx) +
    '<mark>' +
    text.slice(idx, idx + query.length) +
    '</mark>' +
    text.slice(idx + query.length)
  )
}

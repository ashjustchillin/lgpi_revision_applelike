import { useState } from 'react'
import { motion, AnimatePresence } from '../lib/motion'
import { BackButton, ConfirmModal } from '../components/UI'
import { usePersonalNotes } from '../hooks/usePersonalNotes'
import { renderMarkdown } from '../lib/utils'
import { reformulerContenu, suggererTitre } from '../lib/groq'

// ── CARTE NOTE ────────────────────────────────────────────
function NoteCard({ note, onEdit, onDelete, onFiche, accent, allNotes, mods }) {
  const [confirm, setConfirm] = useState(false)
  const [expanded, setExpanded] = useState(false)

  // Fiches liees
  const linkedFiches = (note.linkedFiches || [])
    .map(id => allNotes?.find(n => n.id === id))
    .filter(Boolean)

  return (
    <motion.div layout
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="card-base p-4 group"
      whileHover={{ y: -2, boxShadow: 'var(--shadow-md)' }}
    >
      <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl" style={{ background: accent }} />

      {/* Header */}
      <div className="flex items-start justify-between gap-2 mt-1">
        <div className="flex-1 min-w-0">
          {note.title && (
            <p className="text-sm font-semibold mb-1 truncate" style={{ color: 'var(--text-1)', letterSpacing: '-.01em' }}>
              {note.title}
            </p>
          )}
          {note.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {note.tags.map(t => (
                <span key={t} className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                  style={{ background: accent + '22', color: accent }}>{t}</span>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <motion.button whileTap={{ scale: .9 }} onClick={() => onEdit(note)}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-xs"
            style={{ background: 'var(--surface-2)', color: 'var(--text-2)' }}
          >✏️</motion.button>
          <motion.button whileTap={{ scale: .9 }} onClick={() => setConfirm(true)}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-xs"
            style={{ background: '#fee2e2', color: '#ef4444' }}
          >🗑</motion.button>
        </div>
      </div>

      {/* Contenu */}
      <div onClick={() => setExpanded(e => !e)} className="cursor-pointer">
        {note.mode === 'structure' ? (
          <div className={`prose-fiche text-xs leading-relaxed ${expanded ? '' : 'line-clamp-3'}`}
            dangerouslySetInnerHTML={{ __html: renderMarkdown(note.content || '') }} />
        ) : (
          <p className={`text-xs leading-relaxed whitespace-pre-wrap ${expanded ? '' : 'line-clamp-3'}`}
            style={{ color: 'var(--text-2)' }}>{note.content}</p>
        )}
        {!expanded && (note.content?.length > 150) && (
          <span className="text-[10px] font-medium" style={{ color: accent }}>Voir plus...</span>
        )}
      </div>

      {/* Fiches liees */}
      {linkedFiches.length > 0 && (
        <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
          <p className="text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-3)' }}>
            Fiches liees
          </p>
          <div className="flex flex-wrap gap-1.5">
            {linkedFiches.map(f => {
              const mod = mods?.find(m => m.id === f.module)
              return (
                <motion.button key={f.id} whileTap={{ scale: .95 }}
                  onClick={() => onFiche && onFiche(f.id, f.module)}
                  className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg font-medium border transition-colors"
                  style={{ background: mod?.bg || 'var(--surface-2)', color: mod?.tc || 'var(--text-2)', borderColor: 'var(--border)' }}
                >
                  {mod?.icon} {f.title}
                </motion.button>
              )
            })}
          </div>
        </div>
      )}

      <p className="text-[10px] mt-2" style={{ color: 'var(--text-3)' }}>
        {note.updatedAt ? new Date(note.updatedAt).toLocaleDateString('fr', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
      </p>

      {confirm && (
        <ConfirmModal
          title="Supprimer cette note ?"
          message="Cette note sera definitivement supprimee."
          onConfirm={() => { setConfirm(false); onDelete(note.id) }}
          onCancel={() => setConfirm(false)}
        />
      )}
    </motion.div>
  )
}

// ── FORMULAIRE NOTE ───────────────────────────────────────
function NoteForm({ note, onSave, onCancel, accent, allNotes, mods }) {
  const [mode, setMode] = useState(note?.mode || 'libre')
  const [title, setTitle] = useState(note?.title || '')
  const [content, setContent] = useState(note?.content || '')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState(note?.tags || [])
  const [linkedFiches, setLinkedFiches] = useState(note?.linkedFiches || [])
  const [saving, setSaving] = useState(false)
  const [ficheSearch, setFicheSearch] = useState('')

  // Etats IA
  const [aiLoading, setAiLoading] = useState(null)
  const [aiPreview, setAiPreview] = useState(null)
  const [aiError, setAiError] = useState(null)

  const addTag = val => {
    const v = val.trim()
    if (v && !tags.includes(v)) setTags(t => [...t, v])
    setTagInput('')
  }

  // Reformuler le contenu avec IA
  const handleReformuler = async () => {
    if (!content.trim()) return
    setAiLoading('content'); setAiError(null); setAiPreview(null)
    try {
      const result = await reformulerContenu(content, title)
      setAiPreview({ type: 'content', value: result, original: content })
    } catch {
      setAiError('Erreur de connexion a l\'IA')
    } finally { setAiLoading(null) }
  }

  // Suggerer un titre avec IA
  const handleSuggererTitre = async () => {
    if (!content.trim()) return
    setAiLoading('title'); setAiError(null); setAiPreview(null)
    try {
      const result = await suggererTitre(content)
      setAiPreview({ type: 'title', value: result, original: title })
    } catch {
      setAiError('Erreur de connexion a l\'IA')
    } finally { setAiLoading(null) }
  }

  const acceptPreview = () => {
    if (!aiPreview) return
    if (aiPreview.type === 'content') setContent(aiPreview.value)
    else if (aiPreview.type === 'title') setTitle(aiPreview.value)
    setAiPreview(null)
  }

  const handleSave = async () => {
    if (!content.trim() && !title.trim()) return
    setSaving(true)
    try {
      await onSave({
        mode, title: title.trim(), content: content.trim(),
        tags, linkedFiches,
        ...(note?.id ? { id: note.id } : {})
      })
    } finally { setSaving(false) }
  }

  // Fiches filtrees pour la recherche
  const fichesFiltrees = (allNotes || [])
    .filter(n => !ficheSearch || n.title.toLowerCase().includes(ficheSearch.toLowerCase()))
    .slice(0, 30)

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="card-base p-5 mb-4" style={{ boxShadow: 'var(--shadow-md)' }}
    >
      <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl" style={{ background: accent }} />

      {/* Toggle mode */}
      <div className="flex rounded-xl p-1 gap-1 mb-4 mt-1 w-fit"
        style={{ background: 'var(--surface-2)' }}>
        {['libre', 'structure'].map(m => (
          <button key={m} onClick={() => setMode(m)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={mode === m ? { background: accent, color: '#fff' } : { color: 'var(--text-2)' }}
          >
            {m === 'libre' ? '📝 Texte libre' : '📋 Structure'}
          </button>
        ))}
      </div>

      {/* Titre */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-3)' }}>
            Titre
          </label>
          {content.trim() && (
            <motion.button whileTap={{ scale: .95 }} onClick={handleSuggererTitre}
              disabled={!!aiLoading}
              className="flex items-center gap-1 text-[10px] font-medium disabled:opacity-50 transition-colors"
              style={{ color: '#7c3aed' }}
            >
              {aiLoading === 'title' ? (
                <><span className="w-2.5 h-2.5 border border-purple-400 border-t-transparent rounded-full animate-spin inline-block" /> Suggestion...</>
              ) : '✨ Suggerer un titre'}
            </motion.button>
          )}
        </div>
        <input value={title} onChange={e => setTitle(e.target.value)}
          placeholder="Titre de la note"
          className="input-base text-sm font-medium"
        />
        {/* Preview titre */}
        <AnimatePresence>
          {aiPreview?.type === 'title' && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mt-2"
            >
              <div className="p-3 rounded-xl border" style={{ background: '#faf5ff', borderColor: '#d8b4fe' }}>
                <p className="text-[10px] font-semibold mb-1" style={{ color: '#7c3aed' }}>Titre suggere</p>
                <p className="text-sm font-semibold mb-2" style={{ color: '#6d28d9' }}>{aiPreview.value}</p>
                <div className="flex gap-2">
                  <button onClick={acceptPreview} className="text-xs font-semibold text-white px-3 py-1 rounded-lg" style={{ background: '#7c3aed' }}>Utiliser</button>
                  <button onClick={() => setAiPreview(null)} className="text-xs" style={{ color: '#7c3aed' }}>Ignorer</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Contenu */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-3)' }}>
            Contenu
          </label>
          {content.trim() && (
            <motion.button whileTap={{ scale: .95 }} onClick={handleReformuler}
              disabled={!!aiLoading}
              className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg disabled:opacity-50"
              style={{ background: '#faf5ff', color: '#7c3aed' }}
            >
              {aiLoading === 'content' ? (
                <><span className="w-3 h-3 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" /> Reformulation...</>
              ) : '✨ Reformuler avec IA'}
            </motion.button>
          )}
        </div>
        <textarea value={content} onChange={e => setContent(e.target.value)}
          placeholder={mode === 'libre'
            ? "Tes notes en texte libre...\n\nEcris rapidement, l'IA peut reformuler pour toi !"
            : "Contenu...\n\nMarkdown: ## Titre  **gras**  - liste"}
          rows={mode === 'libre' ? 5 : 6}
          className="input-base resize-y leading-relaxed text-sm"
        />
        {/* Preview reformulation */}
        <AnimatePresence>
          {aiPreview?.type === 'content' && (
            <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mt-2 rounded-xl overflow-hidden border" style={{ borderColor: '#d8b4fe' }}
            >
              <div className="flex items-center justify-between px-3 py-2" style={{ background: '#faf5ff', borderBottom: '1px solid #d8b4fe' }}>
                <span className="text-xs font-semibold" style={{ color: '#7c3aed' }}>✨ Version reformulee</span>
                <div className="flex gap-2">
                  <button onClick={acceptPreview} className="text-xs font-semibold text-white px-3 py-1 rounded-lg" style={{ background: '#7c3aed' }}>Utiliser</button>
                  <button onClick={() => setAiPreview(null)} className="text-xs px-2" style={{ color: '#7c3aed' }}>Ignorer</button>
                </div>
              </div>
              <div className="p-3" style={{ background: 'var(--surface)' }}>
                <pre className="text-xs whitespace-pre-wrap font-sans leading-relaxed" style={{ color: 'var(--text-1)' }}>{aiPreview.value}</pre>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {aiError && (
          <p className="text-xs mt-1.5 text-red-500">{aiError}</p>
        )}
      </div>

      {/* Tags (mode structure) */}
      {mode === 'structure' && (
        <div className="mb-4">
          <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-3)' }}>
            Tags
          </label>
          <div className="flex flex-wrap gap-1.5 p-2 rounded-xl border min-h-9"
            style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}>
            {tags.map((t, i) => (
              <span key={i} className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium"
                style={{ background: accent + '22', color: accent }}>
                {t}
                <button onClick={() => setTags(a => a.filter((_, j) => j !== i))} className="opacity-60 hover:opacity-100">✕</button>
              </span>
            ))}
            <input value={tagInput} onChange={e => setTagInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(tagInput) } }}
              placeholder="Ajouter un tag..."
              className="flex-1 min-w-20 text-xs bg-transparent outline-none"
              style={{ color: 'var(--text-1)' }}
            />
          </div>
        </div>
      )}

      {/* Fiches liees */}
      <div className="mb-4">
        <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-3)' }}>
          Fiches LGPI liees
        </label>
        <div className="border rounded-xl overflow-hidden" style={{ borderColor: 'var(--border)' }}>
          <input value={ficheSearch} onChange={e => setFicheSearch(e.target.value)}
            placeholder="Rechercher une fiche..."
            className="w-full px-3 py-2 text-xs outline-none bg-transparent border-b"
            style={{ borderColor: 'var(--border)', color: 'var(--text-1)' }}
          />
          <div className="max-h-36 overflow-y-auto">
            {fichesFiltrees.length === 0 ? (
              <p className="text-xs p-3" style={{ color: 'var(--text-3)' }}>Aucune fiche disponible</p>
            ) : fichesFiltrees.map(f => {
              const mod = mods?.find(m => m.id === f.module)
              const checked = linkedFiches.includes(f.id)
              return (
                <label key={f.id}
                  className="flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors hover:opacity-80"
                  style={{ background: checked ? accent + '11' : 'transparent' }}
                >
                  <input type="checkbox" checked={checked}
                    onChange={e => setLinkedFiches(l => e.target.checked ? [...l, f.id] : l.filter(x => x !== f.id))}
                    className="flex-shrink-0"
                    style={{ accentColor: accent }}
                  />
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0"
                    style={{ background: mod?.bg, color: mod?.tc }}>{mod?.icon}</span>
                  <span className="text-xs truncate" style={{ color: 'var(--text-1)' }}>{f.title}</span>
                </label>
              )
            })}
          </div>
        </div>
        {linkedFiches.length > 0 && (
          <p className="text-[10px] mt-1" style={{ color: accent }}>
            {linkedFiches.length} fiche{linkedFiches.length > 1 ? 's' : ''} liee{linkedFiches.length > 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <motion.button whileTap={{ scale: .96 }} onClick={handleSave} disabled={saving}
          className="btn-accent text-xs disabled:opacity-50"
          style={{ background: accent }}
        >
          {saving ? 'Sauvegarde...' : note ? 'Mettre a jour' : 'Enregistrer'}
        </motion.button>
        <button onClick={onCancel} className="btn-ghost text-xs">Annuler</button>
      </div>
    </motion.div>
  )
}

// ── PAGE PRINCIPALE ───────────────────────────────────────
export default function PersonalNotesPage({ account, onBack, allNotes, mods, onGoFiche }) {
  const { notes, loading, saveNote, deleteNote } = usePersonalNotes(account?.name?.toLowerCase() || 'user')
  const [showForm, setShowForm] = useState(false)
  const [editingNote, setEditingNote] = useState(null)
  const [search, setSearch] = useState('')
  const accent = account?.color || '#6C63FF'

  const filtered = notes.filter(n =>
    !search ||
    (n.title || '').toLowerCase().includes(search.toLowerCase()) ||
    (n.content || '').toLowerCase().includes(search.toLowerCase()) ||
    (n.tags || []).join(' ').toLowerCase().includes(search.toLowerCase())
  )

  const handleSave = async (data) => {
    await saveNote(data)
    setShowForm(false)
    setEditingNote(null)
  }

  const handleEdit = (note) => {
    setEditingNote(note)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="pb-24 sm:pb-0">
      <BackButton label="Retour" onClick={onBack} />

      {/* Header */}
      <div className="flex items-center gap-4 mb-6 p-5 rounded-2xl" style={{ background: accent + '18' }}>
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold text-white"
          style={{ background: accent }}>
          {account?.name?.[0] || '?'}
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold" style={{ color: accent, letterSpacing: '-.03em' }}>Mes notes</h2>
          <p className="text-sm" style={{ color: 'var(--text-2)' }}>
            {notes.length} note{notes.length !== 1 ? 's' : ''} personnelle{notes.length !== 1 ? 's' : ''}
          </p>
        </div>
        {!showForm && (
          <motion.button whileTap={{ scale: .95 }}
            onClick={() => { setEditingNote(null); setShowForm(true) }}
            className="px-4 py-2 rounded-full text-sm font-semibold text-white"
            style={{ background: accent }}
          >+ Nouvelle</motion.button>
        )}
      </div>

      {/* Formulaire */}
      <AnimatePresence>
        {showForm && (
          <NoteForm
            note={editingNote}
            onSave={handleSave}
            onCancel={() => { setShowForm(false); setEditingNote(null) }}
            accent={accent}
            allNotes={allNotes}
            mods={mods}
          />
        )}
      </AnimatePresence>

      {/* Search */}
      {notes.length > 3 && (
        <div className="relative mb-4">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none" style={{ color: 'var(--text-3)' }}>⌕</span>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher dans mes notes..."
            className="input-base pl-9 text-sm" />
        </div>
      )}

      {/* Notes */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: accent, borderTopColor: 'transparent' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">📝</div>
          <p className="text-sm mb-4" style={{ color: 'var(--text-2)' }}>
            {search ? 'Aucune note trouvee.' : 'Aucune note pour le moment.'}
          </p>
          {!showForm && !search && (
            <motion.button whileTap={{ scale: .95 }}
              onClick={() => { setEditingNote(null); setShowForm(true) }}
              className="px-4 py-2 rounded-full text-sm font-semibold text-white"
              style={{ background: accent }}
            >Creer ma premiere note</motion.button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <AnimatePresence>
            {filtered.map(note => (
              <NoteCard
                key={note.id} note={note}
                onEdit={handleEdit}
                onDelete={deleteNote}
                onFiche={onGoFiche}
                accent={accent}
                allNotes={allNotes}
                mods={mods}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  )
}

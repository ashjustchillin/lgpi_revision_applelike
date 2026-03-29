import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { NavBreadcrumb, BackButton, ConfirmModal } from '../components/UI'
import { usePersonalNotes } from '../hooks/usePersonalNotes'
import { renderMarkdown } from '../lib/utils'

const MODES = ['libre', 'structure']

function NoteCard({ note, onEdit, onDelete, accent }) {
  const [confirm, setConfirm] = useState(false)
  const [expanded, setExpanded] = useState(false)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-base p-4 group"
      whileHover={{ y: -2, boxShadow: 'var(--shadow-md)' }}
    >
      {/* Accent bar */}
      <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl" style={{ background: accent }} />

      <div className="flex items-start justify-between gap-2 mt-1">
        <div className="flex-1 min-w-0">
          {note.title && (
            <p className="text-sm font-semibold mb-1 truncate" style={{ color: 'var(--text-1)', letterSpacing: '-.01em' }}>
              {note.title}
            </p>
          )}
          {note.mode === 'structure' && note.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {note.tags.map(t => (
                <span key={t} className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                  style={{ background: accent + '22', color: accent }}>
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
        {/* Actions */}
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
      <div
        onClick={() => setExpanded(e => !e)}
        className="cursor-pointer"
      >
        {note.mode === 'structure' ? (
          <div className={`prose-fiche text-xs leading-relaxed ${expanded ? '' : 'line-clamp-3'}`}
            dangerouslySetInnerHTML={{ __html: renderMarkdown(note.content || '') }}
          />
        ) : (
          <p className={`text-xs leading-relaxed whitespace-pre-wrap ${expanded ? '' : 'line-clamp-3'}`}
            style={{ color: 'var(--text-2)' }}>
            {note.content}
          </p>
        )}
        {!expanded && note.content?.length > 150 && (
          <span className="text-[10px] font-medium" style={{ color: accent }}>Voir plus...</span>
        )}
      </div>

      {/* Date */}
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

function NoteForm({ note, onSave, onCancel, accent }) {
  const [mode, setMode] = useState(note?.mode || 'libre')
  const [title, setTitle] = useState(note?.title || '')
  const [content, setContent] = useState(note?.content || '')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState(note?.tags || [])
  const [saving, setSaving] = useState(false)

  const addTag = val => {
    const v = val.trim()
    if (v && !tags.includes(v)) setTags(t => [...t, v])
    setTagInput('')
  }

  const handleSave = async () => {
    if (!content.trim() && !title.trim()) return
    setSaving(true)
    try {
      await onSave({ mode, title: title.trim(), content: content.trim(), tags, ...(note?.id ? { id: note.id } : {}) })
    } finally {
      setSaving(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="card-base p-5 mb-4"
      style={{ boxShadow: 'var(--shadow-md)' }}
    >
      <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl" style={{ background: accent }} />

      {/* Toggle mode */}
      <div className="flex bg-gray-100 dark:bg-zinc-800 rounded-xl p-1 gap-1 mb-4 mt-1 w-fit">
        {MODES.map(m => (
          <button key={m} onClick={() => setMode(m)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize"
            style={mode === m ? { background: accent, color: '#fff' } : { color: 'var(--text-2)' }}
          >
            {m === 'libre' ? '📝 Texte libre' : '📋 Structure'}
          </button>
        ))}
      </div>

      {/* Titre (mode structure) */}
      {mode === 'structure' && (
        <input value={title} onChange={e => setTitle(e.target.value)}
          placeholder="Titre de la note"
          className="input-base mb-3 text-sm font-semibold"
        />
      )}

      {/* Contenu */}
      <textarea
        value={content} onChange={e => setContent(e.target.value)}
        placeholder={mode === 'libre'
          ? "Tes notes en texte libre...\n\nEcris ce que tu veux ici !"
          : "Contenu de la note...\n\nMarkdown supporte : ## Titre  **gras**  - liste"}
        rows={mode === 'libre' ? 5 : 6}
        className="input-base resize-y leading-relaxed text-sm mb-3"
      />

      {/* Tags (mode structure) */}
      {mode === 'structure' && (
        <div className="mb-3">
          <div className="flex flex-wrap gap-1.5 p-2 rounded-xl border min-h-9"
            style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}>
            {tags.map((t, i) => (
              <span key={i} className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium"
                style={{ background: accent + '22', color: accent }}>
                {t}
                <button onClick={() => setTags(a => a.filter((_, j) => j !== i))} className="opacity-60 hover:opacity-100">✕</button>
              </span>
            ))}
            <input value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(tagInput) } }}
              placeholder="Ajouter un tag..."
              className="flex-1 min-w-20 text-xs bg-transparent outline-none"
              style={{ color: 'var(--text-1)' }}
            />
          </div>
        </div>
      )}

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

export default function PersonalNotesPage({ account, onBack }) {
  const { notes, loading, saveNote, deleteNote } = usePersonalNotes(account?.name?.toLowerCase() || 'user')
  const [showForm, setShowForm] = useState(false)
  const [editingNote, setEditingNote] = useState(null)
  const [search, setSearch] = useState('')
  const accent = account?.color || '#6C63FF'

  const filtered = notes.filter(n =>
    !search || (n.title || '').toLowerCase().includes(search.toLowerCase()) ||
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

      {/* Header perso */}
      <div className="flex items-center gap-4 mb-6 p-5 rounded-2xl"
        style={{ background: accent + '18' }}>
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold text-white"
          style={{ background: accent }}>
          {account?.name?.[0] || '?'}
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold" style={{ color: accent, letterSpacing: '-.03em' }}>
            Mes notes
          </h2>
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
          />
        )}
      </AnimatePresence>

      {/* Search */}
      {notes.length > 3 && (
        <div className="relative mb-4">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none" style={{ color: 'var(--text-3)' }}>⌕</span>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher dans mes notes..."
            className="input-base pl-9 text-sm"
          />
        </div>
      )}

      {/* Notes */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: accent, borderTopColor: 'transparent' }} />
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
                key={note.id}
                note={note}
                onEdit={handleEdit}
                onDelete={deleteNote}
                accent={accent}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  )
}

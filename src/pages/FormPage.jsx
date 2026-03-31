import { useState, useRef } from 'react'
import { motion, AnimatePresence } from '../lib/motion'
import { NavBreadcrumb, BackButton, Chip } from '../components/UI'
import { TYPES } from '../lib/firebase'
import { todayStr, renderMarkdown } from '../lib/utils'
import { reformulerContenu, suggererTitre, suggererTags, detecterDoublons } from '../lib/groq'
import { FICHE_TEMPLATES } from '../lib/templates'

export default function FormPage({ note, mods, notes, curMod, onSave, onCancel }) {
  const [title, setTitle] = useState(note?.title || '')
  const [module, setModule] = useState(note?.module || curMod || mods[0]?.id || '')
  const [type, setType] = useState(note?.type || 'procedure')
  const [path, setPath] = useState(note?.path || '')
  const [content, setContent] = useState(note?.content || '')
  const [tags, setTags] = useState(note?.tags || [])
  const [links, setLinks] = useState(note?.links || [])
  const [tagInput, setTagInput] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [linkSearch, setLinkSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [preview, setPreview] = useState(false)
  const [doublons, setDoublons] = useState([])
  const [checkingDoublons, setCheckingDoublons] = useState(false)
  const [showTemplates, setShowTemplates] = useState(!note)
  const tagRef = useRef(null)

  // États IA
  const [aiLoading, setAiLoading] = useState(null)
  const [aiPreview, setAiPreview] = useState(null)
  const [aiError, setAiError] = useState(null)

  const curModObj = mods.find(m => m.id === module) || mods[0]
  const pathSteps = path ? path.split('>').map(s => s.trim()).filter(Boolean) : []
  const allTags = [...new Set(notes.flatMap(n => n.tags || []))]
  const filteredNotes = notes.filter(n =>
    n.id !== note?.id &&
    (!linkSearch || n.title.toLowerCase().includes(linkSearch.toLowerCase()))
  )

  const updateTagSuggestions = val => {
    if (!val) { setSuggestions([]); return }
    const q = val.toLowerCase()
    setSuggestions(allTags.filter(t => t.toLowerCase().includes(q) && !tags.includes(t)).slice(0, 6))
  }

  const addTag = val => {
    const v = val.trim()
    if (v && !tags.includes(v)) setTags(t => [...t, v])
    setTagInput(''); setSuggestions([])
  }

  // Fonctions IA
  const handleReformuler = async () => {
    if (!content.trim()) return
    setAiLoading('reformuler'); setAiError(null); setAiPreview(null)
    try {
      const result = await reformulerContenu(content, title)
      setAiPreview({ type: 'reformuler', value: result, original: content })
    } catch (e) {
      setAiError('Erreur de connexion à l\'IA. Réessaie dans quelques secondes.')
    } finally { setAiLoading(null) }
  }

  const handleSuggererTitre = async () => {
    if (!content.trim()) return
    setAiLoading('titre'); setAiError(null)
    try {
      const result = await suggererTitre(content)
      setAiPreview({ type: 'titre', value: result, original: title })
    } catch (e) {
      setAiError('Erreur de connexion à l\'IA.')
    } finally { setAiLoading(null) }
  }

  const handleSuggererTags = async () => {
    if (!content.trim() && !title.trim()) return
    setAiLoading('tags'); setAiError(null)
    try {
      const result = await suggererTags(content, title, allTags)
      setAiPreview({ type: 'tags', value: result, original: tags })
    } catch (e) {
      setAiError('Erreur de connexion à l\'IA.')
    } finally { setAiLoading(null) }
  }

  const acceptPreview = () => {
    if (!aiPreview) return
    if (aiPreview.type === 'reformuler') setContent(aiPreview.value)
    else if (aiPreview.type === 'titre') setTitle(aiPreview.value)
    else if (aiPreview.type === 'tags') {
      const newTags = [...new Set([...tags, ...aiPreview.value])]
      setTags(newTags)
    }
    setAiPreview(null)
  }

  const handleSave = async () => {
    if (!title.trim()) { alert('Le titre est requis.'); return }
    setSaving(true)
    const now = Date.now()
    const data = {
      title: title.trim(), module, content: content.trim(), path: path.trim(),
      type, links, tags, date: todayStr(),
      createdAt: note ? (note.createdAt || now) : now,
      updatedAt: now,
    }
    if (note?.id) data.id = note.id
    try { await onSave(data) } finally { setSaving(false) }
  }

  const accentColor = curModObj?.color || 'var(--accent)'

  // Appliquer un template
  const applyTemplate = (tpl) => {
    if (!content) setContent(tpl.content)
    else if (window.confirm('Remplacer le contenu par ce template ?')) setContent(tpl.content)
    setType(tpl.type)
    setShowTemplates(false)
  }

  // Vérifier les doublons
  const checkDoublons = async () => {
    if (!title.trim() || !notes?.length) return
    setCheckingDoublons(true)
    try {
      const existing = notes.filter(n => !note || n.id !== note.id)
      const found = await detecterDoublons(title, content, existing)
      setDoublons(found)
    } catch {}
    setCheckingDoublons(false)
  }

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
      <NavBreadcrumb crumbs={[
        { label: 'Accueil', action: () => onCancel('home') },
        { label: curModObj?.label || 'Module', action: () => onCancel('module') },
        { label: note ? 'Modifier' : 'Nouvelle fiche' },
      ]} />
      {/* Templates */}
      {showTemplates && !note && (
        <div className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-3)' }}>
            Choisir un template
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {FICHE_TEMPLATES.map(tpl => (
              <button key={tpl.id} type="button" onClick={() => applyTemplate(tpl)}
                className="flex flex-col items-center gap-1 p-3 rounded-xl border text-center transition-all"
                style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                <span className="text-xl">{tpl.icon}</span>
                <span className="text-[10px] font-medium" style={{ color: 'var(--text-2)' }}>{tpl.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Alerte doublons */}
      {doublons.length > 0 && (
        <div className="mb-4 p-3 rounded-xl border" style={{ background: '#fef9c3', borderColor: '#fbbf24' }}>
          <p className="text-xs font-semibold mb-1" style={{ color: '#92400e' }}>
            ⚠️ {doublons.length} fiche{doublons.length > 1 ? 's' : ''} similaire{doublons.length > 1 ? 's' : ''} detectee{doublons.length > 1 ? 's' : ''}
          </p>
          {doublons.map(d => (
            <p key={d.id} className="text-xs" style={{ color: '#78350f' }}>• {d.raison}</p>
          ))}
          <button type="button" onClick={() => setDoublons([])}
            className="text-[10px] mt-1 underline" style={{ color: '#92400e' }}>
            Ignorer
          </button>
        </div>
      )}

      <BackButton label="Annuler" onClick={() => onCancel(note ? 'fiche' : 'module')} />

      <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-gray-200 dark:border-zinc-700 p-6 max-w-2xl">

        {/* SECTION INFORMATIONS */}
        <div className="mb-6 pb-6 border-b border-gray-100 dark:border-zinc-700">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-4">Informations</p>

          <div className="mb-3">
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-400">Titre</label>
              {content.trim() && (
                <motion.button
                  whileTap={{ scale: .95 }}
                  onClick={handleSuggererTitre}
                  disabled={aiLoading === 'titre'}
                  className="flex items-center gap-1 text-[10px] font-medium text-purple-500 hover:text-purple-600 disabled:opacity-50 transition-colors"
                >
                  {aiLoading === 'titre' ? (
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 border border-purple-400 border-t-transparent rounded-full animate-spin inline-block" /> Génération...</span>
                  ) : '✨ Suggérer un titre'}
                </motion.button>
              )}
            </div>
            <input value={title} onChange={e => setTitle(e.target.value)}
              placeholder="Titre de la fiche"
              className="input-base" />
            {/* Preview titre suggéré */}
            <AnimatePresence>
              {aiPreview?.type === 'titre' && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden mt-2"
                >
                  <div className="p-3 bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-800 rounded-xl">
                    <p className="text-[10px] font-semibold text-purple-400 uppercase tracking-wider mb-1">✨ Titre suggéré</p>
                    <p className="text-sm font-semibold text-purple-700 dark:text-purple-300 mb-2">{aiPreview.value}</p>
                    <div className="flex gap-2">
                      <button onClick={acceptPreview} className="text-xs font-semibold text-white bg-purple-500 px-3 py-1 rounded-lg hover:bg-purple-600 transition-colors">Utiliser</button>
                      <button onClick={() => setAiPreview(null)} className="text-xs text-purple-400 hover:text-purple-600">Ignorer</button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="mb-3">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1.5">Module</label>
            <select value={module} onChange={e => setModule(e.target.value)} className="input-base">
              {mods.map(m => <option key={m.id} value={m.id}>{m.icon} {m.label}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1.5">Type</label>
            <div className="flex gap-2 flex-wrap">
              {TYPES.map(tp => (
                <motion.button key={tp.id} whileTap={{ scale: .95 }} onClick={() => setType(tp.id)}
                  className="px-3 py-1.5 rounded-xl text-sm transition-all"
                  style={type === tp.id
                    ? { background: tp.bg, borderColor: tp.color, color: tp.color, fontWeight: 600, border: '1.5px solid' }
                    : { borderColor: '#d1d5db', color: '#9ca3af', background: 'transparent', border: '1.5px solid' }
                  }
                >{tp.emoji} {tp.label}</motion.button>
              ))}
            </div>
          </div>
        </div>

        {/* SECTION CONTENU */}
        <div className="mb-6 pb-6 border-b border-gray-100 dark:border-zinc-700">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-4">Contenu</p>

          <div className="mb-3">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1.5">Chemin dans le logiciel</label>
            <input value={path} onChange={e => setPath(e.target.value)}
              placeholder="ex: Stock > Inventaires > Nouvel inventaire"
              className="input-base" />
            <div className="flex items-center gap-1.5 flex-wrap mt-2 min-h-6">
              {pathSteps.length > 0 ? pathSteps.map((s, i) => (
                <span key={i} className="flex items-center gap-1.5">
                  {i > 0 && <span className="text-gray-300 text-xs">›</span>}
                  <span className="text-xs font-medium bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 px-2 py-0.5 rounded-md text-gray-700 dark:text-zinc-300">{s}</span>
                </span>
              )) : <span className="text-xs text-gray-300 italic">Aperçu du chemin...</span>}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-400">Notes</label>
              {content.trim() && (
                <motion.button
                  whileTap={{ scale: .95 }}
                  onClick={handleReformuler}
                  disabled={!!aiLoading}
                  className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1 rounded-lg transition-all disabled:opacity-50"
                  style={{ background: '#f3f0ff', color: '#7c3aed' }}
                >
                  {aiLoading === 'reformuler' ? (
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                      Reformulation...
                    </span>
                  ) : '✨ Reformuler avec IA'}
                </motion.button>
              )}
            </div>

            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[11px]" style={{ color: 'var(--text-3)' }}>
                Markdown: <code style={{ background: 'var(--surface-2)', padding: '1px 4px', borderRadius: 4, fontSize: '10px' }}>## Titre</code>{' '}
                <code style={{ background: 'var(--surface-2)', padding: '1px 4px', borderRadius: 4, fontSize: '10px' }}>**gras**</code>
              </p>
              <button type="button" onClick={() => setShowPreview(p => !p)}
                className="text-[11px] font-medium px-2.5 py-1 rounded-lg flex-shrink-0"
                style={showPreview ? { background: 'var(--accent)', color: '#fff' } : { background: 'var(--surface-2)', color: 'var(--text-2)' }}>
                {showPreview ? '✎ Editer' : '👁 Apercu'}
              </button>
            </div>
            {showPreview ? (
              <div className="prose-fiche p-4 rounded-2xl border min-h-[180px] cursor-pointer"
                style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
                onClick={() => setShowPreview(false)}
                dangerouslySetInnerHTML={{ __html: renderMarkdown(content || '') }}
              />
            ) : (
              <div className="prose-fiche p-3 rounded-xl border min-h-[160px] hidden"
                style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
                dangerouslySetInnerHTML={{ __html: renderMarkdown(content || '') }} />
            ) : (
              <textarea
                value={content} onChange={e => setContent(e.target.value)}
                placeholder={"Tes notes ici...\n\nFormatage : ## Titre  **gras**  - liste  `code`"}
                rows={8}
                className="input-base resize-y leading-relaxed"
              />
            )}
            )}

            {/* Preview reformulation */}
            <AnimatePresence>
              {aiPreview?.type === 'reformuler' && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="mt-3 border border-purple-200 dark:border-purple-800 rounded-2xl overflow-hidden"
                >
                  <div className="bg-purple-50 dark:bg-purple-950 px-4 py-2.5 flex items-center justify-between border-b border-purple-200 dark:border-purple-800">
                    <p className="text-xs font-semibold text-purple-600 dark:text-purple-400">✨ Version reformulée par l'IA</p>
                    <div className="flex gap-2">
                      <button onClick={acceptPreview}
                        className="text-xs font-semibold text-white bg-purple-500 px-3 py-1 rounded-lg hover:bg-purple-600 transition-colors"
                      >Utiliser cette version</button>
                      <button onClick={() => setAiPreview(null)}
                        className="text-xs text-purple-400 hover:text-purple-600 px-2"
                      >Ignorer</button>
                    </div>
                  </div>
                  <div className="p-4 bg-white dark:bg-zinc-900">
                    <pre className="text-sm text-gray-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed font-sans">{aiPreview.value}</pre>
                  </div>
                  {/* Comparaison */}
                  <div className="px-4 py-2 bg-gray-50 dark:bg-zinc-800 border-t border-gray-100 dark:border-zinc-700">
                    <p className="text-[10px] text-gray-400">Original : {aiPreview.original.slice(0, 80)}{aiPreview.original.length > 80 ? '...' : ''}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Erreur IA */}
            <AnimatePresence>
              {aiError && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="mt-2 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-xl flex items-center justify-between"
                >
                  <p className="text-xs text-red-500">{aiError}</p>
                  <button onClick={() => setAiError(null)} className="text-red-400 text-xs ml-2">✕</button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* SECTION ORGANISATION */}
        <div className="mb-6">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-4">Organisation</p>

          {/* Fiches liées */}
          <div className="mb-4">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1.5">Fiches liées</label>
            <div className="border border-gray-200 dark:border-zinc-700 rounded-xl overflow-hidden">
              <input value={linkSearch} onChange={e => setLinkSearch(e.target.value)}
                placeholder="Filtrer les fiches..."
                className="w-full px-3 py-2 text-sm border-b border-gray-100 dark:border-zinc-700 outline-none bg-transparent"
              />
              <div className="max-h-40 overflow-y-auto">
                {filteredNotes.length === 0 ? (
                  <p className="text-xs text-gray-400 p-3">Aucune fiche disponible</p>
                ) : filteredNotes.map(n => (
                  <label key={n.id} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-zinc-700 cursor-pointer">
                    <input type="checkbox" checked={links.includes(n.id)}
                      onChange={e => setLinks(l => e.target.checked ? [...l, n.id] : l.filter(x => x !== n.id))}
                      className="flex-shrink-0" style={{ accentColor: 'var(--accent)' }}
                    />
                    <span className="text-xs text-gray-700 dark:text-zinc-300">{n.title}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Tags avec suggestion IA */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-400">Tags</label>
              {(content.trim() || title.trim()) && (
                <motion.button whileTap={{ scale: .95 }} onClick={handleSuggererTags}
                  disabled={aiLoading === 'tags'}
                  className="flex items-center gap-1 text-[10px] font-medium text-purple-500 hover:text-purple-600 disabled:opacity-50 transition-colors"
                >
                  {aiLoading === 'tags' ? (
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 border border-purple-400 border-t-transparent rounded-full animate-spin inline-block" /> Analyse...</span>
                  ) : '✨ Suggérer des tags'}
                </motion.button>
              )}
            </div>

            {/* Preview tags suggérés */}
            <AnimatePresence>
              {aiPreview?.type === 'tags' && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden mb-2"
                >
                  <div className="p-3 bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-800 rounded-xl">
                    <p className="text-[10px] font-semibold text-purple-400 uppercase tracking-wider mb-2">✨ Tags suggérés</p>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {aiPreview.value.map(t => (
                        <span key={t} className="text-xs px-2.5 py-1 rounded-full font-medium bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300">{t}</span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={acceptPreview} className="text-xs font-semibold text-white bg-purple-500 px-3 py-1 rounded-lg hover:bg-purple-600 transition-colors">Ajouter tous</button>
                      <button onClick={() => setAiPreview(null)} className="text-xs text-purple-400 hover:text-purple-600">Ignorer</button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="relative" ref={tagRef}>
              <div className="flex flex-wrap gap-1.5 p-2 border border-gray-200 dark:border-zinc-700 rounded-xl min-h-10 cursor-text bg-gray-50 dark:bg-zinc-900"
                onClick={() => tagRef.current?.querySelector('input')?.focus()}
              >
                {tags.map((t, i) => <Chip key={i} label={t} onRemove={() => setTags(a => a.filter((_, j) => j !== i))} />)}
                <input value={tagInput}
                  onChange={e => { setTagInput(e.target.value); updateTagSuggestions(e.target.value) }}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(tagInput) }
                    if (e.key === 'Escape') setSuggestions([])
                  }}
                  onBlur={() => setTimeout(() => setSuggestions([]), 150)}
                  placeholder="Ajouter un tag..."
                  className="flex-1 min-w-24 text-sm bg-transparent outline-none text-gray-700 dark:text-zinc-300 placeholder-gray-400"
                />
              </div>
              {suggestions.length > 0 && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                  className="absolute top-full left-0 right-0 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl shadow-lg z-10 overflow-hidden"
                >
                  {suggestions.map(s => (
                    <button key={s} onMouseDown={e => { e.preventDefault(); addTag(s) }}
                      className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300"
                    >{s}</button>
                  ))}
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex items-center gap-3 flex-wrap">
          <motion.button whileTap={{ scale: .96 }} onClick={handleSave} disabled={saving}
            className="px-5 py-2.5 text-white text-sm font-semibold rounded-xl disabled:opacity-60 hover:brightness-90 transition-all"
            style={{ background: accentColor }}
          >
            {saving ? 'Sauvegarde...' : 'Enregistrer'}
          </motion.button>
          <button onClick={() => onCancel(note ? 'fiche' : 'module')}
            className="px-4 py-2.5 text-sm text-gray-400 border border-gray-200 dark:border-zinc-700 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
          >Annuler</button>
          {saving && (
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <div className="w-3 h-3 border-2 border-gray-200 border-t-accent rounded-full animate-spin" style={{ borderTopColor: 'var(--accent)' }} />
              Sauvegarde...
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

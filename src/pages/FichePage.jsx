import { useState } from 'react'
import { motion, AnimatePresence } from '../lib/motion'
import { NavBreadcrumb, BackButton, TypeBadge, ConfirmModal } from '../components/UI'
import { renderMarkdown, relativeDate, getType } from '../lib/utils'
import { exportFichePDF } from '../lib/pdf'
import { MasteryBadge, MasterySelector } from '../components/Mastery'
import CommentsPanel from '../components/CommentsPanel'
import { FocusOverlay } from '../components/UI'
import { useSwipe } from '../hooks/useSwipe'
import { resumerFiche, suggererFichesLiees, genererQuestions } from '../lib/groq'

export default function FichePage({ note, mod, allNotes, onBack, onEdit, onDelete, onFiche, onToast, isPinned, onTogglePin, masteryLevel, onMasteryChange, isAdmin, account, onCopyLink }) {
  const [confirm, setConfirm] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [summary, setSummary] = useState(null)
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [focusMode, setFocusMode] = useState(false)
  const [questions, setQuestions] = useState(null)
  const [questionsLoading, setQuestionsLoading] = useState(false)
  const [currentQ, setCurrentQ] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [suggestedFiches, setSuggestedFiches] = useState(null)
  const [suggestLoading, setSuggestLoading] = useState(false)
  const [questionsRevealed, setQuestionsRevealed] = useState({})

  const handleSuggestFiches = async () => {
    if (suggestedFiches) { setSuggestedFiches(null); return }
    setSuggestLoading(true)
    try {
      const others = (allNotes || []).filter(n => n.id !== note.id)
      const result = await suggererFichesLiees(note.title, note.content, others)
      setSuggestedFiches(result)
    } catch {}
    finally { setSuggestLoading(false) }
  }

  const { onTouchStart, onTouchEnd } = useSwipe({
    onRight: () => onBack('module'),
    threshold: 80,
  })

  if (!note || !mod) return null

  const tp = getType(note.type)
  const pathSteps = note.path ? note.path.split('>').map(s => s.trim()).filter(Boolean) : []
  const linkedNotes = (note.links || []).map(id => allNotes.find(n => n.id === id)).filter(Boolean)

  const handleCopy = () => {
    navigator.clipboard.writeText(note.content || '')
      .then(() => onToast('Contenu copie !'))
      .catch(() => onToast('Impossible de copier'))
  }

  const handleExportPDF = async () => {
    setExporting(true)
    try {
      exportFichePDF(note, mod)
      onToast('PDF exporte !')
    } catch (e) {
      console.error(e)
      onToast('Erreur export PDF')
    } finally { setExporting(false) }
  }

  const handleQuestions = async () => {
    if (questions) { setQuestions(null); setQuestionsRevealed({}); return }
    setQuestionsLoading(true)
    try {
      const result = await genererQuestions(note.content, note.title)
      setQuestions(result)
    } catch {}
    finally { setQuestionsLoading(false) }
  }

  const handleSummary = async () => {
    if (summary) { setSummary(null); return }
    setSummaryLoading(true)
    try {
      const points = await resumerFiche(note.content || '', note.title)
      setSummary(points)
    } catch {
      onToast('Erreur IA - reessaie')
    } finally { setSummaryLoading(false) }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <NavBreadcrumb crumbs={[
        { label: 'Accueil', action: () => onBack('home') },
        { label: mod.label, action: () => onBack('module') },
        { label: note.title },
      ]} />
      <BackButton label={mod.label} onClick={() => onBack('module')} />

      {/* Module */}
      <p className="text-[11px] font-semibold uppercase tracking-widest mb-1.5 flex items-center gap-1.5"
        style={{ color: mod.color }}>
        <span>{mod.icon}</span><span>{mod.label}</span>
      </p>

      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
        <motion.h1 layoutId={"title-" + note.id}
          className="text-2xl font-bold tracking-tight leading-tight flex-1"
          style={{ color: 'var(--text-1)', letterSpacing: '-.04em' }}
        >
          {note.title}
        </motion.h1>
        <motion.div layoutId={"badge-" + note.id}>
          <TypeBadge typeId={note.type} size="lg" />
        </motion.div>
      </div>

      {/* Chemin */}
      {pathSteps.length > 0 && (
        <div className="inline-flex items-center gap-1.5 flex-wrap mb-4 px-3 py-2 rounded-xl border"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          {pathSteps.map((s, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && <span className="text-[10px]" style={{ color: 'var(--text-3)' }}>›</span>}
              <span className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>{s}</span>
            </span>
          ))}
        </div>
      )}

      {/* Resume IA */}
      <AnimatePresence>
        {summary && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-4"
          >
            <div className="rounded-2xl p-4 border" style={{ background: '#faf5ff', borderColor: '#d8b4fe' }}>
              <p className="text-xs font-semibold mb-2" style={{ color: '#7c3aed' }}>✨ Points cles</p>
              <div className="space-y-1.5">
                {summary.map((point, i) => (
                  <motion.div key={i}
                    initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * .1 }}
                    className="flex items-start gap-2"
                  >
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 mt-0.5"
                      style={{ background: '#7c3aed' }}>{i + 1}</span>
                    <p className="text-sm" style={{ color: '#4c1d95' }}>{point}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Questions IA */}
      {questions && (
        <div className="mb-4 rounded-2xl overflow-hidden border" style={{ borderColor: '#7dd3fc' }}>
          <div className="flex items-center justify-between px-4 py-2.5" style={{ background: '#f0f9ff', borderBottom: '1px solid #7dd3fc' }}>
            <span className="text-xs font-semibold" style={{ color: '#0369a1' }}>❓ Question {currentQ + 1}/{questions.length}</span>
            <button onClick={() => setQuestions(null)} className="text-xs" style={{ color: '#0369a1' }}>✕</button>
          </div>
          <div className="p-4" style={{ background: 'var(--surface)' }}>
            <p className="text-sm font-semibold mb-3" style={{ color: 'var(--text-1)' }}>{questions[currentQ]?.q}</p>
            {showAnswer ? (
              <div>
                <p className="text-sm p-3 rounded-xl mb-3" style={{ background: '#f0fdf4', color: '#166534' }}>
                  ✓ {questions[currentQ]?.r}
                </p>
                <div className="flex gap-2">
                  {currentQ < questions.length - 1 ? (
                    <button onClick={() => { setCurrentQ(q => q + 1); setShowAnswer(false) }}
                      className="btn-accent text-xs">Question suivante →</button>
                  ) : (
                    <button onClick={() => { setCurrentQ(0); setShowAnswer(false) }}
                      className="btn-accent text-xs">🔄 Recommencer</button>
                  )}
                </div>
              </div>
            ) : (
              <button onClick={() => setShowAnswer(true)}
                className="text-xs px-4 py-2 rounded-xl font-semibold"
                style={{ background: '#f0f9ff', color: '#0369a1', border: '1px solid #7dd3fc' }}>
                Voir la réponse
              </button>
            )}
          </div>
        </div>
      )}

      {/* Fiches liées suggérées par IA */}
      {suggestedLinks && suggestedLinks.length > 0 && (
        <div className="mb-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-3)' }}>
            🔗 Fiches liees suggérées par l'IA
          </p>
          <div className="flex flex-wrap gap-2">
            {suggestedLinks.map(f => {
              const fm = allNotes ? null : null
              return (
                <button key={f.id} onClick={() => onFiche(f.id)}
                  className="text-xs px-3 py-1.5 rounded-xl border font-medium transition-all"
                  style={{ background: 'var(--surface-2)', borderColor: 'var(--border)', color: 'var(--text-2)' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                >
                  {f.title}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Barre actions */}
      <div className="flex items-center gap-2 flex-wrap mb-4">
        <motion.button whileTap={{ scale: .95 }} onClick={handleSummary} disabled={summaryLoading}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl disabled:opacity-50"
          style={{ background: '#faf5ff', color: '#7c3aed', border: '1px solid #d8b4fe' }}
        >
          {summaryLoading
            ? <><span className="w-3 h-3 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" /> Resume...</>
            : summary ? '✕ Fermer le resume' : '✨ Resumer avec IA'
          }
        </motion.button>
        {onCopyLink && (
          <button onClick={onCopyLink}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl border transition-all"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-2)' }}
          >🔗 Lien</button>
        )}
        {getShareUrl && (
          <button onClick={() => {
            const url = getShareUrl(note.id)
            navigator.clipboard.writeText(url).then(() => onToast('Lien copie !')).catch(() => onToast('Erreur'))
          }}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl border transition-all"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-2)' }}
          >🔗 Copier le lien</button>
        )}
        <button onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl border transition-all"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-2)' }}
        >📋 Copier</button>
        <button onClick={handleExportPDF} disabled={exporting}
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl border transition-all disabled:opacity-50"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-2)' }}
        >{exporting ? 'Export...' : '🖨️ PDF'}</button>
        <button onClick={handleQuestions} disabled={questionsLoading}
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl border transition-all"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-2)' }}
        >
          {questionsLoading ? '⏳' : questions ? '✕ Questions' : '❓ Questions IA'}
        </button>
        <button onClick={handleSuggestLinks} disabled={linksLoading}
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl border transition-all"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-2)' }}
        >
          {linksLoading ? '⏳' : suggestedLinks ? '✕ Suggestions' : '🔗 Fiches liees IA'}
        </button>
        <button onClick={() => setFocusMode(true)}
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl border transition-all"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-2)' }}
        >🎯 Focus</button>
        <button onClick={handleSuggestFiches} disabled={suggestLoading}
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl border transition-all disabled:opacity-50"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-2)' }}
        >{suggestLoading ? '...' : suggestedFiches ? 'X Suggestions' : 'Fiches liees'}</button>
        <button onClick={handleQuestions} disabled={questionsLoading}
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl border transition-all disabled:opacity-50"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-2)' }}
        >{questionsLoading ? '...' : questions ? 'X Questions' : 'Questions'}</button>
        <button onClick={onTogglePin}
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl border transition-all"
          style={isPinned
            ? { background: '#fef3c7', borderColor: '#fbbf24', color: '#92400e' }
            : { background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-2)' }
          }
        >{isPinned ? '📌 Epinglee' : '📍 Epingler'}</button>
      </div>

      {/* Niveau de maitrise */}
      <div className="mb-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-3)' }}>
          Niveau de maitrise
        </p>
        <MasterySelector current={masteryLevel ?? 0} onChange={onMasteryChange} />
      </div>

      {/* Contenu */}
      <div className="card-base p-5 mb-4 prose-fiche text-sm leading-relaxed" style={{ color: 'var(--text-1)' }}>
        <div dangerouslySetInnerHTML={{ __html: renderMarkdown(note.content || '') }} />
      </div>

      {suggestedFiches && suggestedFiches.length > 0 && (
        <div className="mb-4 p-4 rounded-2xl border" style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}>
          <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-3)' }}>Fiches complementaires</p>
          <div className="space-y-2">
            {suggestedFiches.map(f => (
              <motion.button key={f.id} whileHover={{ x: 3 }} whileTap={{ scale: .98 }}
                onClick={() => onFiche(f.id)}
                className="w-full flex items-center gap-3 p-3 rounded-xl text-left"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <span className="text-sm">📄</span>
                <span className="text-sm font-medium truncate" style={{ color: 'var(--text-1)' }}>{f.title}</span>
                <span className="ml-auto text-xs" style={{ color: 'var(--text-3)' }}>›</span>
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {questions && questions.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-semibold mb-3" style={{ color: 'var(--text-3)' }}>Questions de revision</p>
          <div className="space-y-3">
            {questions.map((q, i) => (
              <div key={i} className="card-base p-4">
                <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-1)' }}>{q.q}</p>
                {questionsRevealed[i] ? (
                  <div className="p-3 rounded-xl" style={{ background: '#f0fdf4', borderLeft: '3px solid #22c55e' }}>
                    <p className="text-sm" style={{ color: '#166534' }}>{q.a}</p>
                  </div>
                ) : (
                  <button onClick={() => setQuestionsRevealed(r => ({ ...r, [i]: true }))}
                    className="text-xs px-3 py-1.5 rounded-lg font-medium"
                    style={{ background: 'var(--surface-2)', color: 'var(--text-2)' }}>
                    Voir la reponse
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fiches liees */}
      {linkedNotes.length > 0 && (
        <div className="mb-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-3)' }}>
            Fiches liees
          </p>
          <div className="flex flex-wrap gap-2">
            {linkedNotes.map(ln => (
              <motion.button key={ln.id} whileHover={{ y: -1 }} whileTap={{ scale: .97 }}
                onClick={() => onFiche(ln.id)}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium border transition-all"
                style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-2)' }}
              >{ln.title}</motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Tags */}
      {(note.tags || []).length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {note.tags.map(t => (
            <span key={t} className="text-xs px-2.5 py-1 rounded-full font-medium"
              style={{ background: mod.bg, color: mod.tc }}>{t}</span>
          ))}
        </div>
      )}

      {/* Date */}
      <p className="text-xs mb-5" style={{ color: 'var(--text-3)' }}>
        {note.date ? 'Creee le ' + note.date : ''}
        {note.updatedAt ? ' · modifiee ' + relativeDate(new Date(note.updatedAt).toISOString().slice(0, 10)) : ''}
      </p>

      {/* Actions admin */}
      {isAdmin && (
        <div className="flex gap-3 flex-wrap mb-6">
          <motion.button whileTap={{ scale: .96 }} onClick={onEdit}
            className="px-5 py-2.5 text-white text-sm font-medium rounded-full hover:brightness-90"
            style={{ background: mod.color }}
          >Modifier</motion.button>
          <motion.button whileTap={{ scale: .96 }} onClick={() => setConfirm(true)}
            className="px-5 py-2.5 text-sm font-medium rounded-full border"
            style={{ color: '#ef4444', borderColor: '#fecaca', background: 'transparent' }}
          >Supprimer</motion.button>
        </div>
      )}

      {/* Commentaires */}
      <CommentsPanel
        noteId={note.id}
        account={account}
        isAdmin={isAdmin}
      />

      {/* Mode focus */}
      {focusMode && <FocusOverlay onClose={() => setFocusMode(false)} />}
      {focusMode && (
        <div className="fixed inset-4 z-50 rounded-3xl overflow-auto p-6"
          style={{ background: 'var(--surface)', boxShadow: 'var(--shadow-xl)' }}>
          <button onClick={() => setFocusMode(false)}
            className="absolute top-4 right-4 text-sm px-3 py-1.5 rounded-full"
            style={{ background: 'var(--surface-2)', color: 'var(--text-2)' }}>
            ✕ Quitter le focus
          </button>
          <h2 className="text-xl font-bold mb-4 pr-24" style={{ color: 'var(--text-1)', letterSpacing: '-.03em' }}>{note.title}</h2>
          <div className="prose-fiche" dangerouslySetInnerHTML={{ __html: renderMarkdown(note.content || '') }} />
        </div>
      )}

      {confirm && (
        <ConfirmModal
          title="Supprimer cette fiche ?"
          message={'"' + note.title + '" sera definitivement supprimee.'}
          onConfirm={() => { setConfirm(false); onDelete() }}
          onCancel={() => setConfirm(false)}
        />
      )}
    </motion.div>
  )
}

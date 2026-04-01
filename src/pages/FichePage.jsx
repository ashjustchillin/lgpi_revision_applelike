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
  const [suggestedLinks, setSuggestedLinks] = useState(null)
  const [linksLoading, setLinksLoading] = useState(false)
  const [expandedImage, setExpandedImage] = useState(null)

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

  const handleSuggestLinks = async () => {
    if (suggestedLinks) { setSuggestedLinks(null); return }
    setLinksLoading(true)
    try {
      const others = (allNotes || []).filter(n => n.id !== note.id)
      const result = await suggererFichesLiees(note.title, note.content, others)
      setSuggestedLinks(result)
    } catch {}
    finally { setLinksLoading(false) }
  }

  const { onTouchStart, onTouchEnd } = useSwipe({ onRight: () => onBack('module'), threshold: 80 })

  if (!note || !mod) return null

  const tp = getType(note.type)
  const pathSteps = note.path ? note.path.split('>').map(s => s.trim()).filter(Boolean) : []
  const linkedNotes = (note.links || []).map(id => allNotes.find(n => n.id === id)).filter(Boolean)

  const handleCopy = () => {
    navigator.clipboard.writeText(note.content || '').then(() => onToast('Contenu copie !')).catch(() => onToast('Impossible de copier'))
  }

  const handleExportPDF = async () => {
    setExporting(true)
    try { exportFichePDF(note, mod); onToast('PDF exporte !') }
    catch (e) { console.error(e); onToast('Erreur export PDF') }
    finally { setExporting(false) }
  }

  const handleQuestions = async () => {
    if (questions) { setQuestions(null); setQuestionsRevealed({}); return }
    setQuestionsLoading(true)
    try { const result = await genererQuestions(note.content, note.title); setQuestions(result) }
    catch {} finally { setQuestionsLoading(false) }
  }

  const handleSummary = async () => {
    if (summary) { setSummary(null); return }
    setSummaryLoading(true)
    try { const points = await resumerFiche(note.content || '', note.title); setSummary(points) }
    catch { onToast('Erreur IA - reessaie') }
    finally { setSummaryLoading(false) }
  }

  // Style commun pour les boutons de la grille (Apple Pill style)
  const ActionButton = ({ onClick, disabled, children, variant = 'default', isLoading = false }) => {
    const baseStyle = "flex items-center justify-center gap-2 text-xs font-medium px-4 py-3 rounded-2xl transition-all active:scale-95 select-none"
    const variants = {
      default: "bg-[var(--surface)] border border-[var(--border)] text-[var(--text-1)] hover:bg-[var(--surface-2)]",
      primary: "bg-[var(--accent)] text-white shadow-md shadow-[var(--accent)]/20 hover:opacity-90",
      ghost: "bg-transparent text-[var(--text-2)] hover:bg-[var(--surface-2)]",
      accentPurple: "bg-[#faf5ff] border border-[#d8b4fe] text-[#7c3aed] hover:bg-[#f3e8ff]",
      accentBlue: "bg-[#f0f9ff] border border-[#7dd3fc] text-[#0369a1] hover:bg-[#e0f2fe]",
      accentYellow: "bg-[#fef3c7] border border-[#fbbf24] text-[#92400e] hover:bg-[#fde68a]"
    }
    
    return (
      <motion.button 
        whileTap={{ scale: 0.96 }}
        onClick={onClick} 
        disabled={disabled || isLoading}
        className={`${baseStyle} ${variants[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {isLoading ? <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" /> : children}
      </motion.button>
    )
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 8 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      onTouchStart={onTouchStart} 
      onTouchEnd={onTouchEnd}
      className="pb-20" // Padding en bas pour ne pas être caché par la nav bar
    >
      {/* En-tête minimaliste */}
      <div className="flex items-center justify-between mb-4">
        <BackButton label={mod.label} onClick={() => onBack('module')} />
        <motion.div layoutId={"badge-" + note.id}>
          <TypeBadge typeId={note.type} size="lg" />
        </motion.div>
      </div>

      <p className="text-[11px] font-bold uppercase tracking-widest mb-3 flex items-center gap-2" style={{ color: mod.color }}>
        <span>{mod.icon}</span><span>{mod.label}</span>
      </p>

      <div className="flex items-start justify-between gap-4 mb-6">
        <motion.h1 
          layoutId={"title-" + note.id} 
          className="text-3xl font-bold tracking-tight leading-[1.1] text-[var(--text-1)] flex-1" 
          style={{ letterSpacing: '-0.03em' }}
        >
          {note.title}
        </motion.h1>
        <button onClick={onTogglePin} className="p-2 -mr-2 rounded-full hover:bg-[var(--surface-2)] transition-colors">
          {isPinned ? '📌' : '📍'}
        </button>
      </div>

      {pathSteps.length > 0 && (
        <div className="inline-flex items-center gap-2 flex-wrap mb-6 px-4 py-2 rounded-full border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          {pathSteps.map((s, i) => (
            <span key={i} className="flex items-center gap-2">
              {i > 0 && <span className="text-[10px] opacity-50">/</span>}
              <span className="text-xs font-medium text-[var(--text-2)]">{s}</span>
            </span>
          ))}
        </div>
      )}

      {/* --- GRILLE D'ACTIONS (Style iOS Control Center) --- */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        {/* Actions IA mises en avant */}
        <ActionButton onClick={handleSummary} isLoading={summaryLoading} variant="accentPurple">
          {summary ? '✕ Masquer' : '✨ Résumer'}
        </ActionButton>
        <ActionButton onClick={handleQuestions} isLoading={questionsLoading} variant="accentBlue">
          {questions ? '✕ Quiz' : '❓ Quiz IA'}
        </ActionButton>
        <ActionButton onClick={handleSuggestLinks} isLoading={linksLoading} variant="default">
          {suggestedLinks ? '✕ Liens' : '🔗 Fiches liées'}
        </ActionButton>
        <ActionButton onClick={() => setFocusMode(true)} variant="default">
          🎯 Focus
        </ActionButton>
        
        {/* Actions Utilitaires */}
        {onCopyLink && (
          <ActionButton onClick={onCopyLink} variant="ghost">
            🔗 Lien
          </ActionButton>
        )}
        <ActionButton onClick={handleCopy} variant="ghost">
          📋 Copier
        </ActionButton>
        <ActionButton onClick={handleExportPDF} isLoading={exporting} variant="ghost" className="col-span-2 sm:col-span-1">
          {exporting ? 'Export...' : '🖨️ Exporter PDF'}
        </ActionButton>
      </div>

      {/* Niveau de maitrise */}
      <div className="mb-8 p-4 rounded-2xl border" style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}>
        <div className="flex justify-between items-center mb-3">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-3)]">Maîtrise</p>
          {masteryLevel > 0 && <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--accent)] text-white">Niveau {masteryLevel}</span>}
        </div>
        <MasterySelector current={masteryLevel ?? 0} onChange={onMasteryChange} />
      </div>

      {/* Contenu Principal */}
      <div className="card-base p-6 sm:p-8 rounded-3xl mb-6 shadow-sm prose-fiche text-[15px] leading-relaxed" style={{ color: 'var(--text-1)', background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div dangerouslySetInnerHTML={{ __html: renderMarkdown(note.content || '') }} />
      </div>

      {/* ── IMAGES DE LA FICHE ── */}
      {(note.images || []).length > 0 && (
        <div className="mb-6 pt-2">
          <p className="text-xs font-bold uppercase tracking-widest mb-3 text-[var(--text-3)]">Galerie</p>
          <div className="grid grid-cols-2 gap-3">
            {note.images.map((img, idx) => (
              <div key={idx} onClick={() => setExpandedImage(img)}
                className="rounded-2xl overflow-hidden border aspect-video cursor-pointer group"
                style={{ borderColor: 'var(--border)' }}>
                <img src={img.url} alt={img.name || 'Capture'} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sections IA (Résumé) */}
      <AnimatePresence>
        {summary && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-6">
            <div className="rounded-3xl p-5 border" style={{ background: 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)', borderColor: '#d8b4fe' }}>
              <p className="text-xs font-bold mb-3 flex items-center gap-2" style={{ color: '#7c3aed' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-[#7c3aed] animate-pulse"></span>
                Points clés générés par l'IA
              </p>
              <div className="space-y-2">
                {(Array.isArray(summary) ? summary : [summary]).map((pt, i) => (
                  <p key={i} className="text-sm leading-relaxed" style={{ color: '#581c87' }}>• {pt}</p>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quiz IA (Overlay style) */}
      {questions && questions.length > 0 && questions[0]?.r && (
        <div className="mb-6 p-5 rounded-3xl border shadow-sm" style={{ background: '#f0f9ff', borderColor: '#7dd3fc' }}>
          <div className="flex justify-between items-center mb-4">
            <p className="text-xs font-bold" style={{ color: '#0369a1' }}>MODE QUIZ</p>
            <span className="text-xs font-mono bg-white/50 px-2 py-1 rounded-md">{currentQ + 1}/{questions.length}</span>
          </div>
          <p className="text-base font-medium mb-4 leading-snug" style={{ color: 'var(--text-1)' }}>{questions[currentQ]?.q}</p>
          <div className="min-h-[60px]">
            {showAnswer ? (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <div className="p-4 rounded-2xl mb-4 shadow-sm" style={{ background: '#f0fdf4', border: '1px solid #86efac' }}>
                  <p className="text-sm font-medium" style={{ color: '#166534' }}>{questions[currentQ]?.r}</p>
                </div>
                <div className="flex gap-2">
                  {currentQ < questions.length - 1
                    ? <ActionButton onClick={() => { setCurrentQ(q => q + 1); setShowAnswer(false) }} variant="primary">Suivant →</ActionButton>
                    : <ActionButton onClick={() => { setCurrentQ(0); setShowAnswer(false) }} variant="default">🔄 Recommencer</ActionButton>}
                </div>
              </motion.div>
            ) : (
              <ActionButton onClick={() => setShowAnswer(true)} variant="primary" className="w-full">
                Voir la réponse
              </ActionButton>
            )}
          </div>
        </div>
      )}

      {/* Fiches liées suggérées */}
      {suggestedLinks && suggestedLinks.length > 0 && (
        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-widest mb-3 text-[var(--text-3)]">Suggestions de l'IA</p>
          <div className="flex flex-wrap gap-2">
            {suggestedLinks.map(f => (
              <button key={f.id} onClick={() => onFiche(f.id)} className="text-xs px-4 py-2 rounded-2xl border font-medium transition-all hover:border-[var(--accent)]"
                style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-1)' }}>{f.title}</button>
            ))}
          </div>
        </div>
      )}

      {/* Fiches complémentaires (Full list) */}
      {suggestedFiches && suggestedFiches.length > 0 && (
        <div className="mb-6 p-4 rounded-3xl border" style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}>
          <p className="text-xs font-bold mb-3 text-[var(--text-3)]">À voir aussi</p>
          <div className="space-y-2">
            {suggestedFiches.map(f => (
              <motion.button key={f.id} whileHover={{ x: 4 }} whileTap={{ scale: 0.98 }} onClick={() => onFiche(f.id)}
                className="w-full flex items-center gap-3 p-3 rounded-2xl text-left transition-colors hover:bg-[var(--surface)]"
                style={{ color: 'var(--text-1)' }}>
                <span className="text-lg opacity-50">📄</span>
                <span className="text-sm font-medium truncate flex-1">{f.title}</span>
                <span className="text-xs opacity-30">→</span>
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Fiches liees manuelles */}
      {linkedNotes.length > 0 && (
        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-widest mb-3 text-[var(--text-3)]">Liens directs</p>
          <div className="flex flex-wrap gap-2">
            {linkedNotes.map(ln => (
              <motion.button key={ln.id} whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} onClick={() => onFiche(ln.id)}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border transition-all shadow-sm"
                style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-1)' }}>{ln.title}</motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Tags */}
      {(note.tags || []).length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {note.tags.map(t => (<span key={t} className="text-xs px-3 py-1 rounded-full font-medium" style={{ background: mod.bg || 'var(--surface-2)', color: mod.tc || 'var(--text-2)' }}>#{t}</span>))}
        </div>
      )}

      <p className="text-[11px] font-medium mb-8 flex items-center gap-2" style={{ color: 'var(--text-3)' }}>
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-3)]"></span>
        {note.date ? 'Créée le ' + note.date : ''}
        {note.updatedAt ? ' · modifiée ' + relativeDate(new Date(note.updatedAt).toISOString().slice(0, 10)) : ''}
      </p>

      {isAdmin && (
        <div className="flex gap-3 mb-8 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
          <motion.button whileTap={{ scale: 0.96 }} onClick={onEdit} className="flex-1 py-3 text-white text-sm font-bold rounded-full hover:brightness-110 transition-all shadow-lg shadow-[var(--accent)]/20" style={{ background: mod.color }}>Modifier la fiche</motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => setConfirm(true)} className="px-5 py-3 text-sm font-bold rounded-full border transition-all hover:bg-red-50" style={{ color: '#ef4444', borderColor: '#fecaca' }}>Supprimer</motion.button>
        </div>
      )}

      <CommentsPanel noteId={note.id} account={account} isAdmin={isAdmin} />

      {/* Lightbox pour images */}
      <AnimatePresence>
        {expandedImage && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-8 cursor-zoom-out"
            style={{ background: 'rgba(0,0,0,.85)', backdropFilter: 'blur(12px)' }}
            onClick={() => setExpandedImage(null)}>
            <motion.img initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              src={expandedImage.url} alt={expandedImage.name}
              className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl object-contain"
              onClick={e => e.stopPropagation()} />
            <button onClick={() => setExpandedImage(null)}
              className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md text-white flex items-center justify-center text-xl hover:bg-white/20 transition-all border border-white/10">✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      {focusMode && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
          className="fixed inset-0 z-[100] bg-[var(--surface)] overflow-y-auto">
          <div className="max-w-2xl mx-auto p-6 sm:p-12 min-h-screen flex flex-col">
            <div className="sticky top-0 bg-[var(--surface)] z-10 py-4 mb-8 border-b flex justify-between items-center" style={{ borderColor: 'var(--border)' }}>
              <span className="text-xs font-bold uppercase tracking-widest text-[var(--text-3)]">Mode Focus</span>
              <button onClick={() => setFocusMode(false)} className="px-4 py-2 rounded-full bg-[var(--surface-2)] text-sm font-medium">Quitter</button>
            </div>
            <h1 className="text-3xl font-bold mb-8" style={{ color: 'var(--text-1)', letterSpacing: '-0.03em' }}>{note.title}</h1>
            <div className="prose-fiche text-lg leading-loose flex-1" style={{ color: 'var(--text-1)' }} dangerouslySetInnerHTML={{ __html: renderMarkdown(note.content || '') }} />
            <div className="h-20"></div>
          </div>
        </motion.div>
      )}

      {confirm && (
        <ConfirmModal title="Supprimer cette fiche ?" message={'"' + note.title + '" sera définitivement supprimée.'}
          onConfirm={() => { setConfirm(false); onDelete() }} onCancel={() => setConfirm(false)} />
      )}
    </motion.div>
  )
}
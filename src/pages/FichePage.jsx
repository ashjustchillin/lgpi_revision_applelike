import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { NavBreadcrumb, BackButton, TypeBadge, ConfirmModal } from '../components/UI'
import { renderMarkdown, relativeDate, getType } from '../lib/utils'
import { exportFichePDF } from '../lib/exportPDF'
import { MasteryBadge, MasterySelector } from '../components/Mastery'
import CommentsPanel from '../components/CommentsPanel'
import { resumerFiche } from '../lib/groq'

export default function FichePage({ note, mod, allNotes, onBack, onEdit, onDelete, onFiche, onToast, isPinned, onTogglePin, masteryLevel, onMasteryChange, isAdmin, account }) {
  const [confirm, setConfirm] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [summary, setSummary] = useState(null)
  const [summaryLoading, setSummaryLoading] = useState(false)

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
      await exportFichePDF(note, mod, tp)
      onToast('PDF exporte !')
    } catch (e) {
      console.error(e)
      onToast('Erreur export PDF')
    } finally { setExporting(false) }
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
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
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
        <button onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl border transition-all"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-2)' }}
        >📋 Copier</button>
        <button onClick={handleExportPDF} disabled={exporting}
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl border transition-all disabled:opacity-50"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-2)' }}
        >{exporting ? 'Export...' : '🖨️ PDF'}</button>
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

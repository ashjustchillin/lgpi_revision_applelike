import { useState } from 'react'
import { motion } from 'framer-motion'
import { NavBreadcrumb, BackButton, TypeBadge, ConfirmModal } from '../components/UI'
import { renderMarkdown, relativeDate, getType } from '../lib/utils'
import { exportFichePDF } from '../lib/exportPDF'
import { MasteryBadge, MasterySelector } from '../components/Mastery'

export default function FichePage({ note, mod, allNotes, onBack, onEdit, onDelete, onFiche, onToast, isPinned, onTogglePin, masteryLevel, onMasteryChange, isAdmin }) {
  const [confirm, setConfirm] = useState(false)
  const [exporting, setExporting] = useState(false)

  if (!note || !mod) return null

  const tp = getType(note.type)
  const pathSteps = note.path ? note.path.split('>').map(s => s.trim()).filter(Boolean) : []
  const linkedNotes = (note.links || []).map(id => allNotes.find(n => n.id === id)).filter(Boolean)

  const handleCopy = () => {
    navigator.clipboard.writeText(note.content || '')
      .then(() => onToast('Contenu copié ! 📋'))
      .catch(() => onToast('Impossible de copier'))
  }

  const handleExportPDF = async () => {
    setExporting(true)
    try {
      await exportFichePDF(note, mod, tp)
      onToast('PDF exporté ! 🖨️')
    } catch (e) {
      console.error(e)
      onToast('Erreur lors de l\'export')
    } finally {
      setExporting(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
      <NavBreadcrumb crumbs={[
        { label: 'Accueil', action: () => onBack('home') },
        { label: mod.label, action: () => onBack('module') },
        { label: note.title },
      ]} />
      <BackButton label={mod.label} onClick={() => onBack('module')} />

      {/* Module label */}
      <p className="text-[11px] font-semibold uppercase tracking-widest mb-1.5 flex items-center gap-1.5" style={{ color: mod.color }}>
        <span>{mod.icon}</span><span>{mod.label}</span>
      </p>

      {/* Header avec layoutId pour transition cinématique */}
      <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
        <motion.h1
          layoutId={`title-${note.id}`}
          className="text-2xl font-semibold tracking-tight leading-tight flex-1 text-gray-900 dark:text-zinc-100"
        >
          {note.title}
        </motion.h1>
        <motion.div layoutId={`badge-${note.id}`}>
          <TypeBadge typeId={note.type} size="lg" />
        </motion.div>
      </div>

      {/* Chemin breadcrumb */}
      {pathSteps.length > 0 && (
        <motion.div
          initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }}
          className="inline-flex items-center gap-1.5 flex-wrap mb-4 px-3 py-2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl"
        >
          {pathSteps.map((s, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && <span className="text-gray-300 dark:text-zinc-600 text-xs">›</span>}
              <span className="text-sm font-medium text-gray-700 dark:text-zinc-300">{s}</span>
            </span>
          ))}
        </motion.div>
      )}

      {/* Niveau de maîtrise */}
      <div className="mb-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-2">Niveau de maîtrise</p>
        <MasterySelector current={masteryLevel ?? 0} onChange={onMasteryChange} />
      </div>

      {/* Barre d'actions */}
      <div className="flex items-center gap-2 flex-wrap mb-4">
        <button onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-accent border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-1.5 transition-all hover:border-accent bg-white dark:bg-zinc-800"
        >
          📋 Copier
        </button>
        <button
          onClick={handleExportPDF}
          disabled={exporting}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-accent border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-1.5 transition-all hover:border-accent bg-white dark:bg-zinc-800 disabled:opacity-50"
        >
          {exporting ? '⏳ Export...' : '🖨️ Exporter PDF'}
        </button>
        <button
          onClick={onTogglePin}
          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border transition-all ${
            isPinned
              ? 'border-amber-300 bg-amber-50 text-amber-600 dark:bg-amber-950 dark:border-amber-700'
              : 'border-gray-200 dark:border-zinc-700 text-gray-400 hover:border-accent hover:text-accent bg-white dark:bg-zinc-800'
          }`}
        >
          {isPinned ? '📌 Épinglée' : '📍 Épingler'}
        </button>
      </div>

      {/* Corps de la fiche */}
      <div className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-2xl p-5 mb-4 prose-fiche text-sm text-gray-700 dark:text-zinc-300 leading-relaxed">
        <div dangerouslySetInnerHTML={{ __html: renderMarkdown(note.content || '') }} />
      </div>

      {/* Fiches liées */}
      {linkedNotes.length > 0 && (
        <div className="mb-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-2">🔗 Fiches liées</p>
          <div className="flex flex-wrap gap-2">
            {linkedNotes.map(ln => (
              <motion.button
                key={ln.id}
                whileHover={{ y: -1 }} whileTap={{ scale: .97 }}
                onClick={() => onFiche(ln.id)}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm font-medium text-gray-600 dark:text-zinc-400 hover:border-accent hover:text-accent transition-all"
              >
                {ln.title}
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Tags */}
      {(note.tags || []).length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {note.tags.map(t => (
            <span key={t} className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: mod.bg, color: mod.tc }}>{t}</span>
          ))}
        </div>
      )}

      {/* Date */}
      <p className="text-xs text-gray-400 mb-5">
        {note.date ? `Créée le ${note.date}` : ''}
        {note.updatedAt ? ` · modifiée ${relativeDate(new Date(note.updatedAt).toISOString().slice(0, 10))}` : ''}
      </p>

      {/* Actions modifier/supprimer — admin seulement */}
      {isAdmin && (
      <div className="flex gap-3 flex-wrap">
        <motion.button whileTap={{ scale: .96 }} onClick={onEdit}
          className="px-5 py-2.5 text-white text-sm font-medium rounded-xl hover:brightness-90 transition-all"
          style={{ background: mod.color }}
        >Modifier</motion.button>
        <motion.button whileTap={{ scale: .96 }} onClick={() => setConfirm(true)}
          className="px-5 py-2.5 bg-transparent text-red-500 border border-red-100 dark:border-red-900 text-sm font-medium rounded-xl hover:bg-red-50 dark:hover:bg-red-950 transition-all"
        >Supprimer</motion.button>
      </div>
      )}

      {confirm && (
        <ConfirmModal
          title="Supprimer cette fiche ?"
          message={`"${note.title}" sera définitivement supprimée.`}
          onConfirm={() => { setConfirm(false); onDelete() }}
          onCancel={() => setConfirm(false)}
        />
      )}
    </motion.div>
  )
}

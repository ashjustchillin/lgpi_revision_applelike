import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { parseZendeskCSV } from '../lib/dataIO'
import { zendeckTicketToFiche } from '../lib/groq'

const STEPS = ['upload', 'preview', 'converting', 'done']

export default function ZendeskImport({ mods, onImportFiches, onClose }) {
  const [step, setStep] = useState('upload')
  const [tickets, setTickets] = useState([])
  const [selected, setSelected] = useState([])
  const [results, setResults] = useState([])
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState(null)
  const fileRef = useRef(null)

  const handleFile = async e => {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    try {
      const text = await file.text()
      const parsed = parseZendeskCSV(text)
      if (!parsed.length) throw new Error('Aucun ticket trouvé dans ce fichier')
      setTickets(parsed)
      setSelected(parsed.map(t => t.id)) // Tout sélectionner par défaut
      setStep('preview')
    } catch (err) {
      setError(err.message)
    }
    e.target.value = ''
  }

  const toggleSelect = id => {
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])
  }

  const toggleAll = () => {
    setSelected(s => s.length === tickets.length ? [] : tickets.map(t => t.id))
  }

  const handleConvert = async () => {
    const toConvert = tickets.filter(t => selected.includes(t.id))
    if (!toConvert.length) return
    setStep('converting')
    setProgress(0)
    const converted = []
    for (let i = 0; i < toConvert.length; i++) {
      try {
        const fiche = await zendeckTicketToFiche(toConvert[i], mods)
        converted.push({ ticket: toConvert[i], fiche, ok: true })
      } catch (e) {
        converted.push({ ticket: toConvert[i], error: e.message, ok: false })
      }
      setProgress(Math.round(((i + 1) / toConvert.length) * 100))
      // Petite pause pour éviter le rate limiting
      if (i < toConvert.length - 1) await new Promise(r => setTimeout(r, 500))
    }
    setResults(converted)
    setStep('done')
  }

  const handleImport = async () => {
    const fiches = results.filter(r => r.ok).map(r => r.fiche)
    await onImportFiches(fiches)
    onClose()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,.5)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: .96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: .96 }}
        className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-zinc-800">
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-zinc-100">Import Zendesk</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {step === 'upload' && 'Charge ton export CSV Zendesk'}
              {step === 'preview' && `${tickets.length} tickets trouvés — sélectionne ceux à convertir`}
              {step === 'converting' && 'Conversion en cours avec l\'IA...'}
              {step === 'done' && `${results.filter(r => r.ok).length} fiches prêtes à importer`}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
        </div>

        {/* Barre de progression des étapes */}
        <div className="flex px-6 py-3 gap-2 border-b border-gray-50 dark:border-zinc-800">
          {[
            { key: 'upload', label: '1. Upload' },
            { key: 'preview', label: '2. Sélection' },
            { key: 'converting', label: '3. Conversion IA' },
            { key: 'done', label: '4. Import' },
          ].map((s, i) => {
            const stepIdx = STEPS.indexOf(step)
            const sIdx = STEPS.indexOf(s.key)
            return (
              <div key={s.key} className="flex items-center gap-1.5 flex-1">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 transition-all ${
                  sIdx < stepIdx ? 'bg-green-500 text-white' :
                  sIdx === stepIdx ? 'bg-accent text-white' :
                  'bg-gray-100 dark:bg-zinc-800 text-gray-400'
                }`} style={sIdx === stepIdx ? { background: 'var(--accent)' } : {}}>
                  {sIdx < stepIdx ? '✓' : i + 1}
                </div>
                <span className={`text-[10px] font-medium ${sIdx === stepIdx ? 'text-accent' : 'text-gray-400'}`}
                  style={sIdx === stepIdx ? { color: 'var(--accent)' } : {}}>
                  {s.label}
                </span>
              </div>
            )
          })}
        </div>

        {/* Contenu */}
        <div className="flex-1 overflow-y-auto p-6">

          {/* STEP 1 — Upload */}
          {step === 'upload' && (
            <div className="space-y-4">
              <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} className="hidden" />
              <motion.button
                whileTap={{ scale: .97 }}
                onClick={() => fileRef.current?.click()}
                className="w-full border-2 border-dashed border-gray-200 dark:border-zinc-700 rounded-2xl p-8 flex flex-col items-center gap-3 hover:border-accent transition-colors group"
              >
                <span className="text-4xl">📊</span>
                <div className="text-center">
                  <p className="text-sm font-semibold text-gray-700 dark:text-zinc-300 group-hover:text-accent transition-colors">
                    Glisse ton export Zendesk ici
                  </p>
                  <p className="text-xs text-gray-400 mt-1">ou clique pour choisir un fichier CSV</p>
                </div>
              </motion.button>

              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-500">
                  ✗ {error}
                </div>
              )}

              {/* Instructions */}
              <div className="bg-gray-50 dark:bg-zinc-800 rounded-2xl p-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Comment exporter depuis Zendesk ?
                </p>
                <ol className="text-xs text-gray-500 space-y-1 list-decimal list-inside">
                  <li>Zendesk Admin → Rapports → Exporter</li>
                  <li>Choisir le format CSV</li>
                  <li>Inclure : Sujet, Description, Commentaires, Tags</li>
                  <li>Télécharger et importer ici</li>
                </ol>
                <p className="text-xs text-gray-400 mt-3 italic">
                  💡 Le format exact sera détecté automatiquement — reviens demain avec ton export !
                </p>
              </div>
            </div>
          )}

          {/* STEP 2 — Preview tickets */}
          {step === 'preview' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-400">{selected.length} / {tickets.length} sélectionnés</p>
                <button onClick={toggleAll} className="text-xs text-accent hover:underline">
                  {selected.length === tickets.length ? 'Tout désélectionner' : 'Tout sélectionner'}
                </button>
              </div>
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {tickets.map(t => (
                  <motion.div
                    key={t.id}
                    whileTap={{ scale: .99 }}
                    onClick={() => toggleSelect(t.id)}
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      selected.includes(t.id)
                        ? 'border-accent bg-accent-soft'
                        : 'border-gray-200 dark:border-zinc-700 hover:border-gray-300'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded flex-shrink-0 mt-0.5 border-2 flex items-center justify-center transition-all ${
                      selected.includes(t.id) ? 'border-accent bg-accent' : 'border-gray-300 dark:border-zinc-600'
                    }`} style={selected.includes(t.id) ? { borderColor: 'var(--accent)', background: 'var(--accent)' } : {}}>
                      {selected.includes(t.id) && <span className="text-white text-[8px]">✓</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-800 dark:text-zinc-200 truncate">{t.subject}</p>
                      {t.description && (
                        <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-1">{t.description}</p>
                      )}
                      {t.tags && (
                        <p className="text-[10px] text-gray-300 dark:text-zinc-600 mt-0.5">🏷️ {t.tags}</p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3 — Conversion en cours */}
          {step === 'converting' && (
            <div className="flex flex-col items-center justify-center py-8 gap-4">
              <div className="relative w-20 h-20">
                <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="34" fill="none" stroke="#e5e7eb" strokeWidth="6" />
                  <circle cx="40" cy="40" r="34" fill="none" strokeWidth="6"
                    stroke="var(--accent)"
                    strokeDasharray={`${2 * Math.PI * 34}`}
                    strokeDashoffset={`${2 * Math.PI * 34 * (1 - progress / 100)}`}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset .5s ease' }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold text-accent" style={{ color: 'var(--accent)' }}>{progress}%</span>
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-800 dark:text-zinc-200">Conversion par l'IA en cours</p>
                <p className="text-xs text-gray-400 mt-1">
                  {Math.round(progress * selected.length / 100)} / {selected.length} tickets convertis
                </p>
              </div>
              <div className="w-full bg-gray-100 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                <motion.div className="h-full rounded-full" style={{ background: 'var(--accent)' }}
                  animate={{ width: `${progress}%` }} transition={{ duration: .5 }} />
              </div>
              <p className="text-xs text-gray-400 italic text-center">
                ✨ L'IA analyse chaque ticket et crée une fiche structurée
              </p>
            </div>
          )}

          {/* STEP 4 — Résultats */}
          {step === 'done' && (
            <div className="space-y-3">
              {/* Résumé */}
              <div className="flex gap-3">
                <div className="flex-1 bg-green-50 dark:bg-green-950 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-green-600">{results.filter(r => r.ok).length}</p>
                  <p className="text-xs text-green-600">converties ✓</p>
                </div>
                {results.filter(r => !r.ok).length > 0 && (
                  <div className="flex-1 bg-red-50 dark:bg-red-950 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-red-500">{results.filter(r => !r.ok).length}</p>
                    <p className="text-xs text-red-500">erreurs ✗</p>
                  </div>
                )}
              </div>

              {/* Aperçu des fiches */}
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {results.map((r, i) => (
                  <div key={i} className={`p-3 rounded-xl border text-xs ${
                    r.ok
                      ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950'
                      : 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950'
                  }`}>
                    {r.ok ? (
                      <div>
                        <p className="font-semibold text-gray-800 dark:text-zinc-200">{r.fiche.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-gray-400">{r.fiche.module}</span>
                          <span className="text-gray-300">·</span>
                          <span className="text-green-600">{r.fiche.type}</span>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <p className="font-semibold text-red-600 truncate">{r.ticket.subject}</p>
                        <p className="text-red-400 mt-0.5">{r.error}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer avec actions */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-zinc-800 flex gap-3">
          {step === 'preview' && (
            <>
              <motion.button whileTap={{ scale: .96 }} onClick={handleConvert}
                disabled={!selected.length}
                className="flex-1 py-2.5 text-white text-sm font-semibold rounded-xl disabled:opacity-40 hover:brightness-90 transition-all"
                style={{ background: 'var(--accent)' }}
              >
                ✨ Convertir {selected.length} ticket{selected.length > 1 ? 's' : ''} avec IA
              </motion.button>
              <button onClick={() => setStep('upload')} className="px-4 text-sm text-gray-400 border border-gray-200 dark:border-zinc-700 rounded-xl">
                Retour
              </button>
            </>
          )}
          {step === 'done' && results.filter(r => r.ok).length > 0 && (
            <>
              <motion.button whileTap={{ scale: .96 }} onClick={handleImport}
                className="flex-1 py-2.5 text-white text-sm font-semibold rounded-xl hover:brightness-90 transition-all"
                style={{ background: 'var(--accent)' }}
              >
                ⬆️ Importer {results.filter(r => r.ok).length} fiches
              </motion.button>
              <button onClick={onClose} className="px-4 text-sm text-gray-400 border border-gray-200 dark:border-zinc-700 rounded-xl">
                Annuler
              </button>
            </>
          )}
          {step === 'upload' && (
            <button onClick={onClose} className="w-full py-2.5 text-sm text-gray-400 border border-gray-200 dark:border-zinc-700 rounded-xl">
              Fermer
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

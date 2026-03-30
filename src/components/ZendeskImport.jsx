import { useState, useRef } from 'react'
import { motion, AnimatePresence } from '../lib/motion'
import { parseZendeskCSV } from '../lib/dataIO'
import { zendeckTicketToFiche } from '../lib/groq'

const STEPS = ['upload', 'enrich', 'converting', 'done']

// Bookmarklet code - extrait le contenu d'un ticket Zendesk
const BOOKMARKLET_CODE = `javascript:(function(){
  var title = document.querySelector('[data-test-id="ticket-subject"] input, .ticket-title-input input, h1.ticket-title, [aria-label="Titre du ticket"] input');
  var subjectVal = title ? title.value || title.innerText || title.textContent : '';
  if(!subjectVal){ var h = document.querySelector('.subjectValue, .ticket-subject'); subjectVal = h ? h.innerText : ''; }
  var msgs = [];
  document.querySelectorAll('.comment-body, .zd-comment, [data-comment-id] .value, .rich_text').forEach(function(el){
    var t = el.innerText || el.textContent;
    if(t && t.trim().length > 10) msgs.push(t.trim());
  });
  if(!msgs.length){ document.querySelectorAll('article .zd-comment-body, .message-body, .event-body').forEach(function(el){ var t=el.innerText; if(t&&t.trim().length>5) msgs.push(t.trim()); }); }
  var result = 'SUJET: ' + subjectVal + '\\n\\n' + msgs.join('\\n\\n---\\n\\n');
  var ta = document.createElement('textarea');
  ta.style.cssText='position:fixed;top:10px;left:10px;width:90vw;height:70vh;z-index:99999;font-size:13px;padding:12px;border-radius:8px;border:2px solid #6C63FF;box-shadow:0 8px 32px rgba(0,0,0,.3);background:white;color:#333;';
  ta.value = result;
  ta.readOnly = true;
  document.body.appendChild(ta);
  ta.select();
  try{ document.execCommand('copy'); } catch(e){}
  var btn = document.createElement('button');
  btn.innerText = '✕ Fermer';
  btn.style.cssText='position:fixed;top:12px;right:12px;z-index:100000;background:#6C63FF;color:white;border:none;padding:8px 16px;border-radius:8px;cursor:pointer;font-size:13px;';
  btn.onclick=function(){ document.body.removeChild(ta); document.body.removeChild(btn); };
  document.body.appendChild(btn);
  var note = document.createElement('div');
  note.innerText = '✓ Contenu copié ! Colle-le dans LGPI Notes.';
  note.style.cssText='position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#1d1d1f;color:white;padding:10px 20px;border-radius:20px;z-index:100000;font-size:13px;';
  document.body.appendChild(note);
  setTimeout(function(){ try{ document.body.removeChild(note); }catch(e){} }, 3000);
})();`

export default function ZendeskImport({ mods, onImportFiches, onClose }) {
  const [step, setStep] = useState('upload')
  const [tickets, setTickets] = useState([])
  const [selected, setSelected] = useState([])
  const [enriched, setEnriched] = useState({}) // ticketId -> texte collé
  const [results, setResults] = useState([])
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState(null)
  const [showBookmarklet, setShowBookmarklet] = useState(false)
  const [copiedBookmarklet, setCopiedBookmarklet] = useState(false)
  const fileRef = useRef(null)

  const handleFile = async e => {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    try {
      const text = await file.text()
      const parsed = parseZendeskCSV(text)
      if (!parsed.length) throw new Error('Aucun ticket trouve dans ce fichier')
      setTickets(parsed)
      setSelected(parsed.map(t => t.id))
      setStep('enrich')
    } catch (err) {
      setError(err.message)
    }
    e.target.value = ''
  }

  const toggleSelect = id =>
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])

  const toggleAll = () =>
    setSelected(s => s.length === tickets.length ? [] : tickets.map(t => t.id))

  const handleConvert = async () => {
    const toConvert = tickets.filter(t => selected.includes(t.id))
    if (!toConvert.length) return
    setStep('converting')
    setProgress(0)
    const converted = []
    for (let i = 0; i < toConvert.length; i++) {
      try {
        const ticket = { ...toConvert[i] }
        // Ajouter le contenu enrichi si disponible
        if (enriched[ticket.id]) {
          ticket.description = enriched[ticket.id]
          ticket.comments = enriched[ticket.id]
        }
        const fiche = await zendeckTicketToFiche(ticket, mods)
        converted.push({ ticket, fiche, ok: true })
      } catch (e) {
        converted.push({ ticket: toConvert[i], error: e.message, ok: false })
      }
      setProgress(Math.round(((i + 1) / toConvert.length) * 100))
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

  const copyBookmarklet = () => {
    navigator.clipboard.writeText(BOOKMARKLET_CODE).then(() => {
      setCopiedBookmarklet(true)
      setTimeout(() => setCopiedBookmarklet(false), 2000)
    })
  }

  const enrichedCount = Object.keys(enriched).filter(k => enriched[k]?.trim()).length
  const selectedTickets = tickets.filter(t => selected.includes(t.id))

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,.5)' }}
      onClick={onClose}
    >
      <div
        className="rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden"
        style={{ background: 'var(--surface)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <div>
            <h2 className="font-semibold text-sm" style={{ color: 'var(--text-1)' }}>Import Zendesk</h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
              {step === 'upload' && 'Charge ton export CSV Zendesk'}
              {step === 'enrich' && `${tickets.length} tickets — ajoute le contenu des tickets`}
              {step === 'converting' && "Conversion en cours avec l'IA..."}
              {step === 'done' && `${results.filter(r => r.ok).length} fiches pretes a importer`}
            </p>
          </div>
          <button onClick={onClose} className="text-xl leading-none" style={{ color: 'var(--text-3)' }}>✕</button>
        </div>

        {/* Steps indicator */}
        <div className="flex px-6 py-3 gap-2 border-b" style={{ borderColor: 'var(--border)' }}>
          {[
            { key: 'upload', label: '1. CSV' },
            { key: 'enrich', label: '2. Contenu' },
            { key: 'converting', label: '3. IA' },
            { key: 'done', label: '4. Import' },
          ].map((s, i) => {
            const stepIdx = STEPS.indexOf(step)
            const sIdx = STEPS.indexOf(s.key)
            return (
              <div key={s.key} className="flex items-center gap-1.5 flex-1">
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                  style={{
                    background: sIdx < stepIdx ? '#22c55e' : sIdx === stepIdx ? 'var(--accent)' : 'var(--surface-2)',
                    color: sIdx <= stepIdx ? '#fff' : 'var(--text-3)',
                  }}>
                  {sIdx < stepIdx ? '✓' : i + 1}
                </div>
                <span className="text-[10px] font-medium"
                  style={{ color: sIdx === stepIdx ? 'var(--accent)' : 'var(--text-3)' }}>
                  {s.label}
                </span>
              </div>
            )
          })}
        </div>

        {/* Contenu */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">

          {/* STEP 1 — Upload CSV */}
          {step === 'upload' && (
            <div className="space-y-4">
              <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} className="hidden" />
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full border-2 border-dashed rounded-2xl p-8 flex flex-col items-center gap-3 transition-colors"
                style={{ borderColor: 'var(--border)' }}
              >
                <span className="text-4xl">📊</span>
                <div className="text-center">
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>
                    Charge ton export CSV Zendesk
                  </p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>
                    Clique pour choisir le fichier
                  </p>
                </div>
              </button>

              {error && (
                <div className="p-3 rounded-xl text-xs text-red-500 border border-red-200"
                  style={{ background: '#fff0f0' }}>✗ {error}</div>
              )}

              {/* Bookmarklet section */}
              <div className="rounded-2xl p-4 border" style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-3)' }}>
                    🔖 Bookmarklet — extraire le contenu
                  </p>
                  <button
                    onClick={() => setShowBookmarklet(b => !b)}
                    className="text-[10px] font-medium px-2 py-1 rounded-lg"
                    style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}
                  >
                    {showBookmarklet ? 'Masquer' : 'Voir'}
                  </button>
                </div>
                <p className="text-xs mb-3" style={{ color: 'var(--text-2)' }}>
                  Installe ce bookmarklet dans Chrome pour extraire le contenu complet d'un ticket en 1 clic.
                </p>

                {showBookmarklet && (
                  <div className="space-y-3">
                    <div className="rounded-xl p-3 border text-[11px] font-mono break-all leading-relaxed"
                      style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-2)' }}>
                      {BOOKMARKLET_CODE.slice(0, 120)}...
                    </div>
                    <button
                      onClick={copyBookmarklet}
                      className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
                      style={{ background: copiedBookmarklet ? '#22c55e' : 'var(--accent)' }}
                    >
                      {copiedBookmarklet ? '✓ Code copie !' : '📋 Copier le code du bookmarklet'}
                    </button>
                    <div className="rounded-xl p-3 border space-y-1.5" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                      <p className="text-[11px] font-semibold" style={{ color: 'var(--text-1)' }}>Comment installer :</p>
                      <p className="text-[11px]" style={{ color: 'var(--text-2)' }}>1. Affiche la barre de favoris Chrome (Ctrl+Shift+B)</p>
                      <p className="text-[11px]" style={{ color: 'var(--text-2)' }}>2. Fais clic droit → "Ajouter une page"</p>
                      <p className="text-[11px]" style={{ color: 'var(--text-2)' }}>3. Nom : "LGPI Zendesk", URL : colle le code copie</p>
                      <p className="text-[11px]" style={{ color: 'var(--text-2)' }}>4. Sur un ticket Zendesk, clique le favori → copie le contenu → reviens ici</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 2 — Enrichissement du contenu */}
          {step === 'enrich' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs" style={{ color: 'var(--text-3)' }}>
                  {selected.length}/{tickets.length} selectionnes · {enrichedCount} avec contenu
                </p>
                <button onClick={toggleAll} className="text-xs font-medium"
                  style={{ color: 'var(--accent)' }}>
                  {selected.length === tickets.length ? 'Tout deselectionner' : 'Tout selectionner'}
                </button>
              </div>

              {/* Info bookmarklet */}
              <div className="rounded-xl p-3 border flex items-start gap-2"
                style={{ background: '#faf5ff', borderColor: '#d8b4fe' }}>
                <span className="text-base flex-shrink-0">💡</span>
                <p className="text-[11px]" style={{ color: '#6d28d9' }}>
                  Pour chaque ticket, tu peux coller le contenu extrait avec le bookmarklet.
                  L'IA utilisera ce contenu pour creer une fiche plus precise.
                  C'est optionnel — tu peux importer sans contenu.
                </p>
              </div>

              <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                {tickets.map(t => (
                  <div key={t.id}
                    className="rounded-xl border overflow-hidden"
                    style={{ borderColor: selected.includes(t.id) ? 'var(--accent)' : 'var(--border)' }}
                  >
                    {/* Header ticket */}
                    <div
                      className="flex items-start gap-3 p-3 cursor-pointer"
                      style={{ background: selected.includes(t.id) ? 'var(--accent-bg)' : 'var(--surface)' }}
                      onClick={() => toggleSelect(t.id)}
                    >
                      <div className="w-4 h-4 rounded flex-shrink-0 mt-0.5 border-2 flex items-center justify-center transition-all"
                        style={selected.includes(t.id)
                          ? { borderColor: 'var(--accent)', background: 'var(--accent)' }
                          : { borderColor: 'var(--border)' }}>
                        {selected.includes(t.id) && <span className="text-white text-[8px]">✓</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-1)' }}>
                          {t.subject}
                        </p>
                        {t.requester && (
                          <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-3)' }}>
                            👤 {t.requester}
                          </p>
                        )}
                      </div>
                      {enriched[t.id]?.trim() && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0"
                          style={{ background: '#dcfce7', color: '#16a34a' }}>
                          ✓ contenu
                        </span>
                      )}
                    </div>

                    {/* Zone contenu collé */}
                    {selected.includes(t.id) && (
                      <div className="px-3 pb-3 pt-1 border-t" style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}>
                        <p className="text-[10px] font-medium mb-1.5" style={{ color: 'var(--text-3)' }}>
                          Colle le contenu du ticket (optionnel) :
                        </p>
                        <textarea
                          value={enriched[t.id] || ''}
                          onChange={e => setEnriched(prev => ({ ...prev, [t.id]: e.target.value }))}
                          placeholder="Colle ici le contenu extrait avec le bookmarklet, ou le texte copie depuis Zendesk..."
                          rows={3}
                          className="input-base text-xs resize-y"
                          style={{ fontSize: '11px', lineHeight: '1.5' }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3 — Conversion IA */}
          {step === 'converting' && (
            <div className="flex flex-col items-center justify-center py-8 gap-4">
              <div className="relative w-20 h-20">
                <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="34" fill="none" stroke="var(--border)" strokeWidth="6" />
                  <circle cx="40" cy="40" r="34" fill="none" strokeWidth="6"
                    stroke="var(--accent)"
                    strokeDasharray={`${2 * Math.PI * 34}`}
                    strokeDashoffset={`${2 * Math.PI * 34 * (1 - progress / 100)}`}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset .5s ease' }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold" style={{ color: 'var(--accent)' }}>{progress}%</span>
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>
                  Conversion par l'IA en cours
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>
                  {Math.round(progress * selected.length / 100)} / {selected.length} tickets traites
                </p>
              </div>
              <div className="w-full rounded-full overflow-hidden" style={{ height: 6, background: 'var(--border)' }}>
                <div className="h-full rounded-full" style={{ width: `${progress}%`, background: 'var(--accent)', transition: 'width .5s ease' }} />
              </div>
              <p className="text-xs italic text-center" style={{ color: 'var(--text-3)' }}>
                ✨ L'IA analyse chaque ticket et cree une fiche structuree
              </p>
            </div>
          )}

          {/* STEP 4 — Resultats */}
          {step === 'done' && (
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="flex-1 rounded-xl p-3 text-center border"
                  style={{ background: '#f0fdf4', borderColor: '#bbf7d0' }}>
                  <p className="text-2xl font-bold text-green-600">{results.filter(r => r.ok).length}</p>
                  <p className="text-xs text-green-600">converties ✓</p>
                </div>
                {results.filter(r => !r.ok).length > 0 && (
                  <div className="flex-1 rounded-xl p-3 text-center border"
                    style={{ background: '#fff0f0', borderColor: '#fecaca' }}>
                    <p className="text-2xl font-bold text-red-500">{results.filter(r => !r.ok).length}</p>
                    <p className="text-xs text-red-500">erreurs ✗</p>
                  </div>
                )}
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {results.map((r, i) => (
                  <div key={i} className="p-3 rounded-xl border text-xs"
                    style={r.ok
                      ? { background: '#f0fdf4', borderColor: '#bbf7d0' }
                      : { background: '#fff0f0', borderColor: '#fecaca' }}>
                    {r.ok ? (
                      <div>
                        <p className="font-semibold" style={{ color: 'var(--text-1)' }}>{r.fiche.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span style={{ color: 'var(--text-3)' }}>{r.fiche.module}</span>
                          <span style={{ color: 'var(--text-3)' }}>·</span>
                          <span className="text-green-600">{r.fiche.type}</span>
                          {r.ticket.description && (
                            <span className="text-green-600 font-medium">· avec contenu</span>
                          )}
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

        {/* Footer */}
        <div className="px-6 py-4 border-t flex gap-3" style={{ borderColor: 'var(--border)' }}>
          {step === 'enrich' && (
            <>
              <button
                onClick={handleConvert}
                disabled={!selected.length}
                className="flex-1 py-2.5 text-white text-sm font-semibold rounded-xl disabled:opacity-40 transition-all"
                style={{ background: 'var(--accent)' }}
              >
                ✨ Convertir {selected.length} ticket{selected.length !== 1 ? 's' : ''} avec IA
                {enrichedCount > 0 && ` (${enrichedCount} avec contenu)`}
              </button>
              <button onClick={() => setStep('upload')}
                className="px-4 text-sm rounded-xl border"
                style={{ color: 'var(--text-2)', borderColor: 'var(--border)' }}>
                Retour
              </button>
            </>
          )}
          {step === 'done' && results.filter(r => r.ok).length > 0 && (
            <>
              <button onClick={handleImport}
                className="flex-1 py-2.5 text-white text-sm font-semibold rounded-xl transition-all"
                style={{ background: 'var(--accent)' }}>
                ⬆️ Importer {results.filter(r => r.ok).length} fiches
              </button>
              <button onClick={onClose}
                className="px-4 text-sm rounded-xl border"
                style={{ color: 'var(--text-2)', borderColor: 'var(--border)' }}>
                Annuler
              </button>
            </>
          )}
          {(step === 'upload' || step === 'converting') && (
            <button onClick={onClose}
              className="w-full py-2.5 text-sm rounded-xl border"
              style={{ color: 'var(--text-2)', borderColor: 'var(--border)' }}>
              Fermer
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

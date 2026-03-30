import { useState } from 'react'
import { BackButton } from '../components/UI'
import { parseZendeskCSV } from '../lib/dataIO'
import { zendeckTicketToFiche } from '../lib/groq'

const STORAGE_KEY = 'lgpi-zendesk-queue'

function loadQueue() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') }
  catch { return [] }
}
function saveQueue(q) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(q))
}

// ── TICKET CARD ───────────────────────────────────────────
function TicketCard({ ticket, onAddContent, onConvert, onDiscard, mods, converting }) {
  const [expanded, setExpanded] = useState(false)
  const [content, setContent] = useState(ticket.manualContent || '')
  const [editingContent, setEditingContent] = useState(false)

  const hasContent = ticket.manualContent?.trim() || ticket.description?.trim()

  return (
    <div className="card-base overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-0.5"
        style={{ background: ticket.converted ? '#22c55e' : ticket.status === 'pending' ? 'var(--accent)' : 'var(--border)' }} />

      {/* Header */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              {ticket.id && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                  style={{ background: 'var(--surface-2)', color: 'var(--text-3)' }}>
                  #{ticket.id}
                </span>
              )}
              {ticket.status && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: 'var(--surface-2)', color: 'var(--text-2)' }}>
                  {ticket.status}
                </span>
              )}
              {hasContent && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: '#dcfce7', color: '#16a34a' }}>
                  ✓ contenu
                </span>
              )}
              {ticket.converted && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: '#dbeafe', color: '#1d4ed8' }}>
                  ✓ fiche creee
                </span>
              )}
            </div>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-1)', letterSpacing: '-.01em' }}>
              {ticket.subject}
            </p>
            {ticket.tags && (
              <p className="text-[10px] mt-1" style={{ color: 'var(--text-3)' }}>🏷️ {ticket.tags}</p>
            )}
          </div>
          <button onClick={() => setExpanded(e => !e)}
            className="text-sm flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg"
            style={{ background: 'var(--surface-2)', color: 'var(--text-2)' }}>
            {expanded ? '▲' : '▼'}
          </button>
        </div>

        {/* Actions */}
        {!ticket.converted && (
          <div className="flex gap-2 mt-3 flex-wrap">
            <button
              onClick={() => setEditingContent(e => !e)}
              className="text-xs px-3 py-1.5 rounded-lg font-medium"
              style={{ background: 'var(--surface-2)', color: 'var(--text-2)' }}
            >
              {editingContent ? '✕ Fermer' : hasContent ? '✏️ Modifier contenu' : '+ Ajouter contenu'}
            </button>
            <button
              onClick={() => onConvert(ticket)}
              disabled={converting}
              className="text-xs px-3 py-1.5 rounded-lg font-semibold text-white disabled:opacity-50"
              style={{ background: 'var(--accent)' }}
            >
              {converting ? '⏳ Conversion...' : '✨ Creer fiche'}
            </button>
            <button
              onClick={() => onDiscard(ticket.id)}
              className="text-xs px-3 py-1.5 rounded-lg"
              style={{ color: '#ef4444', background: '#fee2e2' }}
            >
              🗑 Ignorer
            </button>
          </div>
        )}
        {ticket.converted && (
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => onDiscard(ticket.id)}
              className="text-xs px-3 py-1.5 rounded-lg"
              style={{ color: 'var(--text-3)', background: 'var(--surface-2)' }}
            >
              Retirer de la liste
            </button>
          </div>
        )}
      </div>

      {/* Zone contenu manuel */}
      {editingContent && !ticket.converted && (
        <div className="px-4 pb-4 border-t pt-3" style={{ borderColor: 'var(--border)' }}>
          <p className="text-[11px] font-semibold mb-2" style={{ color: 'var(--text-3)' }}>
            Colle le contenu du ticket depuis Zendesk :
          </p>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Colle ici la description + les commentaires du ticket depuis Zendesk...&#10;&#10;Tu peux copier tout le texte de la page ticket et le coller ici."
            rows={5}
            className="input-base text-xs resize-y w-full mb-2"
          />
          <button
            onClick={() => { onAddContent(ticket.id, content); setEditingContent(false) }}
            className="text-xs px-4 py-2 rounded-lg font-semibold text-white"
            style={{ background: 'var(--accent)' }}
          >
            Sauvegarder le contenu
          </button>
        </div>
      )}

      {/* Detail ticket */}
      {expanded && (
        <div className="px-4 pb-4 border-t pt-3 space-y-2" style={{ borderColor: 'var(--border)' }}>
          {ticket.description && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-3)' }}>Description CSV</p>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-2)' }}>{ticket.description}</p>
            </div>
          )}
          {ticket.manualContent && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-3)' }}>Contenu ajoute</p>
              <p className="text-xs leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-2)' }}>
                {ticket.manualContent.slice(0, 300)}{ticket.manualContent.length > 300 ? '...' : ''}
              </p>
            </div>
          )}
          {ticket.fichePreview && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-3)' }}>Fiche generee</p>
              <p className="text-xs font-semibold" style={{ color: 'var(--text-1)' }}>{ticket.fichePreview.title}</p>
              <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-3)' }}>
                {ticket.fichePreview.module} · {ticket.fichePreview.type}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── PAGE PRINCIPALE ───────────────────────────────────────
export default function ZendeskPage({ onBack, mods, onImportFiche }) {
  const [queue, setQueue] = useState(loadQueue)
  const [converting, setConverting] = useState(null) // ticketId en cours
  const [filter, setFilter] = useState('all') // all | pending | converted
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState(null)
  const fileRef = { current: null }

  const updateQueue = (newQueue) => {
    setQueue(newQueue)
    saveQueue(newQueue)
  }

  // Charger un CSV
  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    try {
      const text = await file.text()
      const tickets = parseZendeskCSV(text)
      if (!tickets.length) throw new Error('Aucun ticket trouve dans ce fichier')

      // Ajouter les nouveaux tickets (éviter doublons)
      const existing = new Set(queue.map(t => t.id))
      const newTickets = tickets
        .filter(t => !existing.has(t.id))
        .map(t => ({ ...t, status: 'pending', converted: false, addedAt: Date.now() }))

      const newQueue = [...queue, ...newTickets]
      updateQueue(newQueue)
      setFilter('all')
    } catch (err) {
      setError(err.message)
    }
    e.target.value = ''
  }

  // Ajouter contenu manuel
  const handleAddContent = (ticketId, content) => {
    const newQueue = queue.map(t =>
      t.id === ticketId ? { ...t, manualContent: content } : t
    )
    updateQueue(newQueue)
  }

  // Convertir un ticket en fiche
  const handleConvert = async (ticket) => {
    setConverting(ticket.id)
    try {
      const enrichedTicket = {
        ...ticket,
        description: ticket.manualContent || ticket.description || '',
        comments: ticket.manualContent || '',
      }
      const fiche = await zendeckTicketToFiche(enrichedTicket, mods)

      // Importer la fiche
      await onImportFiche([fiche])

      // Marquer comme converti
      const newQueue = queue.map(t =>
        t.id === ticket.id
          ? { ...t, converted: true, fichePreview: fiche }
          : t
      )
      updateQueue(newQueue)
    } catch (err) {
      setError("Erreur IA : " + err.message)
    } finally {
      setConverting(null)
    }
  }

  // Ignorer un ticket
  const handleDiscard = (ticketId) => {
    const newQueue = queue.filter(t => t.id !== ticketId)
    updateQueue(newQueue)
  }

  // Vider toute la liste
  const handleClearAll = () => {
    if (window.confirm('Vider toute la liste ?')) {
      updateQueue([])
    }
  }

  const filtered = queue.filter(t =>
    filter === 'all' ? true :
    filter === 'pending' ? !t.converted :
    filter === 'converted' ? t.converted : true
  )

  const pendingCount = queue.filter(t => !t.converted).length
  const convertedCount = queue.filter(t => t.converted).length

  return (
    <div className="pb-24 sm:pb-0">
      <BackButton label="Retour" onClick={onBack} />

      {/* Header */}
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--accent)' }}>
          Administration
        </p>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-1)', letterSpacing: '-.04em' }}>
          Import Zendesk
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-2)' }}>
          {queue.length} ticket{queue.length !== 1 ? 's' : ''} dans la file
          {pendingCount > 0 && ` · ${pendingCount} en attente`}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <input
          type="file" accept=".csv"
          onChange={handleFile}
          ref={el => fileRef.current = el}
          className="hidden"
          id="zendesk-csv"
        />
        <label htmlFor="zendesk-csv"
          className="btn-accent text-sm cursor-pointer">
          📊 Charger un CSV
        </label>
        {queue.length > 0 && (
          <button onClick={handleClearAll} className="btn-ghost text-sm">
            🗑 Vider la liste
          </button>
        )}
      </div>

      {error && (
        <div className="p-3 rounded-xl mb-4 text-sm border"
          style={{ background: '#fff0f0', borderColor: '#fecaca', color: '#ef4444' }}>
          ✗ {error}
          <button onClick={() => setError(null)} className="ml-2 opacity-60">✕</button>
        </div>
      )}

      {/* Instructions */}
      {queue.length === 0 && (
        <div className="card-base p-6 text-center">
          <div className="text-4xl mb-3">📊</div>
          <p className="text-sm font-semibold mb-2" style={{ color: 'var(--text-1)' }}>
            Aucun ticket en attente
          </p>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-2)' }}>
            Charge un export CSV depuis Zendesk pour commencer.
            Les tickets apparaitront ici pour validation avant d'etre convertis en fiches.
          </p>
          <div className="mt-4 p-3 rounded-xl text-left border" style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}>
            <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-2)' }}>
              Pour chaque ticket, tu pourras :
            </p>
            <div className="space-y-1">
              {[
                '📋 Voir le titre et les infos du CSV',
                '✏️ Coller le contenu complet depuis Zendesk',
                '✨ Lancer la conversion IA en fiche',
                '🗑 Ignorer les tickets non pertinents',
              ].map((step, i) => (
                <p key={i} className="text-xs" style={{ color: 'var(--text-3)' }}>{step}</p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filtres */}
      {queue.length > 0 && (
        <>
          <div className="flex gap-2 mb-4">
            {[
              { key: 'all', label: `Tous (${queue.length})` },
              { key: 'pending', label: `En attente (${pendingCount})` },
              { key: 'converted', label: `Convertis (${convertedCount})` },
            ].map(f => (
              <button key={f.key} onClick={() => setFilter(f.key)}
                className="text-xs px-3 py-1.5 rounded-full font-medium transition-all"
                style={filter === f.key
                  ? { background: 'var(--accent)', color: '#fff' }
                  : { background: 'var(--surface-2)', color: 'var(--text-2)' }
                }>
                {f.label}
              </button>
            ))}
          </div>

          {/* Liste des tickets */}
          <div className="space-y-3">
            {filtered.length === 0 ? (
              <p className="text-sm text-center py-8" style={{ color: 'var(--text-3)' }}>
                Aucun ticket dans cette categorie
              </p>
            ) : filtered.map(ticket => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                mods={mods}
                converting={converting === ticket.id}
                onAddContent={handleAddContent}
                onConvert={handleConvert}
                onDiscard={handleDiscard}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

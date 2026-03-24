// Export toutes les données en JSON
export function exportJSON(notes, mods) {
  const data = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    mods,
    notes,
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `LGPI_backup_${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

// Import depuis un fichier JSON
export function importJSON(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => {
      try {
        const data = JSON.parse(e.target.result)
        if (!data.notes || !data.mods) {
          reject(new Error('Format invalide — le fichier doit contenir notes et mods'))
          return
        }
        resolve(data)
      } catch {
        reject(new Error('Fichier JSON invalide'))
      }
    }
    reader.onerror = () => reject(new Error('Erreur de lecture du fichier'))
    reader.readAsText(file)
  })
}

// Parser un export CSV Zendesk
// Détecte automatiquement les colonnes selon l'en-tête
export function parseZendeskCSV(csvText) {
  const lines = csvText.split('\n').filter(l => l.trim())
  if (lines.length < 2) throw new Error('Fichier CSV vide ou invalide')

  // Parser une ligne CSV (gère les guillemets)
  const parseLine = line => {
    const result = []
    let cur = '', inQ = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') { inQ = !inQ }
      else if (ch === ',' && !inQ) { result.push(cur.trim()); cur = '' }
      else { cur += ch }
    }
    result.push(cur.trim())
    return result
  }

  const headers = parseLine(lines[0]).map(h => h.toLowerCase().replace(/[^a-z0-9]/g, '_'))

  // Mapping flexible des colonnes Zendesk (plusieurs noms possibles)
  const findCol = (...names) => {
    for (const n of names) {
      const idx = headers.findIndex(h => h.includes(n))
      if (idx >= 0) return idx
    }
    return -1
  }

  const cols = {
    subject:     findCol('subject', 'sujet', 'titre', 'title'),
    description: findCol('description', 'body', 'contenu'),
    resolution:  findCol('resolution', 'comment', 'solution', 'reponse', 'reply'),
    tags:        findCol('tags', 'label', 'etiquette'),
    status:      findCol('status', 'statut', 'etat'),
    id:          findCol('id', 'ticket_id', 'numero'),
    created:     findCol('created', 'date', 'ouvert'),
  }

  const tickets = []
  for (let i = 1; i < lines.length; i++) {
    const vals = parseLine(lines[i])
    if (vals.length < 2) continue
    const get = idx => idx >= 0 ? (vals[idx] || '').replace(/^"|"$/g, '').trim() : ''
    tickets.push({
      id:          get(cols.id) || String(i),
      subject:     get(cols.subject),
      description: get(cols.description),
      resolution:  get(cols.resolution),
      tags:        get(cols.tags),
      status:      get(cols.status),
      created:     get(cols.created),
    })
  }

  // Filtrer les tickets sans sujet
  return tickets.filter(t => t.subject && t.subject.length > 2)
}

// Proxy Cloudflare Worker — contourne le CORS
const WORKER_URL = 'https://lgpi-groq-proxy.ashjacquin70.workers.dev'
const MODEL = 'llama-3.3-70b-versatile'

async function groqCall(messages, maxTokens = 1000) {
  const res = await fetch(WORKER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: MODEL, messages, max_tokens: maxTokens, temperature: 0.4 }),
  })
  if (!res.ok) throw new Error('Groq error: ' + res.status)
  const data = await res.json()
  return data.choices[0].message.content.trim()
}

function safeParseJSON(raw) {
  let clean = raw.replace(/```json|```/g, '').trim()
  const start = clean.indexOf('{')
  const end = clean.lastIndexOf('}')
  if (start >= 0 && end > start) clean = clean.slice(start, end + 1)
  try { return JSON.parse(clean) } catch {}
  const extract = (key) => {
    const m = clean.match(new RegExp('"' + key + '"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"', 's'))
    return m ? m[1].replace(/\\n/g, '\n').replace(/\\"/g, '"') : ''
  }
  const extractArr = (key) => {
    const m = clean.match(new RegExp('"' + key + '"\\s*:\\s*\\[([^\\]]*)\\]'))
    if (!m) return []
    return (m[1].match(/"([^"]*)"/g) || []).map(s => s.replace(/"/g, ''))
  }
  return {
    title: extract('title') || 'Ticket Zendesk',
    type: extract('type') || 'info',
    module: extract('module') || '',
    path: extract('path') || '',
    content: extract('content') || '',
    tags: extractArr('tags'),
  }
}

export async function reformulerContenu(content, title = '') {
  const prompt = "Tu es un assistant qui aide a structurer des notes de travail sur LGPI.\n" +
    "Reformule ces notes en une fiche claire et structuree en francais.\n" +
    "Utilise du markdown : ## titres, - listes, **gras**, `code`.\n" +
    (title ? 'Titre : ' + title + '\n' : '') +
    "\nNotes :\n" + content +
    "\n\nReponds uniquement avec le contenu reformule."
  return groqCall([{ role: 'user', content: prompt }], 1500)
}

export async function suggererTitre(content) {
  const prompt = "Propose un titre court et precis (5-8 mots max, en francais) pour cette fiche LGPI.\n" +
    "Reponds uniquement avec le titre, sans guillemets.\n\nContenu :\n" + content.slice(0, 500)
  return groqCall([{ role: 'user', content: prompt }], 50)
}

export async function suggererTags(content, title = '', existingTags = []) {
  const prompt = "Propose 3 a 5 tags pertinents en francais (mots-cles courts, minuscules) pour cette fiche LGPI.\n" +
    (existingTags.length ? 'Tags existants : ' + existingTags.join(', ') + '\n' : '') +
    "Reponds uniquement avec les tags separes par des virgules.\n\nTitre : " + title + "\nContenu : " + content.slice(0, 400)
  const result = await groqCall([{ role: 'user', content: prompt }], 80)
  return result.split(',').map(t => t.trim().toLowerCase()).filter(Boolean).slice(0, 5)
}

export async function zendeckTicketToFiche(ticket, existingMods = []) {
  const cleanText = (str) => (str || '').slice(0, 800)
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\\/g, '/')

  const prompt = "Tu es un expert du logiciel de gestion LGPI. Convertis ce ticket Zendesk en fiche de connaissance.\n\n" +
    "TICKET :\nSujet : " + cleanText(ticket.subject) + "\n" +
    "Description : " + cleanText(ticket.description) + "\n" +
    "Contenu : " + cleanText(ticket.manualContent || ticket.comments || ticket.resolution) + "\n" +
    "Tags : " + (ticket.tags || '').slice(0, 100) + "\n\n" +
    "Modules disponibles : " + (existingMods.map(m => m.label).join(', ') || 'Gestion de stock, Facturation, Teletransmission, Donnees Clients, Serialisation') + "\n\n" +
    'Reponds UNIQUEMENT avec du JSON valide sur une seule ligne, sans markdown ni backticks.\n' +
    'Utilise \\n pour les sauts de ligne dans "content".\n' +
    '{"title":"max 8 mots","type":"procedure|attention|astuce|info","module":"module exact","path":"chemin ou vide","content":"markdown avec \\n","tags":["tag1","tag2"]}'

  const result = await groqCall([{ role: 'user', content: prompt }], 1200)
  return safeParseJSON(result)
}

export async function resumerFiche(content, title = '') {
  const prompt = "Resume cette fiche LGPI en exactement 3 points cles courts (max 15 mots chacun).\n" +
    (title ? 'Titre : ' + title + '\n' : '') +
    "\nContenu :\n" + content.slice(0, 800) +
    "\n\nReponds UNIQUEMENT avec un JSON valide (sans backticks) :\n{\"points\": [\"point 1\", \"point 2\", \"point 3\"]}"
  const result = await groqCall([{ role: 'user', content: prompt }], 200)
  const clean = result.replace(/```json|```/g, '').trim()
  const start = clean.indexOf('{'), end = clean.lastIndexOf('}')
  return JSON.parse(clean.slice(start, end + 1)).points
}

export async function resumerModule(notes, moduleLabel) {
  if (!notes.length) throw new Error('Aucune fiche dans ce module')
  const notesText = notes.slice(0, 15).map((n, i) =>
    (i + 1) + '. ' + n.title + ': ' + (n.content || '').slice(0, 200)
  ).join('\n')

  const prompt = "Tu es un expert LGPI. Voici les fiches du module \"" + moduleLabel + "\" (" + notes.length + " fiches).\n" +
    "Genere un resume concis en 3-5 points cles, utile pour decouvrir ce module.\n\n" +
    "Fiches :\n" + notesText + "\n\n" +
    "Reponds avec un JSON valide sur une ligne :\n" +
    "{\"summary\":\"resume en 2-3 phrases\",\"points\":[\"point 1\",\"point 2\",\"point 3\"],\"keyFiches\":[\"titre fiche 1\",\"titre fiche 2\"]}"

  const result = await groqCall([{ role: 'user', content: prompt }], 500)
  const clean = result.replace(/```json|```/g, '').trim()
  const start = clean.indexOf('{'), end = clean.lastIndexOf('}')
  return JSON.parse(clean.slice(start, end + 1))
}

export async function detecterDoublons(title, content, existingNotes) {
  if (!existingNotes.length) return []
  const existing = existingNotes.slice(0, 30).map((n, i) => i + ': ' + n.title).join('\n')

  const prompt = "Parmi ces fiches LGPI existantes, lesquelles sont potentiellement similaires a la nouvelle fiche ?\n\n" +
    "Nouvelle fiche : \"" + title + "\"\n\nFiches existantes :\n" + existing + "\n\n" +
    "Reponds avec un JSON (indices des fiches similaires) :\n{\"similar\":[0,3],\"reason\":\"explication\"}\n\n" +
    "Si aucune similitude : {\"similar\":[],\"reason\":\"\"}"

  const result = await groqCall([{ role: 'user', content: prompt }], 200)
  const clean = result.replace(/```json|```/g, '').trim()
  const start = clean.indexOf('{'), end = clean.lastIndexOf('}')
  const parsed = JSON.parse(clean.slice(start, end + 1))
  return (parsed.similar || []).map(i => existingNotes[i]).filter(Boolean).slice(0, 3)
}

export async function genererQuestions(content, title) {
  const prompt = "A partir de cette fiche LGPI, genere 3 questions de revision avec leurs reponses.\n" +
    "Titre : " + (title || '') + "\nContenu : " + (content || '').slice(0, 600) + "\n\n" +
    "Reponds avec un JSON valide sur une ligne :\n" +
    "{\"questions\":[{\"q\":\"question 1 ?\",\"a\":\"reponse 1\"},{\"q\":\"question 2 ?\",\"a\":\"reponse 2\"},{\"q\":\"question 3 ?\",\"a\":\"reponse 3\"}]}"

  const result = await groqCall([{ role: 'user', content: prompt }], 400)
  const clean = result.replace(/```json|```/g, '').trim()
  const start = clean.indexOf('{'), end = clean.lastIndexOf('}')
  return JSON.parse(clean.slice(start, end + 1)).questions
}

export async function suggererFichesLiees(title, content, allNotes) {
  if (!allNotes.length) return []
  const notesText = allNotes.slice(0, 40).map((n, i) => i + ': ' + n.title).join('\n')

  const prompt = "Parmi ces fiches LGPI, lesquelles sont les plus pertinentes en complement de la fiche actuelle ?\n\n" +
    "Fiche actuelle : \"" + title + "\"\n\nAutres fiches :\n" + notesText + "\n\n" +
    "Reponds avec un JSON (indices des 3 fiches les plus complementaires) :\n{\"related\":[0,5,12]}"

  const result = await groqCall([{ role: 'user', content: prompt }], 150)
  const clean = result.replace(/```json|```/g, '').trim()
  const start = clean.indexOf('{'), end = clean.lastIndexOf('}')
  const parsed = JSON.parse(clean.slice(start, end + 1))
  return (parsed.related || []).map(i => allNotes[i]).filter(Boolean).slice(0, 3)
}

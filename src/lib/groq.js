// Proxy Cloudflare Worker — contourne le CORS
const WORKER_URL = 'https://lgpi-groq-proxy.ashjacquin70.workers.dev'
const MODEL = 'llama-3.3-70b-versatile'

async function groqCall(messages, maxTokens = 1000) {
  const res = await fetch(WORKER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: MODEL, messages, max_tokens: maxTokens, temperature: 0.4 }),
  })
  if (!res.ok) throw new Error(`Groq error: ${res.status}`)
  const data = await res.json()
  return data.choices[0].message.content.trim()
}

export async function reformulerContenu(content, title = '') {
  const prompt = `Tu es un assistant qui aide à structurer des notes de travail sur un logiciel de gestion (LGPI).

Reformule ces notes prises à la va-vite en une fiche claire et bien structurée en français.
Utilise du markdown : ## pour les titres de sections, - pour les listes, **gras** pour les points importants, \`code\` pour les termes techniques.
Garde un ton professionnel et concis. Ne rajoute pas d'informations inventées.
${title ? `Le titre de la fiche est : "${title}"` : ''}

Notes brutes :
${content}

Réponds uniquement avec le contenu reformulé, sans introduction ni conclusion.`

  return groqCall([{ role: 'user', content: prompt }], 1500)
}

export async function suggererTitre(content) {
  const prompt = `En te basant sur ce contenu de fiche de travail sur le logiciel LGPI, propose un titre court et précis (5-8 mots maximum, en français).
Réponds uniquement avec le titre, sans guillemets ni ponctuation finale.

Contenu :
${content.slice(0, 500)}`

  return groqCall([{ role: 'user', content: prompt }], 50)
}

export async function suggererTags(content, title = '', existingTags = []) {
  const prompt = `En te basant sur ce contenu de fiche de travail sur LGPI, propose 3 à 5 tags pertinents en français (mots-clés courts, en minuscules).
${existingTags.length ? `Tags déjà existants dans l'app : ${existingTags.join(', ')}. Réutilise-les si pertinent.` : ''}
Réponds uniquement avec les tags séparés par des virgules, sans espaces superflus.

Titre : ${title}
Contenu : ${content.slice(0, 400)}`

  const result = await groqCall([{ role: 'user', content: prompt }], 80)
  return result.split(',').map(t => t.trim().toLowerCase()).filter(Boolean).slice(0, 5)
}

// Nettoyer un JSON potentiellement mal forme retourne par l'IA
function safeParseJSON(raw) {
  let clean = raw.replace(/```json|```/g, '').trim()
  const start = clean.indexOf('{')
  const end = clean.lastIndexOf('}')
  if (start >= 0 && end > start) clean = clean.slice(start, end + 1)
  try { return JSON.parse(clean) } catch {}

  // Fallback : extraire les champs manuellement
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

// Convertir un ticket Zendesk en fiche LGPI
export async function zendeckTicketToFiche(ticket, existingMods = []) {
  const cleanText = (str) => (str || '').slice(0, 800)
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\\/g, '/')

  const prompt = "Tu es un expert du logiciel de gestion LGPI. Convertis ce ticket Zendesk en fiche de connaissance.\n\n" +
    "TICKET :\n" +
    "Sujet : " + cleanText(ticket.subject) + "\n" +
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
  const prompt = `Resume cette fiche LGPI en exactement 3 points cles courts (max 15 mots chacun).
${title ? 'Titre : ' + title : ''}

Contenu :
${content.slice(0, 800)}

Reponds UNIQUEMENT avec un JSON valide (sans backticks) :
{"points": ["point 1", "point 2", "point 3"]}`

  const result = await groqCall([{ role: 'user', content: prompt }], 200)
  const clean = result.replace(/```json|```/g, '').trim()
  return JSON.parse(clean).points
}

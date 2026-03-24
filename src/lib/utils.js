import { TYPES } from './firebase'

export const getType = id => TYPES.find(t => t.id === id) || TYPES[0]

export const relativeDate = dateStr => {
  if (!dateStr) return ''
  const d = new Date(dateStr), now = new Date()
  const diff = Math.floor((now - d) / 86400000)
  if (diff === 0) return "Aujourd'hui"
  if (diff === 1) return 'Hier'
  if (diff < 7) return `Il y a ${diff} jours`
  if (diff < 30) return `Il y a ${Math.floor(diff / 7)} sem.`
  if (diff < 365) return `Il y a ${Math.floor(diff / 30)} mois`
  return `Il y a ${Math.floor(diff / 365)} an${Math.floor(diff / 365) > 1 ? 's' : ''}`
}

export const pad2 = n => String(n).padStart(2, '0')

export const todayStr = () => new Date().toISOString().slice(0, 10)

export const renderMarkdown = text => {
  if (!text) return ''
  let html = text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>')
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>')
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>')
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')
  html = html.replace(/`(.+?)`/g, '<code>$1</code>')
  html = html.replace(/^---$/gm, '<hr>')
  html = html.replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>')
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>')
  html = html.replace(/(<li>.*<\/li>\n?)+/g, s => `<ul>${s}</ul>`)
  html = html.replace(/(?<!\<\/[a-z]+\>)\n(?!\<)/g, '<br>')
  return html
}

export const fmtMin = m => `${Math.floor(m / 60)}h${pad2(m % 60)}`

export const toSec = t => {
  const [h, m] = t.split(':').map(Number)
  return h * 3600 + m * 60
}

export const slotMins = slots =>
  slots.reduce((a, s) => {
    const [sh, sm] = s.s.split(':').map(Number)
    const [eh, em] = s.e.split(':').map(Number)
    return a + (eh * 60 + em) - (sh * 60 + sm)
  }, 0)

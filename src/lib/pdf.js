import { renderMarkdown } from './utils'

export function exportFichePDF(note, mod) {
  const tp = {
    procedure: { label: 'Procédure', color: '#1A7FAA', bg: '#E8F4FD' },
    astuce:    { label: 'Astuce',    color: '#996600', bg: '#FFF9E6' },
    attention: { label: 'Attention', color: '#CC0022', bg: '#FFF0F0' },
    info:      { label: 'Info',      color: '#5048CC', bg: '#EEF2FF' },
  }[note.type] || { label: 'Info', color: '#5048CC', bg: '#EEF2FF' }

  const pathSteps = note.path ? note.path.split('>').map(s => s.trim()).filter(Boolean) : []

  const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>${note.title} — LGPI Notes</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;
    font-size: 13px;
    color: #1d1d1f;
    line-height: 1.6;
    padding: 40px;
    max-width: 700px;
    margin: 0 auto;
  }
  .header { margin-bottom: 24px; border-bottom: 2px solid #f0f0f0; padding-bottom: 16px; }
  .module-label {
    font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;
    color: ${mod?.color || '#888'}; margin-bottom: 6px;
  }
  h1 { font-size: 22px; font-weight: 600; letter-spacing: -.4px; line-height: 1.2; margin-bottom: 8px; }
  .type-badge {
    display: inline-block; font-size: 11px; font-weight: 600;
    padding: 3px 10px; border-radius: 20px;
    background: ${tp.bg}; color: ${tp.color};
  }
  .breadcrumb {
    display: flex; align-items: center; gap: 6px; flex-wrap: wrap;
    margin: 12px 0; padding: 8px 12px;
    background: #f8f8f8; border-radius: 8px;
    font-size: 12px; font-weight: 500;
  }
  .bc-arrow { color: #999; }
  .body {
    background: #fafafa; border: 1px solid #e8e8e8;
    border-radius: 10px; padding: 16px;
    margin: 16px 0; white-space: pre-wrap;
    font-size: 13px; line-height: 1.75;
  }
  .body h1 { font-size: 16px; margin: 12px 0 6px; }
  .body h2 { font-size: 14px; margin: 10px 0 4px; }
  .body h3 { font-size: 13px; margin: 8px 0 3px; }
  .body ul, .body ol { margin: 4px 0 8px 20px; }
  .body code { background: #eee; padding: 1px 5px; border-radius: 3px; font-family: monospace; font-size: 11px; }
  .body blockquote { border-left: 3px solid ${mod?.color || '#6C63FF'}; padding: 4px 10px; color: #666; background: #f5f5f5; border-radius: 0 6px 6px 0; margin: 6px 0; }
  .body strong { font-weight: 600; }
  .body em { font-style: italic; }
  .tags { display: flex; flex-wrap: wrap; gap: 6px; margin: 12px 0; }
  .tag { font-size: 11px; padding: 2px 8px; border-radius: 20px; background: ${mod?.bg || '#eee'}; color: ${mod?.tc || '#555'}; font-weight: 500; }
  .meta { font-size: 11px; color: #999; margin-top: 16px; padding-top: 12px; border-top: 1px solid #f0f0f0; }
  .footer { margin-top: 24px; text-align: center; font-size: 10px; color: #ccc; }
  @media print {
    body { padding: 20px; }
    .no-print { display: none; }
  }
</style>
</head>
<body>
<div class="header">
  <div class="module-label">${mod?.icon || ''} ${mod?.label || ''}</div>
  <h1>${note.title}</h1>
  <span class="type-badge">${tp.label}</span>
</div>

${pathSteps.length > 0 ? `
<div class="breadcrumb">
  ${pathSteps.map((s, i) => `${i > 0 ? '<span class="bc-arrow">›</span>' : ''}<span>${s}</span>`).join('')}
</div>` : ''}

<div class="body">${renderMarkdown(note.content || '')}</div>

${(note.tags || []).length > 0 ? `
<div class="tags">
  ${note.tags.map(t => `<span class="tag">${t}</span>`).join('')}
</div>` : ''}

<div class="meta">
  Créée le ${note.date || ''}${note.updatedAt ? ' · Modifiée récemment' : ''}
</div>

<div class="footer">LGPI Notes</div>

<script>window.onload = () => window.print()</script>
</body>
</html>`

  const blob = new Blob([html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const win = window.open(url, '_blank')
  setTimeout(() => URL.revokeObjectURL(url), 10000)
}

export function exportAllPDF(notes, mods) {
  const rows = notes.map(n => {
    const m = mods.find(x => x.id === n.module) || { label: '?', icon: '?', color: '#888' }
    return `<tr>
      <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0">
        <span style="font-size:11px;font-weight:600;color:${m.color}">${m.icon} ${m.label}</span>
      </td>
      <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;font-weight:500">${n.title}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;color:#666;font-size:12px">${(n.tags || []).join(', ')}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;color:#999;font-size:11px">${n.date || ''}</td>
    </tr>`
  }).join('')

  const html = `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"><title>LGPI Notes — Toutes les fiches</title>
<style>
  body { font-family: -apple-system, sans-serif; font-size: 13px; color: #1d1d1f; padding: 40px; }
  h1 { font-size: 20px; margin-bottom: 4px; }
  p { color: #666; font-size: 12px; margin-bottom: 20px; }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; padding: 8px 12px; font-size: 11px; font-weight: 600; color: #999; text-transform: uppercase; letter-spacing: .5px; border-bottom: 2px solid #e8e8e8; }
  @media print { body { padding: 20px; } }
</style></head>
<body>
<h1>LGPI Notes — Toutes les fiches</h1>
<p>${notes.length} fiche${notes.length > 1 ? 's' : ''} · Exporté le ${new Date().toLocaleDateString('fr')}</p>
<table>
  <thead><tr><th>Module</th><th>Titre</th><th>Tags</th><th>Date</th></tr></thead>
  <tbody>${rows}</tbody>
</table>
<script>window.onload = () => window.print()</script>
</body></html>`

  const blob = new Blob([html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank')
  setTimeout(() => URL.revokeObjectURL(url), 10000)
}

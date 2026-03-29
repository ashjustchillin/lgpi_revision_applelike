import jsPDF from 'jspdf'

export async function exportFichePDF(note, mod, type) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = 210, pageH = 297, margin = 20
  const contentW = pageW - margin * 2
  let y = margin

  const accent = [108, 99, 255]
  const gray = [107, 114, 128]
  const dark = [29, 29, 31]

  doc.setFillColor(...accent)
  doc.rect(0, 0, pageW, 3, 'F')
  y += 5

  doc.setFontSize(9)
  doc.setTextColor(...gray)
  doc.text((mod?.icon || '') + ' ' + (mod?.label || ''), margin, y)
  y += 7

  doc.setFontSize(20)
  doc.setTextColor(...dark)
  doc.setFont('helvetica', 'bold')
  const titleLines = doc.splitTextToSize(note.title, contentW)
  doc.text(titleLines, margin, y)
  y += titleLines.length * 8 + 3

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...gray)
  doc.text((type?.emoji || '') + ' ' + (type?.label || ''), margin, y)
  y += 7

  if (note.path && note.path.trim()) {
    doc.setFontSize(9)
    doc.setTextColor(...accent)
    const pathText = note.path.split('>').map(s => s.trim()).join(' > ')
    doc.text('> ' + pathText, margin, y)
    y += 6
  }

  doc.setDrawColor(220, 220, 220)
  doc.line(margin, y, pageW - margin, y)
  y += 8

  if (note.content) {
    doc.setFontSize(11)
    doc.setTextColor(...dark)
    doc.setFont('helvetica', 'normal')

    const lines = note.content.split('\n')
    for (const line of lines) {
      if (y > pageH - margin) { doc.addPage(); y = margin }

      if (line.startsWith('## ')) {
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(13)
        doc.text(line.replace('## ', ''), margin, y)
        y += 7
      } else if (line.startsWith('# ')) {
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(15)
        doc.text(line.replace('# ', ''), margin, y)
        y += 9
      } else if (line.startsWith('- ')) {
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(11)
        doc.setTextColor(...dark)
        const bullet = doc.splitTextToSize('• ' + line.replace('- ', ''), contentW - 5)
        doc.text(bullet, margin + 3, y)
        y += bullet.length * 6
      } else if (line.startsWith('---')) {
        doc.setDrawColor(220, 220, 220)
        doc.line(margin, y, pageW - margin, y)
        y += 5
      } else if (line.trim() === '') {
        y += 3
      } else {
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(11)
        doc.setTextColor(...dark)
        const clean = line.replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1').replace(/`(.+?)`/g, '$1')
        const wrapped = doc.splitTextToSize(clean, contentW)
        doc.text(wrapped, margin, y)
        y += wrapped.length * 6
      }
    }
  }

  y += 8
  if ((note.tags || []).length > 0) {
    if (y > pageH - margin) { doc.addPage(); y = margin }
    doc.setFontSize(9)
    doc.setTextColor(...gray)
    doc.text('Tags : ' + note.tags.join(', '), margin, y)
    y += 6
  }

  if (note.date) {
    doc.setFontSize(8)
    doc.setTextColor(...gray)
    doc.text('Creee le ' + note.date, margin, y)
  }

  doc.setFontSize(8)
  doc.setTextColor(200, 200, 200)
  doc.text('LGPI Notes', pageW / 2, pageH - 8, { align: 'center' })

  const filename = note.title.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '_').slice(0, 50)
  doc.save('LGPI_' + filename + '.pdf')
}

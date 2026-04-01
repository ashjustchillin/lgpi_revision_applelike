import { useState, useRef } from 'react'
import { motion, AnimatePresence } from '../lib/motion'
import { useImageUpload } from '../hooks/useImageUpload'

function ImageThumb({ img, onRemove, onInsert, isAdmin }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <>
      <motion.div layout initial={{ opacity: 0, scale: .9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: .9 }}
        className="relative group rounded-xl overflow-hidden border cursor-pointer"
        style={{ borderColor: 'var(--border)', width: 100, height: 100 }} onClick={() => setExpanded(true)}>
        <img src={img.url} alt={img.name || 'Image'} className="w-full h-full object-cover" loading="lazy" />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
          <button onClick={e => { e.stopPropagation(); onInsert(img) }} className="w-7 h-7 rounded-lg bg-white/90 flex items-center justify-center text-xs" title="Insérer dans le contenu">📎</button>
          {isAdmin && (<button onClick={e => { e.stopPropagation(); onRemove(img) }} className="w-7 h-7 rounded-lg bg-red-500/90 text-white flex items-center justify-center text-xs" title="Supprimer">✕</button>)}
        </div>
        <span className="absolute bottom-1 right-1 text-[8px] px-1 py-0.5 rounded bg-black/60 text-white">{Math.round(img.size / 1024)} Ko</span>
      </motion.div>
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-6 cursor-pointer"
            style={{ background: 'rgba(0,0,0,.8)', backdropFilter: 'blur(8px)' }} onClick={() => setExpanded(false)}>
            <motion.img initial={{ scale: .9 }} animate={{ scale: 1 }} exit={{ scale: .9 }}
              src={img.url} alt={img.name} className="max-w-full max-h-[85vh] rounded-xl shadow-2xl object-contain" onClick={e => e.stopPropagation()} />
            <button onClick={() => setExpanded(false)} className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/20 text-white flex items-center justify-center text-xl">✕</button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default function ImageUploader({ noteId, images = [], onImagesChange, onInsertMarkdown, isAdmin = true }) {
  const { upload, deleteImage, uploading, progress, error } = useImageUpload(noteId)
  const fileRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)

  const handleFiles = async (files) => {
    const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'))
    if (!imageFiles.length) return
    for (const file of imageFiles) {
      const result = await upload(file)
      if (result) onImagesChange([...images, result])
    }
  }

  const handleDrop = (e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files) }
  const handleRemove = async (img) => { if (!window.confirm('Supprimer cette image ?')) return; if (img.path) await deleteImage(img.path); onImagesChange(images.filter(i => i.url !== img.url)) }
  const handleInsert = (img) => { if (onInsertMarkdown) onInsertMarkdown(`\n![${img.name || 'image'}](${img.url})\n`) }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-3)' }}>📷 Images & captures d'écran</p>
        {images.length > 0 && (<span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}>{images.length} image{images.length > 1 ? 's' : ''}</span>)}
      </div>

      {isAdmin && (
        <div onDrop={handleDrop} onDragOver={e => { e.preventDefault(); setDragOver(true) }} onDragLeave={() => setDragOver(false)}
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all"
          style={{ borderColor: dragOver ? 'var(--accent)' : 'var(--border)', background: dragOver ? 'var(--accent-bg)' : 'transparent' }}>
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={e => handleFiles(e.target.files)} />
          {uploading ? (
            <div className="space-y-2">
              <div className="w-6 h-6 mx-auto border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
              <p className="text-xs" style={{ color: 'var(--text-2)' }}>Upload en cours… {progress}%</p>
              <div className="w-32 mx-auto h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--surface-2)' }}>
                <div className="h-full rounded-full transition-all duration-300" style={{ width: `${progress}%`, background: 'var(--accent)' }} />
              </div>
            </div>
          ) : (
            <>
              <span className="text-2xl block mb-1">📷</span>
              <p className="text-xs" style={{ color: 'var(--text-2)' }}>Glisse une image ici, colle depuis le presse-papier, ou clique pour choisir</p>
              <p className="text-[10px] mt-1" style={{ color: 'var(--text-3)' }}>PNG, JPG, WebP · Max 2 Mo · Compressé automatiquement</p>
            </>
          )}
        </div>
      )}

      {error && (<motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-red-500 font-medium">✕ {error}</motion.p>)}

      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <AnimatePresence>{images.map((img, idx) => (<ImageThumb key={img.url || idx} img={img} onRemove={handleRemove} onInsert={handleInsert} isAdmin={isAdmin} />))}</AnimatePresence>
        </div>
      )}
      {images.length > 0 && (<p className="text-[10px]" style={{ color: 'var(--text-3)' }}>💡 Clique sur 📎 pour insérer l'image dans le contenu markdown. Clique sur l'image pour l'agrandir.</p>)}
    </div>
  )
}

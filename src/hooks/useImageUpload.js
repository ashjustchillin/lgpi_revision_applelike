import { useState, useCallback } from 'react'
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'

const MAX_SIZE = 2 * 1024 * 1024
const MAX_WIDTH = 1200
const QUALITY = 0.82

function compressImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      let { width, height } = img
      if (width > MAX_WIDTH) { height = Math.round((height * MAX_WIDTH) / width); width = MAX_WIDTH }
      canvas.width = width; canvas.height = height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, width, height)
      canvas.toBlob(blob => {
        if (!blob) return reject(new Error('Compression échouée'))
        resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.webp'), { type: 'image/webp' }))
      }, 'image/webp', QUALITY)
    }
    img.onerror = () => reject(new Error('Image invalide'))
    img.src = URL.createObjectURL(file)
  })
}

export function useImageUpload(noteId) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState(null)

  const upload = useCallback(async (file) => {
    if (!file) return null
    setUploading(true); setError(null); setProgress(10)
    try {
      if (!file.type.startsWith('image/')) throw new Error('Seules les images sont acceptées')
      setProgress(30)
      const compressed = await compressImage(file)
      if (compressed.size > MAX_SIZE) throw new Error('Image trop volumineuse (max 2 Mo)')
      setProgress(50)
      const storage = getStorage()
      const timestamp = Date.now()
      const fileName = `${timestamp}_${compressed.name}`
      const storageRef = ref(storage, `fiche-images/${noteId || 'draft'}/${fileName}`)
      await uploadBytes(storageRef, compressed)
      setProgress(80)
      const url = await getDownloadURL(storageRef)
      setProgress(100)
      return { url, path: storageRef.fullPath, name: compressed.name, size: compressed.size }
    } catch (e) { setError(e.message); return null }
    finally { setUploading(false); setTimeout(() => setProgress(0), 500) }
  }, [noteId])

  const deleteImage = useCallback(async (path) => {
    try { const storage = getStorage(); await deleteObject(ref(storage, path)); return true }
    catch (e) { console.error('Delete error:', e); return false }
  }, [])

  return { upload, deleteImage, uploading, progress, error }
}

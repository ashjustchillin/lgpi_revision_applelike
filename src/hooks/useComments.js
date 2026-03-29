import { useState, useEffect, useCallback } from 'react'
import { collection, getDocs, addDoc, deleteDoc, doc, orderBy, query } from 'firebase/firestore'
import { db } from '../lib/firebase'

export function useComments(noteId) {
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchComments = useCallback(async () => {
    if (!noteId) return
    setLoading(true)
    try {
      const q = query(collection(db, 'comments_' + noteId), orderBy('createdAt', 'asc'))
      const snap = await getDocs(q)
      setComments(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    } catch (e) {
      // orderBy peut echouer sans index - fallback sans tri
      try {
        const snap = await getDocs(collection(db, 'comments_' + noteId))
        setComments(snap.docs.map(d => ({ id: d.id, ...d.data() }))
          .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0)))
      } catch { setComments([]) }
    } finally {
      setLoading(false)
    }
  }, [noteId])

  useEffect(() => { fetchComments() }, [fetchComments])

  const addComment = useCallback(async (text, author) => {
    if (!noteId || !text.trim()) return
    await addDoc(collection(db, 'comments_' + noteId), {
      text: text.trim(),
      author: author || 'Anonyme',
      createdAt: Date.now(),
    })
    await fetchComments()
  }, [noteId, fetchComments])

  const deleteComment = useCallback(async (commentId) => {
    await deleteDoc(doc(db, 'comments_' + noteId, commentId))
    await fetchComments()
  }, [noteId, fetchComments])

  return { comments, loading, addComment, deleteComment, refresh: fetchComments }
}

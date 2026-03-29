import { useState, useEffect, useCallback } from 'react'
import { collection, getDocs, addDoc, setDoc, deleteDoc, doc, query, where } from 'firebase/firestore'
import { db } from '../lib/firebase'

export function usePersonalNotes(userId) {
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchNotes = useCallback(async () => {
    if (!userId) { setNotes([]); setLoading(false); return }
    try {
      const snap = await getDocs(collection(db, 'notes_perso_' + userId))
      setNotes(snap.docs.map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)))
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchNotes()
  }, [fetchNotes])

  const saveNote = useCallback(async (data) => {
    if (!userId) return
    const col = collection(db, 'notes_perso_' + userId)
    if (data.id) {
      const { id, ...rest } = data
      await setDoc(doc(col, id), { ...rest, updatedAt: Date.now() })
    } else {
      await addDoc(col, { ...data, createdAt: Date.now(), updatedAt: Date.now() })
    }
    await fetchNotes()
  }, [userId, fetchNotes])

  const deleteNote = useCallback(async (id) => {
    if (!userId) return
    await deleteDoc(doc(db, 'notes_perso_' + userId, id))
    await fetchNotes()
  }, [userId, fetchNotes])

  return { notes, loading, saveNote, deleteNote, refresh: fetchNotes }
}

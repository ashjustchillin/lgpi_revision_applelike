import { useState, useEffect, useCallback } from 'react'
import { collection, getDocs, addDoc, setDoc, deleteDoc, doc } from 'firebase/firestore'
import { db } from '../lib/firebase'

const CACHE_KEY = 'lgpi-cache'
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

function loadCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const { notes, mods, ts } = JSON.parse(raw)
    if (Date.now() - ts > CACHE_TTL) return null
    return { notes, mods }
  } catch { return null }
}

function saveCache(notes, mods) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ notes, mods, ts: Date.now() }))
  } catch {}
}

function clearCache() {
  try { localStorage.removeItem(CACHE_KEY) } catch {}
}

export function useFirebase() {
  // Initialiser depuis le cache pour affichage instantane
  const [notes, setNotes] = useState(() => loadCache()?.notes || [])
  const [mods, setMods] = useState(() => loadCache()?.mods || [])
  const [syncState, setSyncState] = useState(() => loadCache() ? 'ok' : 'syncing')

  const fetchAll = useCallback(async (silent = false) => {
    try {
      if (!silent) setSyncState('syncing')
      const [ms, ns] = await Promise.all([
        getDocs(collection(db, 'modules')),
        getDocs(collection(db, 'notes')),
      ])
      const newMods = ms.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))
      const newNotes = ns.docs.map(d => ({ id: d.id, ...d.data() }))
      setMods(newMods)
      setNotes(newNotes)
      saveCache(newNotes, newMods)
      setSyncState('ok')
    } catch (err) {
      console.error(err)
      setSyncState('error')
    }
  }, [])

  useEffect(() => {
    // Si cache present, sync en silence en arriere-plan
    const cached = loadCache()
    if (cached) {
      fetchAll(true)
    } else {
      fetchAll(false)
    }
    // Sync toutes les 60s au lieu de 30s (cache reduit la charge)
    const interval = setInterval(() => fetchAll(true), 60000)
    return () => clearInterval(interval)
  }, [fetchAll])

  const saveNote = useCallback(async data => {
    setSyncState('syncing')
    try {
      if (data.id) {
        const { id, ...rest } = data
        await setDoc(doc(db, 'notes', id), rest)
      } else {
        await addDoc(collection(db, 'notes'), data)
      }
      clearCache()
      await fetchAll(false)
    } catch (e) {
      console.error(e)
      setSyncState('error')
      throw e
    }
  }, [fetchAll])

  const deleteNote = useCallback(async id => {
    setSyncState('syncing')
    try {
      await deleteDoc(doc(db, 'notes', id))
      clearCache()
      await fetchAll(false)
    } catch (e) {
      console.error(e)
      setSyncState('error')
    }
  }, [fetchAll])

  const saveMod = useCallback(async data => {
    setSyncState('syncing')
    try {
      await addDoc(collection(db, 'modules'), { ...data, createdAt: Date.now() })
      clearCache()
      await fetchAll(false)
    } catch (e) {
      console.error(e)
      setSyncState('error')
      throw e
    }
  }, [fetchAll])

  const deleteMod = useCallback(async id => {
    setSyncState('syncing')
    try {
      await deleteDoc(doc(db, 'modules', id))
      const toDelete = notes.filter(n => n.module === id)
      await Promise.all(toDelete.map(n => deleteDoc(doc(db, 'notes', n.id))))
      clearCache()
      await fetchAll(false)
    } catch (e) {
      console.error(e)
      setSyncState('error')
    }
  }, [notes, fetchAll])

  return { notes, mods, syncState, saveNote, deleteNote, saveMod, deleteMod, refresh: fetchAll }
}

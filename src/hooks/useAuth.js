import { useState, useCallback } from 'react'

const STORAGE_KEY = 'lgpi-auth'

// Mots de passe — change-les à ta guise
const PASSWORDS = {
  admin: 'admin',   // Toi — accès complet
  reader: 'na',       // Collègues — lecture seule
}

function loadAuth() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const { role, expires } = JSON.parse(raw)
    if (Date.now() > expires) { localStorage.removeItem(STORAGE_KEY); return null }
    return role
  } catch { return null }
}

export function useAuth() {
  const [role, setRole] = useState(loadAuth)
  const [error, setError] = useState('')

  const login = useCallback((password) => {
    if (password === PASSWORDS.admin) {
      const data = { role: 'admin', expires: Date.now() + 30 * 24 * 60 * 60 * 1000 } // 30 jours
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
      setRole('admin')
      setError('')
      return true
    }
    if (password === PASSWORDS.reader) {
      const data = { role: 'reader', expires: Date.now() + 30 * 24 * 60 * 60 * 1000 }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
      setRole('reader')
      setError('')
      return true
    }
    setError('Mot de passe incorrect')
    return false
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setRole(null)
  }, [])

  return {
    role,
    isAdmin: role === 'admin',
    isReader: role === 'reader',
    isLoggedIn: role !== null,
    login,
    logout,
    error,
  }
}

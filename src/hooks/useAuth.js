import { useState, useCallback } from 'react'

const STORAGE_KEY = 'lgpi-auth'
const SESSION_DURATION = 30 * 24 * 60 * 60 * 1000 // 30 jours

// Comptes — mot de passe = initiales, identifiant = initiales
// Change les initiales selon tes vrais collegues
export const ACCOUNTS = {
  admin: {
    password: 'lgpi-admin',
    role: 'admin',
    name: 'Admin',
    color: '#6C63FF',
  },
  JU: {
    password: 'JU',
    role: 'reader',
    name: 'JU',
    color: '#FF6584',
  },
  MB: {
    password: 'MB',
    role: 'reader',
    name: 'MB',
    color: '#43D9AD',
  },
  BO: {
    password: 'BO',
    role: 'reader',
    name: 'BO',
    color: '#FFB547',
  },
  SC: {
    password: 'SC',
    role: 'reader',
    name: 'SC',
    color: '#FF8C42',
  },
  NG: {
    password: 'NG',
    role: 'reader',
    name: 'NG',
    color: '#3B82F6',
  },
}

function loadAuth() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const { userId, expires } = JSON.parse(raw)
    if (Date.now() > expires) { localStorage.removeItem(STORAGE_KEY); return null }
    return userId
  } catch { return null }
}

export function useAuth() {
  const [userId, setUserId] = useState(loadAuth)
  const [error, setError] = useState('')

  const login = useCallback((password) => {
    const match = Object.entries(ACCOUNTS).find(([, acc]) => acc.password === password.trim())
    if (match) {
      const [id] = match
      const data = { userId: id, expires: Date.now() + SESSION_DURATION }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
      setUserId(id)
      setError('')
      return true
    }
    setError('Mot de passe incorrect')
    return false
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setUserId(null)
  }, [])

  const account = userId ? ACCOUNTS[userId] : null

  return {
    userId,
    account,
    role: account?.role || null,
    isAdmin: account?.role === 'admin',
    isLoggedIn: userId !== null,
    login,
    logout,
    error,
  }
}

import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'lgpi-notif'

function loadSettings() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
  } catch { return {} }
}

export function useNotifications() {
  const [permission, setPermission] = useState(() => 'Notification' in window ? Notification.permission : 'unsupported')
  const [settings, setSettings] = useState(() => ({
    enabled: false,
    time: '09:00',
    ...loadSettings(),
  }))

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) return 'unsupported'
    const result = await Notification.requestPermission()
    setPermission(result)
    return result
  }, [])

  const saveSettings = useCallback((newSettings) => {
    const merged = { ...settings, ...newSettings }
    setSettings(merged)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
  }, [settings])

  const sendNotification = useCallback((title, body) => {
    if (permission !== 'granted') return
    new Notification(title, {
      body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
    })
  }, [permission])

  // Vérifier chaque minute si c'est l'heure du rappel
  useEffect(() => {
    if (!settings.enabled || permission !== 'granted') return
    const check = () => {
      const now = new Date()
      const [h, m] = settings.time.split(':').map(Number)
      if (now.getHours() === h && now.getMinutes() === m) {
        const lastNotif = localStorage.getItem('lgpi-last-notif')
        const today = now.toISOString().slice(0, 10)
        if (lastNotif !== today) {
          sendNotification('🃏 LGPI Notes', 'C\'est l\'heure de ta session de révision !')
          localStorage.setItem('lgpi-last-notif', today)
        }
      }
    }
    check()
    const interval = setInterval(check, 60000)
    return () => clearInterval(interval)
  }, [settings, permission, sendNotification])

  return { permission, settings, requestPermission, saveSettings, sendNotification }
}

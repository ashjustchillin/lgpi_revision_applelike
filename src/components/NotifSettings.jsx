import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function NotifSettings({ permission, settings, onRequestPermission, onSaveSettings, onTest }) {
  const [localTime, setLocalTime] = useState(settings.time || '09:00')
  const [localEnabled, setLocalEnabled] = useState(settings.enabled || false)

  const handleToggle = async () => {
    if (!localEnabled && permission !== 'granted') {
      const result = await onRequestPermission()
      if (result !== 'granted') return
    }
    const newEnabled = !localEnabled
    setLocalEnabled(newEnabled)
    onSaveSettings({ enabled: newEnabled, time: localTime })
  }

  const handleTimeChange = (t) => {
    setLocalTime(t)
    onSaveSettings({ enabled: localEnabled, time: t })
  }

  if (permission === 'unsupported') return (
    <p className="text-xs text-gray-400">Les notifications ne sont pas supportées sur ce navigateur.</p>
  )

  return (
    <div className="space-y-3">
      {permission === 'denied' && (
        <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950 rounded-xl">
          <span className="text-sm">⚠️</span>
          <p className="text-xs text-red-500">Les notifications sont bloquées. Autorise-les dans les réglages de ton navigateur.</p>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-zinc-300">Rappel de révision</p>
          <p className="text-xs text-gray-400">Notification quotidienne pour réviser</p>
        </div>
        <button
          onClick={handleToggle}
          className={`relative w-11 h-6 rounded-full transition-colors ${localEnabled && permission === 'granted' ? 'bg-accent' : 'bg-gray-200 dark:bg-zinc-700'}`}
          style={localEnabled && permission === 'granted' ? { background: 'var(--accent)' } : {}}
        >
          <motion.div
            animate={{ x: localEnabled && permission === 'granted' ? 20 : 2 }}
            className="absolute top-1 w-4 h-4 bg-white rounded-full shadow"
          />
        </button>
      </div>

      <AnimatePresence>
        {localEnabled && permission === 'granted' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-3 pt-2">
              <label className="text-xs text-gray-500 font-medium">Heure :</label>
              <input
                type="time"
                value={localTime}
                onChange={e => handleTimeChange(e.target.value)}
                className="text-sm border border-gray-200 dark:border-zinc-700 rounded-lg px-2 py-1 bg-white dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 outline-none"
                style={{ colorScheme: 'auto' }}
              />
              <button
                onClick={() => onTest()}
                className="text-xs text-accent hover:underline"
              >
                Tester
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SyncDot } from './UI'
import { ACCENT_COLORS } from '../lib/firebase'

export default function Header({ title, syncState, darkMode, onDarkToggle, accent, onAccentChange, onHome, onRevision }) {
  const [accentOpen, setAccentOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const accentRef = useRef(null)

  useEffect(() => {
    const handler = e => { if (accentRef.current && !accentRef.current.contains(e.target)) setAccentOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <>
      {/* Header sticky avec glass morphism */}
      <motion.header
        className="flex items-center gap-3 mb-8 sticky top-0 z-30 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 transition-all duration-300"
        style={scrolled ? {
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          background: darkMode ? 'rgba(10,10,10,.85)' : 'rgba(245,245,247,.88)',
          boxShadow: '0 1px 0 rgba(0,0,0,.06)',
        } : {}}
      >
        {/* Logo */}
        <motion.button
          whileHover={{ scale: 1.05 }} whileTap={{ scale: .94 }}
          onClick={onHome}
          className="text-sm font-bold px-3.5 py-2 rounded-xl flex-shrink-0 relative overflow-hidden"
          style={{ color: 'var(--accent)', background: 'var(--accent-bg)' }}
        >
          <motion.span
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            LGPI
          </motion.span>
        </motion.button>

        {/* Title avec animation */}
        <motion.h1
          key={title}
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="text-lg font-semibold tracking-tight flex-1 truncate text-gray-900 dark:text-zinc-100"
        >
          {title}
        </motion.h1>

        {/* Actions desktop */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <SyncDot state={syncState} />

          {/* Dark toggle */}
          <motion.button
            whileTap={{ scale: .88, rotate: 15 }}
            onClick={onDarkToggle}
            className="hidden sm:flex items-center justify-center w-9 h-9 rounded-xl border border-gray-200 dark:border-zinc-700 text-base hover:bg-white dark:hover:bg-zinc-800 transition-colors"
            style={{ backdropFilter: 'blur(8px)' }}
          >
            <motion.span
              key={darkMode ? 'sun' : 'moon'}
              initial={{ rotate: -30, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              {darkMode ? '☀️' : '🌙'}
            </motion.span>
          </motion.button>

          {/* Accent picker */}
          <div className="relative hidden sm:block" ref={accentRef}>
            <motion.button
              whileTap={{ scale: .88 }}
              onClick={() => setAccentOpen(o => !o)}
              className="flex items-center justify-center w-9 h-9 rounded-xl border border-gray-200 dark:border-zinc-700 text-base hover:bg-white dark:hover:bg-zinc-800 transition-colors"
            >
              🎨
            </motion.button>
            <AnimatePresence>
              {accentOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: .92, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: .92 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 400 }}
                  className="absolute right-0 top-full mt-2 rounded-2xl p-3 shadow-xl z-50 flex flex-wrap gap-2 w-44 border border-gray-200 dark:border-zinc-700"
                  style={{
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    background: darkMode ? 'rgba(28,28,30,.9)' : 'rgba(255,255,255,.9)',
                  }}
                >
                  <p className="w-full text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Couleur</p>
                  {ACCENT_COLORS.map(ac => (
                    <motion.button
                      key={ac.hex}
                      whileHover={{ scale: 1.15 }}
                      whileTap={{ scale: .9 }}
                      title={ac.name}
                      onClick={() => { onAccentChange(ac.hex); setAccentOpen(false) }}
                      className="w-7 h-7 rounded-full transition-all relative"
                      style={{ background: ac.hex }}
                    >
                      {ac.hex === accent && (
                        <motion.div
                          layoutId="accent-check"
                          className="absolute inset-0 rounded-full border-2 border-white scale-110"
                        />
                      )}
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Menu mobile */}
          <motion.button
            whileTap={{ scale: .88 }}
            onClick={() => setMobileOpen(true)}
            className="sm:hidden flex items-center justify-center w-9 h-9 rounded-xl border border-gray-200 dark:border-zinc-700 text-base"
          >
            ☰
          </motion.button>
        </div>
      </motion.header>

      {/* Mobile bottom sheet */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 sm:hidden"
            style={{ background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(4px)' }}
            onClick={() => setMobileOpen(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="absolute bottom-0 left-0 right-0 rounded-t-3xl p-6 border-t border-gray-200 dark:border-zinc-700"
              style={{
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                background: darkMode ? 'rgba(18,18,20,.96)' : 'rgba(252,252,253,.96)',
              }}
              onClick={e => e.stopPropagation()}
            >
              {/* Handle */}
              <div className="w-10 h-1 bg-gray-200 dark:bg-zinc-700 rounded-full mx-auto mb-5" />

              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Menu</div>
              {[
                { icon: '🏠', label: 'Accueil', action: () => { onHome(); setMobileOpen(false) } },
                { icon: '🃏', label: 'Mode revision', action: () => { onRevision(); setMobileOpen(false) } },
                { icon: darkMode ? '☀️' : '🌙', label: darkMode ? 'Mode clair' : 'Mode sombre', action: () => { onDarkToggle(); setMobileOpen(false) } },
              ].map((item, i) => (
                <motion.button
                  key={item.label}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  onClick={item.action}
                  className="flex items-center gap-3 w-full py-3.5 border-b border-gray-100 dark:border-zinc-800 text-sm font-medium text-gray-800 dark:text-zinc-200 last:border-0"
                >
                  <span className="text-xl w-8 text-center">{item.icon}</span>
                  {item.label}
                  <span className="ml-auto text-gray-300 dark:text-zinc-600">›</span>
                </motion.button>
              ))}

              {/* Accent colors */}
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-zinc-800">
                <p className="text-xs text-gray-400 mb-3">Couleur accent</p>
                <div className="flex gap-2">
                  {ACCENT_COLORS.map(ac => (
                    <motion.button
                      key={ac.hex}
                      whileTap={{ scale: .88 }}
                      onClick={() => { onAccentChange(ac.hex) }}
                      className="w-8 h-8 rounded-full relative"
                      style={{ background: ac.hex }}
                    >
                      {ac.hex === accent && (
                        <div className="absolute inset-0 rounded-full border-2 border-white scale-110" />
                      )}
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

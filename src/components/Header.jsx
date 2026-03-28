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
    const h = e => { if (accentRef.current && !accentRef.current.contains(e.target)) setAccentOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', h)
    return () => window.removeEventListener('scroll', h)
  }, [])

  return (
    <>
      <motion.header
        className="flex items-center gap-3 mb-8 sticky top-0 z-30 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 transition-all duration-300"
        animate={scrolled ? {
          backdropFilter: 'blur(20px)',
          backgroundColor: darkMode ? 'rgba(17,17,19,.88)' : 'rgba(247,247,248,.88)',
          boxShadow: '0 1px 0 rgba(0,0,0,.06)',
        } : {
          backdropFilter: 'blur(0px)',
          backgroundColor: 'transparent',
          boxShadow: 'none',
        }}
      >
        {/* Logo pill */}
        <motion.button
          whileHover={{ scale: 1.04 }} whileTap={{ scale: .94 }}
          onClick={onHome}
          className="flex-shrink-0 text-xs font-bold px-3 py-1.5 rounded-full"
          style={{ background: 'var(--accent)', color: '#fff', letterSpacing: '.02em' }}
        >
          LGPI
        </motion.button>

        {/* Title */}
        <AnimatePresence mode="wait">
          <motion.h1 key={title}
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
            transition={{ duration: .15 }}
            className="text-base font-semibold flex-1 truncate"
            style={{ color: 'var(--text-1)', letterSpacing: '-.02em' }}
          >
            {title}
          </motion.h1>
        </AnimatePresence>

        {/* Actions */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <SyncDot state={syncState} />

          {/* Dark */}
          <motion.button whileTap={{ scale: .88 }} onClick={onDarkToggle}
            className="hidden sm:flex items-center justify-center w-8 h-8 rounded-full text-sm transition-colors"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-2)' }}
          >
            <motion.span key={darkMode ? 'sun' : 'moon'}
              initial={{ rotate: -20, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }}
            >
              {darkMode ? '☀️' : '🌙'}
            </motion.span>
          </motion.button>

          {/* Accent */}
          <div className="relative hidden sm:block" ref={accentRef}>
            <motion.button whileTap={{ scale: .88 }} onClick={() => setAccentOpen(o => !o)}
              className="flex items-center justify-center w-8 h-8 rounded-full text-sm"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-2)' }}
            >🎨</motion.button>
            <AnimatePresence>
              {accentOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: .9, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: .9 }}
                  transition={{ type: 'spring', damping: 24, stiffness: 400 }}
                  className="absolute right-0 top-full mt-2 rounded-2xl p-3 shadow-xl z-50 w-40 border"
                  style={{
                    backdropFilter: 'blur(24px)',
                    background: darkMode ? 'rgba(28,28,30,.95)' : 'rgba(255,255,255,.95)',
                    borderColor: 'var(--border)',
                    boxShadow: 'var(--shadow-xl)',
                  }}
                >
                  <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-3)' }}>Couleur</p>
                  <div className="flex flex-wrap gap-2">
                    {ACCENT_COLORS.map(ac => (
                      <motion.button key={ac.hex} whileHover={{ scale: 1.15 }} whileTap={{ scale: .9 }}
                        onClick={() => { onAccentChange(ac.hex); setAccentOpen(false) }}
                        className="w-6 h-6 rounded-full relative"
                        style={{ background: ac.hex }}
                        title={ac.name}
                      >
                        {ac.hex === accent && (
                          <motion.div layoutId="accent-ring"
                            className="absolute inset-0 rounded-full border-2 border-white scale-125"
                          />
                        )}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Mobile menu */}
          <motion.button whileTap={{ scale: .88 }} onClick={() => setMobileOpen(true)}
            className="sm:hidden flex items-center justify-center w-8 h-8 rounded-full text-sm"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-2)' }}
          >☰</motion.button>
        </div>
      </motion.header>

      {/* Mobile sheet */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 sm:hidden"
            style={{ background: 'rgba(0,0,0,.4)', backdropFilter: 'blur(4px)' }}
            onClick={() => setMobileOpen(false)}
          >
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="absolute bottom-0 left-0 right-0 rounded-t-3xl p-6"
              style={{
                backdropFilter: 'blur(24px)',
                background: darkMode ? 'rgba(17,17,19,.97)' : 'rgba(252,252,253,.97)',
                borderTop: '1px solid var(--border)',
              }}
              onClick={e => e.stopPropagation()}
            >
              <div className="w-10 h-1 rounded-full mx-auto mb-6" style={{ background: 'var(--border)' }} />
              {[
                { icon: '🏠', label: 'Accueil', action: () => { onHome(); setMobileOpen(false) } },
                { icon: '🃏', label: 'Mode revision', action: () => { onRevision(); setMobileOpen(false) } },
                { icon: darkMode ? '☀️' : '🌙', label: darkMode ? 'Mode clair' : 'Mode sombre', action: () => { onDarkToggle(); setMobileOpen(false) } },
              ].map((item, i) => (
                <motion.button key={item.label}
                  initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * .05 }}
                  onClick={item.action}
                  className="flex items-center gap-3 w-full py-4 border-b text-sm font-medium last:border-0"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-1)' }}
                >
                  <span className="text-lg w-8 text-center">{item.icon}</span>
                  {item.label}
                  <span className="ml-auto" style={{ color: 'var(--text-3)' }}>›</span>
                </motion.button>
              ))}
              <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                <p className="text-xs mb-3" style={{ color: 'var(--text-3)' }}>Couleur accent</p>
                <div className="flex gap-2">
                  {ACCENT_COLORS.map(ac => (
                    <motion.button key={ac.hex} whileTap={{ scale: .88 }}
                      onClick={() => onAccentChange(ac.hex)}
                      className="w-8 h-8 rounded-full relative"
                      style={{ background: ac.hex }}
                    >
                      {ac.hex === accent && <div className="absolute inset-0 rounded-full border-2 border-white scale-110" />}
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

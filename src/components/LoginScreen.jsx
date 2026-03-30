import { useState } from 'react'
import { motion } from '../lib/motion'

export default function LoginScreen({ onLogin, error }) {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPwd, setShowPwd] = useState(false)

  const handleSubmit = async e => {
    e.preventDefault()
    if (!password.trim()) return
    setLoading(true)
    setTimeout(() => {
      onLogin(password)
      setLoading(false)
    }, 400)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'linear-gradient(135deg, #f5f5f7 0%, #e8e8f0 100%)' }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20, scale: .97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', damping: 24, stiffness: 300 }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 18, stiffness: 350, delay: .1 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 text-white text-2xl font-bold shadow-xl"
            style={{
              background: 'var(--accent)',
              boxShadow: '0 8px 32px rgba(108,99,255,.35)',
              letterSpacing: '-.02em',
            }}
          >
            LG
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .15 }}
            className="text-2xl font-bold mb-1"
            style={{ color: 'var(--text-1)', letterSpacing: '-.04em' }}
          >
            LGPI Notes
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .2 }}
            className="text-sm"
            style={{ color: 'var(--text-2)' }}
          >
            Base de connaissances interne
          </motion.p>
        </div>

        {/* Card login */}
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .2 }}
          className="card-base p-6"
          style={{ boxShadow: 'var(--shadow-xl)' }}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                style={{ color: 'var(--text-2)' }}>
                Mot de passe
              </label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Entrez votre mot de passe"
                  className="input-base pr-10"
                  autoFocus
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs"
                  style={{ color: 'var(--text-3)' }}
                >
                  {showPwd ? '🙈' : '👁'}
                </button>
              </div>
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                  className="text-xs mt-1.5 text-red-500 font-medium"
                >
                  {error}
                </motion.p>
              )}
            </div>

            <motion.button
              type="submit"
              disabled={loading || !password.trim()}
              whileTap={{ scale: .97 }}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50"
              style={{
                background: 'var(--accent)',
                boxShadow: '0 4px 16px rgba(108,99,255,.3)',
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
                  Connexion...
                </span>
              ) : 'Se connecter'}
            </motion.button>
          </form>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .35 }}
          className="text-center text-xs mt-4"
          style={{ color: 'var(--text-3)' }}
        >
          Contacte l'administrateur pour obtenir ton mot de passe
        </motion.p>
      </motion.div>
    </div>
  )
}

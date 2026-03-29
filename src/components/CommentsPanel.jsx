import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useComments } from '../hooks/useComments'

export default function CommentsPanel({ noteId, account, isAdmin }) {
  const { comments, loading, addComment, deleteComment } = useComments(noteId)
  const [text, setText] = useState('')
  const [open, setOpen] = useState(false)
  const [sending, setSending] = useState(false)

  const handleSend = async () => {
    if (!text.trim()) return
    setSending(true)
    try {
      await addComment(text, account?.name || 'Anonyme')
      setText('')
    } finally { setSending(false) }
  }

  return (
    <div className="mt-6 pt-6 border-t" style={{ borderColor: 'var(--border)' }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 w-full text-left"
      >
        <span className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>
          💬 Commentaires
        </span>
        {comments.length > 0 && (
          <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
            style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}>
            {comments.length}
          </span>
        )}
        <span className="ml-auto text-xs" style={{ color: 'var(--text-3)' }}>
          {open ? '▲' : '▼'}
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-4 space-y-3">
              {loading ? (
                <div className="flex justify-center py-4">
                  <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin"
                    style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
                </div>
              ) : comments.length === 0 ? (
                <p className="text-xs text-center py-3" style={{ color: 'var(--text-3)' }}>
                  Aucun commentaire pour le moment
                </p>
              ) : (
                <AnimatePresence>
                  {comments.map(c => (
                    <motion.div key={c.id}
                      initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="flex gap-3 group"
                    >
                      {/* Avatar initiale */}
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 mt-0.5"
                        style={{ background: 'var(--accent)' }}>
                        {c.author?.[0] || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2 mb-0.5">
                          <span className="text-xs font-semibold" style={{ color: 'var(--text-1)' }}>{c.author}</span>
                          <span className="text-[10px]" style={{ color: 'var(--text-3)' }}>
                            {c.createdAt ? new Date(c.createdAt).toLocaleDateString('fr', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                          </span>
                        </div>
                        <p className="text-xs leading-relaxed" style={{ color: 'var(--text-2)' }}>{c.text}</p>
                      </div>
                      {/* Supprimer - admin ou auteur */}
                      {(isAdmin || c.author === account?.name) && (
                        <button
                          onClick={() => deleteComment(c.id)}
                          className="opacity-0 group-hover:opacity-100 text-xs transition-opacity flex-shrink-0"
                          style={{ color: '#ef4444' }}
                        >✕</button>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}

              {/* Zone de saisie */}
              <div className="flex gap-2 pt-2">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                  style={{ background: account?.color || 'var(--accent)' }}>
                  {account?.name?.[0] || '?'}
                </div>
                <div className="flex-1 flex gap-2">
                  <input
                    value={text}
                    onChange={e => setText(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                    placeholder="Ajouter un commentaire..."
                    className="input-base text-xs py-2 flex-1"
                  />
                  <motion.button whileTap={{ scale: .94 }} onClick={handleSend}
                    disabled={sending || !text.trim()}
                    className="px-3 py-2 rounded-xl text-xs font-semibold text-white disabled:opacity-40 transition-all"
                    style={{ background: 'var(--accent)' }}
                  >
                    {sending ? '...' : 'Envoyer'}
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

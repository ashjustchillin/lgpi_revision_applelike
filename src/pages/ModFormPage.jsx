import { useState } from 'react'
import { motion } from '../lib/motion'
import { NavBreadcrumb, BackButton } from '../components/UI'
import { EMOJIS, COLORS } from '../lib/firebase'

export default function ModFormPage({ onSave, onCancel }) {
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('📋')
  const [colorIdx, setColorIdx] = useState(0)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!name.trim()) { alert('Le nom est requis.'); return }
    setSaving(true)
    const col = COLORS[colorIdx]
    try {
      await onSave({ label: name.trim(), icon: emoji, bg: col.bg, tc: col.tc, color: col.tc })
    } finally { setSaving(false) }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
      <NavBreadcrumb crumbs={[{ label: 'Accueil', action: onCancel }, { label: 'Nouveau module' }]} />
      <BackButton label="Annuler" onClick={onCancel} />

      <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-gray-200 dark:border-zinc-700 p-6 max-w-lg">

        <div className="mb-4">
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1.5">Nom du module</label>
          <input
            value={name} onChange={e => setName(e.target.value)}
            placeholder="ex: Comptabilité"
            className="input-base"
            onKeyDown={e => e.key === 'Enter' && handleSave()}
          />
        </div>

        <div className="mb-4">
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-2">Icône</label>
          <div className="flex flex-wrap gap-2">
            {EMOJIS.map(e => (
              <motion.button
                key={e} whileTap={{ scale: .9 }}
                onClick={() => setEmoji(e)}
                className="w-10 h-10 rounded-xl border-2 text-xl flex items-center justify-center transition-all"
                style={emoji === e
                  ? { borderColor: 'var(--accent)', background: 'var(--accent-bg)' }
                  : { borderColor: '#e5e7eb', background: 'transparent' }
                }
              >
                {e}
              </motion.button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-2">Couleur</label>
          <div className="flex flex-wrap gap-2">
            {COLORS.map((c, i) => (
              <motion.button
                key={i} whileTap={{ scale: .9 }}
                onClick={() => setColorIdx(i)}
                className="w-8 h-8 rounded-full transition-all"
                style={{
                  background: c.bg,
                  border: `3px solid ${i === colorIdx ? c.tc : 'transparent'}`,
                  transform: i === colorIdx ? 'scale(1.15)' : 'scale(1)',
                }}
              />
            ))}
          </div>
        </div>

        {/* Preview */}
        <div className="mb-5 p-3 rounded-xl" style={{ background: COLORS[colorIdx].bg }}>
          <p className="text-xs font-semibold mb-1" style={{ color: COLORS[colorIdx].tc }}>Aperçu</p>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{emoji}</span>
            <span className="font-semibold text-sm" style={{ color: COLORS[colorIdx].tc }}>{name || 'Nom du module'}</span>
          </div>
        </div>

        <div className="flex gap-3">
          <motion.button
            whileTap={{ scale: .96 }}
            onClick={handleSave}
            disabled={saving}
            className="btn-accent disabled:opacity-60"
          >
            {saving ? 'Création...' : 'Créer le module'}
          </motion.button>
          <button onClick={onCancel} className="btn-ghost">Annuler</button>
        </div>
      </div>
    </motion.div>
  )
}

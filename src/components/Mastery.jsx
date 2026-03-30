import { motion } from '../lib/motion'
import { MASTERY_LEVELS } from '../hooks/useMastery'

export function MasteryBadge({ level, size = 'sm', onClick }) {
  const info = MASTERY_LEVELS[level ?? 0]
  const cls = size === 'lg'
    ? 'text-xs font-semibold px-3 py-1.5 rounded-full gap-1.5'
    : 'text-[10px] font-semibold px-2 py-0.5 rounded-full gap-1'

  return (
    <motion.span
      whileTap={onClick ? { scale: .93 } : {}}
      onClick={onClick}
      className={`inline-flex items-center ${cls} ${onClick ? 'cursor-pointer hover:opacity-80' : ''}`}
      style={{ background: info.bg, color: info.color }}
      title={info.label}
    >
      {info.emoji} {size === 'lg' ? info.label : ''}
    </motion.span>
  )
}

export function MasterySelector({ current, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {MASTERY_LEVELS.map(l => (
        <motion.button
          key={l.id}
          whileTap={{ scale: .93 }}
          onClick={() => onChange(l.id)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border-2"
          style={current === l.id
            ? { background: l.bg, color: l.color, borderColor: l.color }
            : { background: 'transparent', color: '#9ca3af', borderColor: '#e5e7eb' }
          }
        >
          {l.emoji} {l.label}
        </motion.button>
      ))}
    </div>
  )
}

export function MasteryBar({ masteryStats }) {
  const total = masteryStats.reduce((a, l) => a + l.count, 0)
  if (total === 0) return null

  return (
    <div className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-2xl p-4">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
        🏆 Niveaux de maîtrise
      </p>
      {/* Barre empilée */}
      <div className="flex h-3 rounded-full overflow-hidden mb-3 gap-0.5">
        {masteryStats.filter(l => l.count > 0).map(l => (
          <motion.div
            key={l.id}
            initial={{ width: 0 }}
            animate={{ width: `${(l.count / total) * 100}%` }}
            transition={{ duration: .6, delay: l.id * .1 }}
            className="h-full rounded-sm"
            style={{ background: l.color }}
            title={`${l.label} : ${l.count}`}
          />
        ))}
      </div>
      {/* Légende */}
      <div className="flex flex-wrap gap-3">
        {masteryStats.map(l => (
          <div key={l.id} className="flex items-center gap-1.5">
            <span className="text-sm">{l.emoji}</span>
            <span className="text-xs text-gray-500 dark:text-zinc-400">{l.label}</span>
            <span className="text-xs font-semibold" style={{ color: l.color }}>{l.count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

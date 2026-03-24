import { motion } from 'framer-motion'

const NAV_ITEMS = [
  { id: 'home',     icon: '🏠', label: 'Accueil'  },
  { id: 'search',   icon: '⌕',  label: 'Recherche' },
  { id: 'revision', icon: '🃏', label: 'Revision'  },
  { id: 'planning', icon: '📅', label: 'Planning'  },
]

export default function BottomNav({ page, onNavigate, srsCount = 0 }) {
  return (
    <nav className="bottom-nav sm:hidden">
      {NAV_ITEMS.map(item => {
        const active = page === item.id || (item.id === 'home' && !['revision','planning','search'].includes(page))
        return (
          <motion.button
            key={item.id}
            whileTap={{ scale: .88 }}
            onClick={() => onNavigate(item.id)}
            className="flex flex-col items-center gap-0.5 px-3 py-1 relative"
          >
            <span className={`text-xl transition-all ${active ? 'scale-110' : 'opacity-50'}`}>
              {item.icon}
            </span>
            <span className={`text-[10px] font-medium transition-colors ${active ? 'text-accent' : 'text-gray-400'}`}
              style={active ? { color: 'var(--accent)' } : {}}
            >
              {item.label}
            </span>
            {item.id === 'revision' && srsCount > 0 && (
              <span className="absolute -top-0.5 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {srsCount > 9 ? '9+' : srsCount}
              </span>
            )}
            {active && (
              <motion.div
                layoutId="nav-indicator"
                className="absolute -bottom-2 w-1 h-1 rounded-full"
                style={{ background: 'var(--accent)' }}
              />
            )}
          </motion.button>
        )
      })}
    </nav>
  )
}

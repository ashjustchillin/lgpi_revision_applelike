import { motion } from 'framer-motion'

export default function BottomNav({ page, onNavigate, srsCount = 0, account }) {
  const NAV_ITEMS = [
    { id: 'home',     icon: '🏠', label: 'Accueil'  },
    { id: 'search',   icon: '⌕',  label: 'Recherche' },
    { id: 'revision', icon: '🃏', label: 'Revision'  },
    { id: 'perso',    icon: '📝', label: account?.name?.split(' ')[0] || 'Mes notes' },
  ]

  return (
    <nav className="bottom-nav sm:hidden">
      {NAV_ITEMS.map(item => {
        const active = item.id === page ||
          (item.id === 'home' && !['revision', 'perso', 'search'].includes(page))
        const accent = item.id === 'perso' && account?.color ? account.color : 'var(--accent)'

        return (
          <motion.button
            key={item.id}
            whileTap={{ scale: .85 }}
            onClick={() => onNavigate(item.id)}
            className="flex flex-col items-center gap-0.5 px-3 py-1 relative"
          >
            <div className="relative">
              <span className={`text-xl transition-all ${active ? 'scale-110' : 'opacity-40'}`}>
                {item.icon}
              </span>
              {item.id === 'revision' && srsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {srsCount > 9 ? '9+' : srsCount}
                </span>
              )}
            </div>
            <span className="text-[10px] font-medium transition-colors"
              style={{ color: active ? accent : 'var(--text-3)' }}
            >
              {item.label}
            </span>
            {active && (
              <motion.div layoutId="nav-dot"
                className="absolute -bottom-1.5 w-1 h-1 rounded-full"
                style={{ background: accent }}
              />
            )}
          </motion.button>
        )
      })}
    </nav>
  )
}

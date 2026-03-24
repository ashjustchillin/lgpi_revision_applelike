import { motion, AnimatePresence } from 'framer-motion'
import { SkeletonTile } from '../components/UI'
import Planning from '../components/Planning'
import HistoryPanel from '../components/HistoryPanel'
import StatsPanel from '../components/StatsPanel'
import NotifSettings from '../components/NotifSettings'
import DataIO from '../components/DataIO'
import FicheduJour from '../components/FicheduJour'
import { MasteryBar } from '../components/Mastery'
import { useSearch, highlight } from '../hooks/useSearch'

const container = { hidden: {}, show: { transition: { staggerChildren: .05 } } }
const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }

export default function HomePage({
  mods, notes, syncState,
  onModule, onAddMod, onDeleteMod, onRevision,
  history, onFiche,
  stats, streak, last7Days, globalScore, totalReviewed, worstNotes, onClearStats,
  notifPermission, notifSettings, onRequestNotifPermission, onSaveNotifSettings, onTestNotif,
  onExportJSON, onImportJSON, onImportFiches,
  getMasteryLevel, masteryStats, srsStats,
}) {
  const { query, setQuery, results, clear } = useSearch(notes, mods, 200)
  const loading = syncState === 'syncing' && mods.length === 0

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="pb-20 sm:pb-0 relative z-10">

      {/* Search */}
      <div className="relative mb-5">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-base pointer-events-none">⌕</span>
        <input
          id="global-search" type="text" value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Rechercher dans toutes les fiches..."
          className="w-full pl-11 pr-10 py-3 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-2xl text-sm outline-none transition-all"
          onFocus={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-light)' }}
          onBlur={e => { e.target.style.borderColor = ''; e.target.style.boxShadow = '' }}
        />
        {query && (
          <button onClick={clear} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm">✕</button>
        )}
      </div>

      {/* Résultats recherche */}
      <AnimatePresence>
        {query && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <p className="text-xs text-gray-400 font-medium mb-3">
              {results.length} fiche{results.length !== 1 ? 's' : ''} pour "{query}"
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {results.map(n => (
                <motion.div key={n.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                  onClick={() => onFiche(n.id, n.module)}
                  className="card-base p-4 cursor-pointer hover:-translate-y-0.5 hover:shadow-md transition-all"
                >
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full mb-2" style={{ background: n.mod.bg, color: n.mod.tc }}>
                    {n.mod.icon} {n.mod.label}
                  </span>
                  <p className="text-sm font-semibold text-gray-800 dark:text-zinc-200 mb-1"
                    dangerouslySetInnerHTML={{ __html: highlight(n.title, query) }} />
                  <p className="text-xs text-gray-400 line-clamp-2"
                    dangerouslySetInnerHTML={{ __html: highlight(n.excerpt, query) }} />
                  {n.matchField !== 'titre' && n.matchField !== 'contenu' && (
                    <span className="text-[10px] text-accent mt-1 block">dans : {n.matchField}</span>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!query && (
        <>
          {/* Fiche du jour */}
          <FicheduJour notes={notes} mods={mods} onFiche={onFiche} getLevel={getMasteryLevel} />

          {/* Historique */}
          <HistoryPanel history={history} notes={notes} mods={mods} onFiche={onFiche} />

          {/* Barre d'actions */}
          <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
            <p className="text-sm text-gray-400">Sélectionne un module</p>
            <div className="flex items-center gap-2">
              <NotifSettings
                permission={notifPermission} settings={notifSettings}
                onRequestPermission={onRequestNotifPermission}
                onSaveSettings={onSaveNotifSettings}
                onTest={onTestNotif}
              />
              <DataIO notes={notes} mods={mods} onImport={onImportJSON} onImportFiches={onImportFiches} />
            </div>
          </div>

          {/* Modules */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
              {Array.from({ length: 4 }).map((_, i) => <SkeletonTile key={i} />)}
            </div>
          ) : (
            <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
              {mods.map(m => {
                const cnt = notes.filter(n => n.module === m.id).length
                return (
                  <motion.button key={m.id} variants={item} whileTap={{ scale: .97 }}
                    onClick={() => onModule(m.id)}
                    className="relative text-left p-4 rounded-2xl border-0 transition-all group hover:-translate-y-1"
                    style={{ background: m.bg }}
                  >
                    <button onClick={e => { e.stopPropagation(); if (confirm('Supprimer ' + m.label + ' ?')) onDeleteMod(m.id) }}
                      className="absolute top-2 right-2 w-5 h-5 rounded-full text-[10px] items-center justify-center hidden group-hover:flex"
                      style={{ background: 'rgba(0,0,0,.15)', color: '#fff' }}
                    >✕</button>
                    <div className="text-2xl mb-2">{m.icon}</div>
                    <p className="text-sm font-semibold mb-0.5" style={{ color: m.tc }}>{m.label}</p>
                    <p className="text-xs opacity-60" style={{ color: m.tc }}>{cnt} fiche{cnt !== 1 ? 's' : ''}</p>
                  </motion.button>
                )
              })}
              <motion.button variants={item} whileTap={{ scale: .97 }} onClick={onAddMod}
                className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 border-dashed border-gray-200 dark:border-zinc-700 text-gray-400 text-sm font-medium transition-all min-h-[115px] hover:border-accent hover:text-accent"
              >
                <span className="text-2xl">+</span>
                <span>Nouveau module</span>
              </motion.button>
            </motion.div>
          )}

          <div className="flex justify-end mb-2">
            <motion.button whileTap={{ scale: .97 }} onClick={onRevision}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-accent-soft text-accent"
            >🃏 Mode révision</motion.button>
          </div>

          {/* Barre de maîtrise */}
          {masteryStats && masteryStats.some(l => l.count > 0) && (
            <div className="mb-2">
              <MasteryBar masteryStats={masteryStats} />
            </div>
          )}
        </>
      )}

      <div id="planning-section"><Planning /></div>

      <StatsPanel
        stats={stats} streak={streak} last7Days={last7Days}
        globalScore={globalScore} totalReviewed={totalReviewed}
        worstNotes={worstNotes} mods={mods}
        onFiche={onFiche} onClear={onClearStats}
        srsStats={srsStats}
      />
    </motion.div>
  )
}

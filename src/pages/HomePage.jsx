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

const container = { hidden: {}, show: { transition: { staggerChildren: .06 } } }
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { type: 'spring', damping: 22, stiffness: 300 } } }

export default function HomePage({
  mods, notes, syncState,
  onModule, onAddMod, onDeleteMod, onRevision,
  history, onFiche,
  stats, streak, last7Days, globalScore, totalReviewed, worstNotes, onClearStats,
  notifPermission, notifSettings, onRequestNotifPermission, onSaveNotifSettings, onTestNotif,
  onImportJSON, onImportFiches,
  getMasteryLevel, masteryStats, srsStats,
}) {
  const { query, setQuery, results, clear } = useSearch(notes, mods, 200)
  const loading = syncState === 'syncing' && mods.length === 0

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-24 sm:pb-0">

      {/* Hero section */}
      <div className="mb-8">
        <motion.p
          initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
          className="text-xs font-semibold uppercase tracking-widest mb-1"
          style={{ color: 'var(--accent)' }}
        >
          Base de connaissances
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .05 }}
          className="text-3xl font-bold tracking-tight leading-tight"
          style={{ color: 'var(--text-1)', letterSpacing: '-.04em' }}
        >
          Mes fiches LGPI
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .1 }}
          className="text-sm mt-1"
          style={{ color: 'var(--text-2)' }}
        >
          {notes.length} fiche{notes.length !== 1 ? 's' : ''} · {mods.length} module{mods.length !== 1 ? 's' : ''}
        </motion.p>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base pointer-events-none" style={{ color: 'var(--text-3)' }}>⌕</span>
        <input
          id="global-search" type="text" value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Rechercher dans toutes les fiches..."
          className="input-base pl-11 pr-10 py-3.5 rounded-2xl text-sm"
          style={{ fontSize: '.9rem' }}
        />
        {query && (
          <button onClick={clear} className="absolute right-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--text-3)' }}>✕</button>
        )}
      </div>

      {/* Search results */}
      <AnimatePresence>
        {query && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <p className="text-xs font-medium mb-3" style={{ color: 'var(--text-2)' }}>
              {results.length} fiche{results.length !== 1 ? 's' : ''} pour "{query}"
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-6">
              {results.map(n => (
                <motion.div key={n.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                  onClick={() => onFiche(n.id, n.module)}
                  className="card-base p-4 cursor-pointer"
                  whileHover={{ y: -2, boxShadow: 'var(--shadow-md)' }}
                >
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full mb-2"
                    style={{ background: n.mod.bg, color: n.mod.tc }}>
                    {n.mod.icon} {n.mod.label}
                  </span>
                  <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-1)' }}
                    dangerouslySetInnerHTML={{ __html: highlight(n.title, query) }} />
                  <p className="text-xs leading-relaxed line-clamp-2" style={{ color: 'var(--text-2)' }}
                    dangerouslySetInnerHTML={{ __html: highlight(n.excerpt, query) }} />
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

          {/* Actions bar */}
          <div className="flex items-center justify-between flex-wrap gap-2 mb-5">
            <div className="flex items-center gap-2">
              <motion.button whileTap={{ scale: .95 }} onClick={onRevision}
                className="btn-accent text-xs"
              >🃏 Revision</motion.button>
              <motion.button whileTap={{ scale: .95 }} onClick={onAddMod}
                className="btn-ghost text-xs"
              >+ Module</motion.button>
            </div>
            <div className="flex items-center gap-2">
              <NotifSettings permission={notifPermission} settings={notifSettings}
                onRequestPermission={onRequestNotifPermission}
                onSaveSettings={onSaveNotifSettings} onTest={onTestNotif} />
              <DataIO notes={notes} mods={mods} onImport={onImportJSON} onImportFiches={onImportFiches} />
            </div>
          </div>

          {/* Modules grid V2 — layout plus espacé */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
              {Array.from({ length: 4 }).map((_, i) => <SkeletonTile key={i} />)}
            </div>
          ) : (
            <motion.div variants={container} initial="hidden" animate="show"
              className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6"
            >
              {mods.map(m => {
                const cnt = notes.filter(n => n.module === m.id).length
                return (
                  <motion.button key={m.id} variants={item}
                    onClick={() => onModule(m.id)}
                    whileHover={{ y: -4, boxShadow: '0 16px 40px rgba(0,0,0,.12)' }}
                    whileTap={{ scale: .96 }}
                    transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                    className="relative text-left p-5 rounded-2xl group border-0"
                    style={{ background: m.bg }}
                  >
                    {/* Delete btn */}
                    <button
                      onClick={e => { e.stopPropagation(); if (confirm('Supprimer ' + m.label + ' ?')) onDeleteMod(m.id) }}
                      className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full text-[10px] items-center justify-center hidden group-hover:flex"
                      style={{ background: 'rgba(0,0,0,.12)', color: '#fff' }}
                    >✕</button>

                    {/* Icon avec fond */}
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 text-xl"
                      style={{ background: 'rgba(255,255,255,.4)' }}>
                      {m.icon}
                    </div>
                    <p className="text-sm font-bold leading-tight mb-0.5" style={{ color: m.tc, letterSpacing: '-.02em' }}>{m.label}</p>
                    <p className="text-xs font-medium" style={{ color: m.tc, opacity: .6 }}>
                      {cnt} fiche{cnt !== 1 ? 's' : ''}
                    </p>

                    {/* Accent corner */}
                    <div className="absolute bottom-0 right-0 w-12 h-12 rounded-tl-3xl opacity-20"
                      style={{ background: m.tc }} />
                  </motion.button>
                )
              })}

              {/* Add module */}
              <motion.button variants={item}
                onClick={onAddMod} whileTap={{ scale: .96 }}
                className="flex flex-col items-center justify-center gap-2 p-5 rounded-2xl border-2 border-dashed text-sm font-medium transition-colors min-h-[130px]"
                style={{ borderColor: 'var(--border)', color: 'var(--text-3)' }}
                whileHover={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}
              >
                <span className="text-2xl">+</span>
                <span>Nouveau</span>
              </motion.button>
            </motion.div>
          )}

          {/* Mastery bar */}
          {masteryStats?.some(l => l.count > 0) && (
            <div className="mb-6"><MasteryBar masteryStats={masteryStats} /></div>
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

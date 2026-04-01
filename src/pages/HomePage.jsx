import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from '../lib/motion'
import { SkeletonTile, SectionTitle, ViewToggle } from '../components/UI'
import Planning from '../components/Planning'
import HistoryPanel from '../components/HistoryPanel'
import StatsPanel from '../components/StatsPanel'
import NotifSettings from '../components/NotifSettings'
import DataIO from '../components/DataIO'
import FicheduJour from '../components/FicheduJour'
import { MasteryBar } from '../components/Mastery'
import { useSearch, highlight } from '../hooks/useSearch'
import { useSearchHistory } from '../hooks/useSearchHistory'
import { BadgesPanel } from '../components/Badges'
import { usePullToRefresh } from '../hooks/useSwipe'

const container = { hidden: {}, show: { transition: { staggerChildren: .05 } } }
const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }

export default function HomePage({
  mods, notes, syncState,
  onModule, onAddMod, onDeleteMod, onRevision, onExplorer,
  history, onFiche,
  stats, streak, last7Days, globalScore, totalReviewed, worstNotes, onClearStats,
  notifPermission, notifSettings, onRequestNotifPermission, onSaveNotifSettings, onTestNotif,
  onImportJSON, onImportFiches,
  getMasteryLevel, masteryStats, srsStats,
  isAdmin, onDashboard, onZendesk, userId,
  onRefresh, allBadges, account,
}) {
  const { query, setQuery, results, clear } = useSearch(notes, mods, 200)
  const { history: searchHistory, addSearch, removeSearch } = useSearchHistory()
  const [activeTag, setActiveTag] = useState(null)
  const [modView, setModView] = useState(() => localStorage.getItem('lgpi-mod-view') || 'grid')
  const loading = syncState === 'syncing' && mods.length === 0

  const { onTouchStart, onTouchEnd, onTouchMove } = usePullToRefresh(
    async () => { if (onRefresh) await onRefresh() },
    80
  )

  const handleSearch = useCallback((q) => {
    setQuery(q)
    if (!q) setActiveTag(null)
  }, [setQuery])

  const handleSearchSubmit = useCallback(() => {
    if (query.trim()) addSearch(query.trim())
  }, [query, addSearch])

  const handleTagClick = useCallback((tag) => {
    setActiveTag(t => t === tag ? null : tag)
    setQuery(activeTag === tag ? '' : tag)
  }, [activeTag, setQuery])

  const changeModView = (v) => {
    setModView(v)
    localStorage.setItem('lgpi-mod-view', v)
  }

  const allTags = [...new Set(notes.flatMap(n => n.tags || []))].slice(0, 12)

  // Style Large Screen : Cartes aérées, fond propre
  const cleanCard = "bg-white dark:bg-[var(--surface)] rounded-2xl border border-[var(--border)] shadow-sm hover:shadow-md transition-all"
  const cleanInput = "bg-[var(--surface-2)] dark:bg-[var(--surface-3)] border border-[var(--border)] focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/10"

  return (
    <div className="min-h-screen bg-[var(--surface-2)] selection:bg-[var(--accent)] selection:text-white">
      
      {/* --- ARRIÈRE-PLAN SUBTIL --- */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden opacity-40 dark:opacity-20">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.15, 0.1] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-[120px]"
          style={{ background: 'var(--accent)' }} 
        />
      </div>

      {/* --- CONTENU LARGE (Utilise toute la largeur disponible) --- */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        // MODIF ICI: max-w-7xl au lieu de max-w-4xl pour respirer
        className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 py-8 sm:py-12"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onTouchMove={onTouchMove}
      >
        {/* 1. HEADER */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <motion.p initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
              className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--text-3)' }}>
              Espace de travail
            </motion.p>
            <motion.h1 initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .05 }}
              className="text-4xl sm:text-5xl font-bold tracking-tight"
              style={{ color: 'var(--text-1)', letterSpacing: '-.03em' }}>
              {account?.name || 'Utilisateur'}
            </motion.h1>
          </div>
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-md flex-shrink-0"
            style={{ background: account?.color || 'var(--accent)' }}
          >
            {account?.name?.[0] || '?'}
          </motion.div>
        </div>

        {/* 2. ACTIONS RAPIDES */}
        <div className="flex items-center gap-5 mb-12 overflow-x-auto pb-2 scrollbar-hide">
          <motion.button
            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
            onClick={onRevision}
            className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-lg text-white shadow-lg shadow-[var(--accent)]/30 hover:scale-105 active:scale-95 transition-all flex-shrink-0`}
            style={{ background: 'var(--accent)' }}
          >
            <span className="text-2xl">🃏</span>
            <span className="hidden sm:inline">Réviser</span>
            {srsStats?.due > 0 && <span className="bg-white/20 px-3 py-1 rounded-full text-sm ml-2">{srsStats.due}</span>}
          </motion.button>

          <motion.button
            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 }}
            onClick={onExplorer}
            className={`${cleanCard} flex items-center gap-3 px-8 py-4 flex-shrink-0 hover:border-[var(--accent)]`}
          >
            <span className="text-2xl">📚</span>
            <span className="hidden sm:inline font-bold text-[var(--text-1)]">Explorer</span>
          </motion.button>
          
          {isAdmin && (
             <div className="hidden lg:flex gap-3 ml-auto">
                {onDashboard && <button onClick={onDashboard} className="px-6 py-3 rounded-xl text-sm font-bold hover:bg-[var(--surface-2)] transition-colors text-[var(--text-2)] border border-transparent hover:border-[var(--border)]">Dashboard</button>}
                {onAddMod && <button onClick={onAddMod} className="px-6 py-3 rounded-xl text-sm font-bold bg-[var(--accent)] text-white hover:opacity-90 transition-opacity">+ Module</button>}
             </div>
          )}
        </div>

        {/* 3. SEARCH */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="relative mb-12"
        >
          <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl pointer-events-none text-[var(--text-3)]">⌕</span>
          <input
            id="global-search"
            type="text"
            value={query}
            onChange={e => handleSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearchSubmit()}
            onBlur={handleSearchSubmit}
            placeholder={`Rechercher dans ${notes.length} fiches...`}
            className={`w-full pl-16 pr-20 py-5 rounded-2xl text-xl outline-none transition-all ${cleanInput}`}
            style={{ color: 'var(--text-1)' }}
          />
          {!query && (
            <kbd className="absolute right-6 top-1/2 -translate-y-1/2 text-sm px-4 py-2 rounded-md font-mono bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-3)] hidden sm:inline-block">
              ⌘ K
            </kbd>
          )}
        </motion.div>

        {/* 4. MODULES (Grille plus large) */}
        {!query && (
          <div className="mb-16">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-bold text-[var(--text-1)]">Vos Modules</h3>
              <ViewToggle view={modView} onChange={changeModView} />
            </div>

            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {Array.from({ length: 5 }).map((_, i) => <SkeletonTile key={i} />)}
              </div>
            ) : modView === 'grid' ? (
              <motion.div variants={container} initial="hidden" animate="show"
                // MODIF ICI: gap-6 pour plus d'espace, et 5 colonnes sur très grands écrans
                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6"
              >
                {mods.map(m => {
                  const cnt = notes.filter(n => n.module === m.id).length
                  return (
                    <motion.button key={m.id} variants={item}
                      onClick={() => onModule(m.id)}
                      whileHover={{ y: -5 }}
                      whileTap={{ scale: .98 }}
                      className={`${cleanCard} text-left p-8 relative overflow-hidden group h-full flex flex-col justify-between`}
                    >
                      {/* Ligne colorée haut */}
                      <div className="absolute top-0 left-0 w-full h-1.5" style={{ background: m.bg }} />
                      
                      <div className="flex justify-between items-start mb-6">
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-sm"
                          style={{ background: m.bg, color: m.tc }}>
                          {m.icon}
                        </div>
                        {isAdmin && (
                          <button
                            onClick={e => { e.stopPropagation(); if (window.confirm('Supprimer ' + m.label + ' ?')) onDeleteMod(m.id) }}
                            className="opacity-0 group-hover:opacity-100 p-2 rounded-lg hover:bg-red-50 text-red-500 transition-all">
                            ✕
                          </button>
                        )}
                      </div>
                      
                      <div>
                        <p className="text-lg font-bold mb-2 text-[var(--text-1)] leading-tight">{m.label}</p>
                        <p className="text-sm font-medium text-[var(--text-3)]">{cnt} fiche{cnt !== 1 ? 's' : ''}</p>
                      </div>
                    </motion.button>
                  )
                })}
                {isAdmin && (
                  <motion.button variants={item} onClick={onAddMod} whileTap={{ scale: .96 }}
                    className="flex flex-col items-center justify-center gap-3 p-8 rounded-2xl border-2 border-dashed text-base font-bold transition-colors min-h-[200px]"
                    style={{ borderColor: 'var(--border)', color: 'var(--text-3)' }}
                    whileHover={{ borderColor: 'var(--accent)', color: 'var(--accent)', background: 'var(--accent-bg)' }}>
                    <span className="text-3xl">+</span>
                    <span>Nouveau Module</span>
                  </motion.button>
                )}
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {mods.map(m => {
                  const cnt = notes.filter(n => n.module === m.id).length
                  return (
                    <motion.button key={m.id}
                      initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                      onClick={() => onModule(m.id)}
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: .98 }}
                      className={`${cleanCard} flex items-center gap-5 p-5 text-left group`}
                    >
                      <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 shadow-sm"
                        style={{ background: m.bg, color: m.tc }}>{m.icon}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-lg font-bold text-[var(--text-1)]">{m.label}</p>
                      </div>
                      <span className="text-sm font-bold flex-shrink-0 bg-[var(--surface-2)] px-3 py-1.5 rounded-lg text-[var(--text-3)]">
                        {cnt}
                      </span>
                    </motion.button>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* RÉSULTATS RECHERCHE */}
        <AnimatePresence>
          {query && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mb-16">
              <p className="text-sm font-bold uppercase tracking-wider mb-6 text-[var(--text-3)]">
                {results.length} Résultat{results.length !== 1 ? 's' : ''}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {results.map(n => (
                  <motion.div key={n.id}
                    initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
                    onClick={() => onFiche(n.id, n.module)}
                    className={`${cleanCard} p-8 cursor-pointer group`}
                    whileHover={{ y: -3, borderColor: 'var(--accent)' }}
                  >
                    <span className="inline-flex items-center gap-2 text-xs font-bold px-3 py-1 rounded-full mb-4"
                      style={{ background: n.mod.bg + 'CC', color: n.mod.tc }}>
                      {n.mod.icon} {n.mod.label}
                    </span>
                    <p className="text-lg font-bold mb-2 text-[var(--text-1)] leading-snug">{n.title}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* SECTIONS BAS DE PAGE */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-24">
          {/* Colonne Gauche */}
          <div className="space-y-8">
            <div className={`${cleanCard} p-8`}>
              <Planning userId={userId} />
            </div>
            <FicheduJour notes={notes} mods={mods} onFiche={onFiche} getLevel={getMasteryLevel} />
            <HistoryPanel history={history} notes={notes} mods={mods} onFiche={onFiche} />
          </div>

          {/* Colonne Droite */}
          <div className="space-y-8">
            <div className={`${cleanCard} p-8`}>
              <h3 className="text-sm font-bold uppercase tracking-wider mb-6 text-[var(--text-3)]">Statistiques</h3>
              <StatsPanel
                stats={stats} streak={streak} last7Days={last7Days}
                globalScore={globalScore} totalReviewed={totalReviewed}
                worstNotes={worstNotes} mods={mods}
                onFiche={onFiche} onClear={onClearStats}
                srsStats={srsStats}
              />
            </div>
            
            {masteryStats?.some(l => l.count > 0) && (
              <div className={`${cleanCard} p-8`}>
                <h3 className="text-sm font-bold uppercase tracking-wider mb-6 text-[var(--text-3)]">Maîtrise</h3>
                <MasteryBar masteryStats={masteryStats} />
              </div>
            )}

            {isAdmin && (
               <div className={`${cleanCard} p-8`}>
                 <h3 className="text-sm font-bold uppercase tracking-wider mb-6 text-[var(--text-3)]">Administration</h3>
                 <div className="flex flex-wrap gap-3">
                    {onDashboard && <button onClick={onDashboard} className="text-base px-5 py-2.5 rounded-xl bg-[var(--surface-2)] hover:bg-[var(--border)] transition-colors font-medium">Dashboard</button>}
                    {onZendesk && <button onClick={onZendesk} className="text-base px-5 py-2.5 rounded-xl bg-[var(--surface-2)] hover:bg-[var(--border)] transition-colors font-medium">Zendesk</button>}
                    <NotifSettings permission={notifPermission} settings={notifSettings} onRequestPermission={onRequestNotifPermission} onSaveSettings={onSaveNotifSettings} onTest={onTestNotif} />
                    <DataIO notes={notes} mods={mods} onImport={onImportJSON} onZendesk={onZendesk} />
                 </div>
               </div>
            )}
            
            {allBadges && allBadges.some(b => b.earnedAt) && (
              <div className={`${cleanCard} p-8`}>
                <BadgesPanel allBadges={allBadges} />
              </div>
            )}
          </div>
        </div>

      </motion.div>
    </div>
  )
}
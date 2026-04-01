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

  // Style Commun "Verre" (Glassmorphism)
  // On adapte la transparence selon le mode sombre
  const glassCard = "bg-white/70 dark:bg-black/60 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-xl shadow-[var(--accent)]/5"
  const glassInput = "bg-white/50 dark:bg-black/40 backdrop-blur-md border border-white/30 dark:border-white/10 focus:bg-white/80 dark:focus:bg-black/60"

  return (
    <div className="min-h-screen relative overflow-hidden selection:bg-[var(--accent)] selection:text-white">
      
      {/* --- ARRIÈRE-PLAN ANIMÉ (L'ambiance) --- */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none transition-colors duration-700" style={{ background: 'var(--surface-2)' }}>
        {/* Blob principal (Couleur accent) */}
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[10%] -left-[10%] w-[60vw] h-[60vw] rounded-full blur-[100px]"
          style={{ background: 'var(--accent)', opacity: 0.2 }} 
        />
        {/* Blob secondaire (Bleu ciel) */}
        <motion.div 
          animate={{ scale: [1, 1.3, 1], x: [0, 50, 0], y: [0, -30, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[20%] right-[-10%] w-[50vw] h-[50vw] rounded-full blur-[120px]"
          style={{ background: '#3b82f6', opacity: 0.15 }} 
        />
        {/* Blob tertiaire (Rose doux) */}
        <motion.div 
          animate={{ scale: [1.1, 1, 1.1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[-10%] left-[20%] w-[40vw] h-[40vw] rounded-full blur-[100px]"
          style={{ background: '#ec4899', opacity: 0.12 }} 
        />
      </div>

      {/* --- CONTENU PRINCIPAL --- */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="relative z-10 pb-24 sm:pb-0"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onTouchMove={onTouchMove}
      >
        {/* 1. HEADER GLASS */}
        <div className="px-5 pt-8 pb-4 flex items-center justify-between">
          <div>
            <motion.p initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
              className="text-[11px] font-bold uppercase tracking-[0.2em] mb-2 opacity-70"
              style={{ color: 'var(--text-1)' }}>
              Bienvenue
            </motion.p>
            <motion.h1 initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .05 }}
              className="text-3xl font-bold tracking-tight"
              style={{ color: 'var(--text-1)', letterSpacing: '-.04em', textShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
              {account?.name || 'Utilisateur'}
            </motion.h1>
          </div>
          {/* Avatar "Orbe" */}
          <motion.div 
            whileHover={{ scale: 1.05, rotate: 5 }}
            className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold shadow-lg shadow-[var(--accent)]/30 flex-shrink-0 relative overflow-hidden group"
            style={{ background: account?.color || 'var(--accent)' }}
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-white/30 to-transparent" />
            {account?.name?.[0] || '?'}
          </motion.div>
        </div>

        {/* 2. BENTO GRID GLASS */}
        <div className="px-5 pb-6">
          <div className="grid grid-cols-2 gap-4 mb-6">
            
            {/* A. HERO CARD (Glass + Gradient) */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
              className="col-span-2 p-6 rounded-[32px] text-white relative overflow-hidden shadow-2xl"
              style={{ 
                background: 'linear-gradient(135deg, var(--accent) 0%, #6366f1 100%)',
                boxShadow: '0 20px 40px -5px rgba(79, 70, 229, 0.4)' 
              }}
            >
              {/* Reflet de verre sur la carte */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none mix-blend-overlay" />
              
              <div className="relative z-10 flex justify-between items-start">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-2">Progression</p>
                  <h3 className="text-3xl font-bold mb-1">{notes.length} Fiches</h3>
                  <p className="text-sm font-medium opacity-90">{mods.length} Modules</p>
                </div>
                <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md">
                  <span className="text-2xl">🚀</span>
                </div>
              </div>
              
              {/* Barre de progression stylisée */}
              <div className="mt-6 pt-4 border-t border-white/20">
                <div className="flex justify-between text-xs mb-2 opacity-90 font-medium">
                  <span>Maîtrise globale</span>
                  <span>{globalScore || 0}%</span>
                </div>
                <div className="h-2 bg-black/20 rounded-full overflow-hidden backdrop-blur-sm">
                  <motion.div 
                    initial={{ width: 0 }} 
                    animate={{ width: `${globalScore || 0}%` }} 
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="h-full bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)]" 
                  />
                </div>
              </div>
            </motion.div>

            {/* B. ACTION CARD: Révision (Glass) */}
            <motion.button
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              onClick={onRevision}
              className={`col-span-1 p-5 rounded-[28px] flex flex-col justify-between h-40 group active:scale-95 transition-all duration-300 ${glassCard} relative overflow-hidden`}
              whileHover={{ y: -4, boxShadow: '0 15px 30px -5px rgba(0,0,0,0.1)' }}
            >
              {/* Fond subtil au survol */}
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent)]/0 to-[var(--accent)]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-2 shadow-lg relative z-10 transition-transform group-hover:scale-110" style={{ background: 'var(--accent)', color: '#fff' }}>
                🃏
              </div>
              <div className="relative z-10">
                <p className="text-xs font-bold uppercase tracking-wider mb-1 opacity-60">Révision</p>
                <p className="text-lg font-bold text-[var(--text-1]">Start</p>
              </div>
              {srsStats?.due > 0 && (
                <span className="absolute top-4 right-4 bg-red-500 text-white text-[10px] font-bold w-6 h-6 flex items-center justify-center rounded-full shadow-lg animate-pulse relative z-10">
                  {srsStats.due}
                </span>
              )}
            </motion.button>

            {/* C. ACTION CARD: Explorer (Glass) */}
            <motion.button
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              onClick={onExplorer}
              className={`col-span-1 p-5 rounded-[28px] flex flex-col justify-between h-40 group active:scale-95 transition-all duration-300 ${glassCard} relative overflow-hidden`}
              whileHover={{ y: -4, boxShadow: '0 15px 30px -5px rgba(0,0,0,0.1)' }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-2 shadow-lg relative z-10 transition-transform group-hover:scale-110" style={{ background: '#3b82f6', color: '#fff' }}>
                📚
              </div>
              <div className="relative z-10">
                <p className="text-xs font-bold uppercase tracking-wider mb-1 opacity-60">Explorer</p>
                <p className="text-lg font-bold text-[var(--text-1]">Voir tout</p>
              </div>
            </motion.button>

            {/* D. SEARCH BAR (Glass Large) */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="col-span-2 relative group"
            >
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-lg pointer-events-none opacity-40 transition-colors group-focus-within:opacity-80">⌕</span>
              <input
                id="global-search"
                type="text"
                value={query}
                onChange={e => handleSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearchSubmit()}
                onBlur={handleSearchSubmit}
                placeholder="Chercher une fiche, un concept..."
                className={`w-full pl-12 pr-14 py-4 rounded-[24px] text-sm outline-none transition-all duration-300 shadow-sm group-focus-within:shadow-lg ${glassInput}`}
                style={{ color: 'var(--text-1)' }}
              />
              {!query && (
                <kbd className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] px-2 py-1 rounded-md font-mono opacity-40 bg-black/5 border border-black/5 dark:bg-white/10 dark:border-white/10">
                  ⌘K
                </kbd>
              )}
            </motion.div>
          </div>
        </div>

        {/* CONTENU (Cartes Glass) */}
        <div className="px-5 pb-6">
          
          {/* RÉSULTATS RECHERCHE */}
          <AnimatePresence>
            {query && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <p className="text-xs font-bold uppercase tracking-wider mb-3 ml-1 opacity-60">
                  {results.length} Résultat{results.length !== 1 ? 's' : ''}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                  {results.map(n => (
                    <motion.div key={n.id}
                      initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                      onClick={() => onFiche(n.id, n.module)}
                      className={`${glassCard} p-4 rounded-2xl cursor-pointer active:scale-98 transition-transform relative overflow-hidden group`}
                      whileHover={{ y: -3 }}
                    >
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full mb-2 border border-white/20 backdrop-blur-sm"
                        style={{ background: n.mod.bg + 'CC', color: n.mod.tc }}>
                        {n.mod.icon} {n.mod.label}
                      </span>
                      <p className="text-sm font-bold mb-1 text-[var(--text-1)]">{n.title}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!query && (
            <>
              {/* Cartes flottantes secondaires */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 mb-6">
                <FicheduJour notes={notes} mods={mods} onFiche={onFiche} getLevel={getMasteryLevel} />
                <HistoryPanel history={history} notes={notes} mods={mods} onFiche={onFiche} />
              </motion.div>

              {/* Outils Admin */}
              <div className="flex items-center justify-between flex-wrap gap-2 mb-6 p-3 rounded-2xl glassCard">
                <div className="flex items-center gap-2 flex-wrap">
                  {isAdmin && onDashboard && (
                    <motion.button whileTap={{ scale: .95 }} onClick={onDashboard} className="text-[11px] px-3 py-1.5 rounded-lg font-medium hover:bg-white/10 transition-colors" style={{ color: 'var(--text-2)' }}>
                      📊 Dashboard
                    </motion.button>
                  )}
                  {isAdmin && onAddMod && (
                    <motion.button whileTap={{ scale: .95 }} onClick={onAddMod} className="text-[11px] px-3 py-1.5 rounded-lg font-medium hover:bg-white/10 transition-colors" style={{ color: 'var(--text-2)' }}>
                      + Module
                    </motion.button>
                  )}
                  {isAdmin && (
                    <>
                      <NotifSettings permission={notifPermission} settings={notifSettings}
                        onRequestPermission={onRequestNotifPermission}
                        onSaveSettings={onSaveNotifSettings} onTest={onTestNotif} />
                      <DataIO notes={notes} mods={mods} onImport={onImportJSON} onZendesk={onZendesk} />
                    </>
                  )}
                </div>
              </div>

              {/* Titre Section */}
              <div className="flex items-center justify-between mb-4 px-1">
                <h3 className="text-lg font-bold text-[var(--text-1]">Modules</h3>
                <ViewToggle view={modView} onChange={changeModView} />
              </div>

              {/* LISTE MODULES (Style Verre) */}
              {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                  {Array.from({ length: 4 }).map((_, i) => <SkeletonTile key={i} />)}
                </div>
              ) : modView === 'grid' ? (
                <motion.div variants={container} initial="hidden" animate="show"
                  className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                  {mods.map(m => {
                    const cnt = notes.filter(n => n.module === m.id).length
                    return (
                      <motion.button key={m.id} variants={item}
                        onClick={() => onModule(m.id)}
                        whileHover={{ y: -6, scale: 1.02 }}
                        whileTap={{ scale: .96 }}
                        className={`relative text-left p-5 rounded-3xl border-2 shadow-lg group transition-all duration-300 ${glassCard}`}
                        style={{ borderColor: m.bg + '40' }} // Bordure colorée subtile
                      >
                        {isAdmin && (
                          <button
                            onClick={e => { e.stopPropagation(); if (window.confirm('Supprimer ' + m.label + ' ?')) onDeleteMod(m.id) }}
                            className="absolute top-3 right-3 w-6 h-6 rounded-full text-[10px] items-center justify-center hidden group-hover:flex bg-black/10 hover:bg-black/20 transition-colors">
                            ✕
                          </button>
                        )}
                        {/* Icône Flottante */}
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-3 shadow-md relative z-10 transition-transform group-hover:rotate-6"
                          style={{ background: m.bg, color: m.tc }}>
                          {m.icon}
                        </div>
                        <p className="text-sm font-bold mb-1 text-[var(--text-1] relative z-10">{m.label}</p>
                        <p className="text-xs font-medium opacity-60 relative z-10">
                          {cnt} fiche{cnt !== 1 ? 's' : ''}
                        </p>
                        
                        {/* Reflet de lumière au survol */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl pointer-events-none" />
                      </motion.button>
                    )
                  })}
                  {isAdmin && (
                    <motion.button variants={item} onClick={onAddMod} whileTap={{ scale: .96 }}
                      className="flex flex-col items-center justify-center gap-2 p-5 rounded-3xl border-2 border-dashed text-sm font-medium transition-colors min-h-[140px] glassCard"
                      style={{ borderColor: 'var(--border)' }}
                      whileHover={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>
                      <span className="text-2xl">+</span>
                      <span>Nouveau</span>
                    </motion.button>
                  )}
                </motion.div>
              ) : (
                <div className="space-y-3 mb-6">
                  {mods.map(m => {
                    const cnt = notes.filter(n => n.module === m.id).length
                    return (
                      <motion.button key={m.id}
                        initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                        onClick={() => onModule(m.id)}
                        whileHover={{ x: 6 }}
                        whileTap={{ scale: .98 }}
                        className={`w-full flex items-center gap-4 p-4 rounded-2xl text-left shadow-sm transition-all glassCard group`}
                        style={{ borderLeft: `4px solid ${m.bg}` }}
                      >
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 shadow-sm transition-transform group-hover:rotate-12"
                          style={{ background: m.bg, color: m.tc }}>{m.icon}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-[var(--text-1]">{m.label}</p>
                        </div>
                        <span className="text-xs font-bold flex-shrink-0 opacity-60 bg-black/5 px-2 py-1 rounded-md">
                          {cnt}
                        </span>
                      </motion.button>
                    )
                  })}
                </div>
              )}

              {/* Maîtrise */}
              {masteryStats?.some(l => l.count > 0) && (
                <div className="mb-6 p-5 rounded-3xl glassCard">
                  <MasteryBar masteryStats={masteryStats} />
                </div>
              )}
            </>
          )}
        </div>

        {/* BAS DE PAGE */}
        <div className="px-5 pb-24 sm:pb-0">
          {allBadges && allBadges.some(b => b.earnedAt) && (
            <div className="mb-6">
              <BadgesPanel allBadges={allBadges} />
            </div>
          )}

          <div id="planning-section">
            <Planning userId={userId} />
          </div>

          <div className="mt-8">
            <StatsPanel
              stats={stats} streak={streak} last7Days={last7Days}
              globalScore={globalScore} totalReviewed={totalReviewed}
              worstNotes={worstNotes} mods={mods}
              onFiche={onFiche} onClear={onClearStats}
              srsStats={srsStats}
            />
          </div>
        </div>
      </motion.div>
    </div>
  )
}import { useState, useCallback } from 'react'
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

  // Style Commun "Verre" (Glassmorphism)
  // On adapte la transparence selon le mode sombre
  const glassCard = "bg-white/70 dark:bg-black/60 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-xl shadow-[var(--accent)]/5"
  const glassInput = "bg-white/50 dark:bg-black/40 backdrop-blur-md border border-white/30 dark:border-white/10 focus:bg-white/80 dark:focus:bg-black/60"

  return (
    <div className="min-h-screen relative overflow-hidden selection:bg-[var(--accent)] selection:text-white">
      
      {/* --- ARRIÈRE-PLAN ANIMÉ (L'ambiance) --- */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none transition-colors duration-700" style={{ background: 'var(--surface-2)' }}>
        {/* Blob principal (Couleur accent) */}
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[10%] -left-[10%] w-[60vw] h-[60vw] rounded-full blur-[100px]"
          style={{ background: 'var(--accent)', opacity: 0.2 }} 
        />
        {/* Blob secondaire (Bleu ciel) */}
        <motion.div 
          animate={{ scale: [1, 1.3, 1], x: [0, 50, 0], y: [0, -30, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[20%] right-[-10%] w-[50vw] h-[50vw] rounded-full blur-[120px]"
          style={{ background: '#3b82f6', opacity: 0.15 }} 
        />
        {/* Blob tertiaire (Rose doux) */}
        <motion.div 
          animate={{ scale: [1.1, 1, 1.1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[-10%] left-[20%] w-[40vw] h-[40vw] rounded-full blur-[100px]"
          style={{ background: '#ec4899', opacity: 0.12 }} 
        />
      </div>

      {/* --- CONTENU PRINCIPAL --- */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="relative z-10 pb-24 sm:pb-0"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onTouchMove={onTouchMove}
      >
        {/* 1. HEADER GLASS */}
        <div className="px-5 pt-8 pb-4 flex items-center justify-between">
          <div>
            <motion.p initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
              className="text-[11px] font-bold uppercase tracking-[0.2em] mb-2 opacity-70"
              style={{ color: 'var(--text-1)' }}>
              Bienvenue
            </motion.p>
            <motion.h1 initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .05 }}
              className="text-3xl font-bold tracking-tight"
              style={{ color: 'var(--text-1)', letterSpacing: '-.04em', textShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
              {account?.name || 'Utilisateur'}
            </motion.h1>
          </div>
          {/* Avatar "Orbe" */}
          <motion.div 
            whileHover={{ scale: 1.05, rotate: 5 }}
            className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold shadow-lg shadow-[var(--accent)]/30 flex-shrink-0 relative overflow-hidden group"
            style={{ background: account?.color || 'var(--accent)' }}
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-white/30 to-transparent" />
            {account?.name?.[0] || '?'}
          </motion.div>
        </div>

        {/* 2. BENTO GRID GLASS */}
        <div className="px-5 pb-6">
          <div className="grid grid-cols-2 gap-4 mb-6">
            
            {/* A. HERO CARD (Glass + Gradient) */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
              className="col-span-2 p-6 rounded-[32px] text-white relative overflow-hidden shadow-2xl"
              style={{ 
                background: 'linear-gradient(135deg, var(--accent) 0%, #6366f1 100%)',
                boxShadow: '0 20px 40px -5px rgba(79, 70, 229, 0.4)' 
              }}
            >
              {/* Reflet de verre sur la carte */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none mix-blend-overlay" />
              
              <div className="relative z-10 flex justify-between items-start">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-2">Progression</p>
                  <h3 className="text-3xl font-bold mb-1">{notes.length} Fiches</h3>
                  <p className="text-sm font-medium opacity-90">{mods.length} Modules</p>
                </div>
                <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md">
                  <span className="text-2xl">🚀</span>
                </div>
              </div>
              
              {/* Barre de progression stylisée */}
              <div className="mt-6 pt-4 border-t border-white/20">
                <div className="flex justify-between text-xs mb-2 opacity-90 font-medium">
                  <span>Maîtrise globale</span>
                  <span>{globalScore || 0}%</span>
                </div>
                <div className="h-2 bg-black/20 rounded-full overflow-hidden backdrop-blur-sm">
                  <motion.div 
                    initial={{ width: 0 }} 
                    animate={{ width: `${globalScore || 0}%` }} 
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="h-full bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)]" 
                  />
                </div>
              </div>
            </motion.div>

            {/* B. ACTION CARD: Révision (Glass) */}
            <motion.button
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              onClick={onRevision}
              className={`col-span-1 p-5 rounded-[28px] flex flex-col justify-between h-40 group active:scale-95 transition-all duration-300 ${glassCard} relative overflow-hidden`}
              whileHover={{ y: -4, boxShadow: '0 15px 30px -5px rgba(0,0,0,0.1)' }}
            >
              {/* Fond subtil au survol */}
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent)]/0 to-[var(--accent)]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-2 shadow-lg relative z-10 transition-transform group-hover:scale-110" style={{ background: 'var(--accent)', color: '#fff' }}>
                🃏
              </div>
              <div className="relative z-10">
                <p className="text-xs font-bold uppercase tracking-wider mb-1 opacity-60">Révision</p>
                <p className="text-lg font-bold text-[var(--text-1]">Start</p>
              </div>
              {srsStats?.due > 0 && (
                <span className="absolute top-4 right-4 bg-red-500 text-white text-[10px] font-bold w-6 h-6 flex items-center justify-center rounded-full shadow-lg animate-pulse relative z-10">
                  {srsStats.due}
                </span>
              )}
            </motion.button>

            {/* C. ACTION CARD: Explorer (Glass) */}
            <motion.button
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              onClick={onExplorer}
              className={`col-span-1 p-5 rounded-[28px] flex flex-col justify-between h-40 group active:scale-95 transition-all duration-300 ${glassCard} relative overflow-hidden`}
              whileHover={{ y: -4, boxShadow: '0 15px 30px -5px rgba(0,0,0,0.1)' }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-2 shadow-lg relative z-10 transition-transform group-hover:scale-110" style={{ background: '#3b82f6', color: '#fff' }}>
                📚
              </div>
              <div className="relative z-10">
                <p className="text-xs font-bold uppercase tracking-wider mb-1 opacity-60">Explorer</p>
                <p className="text-lg font-bold text-[var(--text-1]">Voir tout</p>
              </div>
            </motion.button>

            {/* D. SEARCH BAR (Glass Large) */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="col-span-2 relative group"
            >
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-lg pointer-events-none opacity-40 transition-colors group-focus-within:opacity-80">⌕</span>
              <input
                id="global-search"
                type="text"
                value={query}
                onChange={e => handleSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearchSubmit()}
                onBlur={handleSearchSubmit}
                placeholder="Chercher une fiche, un concept..."
                className={`w-full pl-12 pr-14 py-4 rounded-[24px] text-sm outline-none transition-all duration-300 shadow-sm group-focus-within:shadow-lg ${glassInput}`}
                style={{ color: 'var(--text-1)' }}
              />
              {!query && (
                <kbd className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] px-2 py-1 rounded-md font-mono opacity-40 bg-black/5 border border-black/5 dark:bg-white/10 dark:border-white/10">
                  ⌘K
                </kbd>
              )}
            </motion.div>
          </div>
        </div>

        {/* CONTENU (Cartes Glass) */}
        <div className="px-5 pb-6">
          
          {/* RÉSULTATS RECHERCHE */}
          <AnimatePresence>
            {query && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <p className="text-xs font-bold uppercase tracking-wider mb-3 ml-1 opacity-60">
                  {results.length} Résultat{results.length !== 1 ? 's' : ''}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                  {results.map(n => (
                    <motion.div key={n.id}
                      initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                      onClick={() => onFiche(n.id, n.module)}
                      className={`${glassCard} p-4 rounded-2xl cursor-pointer active:scale-98 transition-transform relative overflow-hidden group`}
                      whileHover={{ y: -3 }}
                    >
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full mb-2 border border-white/20 backdrop-blur-sm"
                        style={{ background: n.mod.bg + 'CC', color: n.mod.tc }}>
                        {n.mod.icon} {n.mod.label}
                      </span>
                      <p className="text-sm font-bold mb-1 text-[var(--text-1)]">{n.title}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!query && (
            <>
              {/* Cartes flottantes secondaires */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 mb-6">
                <FicheduJour notes={notes} mods={mods} onFiche={onFiche} getLevel={getMasteryLevel} />
                <HistoryPanel history={history} notes={notes} mods={mods} onFiche={onFiche} />
              </motion.div>

              {/* Outils Admin */}
              <div className="flex items-center justify-between flex-wrap gap-2 mb-6 p-3 rounded-2xl glassCard">
                <div className="flex items-center gap-2 flex-wrap">
                  {isAdmin && onDashboard && (
                    <motion.button whileTap={{ scale: .95 }} onClick={onDashboard} className="text-[11px] px-3 py-1.5 rounded-lg font-medium hover:bg-white/10 transition-colors" style={{ color: 'var(--text-2)' }}>
                      📊 Dashboard
                    </motion.button>
                  )}
                  {isAdmin && onAddMod && (
                    <motion.button whileTap={{ scale: .95 }} onClick={onAddMod} className="text-[11px] px-3 py-1.5 rounded-lg font-medium hover:bg-white/10 transition-colors" style={{ color: 'var(--text-2)' }}>
                      + Module
                    </motion.button>
                  )}
                  {isAdmin && (
                    <>
                      <NotifSettings permission={notifPermission} settings={notifSettings}
                        onRequestPermission={onRequestNotifPermission}
                        onSaveSettings={onSaveNotifSettings} onTest={onTestNotif} />
                      <DataIO notes={notes} mods={mods} onImport={onImportJSON} onZendesk={onZendesk} />
                    </>
                  )}
                </div>
              </div>

              {/* Titre Section */}
              <div className="flex items-center justify-between mb-4 px-1">
                <h3 className="text-lg font-bold text-[var(--text-1]">Modules</h3>
                <ViewToggle view={modView} onChange={changeModView} />
              </div>

              {/* LISTE MODULES (Style Verre) */}
              {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                  {Array.from({ length: 4 }).map((_, i) => <SkeletonTile key={i} />)}
                </div>
              ) : modView === 'grid' ? (
                <motion.div variants={container} initial="hidden" animate="show"
                  className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                  {mods.map(m => {
                    const cnt = notes.filter(n => n.module === m.id).length
                    return (
                      <motion.button key={m.id} variants={item}
                        onClick={() => onModule(m.id)}
                        whileHover={{ y: -6, scale: 1.02 }}
                        whileTap={{ scale: .96 }}
                        className={`relative text-left p-5 rounded-3xl border-2 shadow-lg group transition-all duration-300 ${glassCard}`}
                        style={{ borderColor: m.bg + '40' }} // Bordure colorée subtile
                      >
                        {isAdmin && (
                          <button
                            onClick={e => { e.stopPropagation(); if (window.confirm('Supprimer ' + m.label + ' ?')) onDeleteMod(m.id) }}
                            className="absolute top-3 right-3 w-6 h-6 rounded-full text-[10px] items-center justify-center hidden group-hover:flex bg-black/10 hover:bg-black/20 transition-colors">
                            ✕
                          </button>
                        )}
                        {/* Icône Flottante */}
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-3 shadow-md relative z-10 transition-transform group-hover:rotate-6"
                          style={{ background: m.bg, color: m.tc }}>
                          {m.icon}
                        </div>
                        <p className="text-sm font-bold mb-1 text-[var(--text-1] relative z-10">{m.label}</p>
                        <p className="text-xs font-medium opacity-60 relative z-10">
                          {cnt} fiche{cnt !== 1 ? 's' : ''}
                        </p>
                        
                        {/* Reflet de lumière au survol */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl pointer-events-none" />
                      </motion.button>
                    )
                  })}
                  {isAdmin && (
                    <motion.button variants={item} onClick={onAddMod} whileTap={{ scale: .96 }}
                      className="flex flex-col items-center justify-center gap-2 p-5 rounded-3xl border-2 border-dashed text-sm font-medium transition-colors min-h-[140px] glassCard"
                      style={{ borderColor: 'var(--border)' }}
                      whileHover={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>
                      <span className="text-2xl">+</span>
                      <span>Nouveau</span>
                    </motion.button>
                  )}
                </motion.div>
              ) : (
                <div className="space-y-3 mb-6">
                  {mods.map(m => {
                    const cnt = notes.filter(n => n.module === m.id).length
                    return (
                      <motion.button key={m.id}
                        initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                        onClick={() => onModule(m.id)}
                        whileHover={{ x: 6 }}
                        whileTap={{ scale: .98 }}
                        className={`w-full flex items-center gap-4 p-4 rounded-2xl text-left shadow-sm transition-all glassCard group`}
                        style={{ borderLeft: `4px solid ${m.bg}` }}
                      >
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 shadow-sm transition-transform group-hover:rotate-12"
                          style={{ background: m.bg, color: m.tc }}>{m.icon}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-[var(--text-1]">{m.label}</p>
                        </div>
                        <span className="text-xs font-bold flex-shrink-0 opacity-60 bg-black/5 px-2 py-1 rounded-md">
                          {cnt}
                        </span>
                      </motion.button>
                    )
                  })}
                </div>
              )}

              {/* Maîtrise */}
              {masteryStats?.some(l => l.count > 0) && (
                <div className="mb-6 p-5 rounded-3xl glassCard">
                  <MasteryBar masteryStats={masteryStats} />
                </div>
              )}
            </>
          )}
        </div>

        {/* BAS DE PAGE */}
        <div className="px-5 pb-24 sm:pb-0">
          {allBadges && allBadges.some(b => b.earnedAt) && (
            <div className="mb-6">
              <BadgesPanel allBadges={allBadges} />
            </div>
          )}

          <div id="planning-section">
            <Planning userId={userId} />
          </div>

          <div className="mt-8">
            <StatsPanel
              stats={stats} streak={streak} last7Days={last7Days}
              globalScore={globalScore} totalReviewed={totalReviewed}
              worstNotes={worstNotes} mods={mods}
              onFiche={onFiche} onClear={onClearStats}
              srsStats={srsStats}
            />
          </div>
        </div>
      </motion.div>
    </div>
  )
}
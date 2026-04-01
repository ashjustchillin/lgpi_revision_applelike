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

  // --- BENTO STYLE WRAPPER ---
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="pb-24 sm:pb-0 min-h-screen bg-[var(--surface-2)]"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onTouchMove={onTouchMove}
    >
      {/* 1. HEADER BENTO (Welcome + Avatar) */}
      <div className="px-4 sm:px-6 pt-6 pb-4 flex items-center justify-between">
        <div>
          <motion.p initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
            className="text-[11px] font-semibold uppercase tracking-widest mb-1"
            style={{ color: 'var(--accent)' }}>
            Bienvenue, {account?.name || 'Utilisateur'}
          </motion.p>
          <motion.h1 initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .05 }}
            className="text-2xl font-bold tracking-tight"
            style={{ color: 'var(--text-1)', letterSpacing: '-.03em' }}>
            Prêt à réviser ?
          </motion.h1>
        </div>
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-lg font-bold shadow-md flex-shrink-0"
             style={{ background: account?.color || 'var(--accent)' }}>
          {account?.name?.[0] || '?'}
        </div>
      </div>

      {/* 2. BENTO GRID (Top Section) */}
      <div className="px-4 sm:px-6 pb-6">
        <div className="grid grid-cols-2 gap-3 mb-4">
          
          {/* A. HERO CARD (Stats & Streak) - Large 2 cols */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="col-span-2 p-5 rounded-3xl text-white relative overflow-hidden shadow-lg flex items-center justify-between"
            style={{ 
              background: 'linear-gradient(135deg, var(--accent) 0%, #4f46e5 100%)',
              boxShadow: '0 10px 30px -5px rgba(79, 70, 229, 0.3)' 
            }}
          >
            <div className="relative z-10">
              <p className="text-xs font-medium opacity-90 mb-1">Progression globale</p>
              <h3 className="text-2xl font-bold mb-1">{notes.length} Fiches · {mods.length} Modules</h3>
              <p className="text-sm font-medium bg-white/20 inline-flex items-center gap-1.5 px-3 py-1 rounded-full backdrop-blur-sm">
                {streak > 0 ? <>🔥 Série de {streak} jours</> : <>🌟 Commence aujourd'hui</>}
              </p>
            </div>
            {/* Décoration abstraite */}
            <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          </motion.div>

          {/* B. ACTION CARD: Révision */}
          <motion.button
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            onClick={onRevision}
            className="col-span-1 p-4 rounded-3xl bg-white dark:bg-[var(--surface)] border border-[var(--border)] shadow-sm flex flex-col justify-between h-32 group active:scale-95 transition-transform relative overflow-hidden"
            whileHover={{ y: -2, boxShadow: 'var(--shadow-md)' }}
          >
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-2xl mb-2" style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}>
              🃏
            </div>
            <div>
              <p className="text-xs font-semibold text-[var(--text-3)] mb-0.5">Mode Révision</p>
              <p className="text-sm font-bold text-[var(--text-1)]">Démarrer</p>
            </div>
            {srsStats?.due > 0 && (
              <span className="absolute top-3 right-3 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full animate-pulse">
                {srsStats.due}
              </span>
            )}
          </motion.button>

          {/* C. ACTION CARD: Explorer */}
          <motion.button
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            onClick={onExplorer}
            className="col-span-1 p-4 rounded-3xl bg-white dark:bg-[var(--surface)] border border-[var(--border)] shadow-sm flex flex-col justify-between h-32 group active:scale-95 transition-transform relative overflow-hidden"
            whileHover={{ y: -2, boxShadow: 'var(--shadow-md)' }}
          >
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-2xl mb-2" style={{ background: '#f0f9ff', color: '#0369a1' }}>
              📚
            </div>
            <div>
              <p className="text-xs font-semibold text-[var(--text-3)] mb-0.5">Explorer</p>
              <p className="text-sm font-bold text-[var(--text-1)]">Tout voir</p>
            </div>
          </motion.button>

          {/* D. SEARCH BAR - Wide */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="col-span-2 relative"
          >
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base pointer-events-none opacity-50">⌕</span>
            <input
              id="global-search"
              type="text"
              value={query}
              onChange={e => handleSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearchSubmit()}
              onBlur={handleSearchSubmit}
              placeholder="Rechercher une fiche, un tag, un chemin..."
              className="w-full pl-11 pr-12 py-4 rounded-2xl bg-white dark:bg-[var(--surface)] border border-[var(--border)] shadow-sm text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]/20 transition-all"
              style={{ color: 'var(--text-1)' }}
            />
            {!query && (
              <kbd className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] px-1.5 py-0.5 rounded font-mono opacity-50"
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                ⌘K
              </kbd>
            )}
          </motion.div>
        </div>

        {/* Historique recherches + tags cliquables (Compact) */}
        {!query && (
          <div className="mb-4 flex flex-wrap gap-2">
            {searchHistory.length > 0 && (
              <div className="flex flex-wrap gap-1.5 w-full">
                 {searchHistory.slice(0, 5).map(q => (
                  <button key={q}
                    onClick={() => handleSearch(q)}
                    className="flex items-center gap-1 text-[11px] px-3 py-1.5 rounded-full bg-white dark:bg-[var(--surface)] border border-[var(--border)] shadow-sm transition-colors"
                  >
                    🕐 {q}
                    <span onClick={e => { e.stopPropagation(); removeSearch(q) }}
                      className="ml-1 opacity-50 hover:opacity-100 text-[10px]">✕</span>
                  </button>
                ))}
              </div>
            )}
            {allTags.length > 0 && searchHistory.length === 0 && (
              <div className="flex flex-wrap gap-1.5">
                {allTags.map(tag => (
                  <button key={tag}
                    onClick={() => handleTagClick(tag)}
                    className="text-[11px] px-3 py-1.5 rounded-full font-medium transition-all border shadow-sm"
                    style={activeTag === tag
                      ? { background: 'var(--accent)', color: '#fff', borderColor: 'var(--accent)' }
                      : { background: 'white dark:bg-[var(--surface)]', color: 'var(--text-2)', borderColor: 'var(--border)' }}>
                    #{tag}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* CONTENU PRINCIPAL (Cartes stylisées) */}
      <div className="px-4 sm:px-6 pb-6">
        
        {/* RÉSULTATS DE RECHERCHE (Overlay style) */}
        <AnimatePresence>
          {query && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <p className="text-xs font-medium mb-3 ml-1" style={{ color: 'var(--text-2)' }}>
                {results.length} résultat{results.length !== 1 ? 's' : ''} pour "{query}"
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                {results.map(n => (
                  <motion.div key={n.id}
                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    onClick={() => onFiche(n.id, n.module)}
                    className="bg-white dark:bg-[var(--surface)] p-4 rounded-2xl border border-[var(--border)] shadow-sm cursor-pointer active:scale-98 transition-transform relative overflow-hidden">
                    {/* Ligne accent top */}
                    <div className="absolute top-0 left-0 w-full h-1" style={{ background: 'var(--accent)' }} />
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
            {/* Carte : Fiche du Jour */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
              <FicheduJour notes={notes} mods={mods} onFiche={onFiche} getLevel={getMasteryLevel} />
            </motion.div>

            {/* Carte : Historique */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mb-4">
              <HistoryPanel history={history} notes={notes} mods={mods} onFiche={onFiche} />
            </motion.div>

            {/* Barre d'outils Admin / Actions rapides */}
            <div className="flex items-center justify-between flex-wrap gap-2 mb-4 p-3 rounded-2xl bg-white dark:bg-[var(--surface)] border border-[var(--border)] shadow-sm">
              <div className="flex items-center gap-2 flex-wrap">
                {isAdmin && onDashboard && (
                  <motion.button whileTap={{ scale: .95 }} onClick={onDashboard} className="text-[11px] px-3 py-1.5 rounded-lg font-medium bg-[var(--surface-2)] hover:bg-[var(--border)] transition-colors" style={{ color: 'var(--text-2)' }}>
                    📊 Dashboard
                  </motion.button>
                )}
                {isAdmin && onZendesk && (
                  <motion.button whileTap={{ scale: .95 }} onClick={onZendesk} className="text-[11px] px-3 py-1.5 rounded-lg font-medium bg-[var(--surface-2)] hover:bg-[var(--border)] transition-colors" style={{ color: 'var(--text-2)' }}>
                    🎫 Zendesk
                  </motion.button>
                )}
                {isAdmin && onAddMod && (
                  <motion.button whileTap={{ scale: .95 }} onClick={onAddMod} className="text-[11px] px-3 py-1.5 rounded-lg font-medium bg-[var(--surface-2)] hover:bg-[var(--border)] transition-colors" style={{ color: 'var(--text-2)' }}>
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

            {/* Section Modules */}
            <div className="flex items-center justify-between mb-3 px-1">
              <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--text-1)' }}>Modules</h3>
              <ViewToggle view={modView} onChange={changeModView} />
            </div>

            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                {Array.from({ length: 4 }).map((_, i) => <SkeletonTile key={i} />)}
              </div>
            ) : modView === 'grid' ? (
              <motion.div variants={container} initial="hidden" animate="show"
                className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                {mods.map(m => {
                  const cnt = notes.filter(n => n.module === m.id).length
                  return (
                    <motion.button key={m.id} variants={item}
                      onClick={() => onModule(m.id)}
                      whileHover={{ y: -4, boxShadow: '0 12px 24px -8px rgba(0,0,0,.12)' }}
                      whileTap={{ scale: .96 }}
                      className="relative text-left p-4 rounded-3xl border-0 group shadow-sm transition-shadow"
                      style={{ background: m.bg, color: m.tc }}
                    >
                      {isAdmin && (
                        <button
                          onClick={e => { e.stopPropagation(); if (window.confirm('Supprimer ' + m.label + ' ?')) onDeleteMod(m.id) }}
                          className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full text-[10px] items-center justify-center hidden group-hover:flex bg-black/10 hover:bg-black/20 transition-colors">
                          ✕
                        </button>
                      )}
                      <div className="w-10 h-10 rounded-2xl flex items-center justify-center mb-3 text-xl shadow-sm"
                        style={{ background: 'rgba(255,255,255,.4)' }}>{m.icon}</div>
                      <p className="text-sm font-bold leading-tight mb-0.5" style={{ letterSpacing: '-.02em' }}>{m.label}</p>
                      <p className="text-xs font-medium opacity-60">
                        {cnt} fiche{cnt !== 1 ? 's' : ''}
                      </p>
                      <div className="absolute bottom-0 right-0 w-12 h-12 rounded-tl-3xl opacity-20 pointer-events-none" style={{ background: m.tc }} />
                    </motion.button>
                  )
                })}
                {isAdmin && (
                  <motion.button variants={item} onClick={onAddMod} whileTap={{ scale: .96 }}
                    className="flex flex-col items-center justify-center gap-2 p-4 rounded-3xl border-2 border-dashed text-sm font-medium transition-colors min-h-[130px]"
                    style={{ borderColor: 'var(--border)', color: 'var(--text-3)' }}
                    whileHover={{ borderColor: 'var(--accent)', color: 'var(--accent)', background: 'var(--accent-bg)' }}>
                    <span className="text-2xl">+</span>
                    <span>Nouveau</span>
                  </motion.button>
                )}
              </motion.div>
            ) : (
              <div className="space-y-2 mb-6">
                {mods.map(m => {
                  const cnt = notes.filter(n => n.module === m.id).length
                  return (
                    <motion.button key={m.id}
                      initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                      onClick={() => onModule(m.id)}
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: .98 }}
                      className="w-full flex items-center gap-3 p-3.5 rounded-2xl text-left shadow-sm transition-all"
                      style={{ background: m.bg, color: m.tc }}>
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0 shadow-sm"
                        style={{ background: 'rgba(255,255,255,.4)' }}>{m.icon}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold">{m.label}</p>
                      </div>
                      <span className="text-xs font-medium flex-shrink-0 opacity-70">
                        {cnt} fiche{cnt !== 1 ? 's' : ''}
                      </span>
                      <span className="opacity-50">›</span>
                    </motion.button>
                  )
                })}
              </div>
            )}

            {/* Carte : Maîtrise */}
            {masteryStats?.some(l => l.count > 0) && (
              <div className="mb-6 p-4 rounded-2xl bg-white dark:bg-[var(--surface)] border border-[var(--border)] shadow-sm">
                <MasteryBar masteryStats={masteryStats} />
              </div>
            )}
          </>
        )}
      </div>

      {/* SECTION BAS DE PAGE (Planning & Stats) */}
      <div className="px-4 sm:px-6 pb-24 sm:pb-0">
        {allBadges && allBadges.some(b => b.earnedAt) && (
          <div className="mb-6">
            <BadgesPanel allBadges={allBadges} />
          </div>
        )}

        <div id="planning-section">
          <Planning userId={userId} />
        </div>

        <div className="mt-6">
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
  )
}
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
  onModule, onAddMod, onDeleteMod, onRevision,
  history, onFiche,
  stats, streak, last7Days, globalScore, totalReviewed, worstNotes, onClearStats,
  notifPermission, notifSettings, onRequestNotifPermission, onSaveNotifSettings, onTestNotif,
  onImportJSON, onImportFiches,
  getMasteryLevel, masteryStats, srsStats,
  isAdmin, onDashboard, onZendesk, userId,
  onRefresh, allBadges,
}) {
  const { query, setQuery, results, clear } = useSearch(notes, mods, 200)
  const { history: searchHistory, addSearch, removeSearch } = useSearchHistory()
  const [activeTag, setActiveTag] = useState(null)
  const [modView, setModView] = useState(() => localStorage.getItem('lgpi-mod-view') || 'grid')
  const loading = syncState === 'syncing' && mods.length === 0

  // Pull to refresh
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

  // Tous les tags disponibles
  const allTags = [...new Set(notes.flatMap(n => n.tags || []))].slice(0, 12)

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="pb-24 sm:pb-0"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onTouchMove={onTouchMove}
    >
      {/* Hero */}
      <div className="mb-6">
        <motion.p initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
          className="text-xs font-semibold uppercase tracking-widest mb-1"
          style={{ color: 'var(--accent)' }}>
          Base de connaissances
        </motion.p>
        <motion.h1 initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .05 }}
          className="text-3xl font-bold tracking-tight"
          style={{ color: 'var(--text-1)', letterSpacing: '-.04em' }}>
          Mes fiches LGPI
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .1 }}
          className="text-sm mt-1" style={{ color: 'var(--text-2)' }}>
          {notes.length} fiche{notes.length !== 1 ? 's' : ''} · {mods.length} module{mods.length !== 1 ? 's' : ''}
          {streak > 0 && ` · 🔥 ${streak}j`}
        </motion.p>
      </div>

      {/* Barre de recherche */}
      <div className="relative mb-4">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base pointer-events-none" style={{ color: 'var(--text-3)' }}>⌕</span>
        <input
          id="global-search"
          type="text"
          value={query}
          onChange={e => handleSearch(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearchSubmit()}
          onBlur={handleSearchSubmit}
          placeholder="Rechercher dans toutes les fiches..."
          className="input-base pl-11 pr-10 py-3.5 rounded-2xl"
          style={{ fontSize: '.9rem' }}
        />
        {query && (
          <button onClick={() => { clear(); setActiveTag(null) }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-sm"
            style={{ color: 'var(--text-3)' }}>✕</button>
        )}
      </div>

      {/* Historique recherches + tags cliquables */}
      {!query && (
        <div className="mb-5">
          {searchHistory.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {searchHistory.slice(0, 5).map(q => (
                <button key={q}
                  onClick={() => handleSearch(q)}
                  className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full transition-colors"
                  style={{ background: 'var(--surface-2)', color: 'var(--text-2)' }}>
                  🕐 {q}
                  <span onClick={e => { e.stopPropagation(); removeSearch(q) }}
                    className="ml-1 opacity-50 hover:opacity-100 text-[10px]">✕</span>
                </button>
              ))}
            </div>
          )}
          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {allTags.map(tag => (
                <button key={tag}
                  onClick={() => handleTagClick(tag)}
                  className="text-[11px] px-2.5 py-1 rounded-full font-medium transition-all"
                  style={activeTag === tag
                    ? { background: 'var(--accent)', color: '#fff' }
                    : { background: 'var(--surface-2)', color: 'var(--text-2)' }}>
                  #{tag}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Résultats de recherche */}
      <AnimatePresence>
        {query && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <p className="text-xs font-medium mb-3" style={{ color: 'var(--text-2)' }}>
              {results.length} fiche{results.length !== 1 ? 's' : ''} pour "{query}"
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-6">
              {results.map(n => (
                <motion.div key={n.id}
                  initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                  onClick={() => onFiche(n.id, n.module)}
                  className="card-base p-4 cursor-pointer"
                  whileHover={{ y: -2 }}>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full mb-2"
                    style={{ background: n.mod.bg, color: n.mod.tc }}>
                    {n.mod.icon} {n.mod.label}
                  </span>
                  <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-1)' }}
                    dangerouslySetInnerHTML={{ __html: highlight(n.title, query) }} />
                  <p className="text-xs leading-relaxed line-clamp-2" style={{ color: 'var(--text-2)' }}
                    dangerouslySetInnerHTML={{ __html: highlight(n.excerpt, query) }} />
                  {/* Tags cliquables dans les résultats */}
                  {(n.tags || []).length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {(n.tags || []).map(t => (
                        <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-full"
                          style={{ background: n.mod.bg, color: n.mod.tc }}>#{t}</span>
                      ))}
                    </div>
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

          {/* Barre actions */}
          <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
            <div className="flex items-center gap-2 flex-wrap">
              <motion.button whileTap={{ scale: .95 }} onClick={onRevision} className="btn-accent text-xs">
                🃏 Revision
              </motion.button>
              {isAdmin && (
                <motion.button whileTap={{ scale: .95 }} onClick={onAddMod} className="btn-ghost text-xs">
                  + Module
                </motion.button>
              )}
              {isAdmin && onDashboard && (
                <motion.button whileTap={{ scale: .95 }} onClick={onDashboard} className="btn-ghost text-xs">
                  📊 Dashboard
                </motion.button>
              )}
              {isAdmin && onZendesk && (
                <motion.button whileTap={{ scale: .95 }} onClick={onZendesk} className="btn-ghost text-xs">
                  🎫 Zendesk
                </motion.button>
              )}
            </div>
            <div className="flex items-center gap-2">
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

          {/* Header modules avec toggle vue */}
          <div className="flex items-center justify-between mb-3">
            <SectionTitle>Modules</SectionTitle>
            <ViewToggle view={modView} onChange={changeModView} />
          </div>

          {/* Modules */}
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
                    whileHover={{ y: -4, boxShadow: '0 16px 40px rgba(0,0,0,.12)' }}
                    whileTap={{ scale: .96 }}
                    className="relative text-left p-5 rounded-2xl group border-0"
                    style={{ background: m.bg }}>
                    {isAdmin && (
                      <button
                        onClick={e => { e.stopPropagation(); if (window.confirm('Supprimer ' + m.label + ' ?')) onDeleteMod(m.id) }}
                        className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full text-[10px] items-center justify-center hidden group-hover:flex"
                        style={{ background: 'rgba(0,0,0,.15)', color: '#fff' }}>✕</button>
                    )}
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 text-xl"
                      style={{ background: 'rgba(255,255,255,.4)' }}>{m.icon}</div>
                    <p className="text-sm font-bold leading-tight mb-0.5" style={{ color: m.tc, letterSpacing: '-.02em' }}>{m.label}</p>
                    <p className="text-xs font-medium" style={{ color: m.tc, opacity: .6 }}>
                      {cnt} fiche{cnt !== 1 ? 's' : ''}
                    </p>
                    <div className="absolute bottom-0 right-0 w-12 h-12 rounded-tl-3xl opacity-20" style={{ background: m.tc }} />
                  </motion.button>
                )
              })}
              {isAdmin && (
                <motion.button variants={item} onClick={onAddMod} whileTap={{ scale: .96 }}
                  className="flex flex-col items-center justify-center gap-2 p-5 rounded-2xl border-2 border-dashed text-sm font-medium transition-colors min-h-[130px]"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-3)' }}
                  whileHover={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>
                  <span className="text-2xl">+</span>
                  <span>Nouveau</span>
                </motion.button>
              )}
            </motion.div>
          ) : (
            // Vue liste
            <div className="space-y-2 mb-6">
              {mods.map(m => {
                const cnt = notes.filter(n => n.module === m.id).length
                return (
                  <motion.button key={m.id}
                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                    onClick={() => onModule(m.id)}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: .98 }}
                    className="w-full flex items-center gap-3 p-3.5 rounded-xl text-left"
                    style={{ background: m.bg }}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                      style={{ background: 'rgba(255,255,255,.4)' }}>{m.icon}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold" style={{ color: m.tc }}>{m.label}</p>
                    </div>
                    <span className="text-xs font-medium flex-shrink-0" style={{ color: m.tc, opacity: .7 }}>
                      {cnt} fiche{cnt !== 1 ? 's' : ''}
                    </span>
                    <span style={{ color: m.tc, opacity: .5 }}>›</span>
                  </motion.button>
                )
              })}
            </div>
          )}

          {/* Mastery bar */}
          {masteryStats?.some(l => l.count > 0) && (
            <div className="mb-6"><MasteryBar masteryStats={masteryStats} /></div>
          )}
        </>
      )}

      {/* Badges */}
      {allBadges && allBadges.some(b => b.earnedAt) && (
        <BadgesPanel allBadges={allBadges} />
      )}

      <div id="planning-section">
        <Planning userId={userId} />
      </div>

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

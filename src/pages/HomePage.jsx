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
                  <p className="text-xs font-bold uppercase tracking
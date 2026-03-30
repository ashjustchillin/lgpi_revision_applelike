import { useState, useEffect, useCallback } from 'react'
import { AnimatePresence, motion } from './lib/motion'
import Header from './components/Header'
import { Toast } from './components/UI'
import HomePage from './pages/HomePage'
import ModulePage from './pages/ModulePage'
import FichePage from './pages/FichePage'
import FormPage from './pages/FormPage'
import ModFormPage from './pages/ModFormPage'
import RevisionPage from './pages/RevisionPage'
import BottomNav from './components/BottomNav'
import ParticleBackground from './components/ParticleBackground'
import { useFirebase } from './hooks/useFirebase'
import { useStats } from './hooks/useStats'
import { useHistory } from './hooks/useHistory'
import { usePinned } from './hooks/usePinned'
import { useNotifications } from './hooks/useNotifications'
import { useMastery } from './hooks/useMastery'
import { useSpacedRepetition } from './hooks/useSpacedRepetition'
import { usePageEnter } from './hooks/useGSAP'
import { useAuth } from './hooks/useAuth'
import LoginScreen from './components/LoginScreen'
import PersonalNotesPage from './pages/PersonalNotesPage'
import AdminDashboard from './pages/AdminDashboard'
import { useActivityStats } from './hooks/useActivityStats'
import { ACCOUNTS } from './lib/accounts'
import { collection, addDoc } from 'firebase/firestore'
import { db } from './lib/firebase'

export default function App() {
  const { notes, mods, syncState, saveNote, deleteNote, saveMod, deleteMod, refresh } = useFirebase()
  const { recordSession, getStreak, getLast7Days, getWorstNotes, getGlobalScore, getTotalReviewed, clearStats, stats } = useStats()
  const { history, addToHistory } = useHistory()
  const { pinned, togglePin, isPinned } = usePinned()
  const { permission: notifPermission, settings: notifSettings, requestPermission, saveSettings: saveNotifSettings, sendNotification } = useNotifications()
  const { getLevel, setLevel, updateFromRevision, getMasteryStats, clearMastery } = useMastery()
  const { updateSRS, getDueNotes, getSRSStats, clearSRS } = useSpacedRepetition()
  const { recordView, getGlobalStats, getMostViewedNotes } = useActivityStats(userId)
  const { role, isAdmin, isLoggedIn, login, logout, error: authError, account, userId } = useAuth()
  const appRef = usePageEnter([])

  const [page, setPage] = useState('home')
  const [prevPage, setPrevPage] = useState('home')
  const [curMod, setCurMod] = useState(null)
  const [curFiche, setCurFiche] = useState(null)
  const [editingNote, setEditingNote] = useState(null)
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('lgpi-dark') === '1')
  const [accent, setAccent] = useState(() => localStorage.getItem('lgpi-accent') || '#6C63FF')
  const [toast, setToast] = useState({ msg: '', visible: false })
  let toastTimer = null

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
    localStorage.setItem('lgpi-dark', darkMode ? '1' : '0')
  }, [darkMode])

  useEffect(() => {
    document.documentElement.style.setProperty('--accent', accent)
    document.documentElement.style.setProperty('--accent-bg', accent + '22')
    document.documentElement.style.setProperty('--accent-light', accent + '1a')
    localStorage.setItem('lgpi-accent', accent)
  }, [accent])

  const showToast = useCallback(msg => {
    setToast({ msg, visible: true })
    if (toastTimer) clearTimeout(toastTimer)
    toastTimer = setTimeout(() => setToast(t => ({ ...t, visible: false })), 2200)
  }, [])

  useEffect(() => {
    const handler = e => {
      const tag = document.activeElement.tagName.toLowerCase()
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return
      switch (e.key.toLowerCase()) {
        case 'escape':
          if (page === 'module') setPage('home')
          else if (page === 'fiche') setPage('module')
          else if (page === 'form') setPage(editingNote ? 'fiche' : 'module')
          else if (page === 'revision') setPage('home')
          break
        case 'n': if (page === 'module') { setEditingNote(null); setPage('form') }; break
        case 'r': if (page === 'home' || page === 'module') setPage('revision'); break
        case 'd': setDarkMode(d => !d); break
        case '/':
          e.preventDefault()
          if (page === 'home') document.querySelector('#global-search')?.focus()
          break
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [page, editingNote])

  const goHome = () => { setPage('home'); setCurFiche(null) }
  const goModule = id => { setCurMod(id); setPage('module') }
  const goFiche = (id, modId = null) => {
    if (modId) setCurMod(modId)
    setCurFiche(id); addToHistory(id); recordView(id, modId); setPage('fiche')
  }
  const goRevision = () => setPage('revision')
  const goDashboard = () => setPage('dashboard')
  const goPerso = () => setPage('perso')

  const currentNote = notes.find(n => n.id === curFiche)
  const currentMod = mods.find(m => m.id === curMod)

  const streak = getStreak()
  const last7Days = getLast7Days()
  const globalScore = getGlobalScore()
  const totalReviewed = getTotalReviewed()
  const worstNotes = getWorstNotes(notes, 5)
  const masteryStats = getMasteryStats(notes)
  const srsStats = getSRSStats(notes)

  const handleImportFiches = useCallback(async (fiches) => {
    try {
      let count = 0
      for (const fiche of fiches) {
        const mod = mods.find(m => m.label.toLowerCase() === (fiche.module || '').toLowerCase())
          || mods.find(m => fiche.module && m.label.toLowerCase().includes(fiche.module.toLowerCase()))
          || mods[0]
        if (!mod) continue
        await saveNote({
          title: fiche.title || 'Ticket Zendesk',
          module: mod.id,
          content: fiche.content || '',
          path: fiche.path || '',
          type: fiche.type || 'attention',
          links: [],
          tags: fiche.tags || [],
          date: new Date().toISOString().slice(0, 10),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
        count++
      }
      await refresh()
      showToast(count + " fiches importees !")
    } catch (e) {
      console.error(e)
      showToast("Erreur import")
    }
  }, [mods, saveNote, refresh, showToast])

  const handleImportJSON = useCallback(async ({ notes: importNotes, mods: importMods }) => {
    try {
      let noteCount = 0, modCount = 0
      for (const m of importMods) {
        if (!mods.find(x => x.id === m.id)) {
          await addDoc(collection(db, 'modules'), { ...m, createdAt: m.createdAt || Date.now() })
          modCount++
        }
      }
      for (const n of importNotes) {
        if (!notes.find(x => x.id === n.id)) {
          await addDoc(collection(db, 'notes'), n)
          noteCount++
        }
      }
      await refresh()
      showToast("+" + noteCount + " fiches importees !")
    } catch (e) {
      console.error(e)
      showToast("Erreur import JSON")
    }
  }, [notes, mods, refresh, showToast])

  const pageTitle =
    page === 'home' ? 'Mes fiches de notes' :
    page === 'module' ? (currentMod?.label || '') :
    page === 'fiche' ? (currentNote?.title || '') :
    page === 'form' ? (editingNote ? 'Modifier' : 'Nouvelle fiche') :
    page === 'modform' ? 'Nouveau module' : 'Mode revision'

  // Ecran de login si pas connecte
  if (!isLoggedIn) {
    return (
      <div style={{ '--accent': accent, '--accent-bg': accent + '22', '--accent-light': accent + '1a' }}>
        <LoginScreen onLogin={login} error={authError} />
      </div>
    )
  }

  return (
    <div className="min-h-screen transition-colors duration-500" style={{ background: darkMode ? '#0a0a0a' : '#f5f5f7' }}>
      {page === 'home' && <ParticleBackground darkMode={darkMode} />}
      <div ref={appRef} className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-24 sm:pb-8 relative z-10">
        <Header
          title={pageTitle} syncState={syncState} darkMode={darkMode}
          onDarkToggle={() => setDarkMode(d => !d)}
          accent={accent} onAccentChange={setAccent}
          onHome={goHome} onRevision={goRevision}
          isAdmin={isAdmin} onLogout={logout}
          role={role}
          onPerso={goPerso}
          account={account}
        />

        <AnimatePresence mode="wait">
          <motion.div key={page}
            initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
            transition={{ duration: .18, ease: 'easeOut' }}
          >
            {page === 'home' && (
              <HomePage
                mods={mods} notes={notes} syncState={syncState}
                onModule={goModule}
                onAddMod={isAdmin ? () => setPage('modform') : null}
                onDeleteMod={isAdmin ? async id => { await deleteMod(id); showToast('Module supprime') } : null}
                onRevision={goRevision}
                history={history} onFiche={goFiche}
                stats={stats} streak={streak} last7Days={last7Days}
                globalScore={globalScore} totalReviewed={totalReviewed}
                worstNotes={worstNotes}
                onClearStats={() => { clearStats(); clearMastery(); clearSRS(); showToast('Stats reinitialisees') }}
                notifPermission={notifPermission} notifSettings={notifSettings}
                onRequestNotifPermission={requestPermission}
                onSaveNotifSettings={saveNotifSettings}
                onTestNotif={() => { sendNotification('LGPI Notes', 'Notification test !'); showToast('Notification envoyee !') }}
                onImportJSON={handleImportJSON}
                onImportFiches={handleImportFiches}
                onDashboard={isAdmin ? goDashboard : null}
                getMasteryLevel={getLevel}
                masteryStats={masteryStats}
                srsStats={srsStats}
                isAdmin={isAdmin}
              />
            )}

            {page === 'module' && currentMod && (
              <ModulePage
                mod={currentMod} notes={notes}
                onBack={goHome}
                onFiche={id => goFiche(id)}
                onNewFiche={isAdmin ? () => { setEditingNote(null); setPage('form') } : null}
                onDeleteNote={isAdmin ? async id => { await deleteNote(id); showToast('Fiche supprimee') } : null}
                pinned={pinned}
                onTogglePin={id => {
                  const was = isPinned(id); togglePin(id)
                  showToast(was ? 'Desepinglee' : 'Epinglee !')
                }}
                getMasteryLevel={getLevel}
                isAdmin={isAdmin}
              />
            )}

            {page === 'fiche' && currentNote && currentMod && (
              <FichePage
                note={currentNote} mod={currentMod} allNotes={notes}
                onBack={dest => { if (dest === 'home') goHome(); else setPage('module') }}
                onEdit={isAdmin ? () => { setEditingNote(currentNote); setPage('form') } : null}
                onDelete={isAdmin ? async () => { await deleteNote(curFiche); showToast('Fiche supprimee'); setPage('module') } : null}
                onFiche={goFiche} onToast={showToast}
                account={account}
                isPinned={isPinned(curFiche)}
                onTogglePin={() => {
                  const was = isPinned(curFiche); togglePin(curFiche)
                  showToast(was ? 'Desepinglee' : 'Epinglee !')
                }}
                masteryLevel={getLevel(curFiche)}
                isAdmin={isAdmin}
                onMasteryChange={level => {
                  setLevel(curFiche, level)
                  showToast('Niveau mis a jour !')
                }}
              />
            )}

            {page === 'form' && isAdmin && (
              <FormPage
                note={editingNote} mods={mods} notes={notes} curMod={curMod}
                onSave={async data => {
                  await saveNote(data); showToast('Sauvegarde !')
                  if (editingNote) { setCurFiche(editingNote.id); setPage('fiche') }
                  else setPage('module')
                }}
                onCancel={dest => {
                  if (dest === 'home') goHome()
                  else if (dest === 'fiche') setPage('fiche')
                  else setPage('module')
                }}
              />
            )}

            {page === 'modform' && isAdmin && (
              <ModFormPage
                onSave={async data => { await saveMod(data); showToast('Module cree !'); goHome() }}
                onCancel={goHome}
              />
            )}

            {page === 'dashboard' && isAdmin && (
              <AdminDashboard
                onBack={goHome}
                globalStats={getGlobalStats(ACCOUNTS, notes, mods)}
                mostViewed={getMostViewedNotes(notes, 8)}
                notes={notes} mods={mods}
                onFiche={goFiche}
              />
            )}

            {page === 'perso' && (
              <PersonalNotesPage
                account={account}
                onBack={goHome}
                allNotes={notes}
                mods={mods}
                onGoFiche={(id, modId) => {
                  if (modId) setCurMod(modId)
                  setCurFiche(id)
                  addToHistory(id)
                  setPage('fiche')
                }}
              />
            )}

            {page === 'revision' && (
              <RevisionPage
                notes={notes} mods={mods}
                onBack={goHome}
                onRecordSession={recordSession}
                onUpdateMastery={updateFromRevision}
                getDueNotes={getDueNotes}
                updateSRS={updateSRS}
                srsStats={srsStats}
              />
            )}
          </motion.div>
        </AnimatePresence>

        <Toast message={toast.msg} visible={toast.visible} />
      </div>
      <BottomNav
        page={page}
        srsCount={srsStats?.due || 0}
        account={account}
        onNavigate={dest => {
          if (dest === 'home') goHome()
          else if (dest === 'revision') goRevision()
          else if (dest === 'perso') goPerso()
          else if (dest === 'search') { goHome(); setTimeout(() => document.querySelector('#global-search')?.focus(), 200) }
          else if (dest === 'planning') { goHome(); setTimeout(() => document.querySelector('#planning-section')?.scrollIntoView({ behavior: 'smooth' }), 200) }
        }}
      />
    </div>
  )
}

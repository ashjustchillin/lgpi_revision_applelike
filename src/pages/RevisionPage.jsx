import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform } from '../lib/motion'
import { NavBreadcrumb, BackButton } from '../components/UI'
import { getType } from '../lib/utils'
import { MasteryBadge } from '../components/Mastery'

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Flashcard avec swipe
function SwipeCard({ note, mod, tp, flipped, onFlip, onAnswer, masteryLevel, daysUntil }) {
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-150, 150], [-18, 18])
  const opacity = useTransform(x, [-150, -80, 0, 80, 150], [0, 1, 1, 1, 0])
  const bgOk = useTransform(x, [0, 80, 150], ['rgba(16,185,129,0)', 'rgba(16,185,129,.12)', 'rgba(16,185,129,.25)'])
  const bgKo = useTransform(x, [-150, -80, 0], ['rgba(239,68,68,.25)', 'rgba(239,68,68,.12)', 'rgba(239,68,68,0)'])

  const handleDragEnd = (_, info) => {
    if (!flipped) { onFlip(); return }
    if (info.offset.x > 80) onAnswer(true)
    else if (info.offset.x < -80) onAnswer(false)
  }

  return (
    <motion.div
      style={{ x, rotate, opacity }}
      drag={flipped ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      onClick={() => !flipped && onFlip()}
      className="relative bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-3xl p-8 min-h-64 flex flex-col items-center justify-center text-center cursor-pointer select-none"
      whileTap={{ scale: .99 }}
    >
      {/* Fond swipe OK */}
      <motion.div className="absolute inset-0 rounded-3xl" style={{ background: bgOk }} />
      {/* Fond swipe KO */}
      <motion.div className="absolute inset-0 rounded-3xl" style={{ background: bgKo }} />

      {/* Indicateurs swipe */}
      {flipped && (
        <>
          <motion.div
            className="absolute left-5 top-1/2 -translate-y-1/2 text-red-400 font-bold text-lg"
            style={{ opacity: useTransform(x, [-80, -30, 0], [1, .3, 0]) }}
          >✗</motion.div>
          <motion.div
            className="absolute right-5 top-1/2 -translate-y-1/2 text-emerald-500 font-bold text-lg"
            style={{ opacity: useTransform(x, [0, 30, 80], [0, .3, 1]) }}
          >✓</motion.div>
        </>
      )}

      <div className="absolute top-0 left-0 right-0 h-1 rounded-t-3xl" style={{ background: mod?.color }} />

      <div className="relative z-10 flex flex-col items-center gap-3 w-full">
        <div className="flex items-center gap-2 flex-wrap justify-center">
          <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: mod?.color }}>
            {mod?.icon} {mod?.label}
          </p>
          {masteryLevel !== undefined && <MasteryBadge level={masteryLevel} />}
          {daysUntil > 0 && (
            <span className="text-[10px] bg-blue-50 dark:bg-blue-950 text-blue-500 px-2 py-0.5 rounded-full font-medium">
              dans {daysUntil}j
            </span>
          )}
        </div>

        <h2 className="text-xl font-semibold tracking-tight leading-snug text-gray-900 dark:text-zinc-100">
          {note.title}
        </h2>

        <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{ background: tp?.bg, color: tp?.color }}>
          {tp?.emoji} {tp?.label}
        </span>

        <AnimatePresence>
          {!flipped ? (
            <motion.p exit={{ opacity: 0 }} className="text-sm text-gray-400 mt-2">
              Clique pour voir — swipe pour repondre
            </motion.p>
          ) : (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="w-full mt-2">
              <div className="text-left text-sm text-gray-700 dark:text-zinc-300 bg-gray-50 dark:bg-zinc-900 rounded-xl p-4 leading-relaxed whitespace-pre-wrap">
                {note.content || '—'}
              </div>
              {note.path && <p className="text-left text-xs text-gray-400 italic mt-2">↳ {note.path}</p>}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

export default function RevisionPage({ notes, mods, onBack, onRecordSession, onUpdateMastery, sortByPriority, isDue, getDueCount, updateSRSCard }) {
  const [mode, setMode] = useState('normal') // 'normal' | 'srs'
  const [modFilter, setModFilter] = useState([])
  const [deck, setDeck] = useState([])
  const [idx, setIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [score, setScore] = useState({ ok: 0, ko: 0 })
  const [done, setDone] = useState(false)
  const [sessionResults, setSessionResults] = useState([])

  const dueCount = getDueCount ? getDueCount(notes.map(n => n.id)) : 0

  const buildDeck = (filter, m) => {
    let pool = filter.length ? notes.filter(n => filter.includes(n.module)) : [...notes]
    if (m === 'srs' && sortByPriority) {
      pool = sortByPriority(pool)
    } else {
      pool = shuffle(pool)
    }
    setDeck(pool)
    setIdx(0); setFlipped(false); setScore({ ok: 0, ko: 0 }); setDone(false); setSessionResults([])
  }

  useEffect(() => { buildDeck(modFilter, mode) }, [notes])

  const toggleMod = id => {
    const f = modFilter.includes(id) ? modFilter.filter(x => x !== id) : [...modFilter, id]
    setModFilter(f)
    buildDeck(f, mode)
  }

  const handleMode = m => {
    setMode(m)
    buildDeck(modFilter, m)
  }

  const answer = (correct) => {
    const n = deck[idx]
    const result = { noteId: n.id, moduleId: n.module, correct }
    const newResults = [...sessionResults, result]
    setSessionResults(newResults)
    setScore(s => ({ ...s, [correct ? 'ok' : 'ko']: s[correct ? 'ok' : 'ko'] + 1 }))
    if (onUpdateMastery) onUpdateMastery(n.id, correct)
    if (updateSRSCard) updateSRSCard(n.id, correct)
    if (idx + 1 >= deck.length) {
      setDone(true)
      onRecordSession(newResults)
    } else {
      setIdx(i => i + 1); setFlipped(false)
    }
  }

  const n = deck[idx]
  const m = n ? (mods.find(x => x.id === n.module) || { label: '?', icon: '?', color: '#888', bg: '#eee', tc: '#555' }) : null
  const tp = n ? getType(n.type) : null
  const pct = done ? Math.round((score.ok / (score.ok + score.ko)) * 100) || 0 : 0

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
      <NavBreadcrumb crumbs={[{ label: 'Accueil', action: onBack }, { label: 'Mode revision' }]} />
      <BackButton label="Retour" onClick={onBack} />

      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-gray-900 dark:text-zinc-100">🃏 Mode revision</h2>
          {!done && deck.length > 0 && (
            <p className="text-sm text-gray-400 mt-0.5">{idx + 1} / {deck.length} · ✓ {score.ok} · ✗ {score.ko}</p>
          )}
        </div>
        {/* Toggle mode */}
        <div className="flex bg-gray-100 dark:bg-zinc-800 rounded-xl p-1 gap-1">
          <button
            onClick={() => handleMode('normal')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${mode === 'normal' ? 'bg-white dark:bg-zinc-700 text-gray-800 dark:text-zinc-100 shadow-sm' : 'text-gray-400'}`}
          >Aleatoire</button>
          <button
            onClick={() => handleMode('srs')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${mode === 'srs' ? 'bg-white dark:bg-zinc-700 text-gray-800 dark:text-zinc-100 shadow-sm' : 'text-gray-400'}`}
          >
            🧠 Espacee
            {dueCount > 0 && <span className="bg-red-400 text-white text-[10px] px-1.5 py-0.5 rounded-full">{dueCount}</span>}
          </button>
        </div>
      </div>

      {/* Info SRS */}
      {mode === 'srs' && !done && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="mb-4 px-4 py-2.5 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-xl"
        >
          <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
            🧠 Mode repetition espacee — {dueCount} fiche{dueCount > 1 ? 's' : ''} a revoir aujourd'hui. Les fiches difficiles reviennent plus souvent.
          </p>
        </motion.div>
      )}

      {/* Filtres modules */}
      <div className="flex flex-wrap gap-2 items-center mb-5">
        <span className="text-sm text-gray-400 font-medium">Modules :</span>
        {mods.filter(m => notes.some(n => n.module === m.id)).map(m => {
          const cnt = notes.filter(n => n.module === m.id).length
          const on = modFilter.length === 0 || modFilter.includes(m.id)
          return (
            <motion.button key={m.id} whileTap={{ scale: .95 }} onClick={() => toggleMod(m.id)}
              className="text-sm px-3 py-1.5 rounded-full font-medium transition-all"
              style={{ background: m.bg, color: m.tc, opacity: on ? 1 : .45 }}
            >{m.icon} {m.label} ({cnt})</motion.button>
          )
        })}
      </div>

      {deck.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <div className="text-4xl mb-3">🃏</div>
          <p className="text-sm">Cree d'abord quelques fiches !</p>
        </div>
      ) : done ? (
        <motion.div initial={{ opacity: 0, scale: .97 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-12">
          <AnimatedNumber value={pct} className="text-6xl font-bold mb-2"
            style={{ color: pct >= 70 ? '#1A8C6A' : pct >= 40 ? '#996600' : '#CC0022' }}
          />
          <p className="text-gray-400 text-sm mb-2">{score.ok} correcte{score.ok > 1 ? 's' : ''} · {score.ko} a revoir</p>
          <p className="text-xs text-gray-400 mb-6">
            {pct >= 70 ? 'Excellent travail !' : pct >= 40 ? 'Continue comme ca !' : 'Encore un peu de revision !'}
          </p>
          <div className="flex gap-3 justify-center">
            <motion.button whileTap={{ scale: .95 }} onClick={() => buildDeck(modFilter, mode)} className="btn-accent">
              Recommencer
            </motion.button>
            <motion.button whileTap={{ scale: .95 }} onClick={onBack}
              className="px-4 py-2 text-sm text-gray-400 border border-gray-200 dark:border-zinc-700 rounded-xl"
            >Retour</motion.button>
          </div>
        </motion.div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div key={idx}>
            <SwipeCard
              note={n} mod={m} tp={tp}
              flipped={flipped}
              onFlip={() => setFlipped(true)}
              onAnswer={answer}
              masteryLevel={undefined}
              daysUntil={0}
            />
            <div className="flex gap-3 justify-center flex-wrap mt-4">
              {!flipped ? (
                <motion.button whileTap={{ scale: .95 }} onClick={() => setFlipped(true)}
                  className="px-8 py-3 bg-accent-soft text-accent rounded-xl text-sm font-semibold"
                >Voir la reponse</motion.button>
              ) : (
                <>
                  <motion.button initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                    whileTap={{ scale: .95 }} onClick={() => answer(false)}
                    className="px-6 py-3 bg-red-50 dark:bg-red-950 text-red-500 rounded-xl text-sm font-semibold hover:bg-red-100 transition-colors"
                  >✗ A revoir</motion.button>
                  <motion.button initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}
                    whileTap={{ scale: .95 }} onClick={() => answer(true)}
                    className="px-6 py-3 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 rounded-xl text-sm font-semibold hover:bg-emerald-100 transition-colors"
                  >✓ Je savais</motion.button>
                </>
              )}
            </div>
            {flipped && (
              <p className="text-center text-xs text-gray-400 mt-3">
                Swipe droite = je savais · Swipe gauche = a revoir
              </p>
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </motion.div>
  )
}

// Composant nombre anime
function AnimatedNumber({ value, className, style }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    let start = 0
    const step = Math.ceil(value / 30)
    const timer = setInterval(() => {
      start += step
      if (start >= value) { setDisplay(value); clearInterval(timer) }
      else setDisplay(start)
    }, 30)
    return () => clearInterval(timer)
  }, [value])
  return <div className={className} style={style}>{display}%</div>
}

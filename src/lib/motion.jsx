import { useEffect, useRef, forwardRef } from 'react'

// ── HELPERS ───────────────────────────────────────────────
function applyState(el, state) {
  if (!el || !state) return
  if (state.opacity !== undefined) el.style.opacity = String(state.opacity)
  if (state.y !== undefined) el.style.transform = `translateY(${state.y}px)`
  if (state.x !== undefined) el.style.transform = `translateX(${state.x}px)`
  if (state.scale !== undefined) el.style.transform = `scale(${state.scale})`
  if (state.rotate !== undefined) el.style.transform = `rotate(${state.rotate}deg)`
  if (state.height !== undefined) el.style.height = typeof state.height === 'number' ? state.height + 'px' : state.height
}

function getTransition(transition) {
  const dur = transition?.duration ?? 0.2
  const ease = transition?.type === 'spring' ? 'cubic-bezier(.32,1,.28,1)' : 'ease-out'
  return `opacity ${dur}s ${ease}, transform ${dur}s ${ease}, height ${dur}s ${ease}, box-shadow ${dur}s ${ease}`
}

function getInitStyle(initial) {
  if (!initial) return {}
  const s = {}
  if (initial.opacity !== undefined) s.opacity = initial.opacity
  if (initial.y !== undefined) s.transform = `translateY(${initial.y}px)`
  if (initial.x !== undefined) s.transform = `translateX(${initial.x}px)`
  if (initial.scale !== undefined) s.transform = `scale(${initial.scale})`
  if (initial.height !== undefined) s.height = typeof initial.height === 'number' ? initial.height + 'px' : initial.height
  return s
}

// ── FACTORY ───────────────────────────────────────────────
function createMotionComponent(Tag) {
  const Component = forwardRef(function MotionEl(props, ref) {
    const {
      initial, animate, exit, whileHover, whileTap,
      transition, variants, layout, layoutId,
      children, style, className, onClick,
      onMouseEnter, onMouseLeave,
      ...rest
    } = props

    const elRef = useRef(null)
    const resolvedRef = ref || elRef

    useEffect(() => {
      const el = resolvedRef.current
      if (!el || !animate) return
      el.style.transition = getTransition(transition)
      const id = requestAnimationFrame(() => applyState(el, animate))
      return () => cancelAnimationFrame(id)
    }, [JSON.stringify(animate)])

    function handleMouseEnter(e) {
      if (whileHover) {
        const el = resolvedRef.current
        if (el) {
          el.style.transition = 'transform .15s ease, box-shadow .15s ease, opacity .15s ease'
          applyState(el, whileHover)
          if (whileHover.boxShadow) el.style.boxShadow = whileHover.boxShadow
        }
      }
      if (onMouseEnter) onMouseEnter(e)
    }

    function handleMouseLeave(e) {
      if (whileHover && animate) {
        const el = resolvedRef.current
        if (el) {
          applyState(el, animate)
          if (animate.boxShadow !== undefined) el.style.boxShadow = animate.boxShadow || ''
        }
      }
      if (onMouseLeave) onMouseLeave(e)
    }

    function handleMouseDown() {
      if (whileTap) {
        const el = resolvedRef.current
        if (el) {
          el.style.transition = 'transform .1s ease'
          applyState(el, whileTap)
        }
      }
    }

    function handleMouseUp() {
      if (whileTap && animate) {
        const el = resolvedRef.current
        if (el) applyState(el, animate)
      }
    }

    const initStyle = getInitStyle(initial)

    return (
      <Tag
        ref={resolvedRef}
        className={className}
        style={{ ...initStyle, ...style }}
        onClick={onClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        {...rest}
      >
        {children}
      </Tag>
    )
  })
  Component.displayName = 'Motion(' + Tag + ')'
  return Component
}

// ── EXPORTS PRINCIPAUX ────────────────────────────────────
// IMPORTANT: definir AVANT tout usage

export const motion = {
  div: createMotionComponent('div'),
  button: createMotionComponent('button'),
  span: createMotionComponent('span'),
  p: createMotionComponent('p'),
  header: createMotionComponent('header'),
  nav: createMotionComponent('nav'),
  section: createMotionComponent('section'),
  article: createMotionComponent('article'),
  aside: createMotionComponent('aside'),
  ul: createMotionComponent('ul'),
  li: createMotionComponent('li'),
  h1: createMotionComponent('h1'),
  h2: createMotionComponent('h2'),
  h3: createMotionComponent('h3'),
  form: createMotionComponent('form'),
  a: createMotionComponent('a'),
  img: createMotionComponent('img'),
  label: createMotionComponent('label'),
}

export function AnimatePresence({ children }) {
  return children
}

// ── HOOKS ─────────────────────────────────────────────────
export function useMotionValue(initial) {
  const ref = useRef(initial)
  return {
    get: () => ref.current,
    set: (v) => { ref.current = v },
    onChange: () => () => {},
  }
}

export function useTransform(val, input, output) {
  return { get: () => output[0], onChange: () => () => {} }
}

export function useSpring(value) {
  return { get: () => (typeof value === 'number' ? value : 0), set: () => {}, onChange: () => () => {} }
}

export function useAnimation() {
  return { start: () => Promise.resolve(), stop: () => {} }
}

export function useDragControls() {
  return { start: () => {} }
}

export function useInView() {
  return true
}

// ── MISC ──────────────────────────────────────────────────
export function animate(from, to, options) {
  return { stop: () => {}, then: (cb) => { if (cb) cb(); return Promise.resolve() } }
}

export function MotionConfig({ children }) {
  return children
}

export function LazyMotion({ children }) {
  return children
}

export const domAnimation = {}
export const domMax = {}

// Shim framer-motion leger - animations CSS pures, meme API
import { useEffect, useRef, forwardRef } from 'react'

// Convertit les props motion en style CSS
function getAnimStyle(animate, initial, transition) {
  const dur = transition?.duration ?? 0.2
  const ease = transition?.ease === 'easeOut' ? 'ease-out'
    : transition?.type === 'spring' ? 'cubic-bezier(.32,1,.28,1)'
    : 'ease'
  return {
    transition: `opacity ${dur}s ${ease}, transform ${dur}s ${ease}, height ${dur}s ${ease}`,
  }
}

function applyState(el, state) {
  if (!el || !state) return
  if (state.opacity !== undefined) el.style.opacity = state.opacity
  if (state.y !== undefined) el.style.transform = `translateY(${state.y}px)`
  if (state.x !== undefined) el.style.transform = `translateX(${state.x}px)`
  if (state.scale !== undefined) el.style.transform = `scale(${state.scale})`
  if (state.rotate !== undefined) el.style.transform = `rotate(${state.rotate}deg)`
  if (state.height !== undefined) el.style.height = typeof state.height === 'number' ? state.height + 'px' : state.height
}

// Composant motion generique
function createMotion(Tag) {
  return forwardRef(function MotionEl({
    initial, animate, exit, whileHover, whileTap, whileFocus,
    transition, variants, layout, layoutId,
    children, style, className, onClick, onMouseEnter, onMouseLeave,
    ...rest
  }, ref) {
    const elRef = useRef(null)
    const combinedRef = ref || elRef

    useEffect(() => {
      const el = combinedRef.current
      if (!el) return
      if (initial) applyState(el, initial)
      const tid = requestAnimationFrame(() => {
        if (animate) {
          Object.assign(el.style, getAnimStyle(animate, initial, transition))
          applyState(el, animate)
        }
      })
      return () => cancelAnimationFrame(tid)
    }, [JSON.stringify(animate)])

    const handleMouseEnter = (e) => {
      if (whileHover) {
        const el = combinedRef.current
        if (el) {
          el.style.transition = 'transform .15s ease, box-shadow .15s ease, opacity .15s ease'
          applyState(el, whileHover)
          if (whileHover.boxShadow) el.style.boxShadow = whileHover.boxShadow
          if (whileHover.y !== undefined) el.style.transform = `translateY(${whileHover.y}px)`
        }
      }
      onMouseEnter?.(e)
    }

    const handleMouseLeave = (e) => {
      if (whileHover && animate) {
        const el = combinedRef.current
        if (el) {
          applyState(el, animate)
          if (animate.boxShadow !== undefined) el.style.boxShadow = animate.boxShadow || ''
        }
      }
      onMouseLeave?.(e)
    }

    const handleMouseDown = (e) => {
      if (whileTap) {
        const el = combinedRef.current
        if (el) applyState(el, whileTap)
      }
    }

    const handleMouseUp = (e) => {
      if (whileTap && animate) {
        const el = combinedRef.current
        if (el) applyState(el, animate)
      }
    }

    const initStyle = {}
    if (initial) {
      if (initial.opacity !== undefined) initStyle.opacity = initial.opacity
      if (initial.y !== undefined) initStyle.transform = `translateY(${initial.y}px)`
      if (initial.x !== undefined) initStyle.transform = `translateX(${initial.x}px)`
      if (initial.scale !== undefined) initStyle.transform = `scale(${initial.scale})`
      if (initial.height !== undefined) initStyle.height = typeof initial.height === 'number' ? initial.height + 'px' : initial.height
    }

    return (
      <Tag
        ref={combinedRef}
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
}

// AnimatePresence - rend juste les enfants
export function AnimatePresence({ children, mode }) {
  return children
}

// motion object avec tous les tags HTML courants
export const motion = {
  div: createMotion('div'),
  button: createMotion('button'),
  span: createMotion('span'),
  p: createMotion('p'),
  header: createMotion('header'),
  nav: createMotion('nav'),
  section: createMotion('section'),
  article: createMotion('article'),
  aside: createMotion('aside'),
  ul: createMotion('ul'),
  li: createMotion('li'),
  h1: createMotion('h1'),
  h2: createMotion('h2'),
  h3: createMotion('h3'),
  form: createMotion('form'),
  input: createMotion('input'),
  label: createMotion('label'),
  img: createMotion('img'),
  a: createMotion('a'),
}

export function useAnimation() {
  return { start: () => {}, stop: () => {} }
}

export function useMotionValue(v) {
  return { get: () => v, set: () => {}, onChange: () => () => {} }
}

export function useTransform(val, input, output) {
  return { get: () => output[0] }
}

// Exports supplementaires pour compatibilite
export function animate(from, to, options) {
  return { stop: () => {}, then: (cb) => { cb && cb(); return Promise.resolve() } }
}

export function useSpring(value, config) {
  return { get: () => (typeof value === 'number' ? value : 0), set: () => {}, onChange: () => () => {} }
}

export function useDragControls() {
  return { start: () => {} }
}

export function useInView(ref, options) {
  return true
}

export const MotionConfig = ({ children }) => children
export const LazyMotion = ({ children }) => children
export const domAnimation = {}
export const domMax = {}

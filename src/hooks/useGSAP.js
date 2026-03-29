import { useEffect, useRef } from 'react'

// Animations CSS pures - pas de dependance GSAP externe
export function usePageEnter(deps = []) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.opacity = '0'
    el.style.transform = 'translateY(10px)'
    el.style.transition = 'opacity 0.3s ease, transform 0.3s ease'
    const raf = requestAnimationFrame(() => {
      el.style.opacity = '1'
      el.style.transform = 'translateY(0)'
    })
    return () => cancelAnimationFrame(raf)
  }, deps)

  return ref
}

export function useCounterAnim(value, duration = 1.2) {
  const ref = useRef(null)
  useEffect(() => {
    if (!ref.current || value === null || value === undefined) return
    const el = ref.current
    const start = 0
    const startTime = performance.now()
    const animate = (now) => {
      const elapsed = (now - startTime) / (duration * 1000)
      const progress = Math.min(elapsed, 1)
      const ease = 1 - Math.pow(1 - progress, 3)
      el.textContent = Math.round(start + (value - start) * ease)
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [value])
  return ref
}

export function useTextReveal(text, deps = []) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el || !text) return
    el.textContent = text
  }, deps)
  return ref
}

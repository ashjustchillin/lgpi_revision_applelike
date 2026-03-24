import { useEffect, useRef } from 'react'

// Wrapper leger pour GSAP sans import direct
// Utilise CSS animations pour compatibilite maximale
// et GSAP seulement pour les effets avances

export function usePageEnter(deps = []) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // Reset
    el.style.opacity = '0'
    el.style.transform = 'translateY(12px)'

    // Animer avec GSAP si disponible, sinon CSS
    let cleanup = () => {}
    import('gsap').then(({ gsap }) => {
      const tl = gsap.timeline()
      tl.to(el, { opacity: 1, y: 0, duration: 0.4, ease: 'power3.out' })

      // Animer les enfants en stagger
      const children = el.querySelectorAll('.gsap-item')
      if (children.length) {
        tl.from(children, {
          opacity: 0, y: 10, duration: 0.3,
          stagger: 0.06, ease: 'power2.out'
        }, '-=0.2')
      }

      cleanup = () => tl.kill()
    }).catch(() => {
      // Fallback CSS
      el.style.transition = 'opacity 0.35s ease, transform 0.35s ease'
      requestAnimationFrame(() => {
        el.style.opacity = '1'
        el.style.transform = 'translateY(0)'
      })
    })

    return () => cleanup()
  }, deps)

  return ref
}

export function useCounterAnim(value, duration = 1.2) {
  const ref = useRef(null)

  useEffect(() => {
    if (!ref.current || value === null || value === undefined) return
    const el = ref.current

    import('gsap').then(({ gsap }) => {
      const obj = { val: 0 }
      gsap.to(obj, {
        val: value,
        duration,
        ease: 'power2.out',
        onUpdate: () => { el.textContent = Math.round(obj.val) }
      })
    }).catch(() => {
      el.textContent = value
    })
  }, [value])

  return ref
}

export function useTextReveal(text, deps = []) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el || !text) return

    import('gsap').then(({ gsap }) => {
      // Split en chars
      el.innerHTML = text.split('').map((c, i) =>
        c === ' ' ? ' ' : `<span style="display:inline-block;opacity:0;transform:translateY(8px)">${c}</span>`
      ).join('')

      gsap.to(el.querySelectorAll('span'), {
        opacity: 1, y: 0, duration: 0.4,
        stagger: 0.025, ease: 'power2.out',
        delay: 0.1,
      })
    }).catch(() => {
      el.textContent = text
    })
  }, deps)

  return ref
}

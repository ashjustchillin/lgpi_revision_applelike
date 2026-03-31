import { useRef, useCallback } from 'react'

export function useSwipe({ onLeft, onRight, onUp, onDown, threshold = 50 }) {
  const start = useRef(null)

  const onTouchStart = useCallback(e => {
    const t = e.touches[0]
    start.current = { x: t.clientX, y: t.clientY }
  }, [])

  const onTouchEnd = useCallback(e => {
    if (!start.current) return
    const t = e.changedTouches[0]
    const dx = t.clientX - start.current.x
    const dy = t.clientY - start.current.y
    const adx = Math.abs(dx), ady = Math.abs(dy)
    if (adx < threshold && ady < threshold) return
    if (adx > ady) {
      if (dx < 0 && onLeft) onLeft()
      else if (dx > 0 && onRight) onRight()
    } else {
      if (dy < 0 && onUp) onUp()
      else if (dy > 0 && onDown) onDown()
    }
    start.current = null
  }, [onLeft, onRight, onUp, onDown, threshold])

  return { onTouchStart, onTouchEnd }
}

export function usePullToRefresh(onRefresh, threshold = 80) {
  const startY = useRef(null)
  const pulling = useRef(false)

  const onTouchStart = useCallback(e => {
    if (window.scrollY === 0) startY.current = e.touches[0].clientY
  }, [])

  const onTouchEnd = useCallback(async e => {
    if (!startY.current) return
    const dy = e.changedTouches[0].clientY - startY.current
    if (dy > threshold && pulling.current) {
      pulling.current = false
      await onRefresh()
    }
    startY.current = null
    pulling.current = false
  }, [onRefresh, threshold])

  const onTouchMove = useCallback(e => {
    if (!startY.current) return
    const dy = e.touches[0].clientY - startY.current
    if (dy > 20) pulling.current = true
  }, [])

  return { onTouchStart, onTouchEnd, onTouchMove }
}

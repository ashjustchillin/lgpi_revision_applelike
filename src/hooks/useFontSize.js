import { useState, useEffect } from 'react'

const KEY = 'lgpi-font-size'
const SIZES = { small: 13, normal: 15, large: 17 }

export function useFontSize() {
  const [size, setSize] = useState(() => localStorage.getItem(KEY) || 'normal')

  useEffect(() => {
    const px = SIZES[size] || 15
    document.documentElement.style.fontSize = px + 'px'
    localStorage.setItem(KEY, size)
  }, [size])

  return { size, setSize, sizes: Object.keys(SIZES) }
}

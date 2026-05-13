import { Sun, Moon } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function ThemeToggle() {
  const [isLight, setIsLight] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('theme') === 'light'
    setIsLight(stored)
    if (stored) document.documentElement.classList.add('light')
  }, [])

  const toggle = () => {
    const next = !isLight
    setIsLight(next)
    localStorage.setItem('theme', next ? 'light' : 'dark')
    document.documentElement.classList.toggle('light', next)
  }

  return (
    <button onClick={toggle} className="p-1.5 hover:bg-white/5 rounded transition-colors" title={isLight ? 'Modo oscuro' : 'Modo claro'}>
      {isLight ? <Moon size={12} className="text-gray-500" /> : <Sun size={12} className="text-gray-500" />}
    </button>
  )
}

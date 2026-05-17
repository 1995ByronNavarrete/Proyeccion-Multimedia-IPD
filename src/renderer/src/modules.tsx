import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { BookOpen, Youtube, Image, Monitor, Music, Mic, Sparkles, Clock, Layout, Play, FileVideo, FileText, Megaphone } from 'lucide-react'

export interface ModuleDef {
  id: string
  label: string
  icon: string
  zone: 'left-top' | 'left-bottom' | 'center-top' | 'center-bottom' | 'right-top' | 'right-mid' | 'right-bottom'
  defaultEnabled: boolean
}

export const ALL_MODULES: ModuleDef[] = [
  { id: 'pantallas', label: 'Pantallas', icon: 'Monitor', zone: 'left-bottom', defaultEnabled: true },
  { id: 'youtube', label: 'YouTube', icon: 'Youtube', zone: 'left-bottom', defaultEnabled: true },
  { id: 'imagenes', label: 'Imágenes', icon: 'Image', zone: 'center-bottom', defaultEnabled: true },
  { id: 'audio', label: 'Consola Audio', icon: 'Music', zone: 'center-bottom', defaultEnabled: true },
  { id: 'anuncios', label: 'Anuncios', icon: 'Megaphone', zone: 'center-bottom', defaultEnabled: true },
  { id: 'reproductor', label: 'Reproductor', icon: 'FileVideo', zone: 'right-mid', defaultEnabled: true },
  { id: 'predicacion', label: 'Predicación', icon: 'Mic', zone: 'right-bottom', defaultEnabled: true },
  { id: 'multimedia', label: 'Multimedia', icon: 'FileText', zone: 'right-bottom', defaultEnabled: true },
  { id: 'efectos', label: 'Efectos Visuales', icon: 'Sparkles', zone: 'right-bottom', defaultEnabled: true },
  { id: 'cronometro', label: 'Cronómetro', icon: 'Clock', zone: 'right-bottom', defaultEnabled: true }
]

const STORAGE_KEY = 'ipd-modules'

function loadEnabled(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return new Set(JSON.parse(raw))
  } catch {}
  return new Set(ALL_MODULES.filter((m) => m.defaultEnabled).map((m) => m.id))
}

interface ModuleCtx {
  enabled: Set<string>
  toggle: (id: string) => void
  isEnabled: (id: string) => boolean
}

const Ctx = createContext<ModuleCtx>({ enabled: new Set(), toggle: () => {}, isEnabled: () => false })

export function ModuleProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabled] = useState<Set<string>>(loadEnabled)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...enabled]))
  }, [enabled])

  const toggle = useCallback((id: string) => {
    setEnabled((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }, [])

  const isEnabled = useCallback((id: string) => enabled.has(id), [enabled])

  return <Ctx.Provider value={{ enabled, toggle, isEnabled }}>{children}</Ctx.Provider>
}

export function useModules() {
  return useContext(Ctx)
}

export function getModuleIcon(name: string) {
  const icons: Record<string, any> = { BookOpen, Youtube, Image, Monitor, Music, Mic, Sparkles, Clock, Layout, Play, FileVideo, FileText, Megaphone }
  return icons[name] || Layout
}

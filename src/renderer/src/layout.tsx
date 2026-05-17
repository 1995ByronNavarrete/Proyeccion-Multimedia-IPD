import { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react'

export type ZoneId = 'left' | 'center' | 'right'
export type ModuleId = string

export interface LayoutProfile {
  name: string
  zones: Record<ZoneId, ModuleId[]>
}

const STORAGE_KEY = 'ipd-layouts'
const ACTIVE_KEY = 'ipd-layout-active'

const DEFAULT_LAYOUTS: LayoutProfile[] = [
  {
    name: 'Completo',
    zones: {
      left: ['pantallas', 'youtube'],
      center: ['imagenes', 'anuncios', 'audio'],
      right: ['reproductor', 'predicacion', 'multimedia', 'efectos']
    }
  },
  {
    name: 'Predicación',
    zones: {
      left: ['pantallas'],
      center: ['imagenes', 'anuncios'],
      right: ['predicacion', 'multimedia']
    }
  },
  {
    name: 'Música',
    zones: {
      left: ['youtube'],
      center: ['audio'],
      right: ['reproductor', 'multimedia']
    }
  },
  {
    name: 'Mínimo',
    zones: {
      left: [],
      center: [],
      right: ['multimedia']
    }
  }
]

interface LayoutCtx {
  profiles: LayoutProfile[]
  activeProfile: string
  setActiveProfile: (name: string) => void
  saveProfile: (name: string) => void
  deleteProfile: (name: string) => void
  getModules: (zone: ZoneId) => ModuleId[]
  moveModule: (moduleId: ModuleId, fromZone: ZoneId, toZone: ZoneId, toIndex?: number) => void
  reorderModule: (zone: ZoneId, fromIndex: number, toIndex: number) => void
  editing: boolean
  setEditing: (v: boolean) => void
  resizing: string | null
  setResizing: (v: string | null) => void
  flexValues: Record<string, number>
  setFlexValue: (id: string, value: number) => void
}

const Ctx = createContext<LayoutCtx>(null as any)

function loadProfiles(): LayoutProfile[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return DEFAULT_LAYOUTS
}

function loadActive(): string {
  return localStorage.getItem(ACTIVE_KEY) || 'Completo'
}

export function LayoutProvider({ children }: { children: ReactNode }) {
  const [profiles, setProfiles] = useState<LayoutProfile[]>(loadProfiles)
  const [activeName, setActiveName] = useState(loadActive)
  const [editing, setEditing] = useState(false)
  const [resizing, setResizing] = useState<string | null>(null)
  const [flexValues, setFlexValues] = useState<Record<string, number>>({})
  const dragRef = useRef<{ module: string; from: ZoneId } | null>(null)

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles)) }, [profiles])
  useEffect(() => { localStorage.setItem(ACTIVE_KEY, activeName) }, [activeName])

  const active = profiles.find(p => p.name === activeName) || profiles[0]

  const setActiveProfile = useCallback((name: string) => {
    if (profiles.find(p => p.name === name)) setActiveName(name)
  }, [profiles])

  const saveProfile = useCallback((name: string) => {
    const zones = active.zones
    setProfiles(prev => {
      const existing = prev.findIndex(p => p.name === name)
      if (existing >= 0) {
        const next = [...prev]
        next[existing] = { ...next[existing], zones }
        return next
      }
      return [...prev, { name, zones }]
    })
    setActiveName(name)
  }, [active])

  const deleteProfile = useCallback((name: string) => {
    setProfiles(prev => prev.filter(p => p.name !== name))
    if (activeName === name) setActiveName(profiles[0]?.name || 'Completo')
  }, [activeName, profiles])

  const getModules = useCallback((zone: ZoneId): ModuleId[] => {
    return active?.zones[zone] || []
  }, [active])

  const moveModule = useCallback((moduleId: string, fromZone: ZoneId, toZone: ZoneId, toIndex?: number) => {
    setProfiles(prev => prev.map(p => {
      if (p.name !== activeName) return p
      const zones = { ...p.zones }
      const from = [...(zones[fromZone] || [])]
      const to = [...(zones[toZone] || [])]
      const idx = from.indexOf(moduleId)
      if (idx < 0) return p
      from.splice(idx, 1)
      if (fromZone === toZone) {
        const targetIdx = toIndex ?? idx
        from.splice(targetIdx, 0, moduleId)
        zones[fromZone] = from
      } else {
        const targetIdx = toIndex ?? to.length
        to.splice(targetIdx, 0, moduleId)
        zones[fromZone] = from
        zones[toZone] = to
      }
      return { ...p, zones }
    }))
  }, [activeName])

  const reorderModule = useCallback((zone: ZoneId, fromIndex: number, toIndex: number) => {
    setProfiles(prev => prev.map(p => {
      if (p.name !== activeName) return p
      const zones = { ...p.zones }
      const arr = [...(zones[zone] || [])]
      if (fromIndex < 0 || fromIndex >= arr.length) return p
      const [item] = arr.splice(fromIndex, 1)
      arr.splice(toIndex, 0, item)
      zones[zone] = arr
      return { ...p, zones }
    }))
  }, [activeName])

  const setFlexValue = useCallback((id: string, value: number) => {
    setFlexValues(prev => ({ ...prev, [id]: Math.max(1, Math.min(10, value)) }))
  }, [])

  return (
    <Ctx.Provider value={{
      profiles, activeProfile: activeName, setActiveProfile,
      saveProfile, deleteProfile, getModules, moveModule, reorderModule,
      editing, setEditing, resizing, setResizing, flexValues, setFlexValue
    }}>
      {children}
    </Ctx.Provider>
  )
}

export function useLayout() {
  return useContext(Ctx)
}

import { useState, useEffect } from 'react'
import { Monitor, MonitorPlay, MonitorOff, X, Check, Laptop, BookOpen, Youtube, Image, Megaphone, Sparkles, Play } from 'lucide-react'

interface Display {
  id: number
  name: string
  bounds: { x: number; y: number; width: number; height: number }
  primary: boolean
}

const CONTENT_TYPES = [
  { id: 'biblia', label: 'Biblia', icon: BookOpen },
  { id: 'video', label: 'Video', icon: Play },
  { id: 'anuncios', label: 'Anuncios', icon: Megaphone },
  { id: 'fondos', label: 'Fondos', icon: Image },
  { id: 'efectos', label: 'Efectos', icon: Sparkles }
]

type ContentAssignment = Record<number, string[]>

const STORAGE_KEY = 'ipd-display-assignments'

function loadAssignments(): ContentAssignment {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') } catch { return {} }
}

export default function ScreensModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [displays, setDisplays] = useState<Display[]>([])
  const [assignments, setAssignments] = useState<ContentAssignment>(loadAssignments)
  const [appDisplayId, setAppDisplayId] = useState<number | null>(null)
  const [selectedDisplays, setSelectedDisplays] = useState<number[]>([])

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(assignments)) }, [assignments])

  useEffect(() => {
    if (!open) return
    window.api.screen.getLayout().then(res => {
      setDisplays(res.displays)
      setAppDisplayId(res.appDisplayId)
      setSelectedDisplays(res.displays.filter((d: Display) => d.id !== res.appDisplayId).map((d: Display) => d.id))
    })
  }, [open])

  const toggleDisplay = (id: number) => {
    if (id === appDisplayId) return
    setSelectedDisplays(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const toggleContent = (displayId: number, contentType: string) => {
    setAssignments(prev => {
      const current = prev[displayId] || []
      // If the display is not selected, add it
      if (!selectedDisplays.includes(displayId)) {
        setSelectedDisplays(s => [...s, displayId])
      }
      const next = current.includes(contentType)
        ? current.filter(c => c !== contentType)
        : [...current, contentType]
      return { ...prev, [displayId]: next }
    })
  }

  const getContentForDisplay = (id: number) => assignments[id] || []

  const applyToSelected = () => {
    // Open projector windows for selected displays
    for (const id of selectedDisplays) {
      window.api.projector.projectToDisplay(id)
    }
    onClose()
  }

  const copyToAll = (contentType: string) => {
    setAssignments(prev => {
      const next = { ...prev }
      const sourceId = selectedDisplays.find(id => (prev[id] || []).includes(contentType))
      if (!sourceId) return prev
      const sourceContent = prev[sourceId] || []
      for (const d of displays) {
        if (d.id === appDisplayId) continue
        const current = next[d.id] || []
        const merged = [...new Set([...current, ...sourceContent])]
        next[d.id] = merged
      }
      return next
    })
  }

  const selectAll = () => {
    setSelectedDisplays(displays.filter(d => d.id !== appDisplayId).map(d => d.id))
  }

  const closeAll = () => {
    window.api.projector.close()
    setSelectedDisplays([])
    setAssignments({})
    onClose()
  }

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[900px] max-w-[95vw] max-h-[85vh] bg-theme-panel border border-[rgba(120,80,255,0.25)] rounded-xl shadow-2xl shadow-black/60 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-theme shrink-0">
          <h3 className="text-xs font-bold text-theme flex items-center gap-2">
            <Monitor size={14} className="text-[#6c5ce7]" /> Configurar pantallas
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-white/5 rounded"><X size={14} className="text-theme-dim" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex gap-4 min-w-0">
            {displays.map(d => {
              const isApp = d.id === appDisplayId
              const isSel = selectedDisplays.includes(d.id)
              const content = getContentForDisplay(d.id)
              const ratio = d.bounds.width / d.bounds.height
              const w = Math.min(240, Math.max(160, ratio * 130))
              return (
                <div key={d.id}
                  className={`flex flex-col rounded-xl border-2 transition-all shrink-0 overflow-hidden ${
                    isApp ? 'border-[#6c5ce7]/30 bg-[#6c5ce7]/5' :
                    isSel ? 'border-[#6c5ce7] bg-[#6c5ce7]/10' : 'border-theme bg-theme-card'
                  }`}
                  style={{ width: w + 24 }}>
                  <div
                    onClick={() => toggleDisplay(d.id)}
                    className={`flex flex-col items-center gap-2 p-3 cursor-pointer ${isApp ? 'cursor-default' : ''}`}>
                    <div className="flex items-center justify-center" style={{ width: w, height: w / ratio }}>
                      <div className={`w-full h-full rounded border flex items-center justify-center ${
                        isApp ? 'bg-[#6c5ce7]/10 border-[#6c5ce7]/30' : isSel ? 'bg-[#6c5ce7]/20 border-[#6c5ce7]' : 'bg-black/40 border-theme'
                      }`}>
                        {isApp ? <Laptop size={30} className="text-[#6c5ce7]" /> : <MonitorPlay size={30} className={isSel ? 'text-[#6c5ce7]' : 'text-theme-dim'} />}
                      </div>
                    </div>
                    <div className="text-center w-full">
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-[10px] text-theme font-medium truncate max-w-[100px]">{d.name}</span>
                        {isApp && <span className="text-[7px] bg-[#6c5ce7]/20 text-[#6c5ce7] px-1 rounded">Ctrl</span>}
                      </div>
                      <p className="text-[8px] text-theme-dim">{d.bounds.width}×{d.bounds.height}</p>
                    </div>
                    {!isApp && (
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        isSel ? 'bg-[#6c5ce7] border-[#6c5ce7]' : 'border-theme-dim/40'
                      }`}>
                        {isSel && <Check size={12} className="text-white" />}
                      </div>
                    )}
                  </div>

                  {!isApp && isSel && (
                    <div className="px-3 pb-3 space-y-1">
                      <p className="text-[8px] text-theme-dim font-semibold uppercase tracking-wider">Contenido</p>
                      {CONTENT_TYPES.map(ct => {
                        const active = content.includes(ct.id)
                        const Icon = ct.icon
                        return (
                          <div key={ct.id}
                            onClick={() => toggleContent(d.id, ct.id)}
                            className={`flex items-center gap-1.5 px-2 py-1 rounded cursor-pointer transition-colors ${
                              active ? 'bg-[#6c5ce7]/20' : 'hover:bg-white/5'
                            }`}>
                            <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                              active ? 'bg-[#6c5ce7] border-[#6c5ce7]' : 'border-theme-dim/40'
                            }`}>
                              {active && <Check size={8} className="text-white" />}
                            </div>
                            <Icon size={10} className={active ? 'text-[#6c5ce7]' : 'text-theme-dim'} />
                            <span className={`text-[9px] ${active ? 'text-theme font-medium' : 'text-theme-dim'}`}>{ct.label}</span>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {isApp && (
                    <div className="px-3 pb-3">
                      <p className="text-[8px] text-theme-dim/60 text-center">Pantalla de control</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-t border-theme shrink-0 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <button onClick={selectAll}
              className="text-[9px] px-3 py-1.5 bg-theme-card text-theme-dim rounded-lg hover:text-theme border border-theme transition-colors">
              Seleccionar todo
            </button>
            <button onClick={closeAll}
              className="text-[9px] px-3 py-1.5 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 border border-transparent transition-colors">
              <MonitorOff size={10} className="inline mr-1" />Cerrar todo
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onClose}
              className="text-[9px] px-3 py-1.5 bg-theme-card text-theme-dim rounded-lg hover:text-theme border border-theme transition-colors">
              Cancelar
            </button>
            <button onClick={applyToSelected}
              className="text-[9px] px-4 py-1.5 bg-[#6c5ce7] text-white rounded-lg hover:bg-[#5a4bd1] transition-colors font-medium"
              disabled={selectedDisplays.length === 0}>
              <MonitorPlay size={10} className="inline mr-1" />Aplicar en {selectedDisplays.length} pantalla{selectedDisplays.length !== 1 ? 's' : ''}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

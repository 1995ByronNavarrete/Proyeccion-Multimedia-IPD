import { useState, useEffect } from 'react'
import { Monitor, MonitorPlay, MonitorOff, X, Check, Laptop } from 'lucide-react'

interface Display {
  id: number
  name: string
  bounds: { x: number; y: number; width: number; height: number }
  primary: boolean
}

const STORAGE_KEY = 'ipd-selected-displays'

function loadSelected(): number[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') } catch { return [] }
}

export default function ScreensModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [displays, setDisplays] = useState<Display[]>([])
  const [selected, setSelected] = useState<number[]>(loadSelected)
  const [appDisplayId, setAppDisplayId] = useState<number | null>(null)

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(selected)) }, [selected])

  useEffect(() => {
    if (!open) return
    window.api.screen.getLayout().then(res => {
      setDisplays(res.displays)
      setAppDisplayId(res.appDisplayId)
    })
  }, [open])

  const toggle = (id: number) => {
    if (id === appDisplayId) return
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const selectAll = () => {
    setSelected(displays.filter(d => d.id !== appDisplayId).map(d => d.id))
  }

  const deselectAll = () => setSelected([])

  const projectToSelected = () => {
    for (const id of selected) {
      window.api.projector.projectToDisplay(id)
    }
    onClose()
  }

  const closeAll = () => {
    window.api.projector.close()
    setSelected([])
    onClose()
  }

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[800px] max-w-[90vw] bg-theme-panel border border-[rgba(120,80,255,0.25)] rounded-xl shadow-2xl shadow-black/60 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-theme shrink-0">
          <h3 className="text-xs font-bold text-theme flex items-center gap-2">
            <Monitor size={14} className="text-[#6c5ce7]" /> Pantallas
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-white/5 rounded"><X size={14} className="text-theme-dim" /></button>
        </div>

        <div className="p-4 overflow-x-auto">
          <div className="flex gap-4 min-w-0">
            {displays.map((d, i) => {
              const isApp = d.id === appDisplayId
              const isSel = selected.includes(d.id)
              const ratio = d.bounds.width / d.bounds.height
              const w = Math.min(220, Math.max(140, ratio * 120))
              const h = w / ratio
              return (
                <div key={d.id}
                  onClick={() => toggle(d.id)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all cursor-pointer shrink-0 ${
                    isApp ? 'border-[#6c5ce7]/30 bg-[#6c5ce7]/5 cursor-default' :
                    isSel ? 'border-[#6c5ce7] bg-[#6c5ce7]/10' : 'border-theme bg-theme-card hover:border-[#6c5ce7]/50'
                  }`}
                  style={{ width: w + 24 }}>
                  <div className="flex items-center justify-center" style={{ width: w, height: h }}>
                    <div className={`w-full h-full rounded border flex items-center justify-center transition-colors ${
                      isApp ? 'bg-[#6c5ce7]/10 border-[#6c5ce7]/30' : isSel ? 'bg-[#6c5ce7]/20 border-[#6c5ce7]' : 'bg-black/40 border-theme'
                    }`}>
                      {isApp ? (
                        <Laptop size={Math.min(w, h) * 0.3} className="text-[#6c5ce7]" />
                      ) : (
                        <MonitorPlay size={Math.min(w, h) * 0.3} className={isSel ? 'text-[#6c5ce7]' : 'text-theme-dim'} />
                      )}
                    </div>
                  </div>
                  <div className="text-center w-full">
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-[10px] text-theme font-medium truncate max-w-[120px]">{d.name}</span>
                      {isApp && <span className="text-[7px] bg-[#6c5ce7]/20 text-[#6c5ce7] px-1 rounded shrink-0">Ctrl</span>}
                    </div>
                    <p className="text-[8px] text-theme-dim">{d.bounds.width}×{d.bounds.height}</p>
                  </div>
                  {!isApp && (
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                      isSel ? 'bg-[#6c5ce7] border-[#6c5ce7]' : 'border-theme-dim/40'
                    }`}>
                      {isSel && <Check size={12} className="text-white" />}
                    </div>
                  )}
                  {isApp && <p className="text-[7px] text-theme-dim">Pantalla de control</p>}
                </div>
              )
            })}
          </div>
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-t border-theme shrink-0">
          <div className="flex items-center gap-2">
            <button onClick={selectAll}
              className="text-[9px] px-3 py-1.5 bg-theme-card text-theme-dim rounded-lg hover:text-theme border border-theme transition-colors">
              Seleccionar todo
            </button>
            <button onClick={deselectAll}
              className="text-[9px] px-3 py-1.5 bg-theme-card text-theme-dim rounded-lg hover:text-theme border border-theme transition-colors">
              Desseleccionar
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={closeAll}
              className="text-[9px] px-3 py-1.5 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 border border-transparent transition-colors">
              <MonitorOff size={10} className="inline mr-1" />Cerrar todo
            </button>
            <button onClick={projectToSelected}
              className="text-[9px] px-4 py-1.5 bg-[#6c5ce7] text-white rounded-lg hover:bg-[#5a4bd1] transition-colors font-medium"
              disabled={selected.length === 0}>
              Proyectar en {selected.length} pantalla{selected.length !== 1 ? 's' : ''}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

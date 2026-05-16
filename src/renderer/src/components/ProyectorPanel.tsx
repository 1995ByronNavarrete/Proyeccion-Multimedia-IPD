import { useEffect, useState, useRef } from 'react'
import { Monitor, MonitorPlay, MonitorOff, Square, FileVideo, FileText, Laptop } from 'lucide-react'
import type { ProjectedContent } from '../views/DashboardView'

interface Display { id: number; name: string; bounds: { x: number; y: number; width: number; height: number }; primary: boolean }

interface ProyectorPanelProps {
  projected?: ProjectedContent
}

export default function ProyectorPanel({ projected }: ProyectorPanelProps) {
  const [displays, setDisplays] = useState<Display[]>([])
  const [appDisplayId, setAppDisplayId] = useState<number | null>(null)
  const [captures, setCaptures] = useState<Record<number, string>>({})
  const captureTimer = useRef<ReturnType<typeof setInterval>>()

  const loadLayout = () => {
    window.api.screen.getLayout().then((res) => {
      setDisplays(res.displays)
      setAppDisplayId(res.appDisplayId)
    })
  }

  useEffect(() => {
    loadLayout()
    const unsub = window.api.on('projector:layoutChanged', loadLayout)
    return () => { unsub?.() }
  }, [])

  useEffect(() => {
    const projDisplays = displays.filter((d) => d.id !== appDisplayId)
    if (projDisplays.length === 0) {
      if (captureTimer.current) { clearInterval(captureTimer.current); captureTimer.current = undefined }
      setCaptures({})
      return
    }
    const capture = async () => {
      for (const d of projDisplays) {
        try {
          const capRes = await window.api.capture.projectorByDisplay(d.id)
          if (capRes?.success && capRes.data) {
            const b64 = capRes.data.base64
            setCaptures((prev) => ({ ...prev, [d.id]: `data:image/png;base64,${b64}` }))
          }
        } catch {}
      }
    }
    capture()
    captureTimer.current = setInterval(capture, 2000)
    return () => { if (captureTimer.current) { clearInterval(captureTimer.current); captureTimer.current = undefined } }
  }, [displays, appDisplayId])

  const renderPreview = () => {
    if (!projected || projected.type === 'none') {
      return (
        <div className="text-center px-2">
          <Monitor size={16} className="text-gray-600 mx-auto mb-0.5" />
          <p className="text-[8px] text-gray-600">Sin contenido</p>
          <p className="text-[6px] text-gray-600/60">Elige contenido para proyectar</p>
        </div>
      )
    }
    if (projected.type === 'verse') {
      return (
        <div className="relative w-full h-full flex items-center justify-center px-1 overflow-hidden rounded">
          {projected.backgroundUrl ? (
            <img src={projected.backgroundUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
          ) : null}
          <div className="relative z-10 text-center">
            <p className="text-[9px] font-bold text-white leading-snug line-clamp-3 drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)]">{projected.text}</p>
            {projected.reference && <p className="text-[7px] text-white/70 mt-1 drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]">— {projected.reference}</p>}
          </div>
        </div>
      )
    }
    if (projected.type === 'media') {
      if (projected.mediaUrl?.startsWith('data:image')) {
        return (
          <div className="px-2 flex items-center justify-center h-full">
            <img src={projected.mediaUrl} alt="" className="max-h-full max-w-full object-contain rounded" />
          </div>
        )
      }
      return (
        <div className="text-center px-2">
          <FileVideo size={12} className="text-[#a855f7] mx-auto mb-0.5" />
          <p className="text-[7px] text-white/70 leading-tight line-clamp-2">{projected.text || 'Reproduciendo video'}</p>
        </div>
      )
    }
    if (projected.type === 'document') {
      const isPdf = projected.mediaUrl?.match(/\.pdf/i)
      return (
        <div className="text-center px-2">
          <FileText size={12} className="text-[#f59e0b] mx-auto mb-0.5" />
          <p className="text-[7px] text-white/70 leading-tight line-clamp-2">{projected.text || 'Documento'}</p>
          {isPdf && <p className="text-[5px] text-[#f59e0b]/60 mt-0.5 uppercase tracking-wider">PDF</p>}
        </div>
      )
    }
    if (projected.type === 'black') {
      return (
        <div className="text-center">
          <Square size={10} className="text-gray-500 mx-auto" />
          <p className="text-[7px] text-gray-500 mt-0.5">Pantalla negra</p>
        </div>
      )
    }
    return null
  }

  const appDisplay = displays.find((d) => d.id === appDisplayId)
  const projDisplays = displays.filter((d) => d.id !== appDisplayId)

  return (
    <div className="h-full bg-theme-panel border border-theme rounded-xl flex flex-col overflow-hidden">
      <div className="px-3 py-2 border-b border-theme">
        <h3 className="text-[10px] font-semibold text-theme-muted uppercase tracking-wider">Pantallas</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {appDisplay && (
          <div className="bg-theme-card rounded-lg border border-[#6c5ce7]/30 overflow-hidden">
            <div className="flex items-center gap-2 px-2 py-1.5 bg-[#6c5ce7]/5">
              <Laptop size={11} className="text-[#6c5ce7] shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-theme font-medium truncate">{appDisplay.name}</span>
                  <span className="text-[7px] bg-[#6c5ce7]/20 text-[#6c5ce7] px-1.5 rounded shrink-0">Control</span>
                </div>
                <p className="text-[8px] text-theme-dim">{appDisplay.bounds.width}×{appDisplay.bounds.height}</p>
              </div>
            </div>
            <div className="px-2 pb-2">
              <div className="h-12 bg-gradient-to-b from-[#050816] to-black/80 rounded border border-theme-light flex items-center justify-center">
                <div className="text-center">
                  <MonitorOff size={12} className="text-gray-600 mx-auto mb-0.5" />
                  <p className="text-[7px] text-gray-600">Pantalla de control — sin proyección</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {projDisplays.length > 0 ? (
          projDisplays.map((d) => (
            <div key={d.id}
              className="bg-theme-card rounded-lg border border-[#00d4ff]/20 overflow-hidden">
              <div className="flex items-center gap-2 px-2 py-1.5">
                <MonitorPlay size={11} className="text-[#00d4ff] shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-theme font-medium truncate">{d.name}</span>
                    <span className="text-[7px] bg-green-500/20 text-green-400 px-1.5 rounded shrink-0">Proyección</span>
                  </div>
                  <p className="text-[8px] text-theme-dim">{d.bounds.width}×{d.bounds.height}</p>
                </div>
              </div>
              <div className="px-2 pb-2">
                <div className="h-16 bg-gradient-to-b from-[#050816] to-black/80 rounded border border-theme-light flex items-center justify-center overflow-hidden relative">
                  {captures[d.id] ? (
                    <img src={captures[d.id]} alt={`Vista ${d.name}`} className="w-full h-full object-contain" />
                  ) : (
                    renderPreview()
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-[10px] text-theme-dim">Solo hay una pantalla conectada</p>
          </div>
        )}
      </div>

      <div className="px-2 pb-2 space-y-1.5">
        <button onClick={() => window.api.projector.showBlack()}
          className="w-full flex items-center justify-center gap-1.5 text-[8px] py-1.5 bg-gray-500/20 text-gray-400 rounded hover:bg-gray-500/30 transition-colors">
          <Square size={8} /> Pantalla negra
        </button>
        <button onClick={() => window.api.projector.close()}
          className="w-full flex items-center justify-center gap-1.5 text-[8px] py-1 bg-red-500/10 text-red-400 rounded hover:bg-red-500/20 transition-colors">
          <MonitorOff size={8} /> Cerrar proyección
        </button>
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { Monitor, MonitorPlay, MonitorOff, Square, FileVideo, FileText, Laptop, Eye, EyeOff } from 'lucide-react'
import type { ProjectedContent } from '../views/DashboardView'
import { useLang } from '../i18n'

interface Display { id: number; name: string; bounds: { x: number; y: number; width: number; height: number }; primary: boolean }

interface ProyectorPanelProps {
  projected?: ProjectedContent
}

const CONTENT_BADGES: Record<string, { label: string; color: string }> = {
  verse: { label: 'Verso', color: 'bg-[#6c5ce7]/20 text-[#6c5ce7]' },
  media: { label: 'Multimedia', color: 'bg-[#a855f7]/20 text-[#a855f7]' },
  document: { label: 'Documento', color: 'bg-[#f59e0b]/20 text-[#f59e0b]' },
  black: { label: 'Pantalla negra', color: 'bg-gray-500/20 text-gray-400' },
}

export default function ProyectorPanel({ projected }: ProyectorPanelProps) {
  const { t } = useLang()
  const [displays, setDisplays] = useState<Display[]>([])
  const [appDisplayId, setAppDisplayId] = useState<number | null>(null)

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

  const renderPreview = () => {
    if (!projected || projected.type === 'none') {
      return (
        <div className="text-center px-2">
          <Monitor size={16} className="text-gray-600 mx-auto mb-0.5" />
          <p className="text-[11px] text-gray-600">{t('proyector.noContent')}</p>
          <p className="text-[11px] text-gray-600/60">Elige contenido para proyectar</p>
        </div>
      )
    }
    if (projected.type === 'verse') {
      return (
        <div className="relative w-full h-full flex items-center justify-center px-1 overflow-hidden rounded">
          {projected.backgroundUrl ? (
            <img src={projected.backgroundUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[#0a0e1e] via-[#0c1022] to-[#0a0e1e]" />
          )}
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative z-10 text-center">
             <p className="text-[11px] font-bold text-white leading-snug line-clamp-3 drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)]">{projected.text}</p>
            {projected.reference && <p className="text-[11px] text-white/70 mt-1 drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]">— {projected.reference}</p>}
          </div>
        </div>
      )
    }
    if (projected.type === 'media') {
      if (projected.mediaUrl?.startsWith('data:image')) {
        return (
          <div className="flex items-center justify-center h-full">
            <img src={projected.mediaUrl} alt="" className="max-h-full max-w-full object-contain rounded" />
          </div>
        )
      }
      return (
        <div className="text-center px-2">
          <FileVideo size={12} className="text-[#a855f7] mx-auto mb-0.5" />
          <p className="text-[9px] text-white/70 leading-tight line-clamp-2">{projected.text || 'Reproduciendo video'}</p>
        </div>
      )
    }
    if (projected.type === 'document') {
      const isPdf = projected.mediaUrl?.match(/\.pdf/i)
      return (
        <div className="text-center px-2">
          <FileText size={12} className="text-[#f59e0b] mx-auto mb-0.5" />
          <p className="text-[9px] text-white/70 leading-tight line-clamp-2">{projected.text || 'Documento'}</p>
          {isPdf && <p className="text-[8px] text-[#f59e0b]/60 mt-0.5 uppercase tracking-wider">PDF</p>}
        </div>
      )
    }
    if (projected.type === 'black') {
      return (
        <div className="text-center">
          <Square size={10} className="text-gray-500 mx-auto" />
          <p className="text-[9px] text-gray-500 mt-0.5">Pantalla negra</p>
        </div>
      )
    }
    return null
  }

  const appDisplay = displays.find((d) => d.id === appDisplayId)
  const projDisplays = displays.filter((d) => d.id !== appDisplayId)
  const badge = projected ? CONTENT_BADGES[projected.type] : null

  return (
    <div className="h-full bg-theme-panel border border-theme rounded-xl flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-theme shrink-0">
        <h3 className="text-[11px] font-semibold text-theme-muted uppercase tracking-wider flex items-center gap-1.5">
          <Monitor size={10} /> {t('proyector.title')}
        </h3>
        {badge && (
          <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-medium ${badge.color}`}>{badge.label}</span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-1.5 space-y-1.5">
        {appDisplay && (
          <div className="flex items-center gap-1.5 px-2 py-1 bg-[#6c5ce7]/5 rounded-lg border border-[#6c5ce7]/20">
            <Laptop size={9} className="text-[#6c5ce7] shrink-0" />
            <span className="text-[11px] text-theme flex-1 truncate">{appDisplay.name}</span>
            <span className="text-[10px] bg-[#6c5ce7]/20 text-[#6c5ce7] px-1.5 rounded shrink-0">{t('proyector.control')}</span>
            <span className="text-[11px] text-theme-dim">{appDisplay.bounds.width}×{appDisplay.bounds.height}</span>
          </div>
        )}

        {projDisplays.length > 0 ? (
          projDisplays.map((d) => (
            <div key={d.id}
              className="bg-theme-card rounded-lg border border-[#00d4ff]/20 overflow-hidden">
              <div className="flex items-center gap-1.5 px-2 py-1">
                <MonitorPlay size={9} className="text-[#00d4ff] shrink-0" />
                <span className="text-[11px] text-theme flex-1 truncate">{d.name}</span>
                <span className="text-[10px] bg-green-500/20 text-green-400 px-1.5 rounded shrink-0">{t('proyector.projection')}</span>
                <span className="text-[11px] text-theme-dim">{d.bounds.width}×{d.bounds.height}</span>
                <div className="flex gap-0.5 ml-1">
                  <button onClick={() => window.api.projector.showBlack()}
                    className="p-0.5 bg-gray-500/20 rounded text-gray-400 hover:bg-gray-500/40 transition-colors" title={t('black.title')}>
                    <EyeOff size={7} />
                  </button>
                  <button onClick={() => window.api.projector.close()}
                    className="p-0.5 bg-red-500/10 rounded text-red-400 hover:bg-red-500/30 transition-colors" title={t('common.close')}>
                    <MonitorOff size={7} />
                  </button>
                </div>
              </div>
              <div className="px-2 pb-1.5">
                <div className="h-20 bg-gradient-to-b from-[#050816] to-black/80 rounded border border-theme-light flex items-center justify-center overflow-hidden relative">
                  {renderPreview()}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <Monitor size={20} className="text-gray-600/30 mb-2" />
            <p className="text-[11px] text-theme-dim">Solo hay una pantalla conectada</p>
            <p className="text-[11px] text-theme-dim/60 mt-0.5">{t('proyector.noDisplay')}</p>
          </div>
        )}
      </div>
    </div>
  )
}

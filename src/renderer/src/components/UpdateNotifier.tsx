import { useState, useEffect } from 'react'
import { Download, RefreshCw, X, Loader2 } from 'lucide-react'

export default function UpdateNotifier() {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null)
  const [downloading, setDownloading] = useState(false)
  const [downloaded, setDownloaded] = useState(false)
  const [progress, setProgress] = useState(0)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const unsub1 = window.api.on('update:available', (arg: unknown) => {
      const info = arg as UpdateInfo
      setUpdateInfo(info)
      setDownloaded(false)
      setDownloading(false)
      setDismissed(false)
    })

    const unsub2 = window.api.on('update:not-available', () => {})

    const unsub3 = window.api.on('update:download-progress', (arg: unknown) => {
      const p = arg as UpdateDownloadProgress
      setProgress(p.percent)
    })

    const unsub4 = window.api.on('update:downloaded', () => {
      setDownloaded(true)
      setDownloading(false)
      setProgress(100)
    })

    const unsub5 = window.api.on('update:error', () => {})

    return () => { unsub1?.(); unsub2?.(); unsub3?.(); unsub4?.(); unsub5?.() }
  }, [])

  if (!updateInfo || dismissed) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-theme-card border border-[#a855f7]/30 rounded-xl shadow-2xl p-4 w-80">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <RefreshCw size={14} className="text-[#a855f7]" />
          <span className="text-[11px] font-semibold text-theme">Actualización disponible</span>
        </div>
        <button onClick={() => setDismissed(true)} className="text-theme-dim hover:text-theme transition-colors">
          <X size={12} />
        </button>
      </div>

      <p className="text-[10px] text-theme-dim mb-3">
        Versión <span className="text-theme font-medium">{updateInfo.version}</span> disponible
      </p>

      {downloading && (
        <div className="mb-3">
          <div className="h-1.5 bg-theme rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#6c5ce7] to-[#a855f7] rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-[8px] text-theme-dim mt-1">{Math.round(progress)}%</p>
        </div>
      )}

      {!downloaded ? (
        <button onClick={() => { setDownloading(true); window.api.update.download() }}
          disabled={downloading}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-[#6c5ce7]/20 hover:bg-[#6c5ce7]/30 text-[#6c5ce7] rounded-lg text-[10px] font-medium transition-colors disabled:opacity-50">
          {downloading ? <Loader2 size={10} className="animate-spin" /> : <Download size={10} />}
          {downloading ? 'Descargando...' : 'Descargar actualización'}
        </button>
      ) : (
        <button onClick={() => window.api.update.install()}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg text-[10px] font-medium transition-colors">
          <RefreshCw size={10} />
          Reiniciar e instalar
        </button>
      )}
    </div>
  )
}

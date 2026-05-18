import { useRef, useEffect, useState } from 'react'
import { Play, Pause, Square, Monitor } from 'lucide-react'
import { useLang } from '../i18n'

interface SecondaryDisplayProps {
  bgVideo: { url: string | null; title: string; paused: boolean }
  onPause: () => void
  onResume: () => void
  onStop: () => void
  overlayOpacity?: number
  fontSize?: number
}

const YT_CMD = (fn: string) => JSON.stringify({ event: 'command', func: fn, args: [] })

export default function SecondaryDisplay({ bgVideo, onPause, onResume, onStop }: SecondaryDisplayProps) {
  const { t } = useLang()
  const videoRef = useRef<HTMLVideoElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [ytKey, setYtKey] = useState(0)
  const lastUrlRef = useRef<string | null>(null)
  const isYoutube = bgVideo.url != null && bgVideo.url.includes('youtube.com/embed')

  useEffect(() => {
    if (isYoutube) {
      if (!bgVideo.url) return
      setYtKey((k) => k + 1)
      return
    }
    const v = videoRef.current
    if (!v) return
    if (!bgVideo.url) { v.pause(); v.src = ''; lastUrlRef.current = null; return }
    if (bgVideo.url !== lastUrlRef.current) {
      lastUrlRef.current = bgVideo.url
      v.src = bgVideo.url
      v.play().catch(() => {})
    } else if (bgVideo.paused) {
      v.pause()
    } else {
      v.play().catch(() => {})
    }
  }, [bgVideo.url, bgVideo.paused, isYoutube])

  useEffect(() => {
    if (!isYoutube || !bgVideo.url || !iframeRef.current?.contentWindow) return
    iframeRef.current.contentWindow.postMessage(YT_CMD(bgVideo.paused ? 'pauseVideo' : 'playVideo'), '*')
  }, [bgVideo.paused, isYoutube])

  const handleStop = () => { onStop() }

  if (!bgVideo.url) {
    return (
      <div className="h-full w-full bg-[rgba(8,12,30,0.95)] bg-theme-panel border border-[rgba(120,80,255,0.15)] border-theme rounded-xl overflow-hidden flex flex-col">
        <div className="flex items-center px-3 py-2 border-b border-[rgba(120,80,255,0.15)] border-theme shrink-0">
          <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{t('view.secondary')}</h3>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Monitor size={24} className="text-gray-600 mx-auto mb-1" />
            <p className="text-[9px] text-gray-500">{t('black.empty')}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full w-full bg-black border border-[rgba(120,80,255,0.15)] border-theme rounded-xl overflow-hidden flex flex-col">
      <div className="flex items-center justify-between px-3 py-2 border-b border-[rgba(120,80,255,0.15)] border-theme shrink-0 bg-[rgba(8,12,30,0.95)]">
        <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{t('view.secondary')}</h3>
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[8px] text-green-500">LIVE</span>
        </span>
      </div>

      <div className="flex-1 relative overflow-hidden">
        {isYoutube ? (
          <iframe ref={iframeRef} key={ytKey} src={bgVideo.url} className="w-full h-full pointer-events-none" data-volume="bg" allow="autoplay; fullscreen" allowFullScreen loading="lazy" />
        ) : (
          <video ref={videoRef} className="w-full h-full object-contain pointer-events-none will-change-transform" data-volume="bg" autoPlay playsInline preload="metadata"
            onError={(e) => console.error('[SecondaryDisplay] error:', (e.target as HTMLVideoElement).error?.message)} />
        )}

        <div className="absolute inset-0 z-10 pointer-events-none" />

        <div className="absolute bottom-0 left-0 right-0 z-20 flex items-center justify-center gap-3 py-2 bg-gradient-to-t from-black/60 to-transparent pointer-events-auto">
          <button onClick={bgVideo.paused ? onResume : onPause}
            className="p-2 bg-[#6c5ce7]/30 rounded-full text-[#6c5ce7] hover:bg-[#6c5ce7]/50 transition-colors" title={bgVideo.paused ? 'Reanudar' : 'Pausar'}>
            {bgVideo.paused ? <Play size={14} /> : <Pause size={14} />}
          </button>
          <button onClick={handleStop}
            className="p-2 bg-red-600/30 rounded-full text-red-500 hover:bg-red-600/50 transition-colors" title="Detener">
            <Square size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}

import { useRef, useEffect, useState } from 'react'
import { Play, Pause, Square, Monitor } from 'lucide-react'

interface SecondaryDisplayProps {
  bgVideo: { url: string | null; title: string; paused: boolean }
  onPause: () => void
  onResume: () => void
  onStop: () => void
}

const YT_CMD = (fn: string) => JSON.stringify({ event: 'command', func: fn, args: [] })

export default function SecondaryDisplay({ bgVideo, onPause, onResume, onStop }: SecondaryDisplayProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const isYoutube = bgVideo.url != null && bgVideo.url.includes('youtube.com/embed')
  const [ytKey, setYtKey] = useState(0)

  // Sync video element with bgVideo state
  useEffect(() => {
    if (isYoutube) return
    const v = videoRef.current
    if (!v) return
    if (!bgVideo.url) { v.pause(); v.src = ''; return }
    v.src = bgVideo.url
    if (!bgVideo.paused) v.play().catch(() => {})
    else v.pause()
  }, [bgVideo, isYoutube])

  useEffect(() => {
    if (!isYoutube || !bgVideo.url) return
    setYtKey((k) => k + 1)
  }, [bgVideo.url])

  useEffect(() => {
    if (!isYoutube || !bgVideo.url) return
    const iframe = iframeRef.current
    if (!iframe?.contentWindow) return
    if (bgVideo.paused) iframe.contentWindow.postMessage(YT_CMD('pauseVideo'), '*')
    else iframe.contentWindow.postMessage(YT_CMD('playVideo'), '*')
  }, [bgVideo.paused, isYoutube])

  const handleStop = () => {
    onStop()
    setYtKey((k) => k + 1)
  }

  const hasBgVideo = bgVideo.url != null

  if (!hasBgVideo) {
    return (
      <div className="h-full w-full bg-[rgba(8,12,30,0.95)] bg-theme-panel border border-[rgba(120,80,255,0.15)] border-theme rounded-xl overflow-hidden flex flex-col">
        <div className="flex items-center px-3 py-2 border-b border-[rgba(120,80,255,0.15)] border-theme shrink-0">
          <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Vista Secundaria</h3>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Monitor size={24} className="text-gray-600 mx-auto mb-1" />
            <p className="text-[9px] text-gray-500">Sin contenido proyectado</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full w-full bg-black border border-[rgba(120,80,255,0.15)] border-theme rounded-xl overflow-hidden flex flex-col">
      <div className="flex items-center justify-between px-3 py-2 border-b border-[rgba(120,80,255,0.15)] border-theme shrink-0 bg-[rgba(8,12,30,0.95)]">
        <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Vista Secundaria</h3>
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[8px] text-green-500">LIVE</span>
        </span>
      </div>

      <div className="flex-1 relative overflow-hidden">
        {hasBgVideo ? (
          <>
            {isYoutube ? (
              <iframe ref={iframeRef} key={ytKey} src={bgVideo.url || ''} className="w-full h-full pointer-events-none" data-volume="bg" allow="autoplay; fullscreen" allowFullScreen />
            ) : (
              <video ref={videoRef} className="w-full h-full object-contain pointer-events-none" data-volume="bg" autoPlay playsInline
                onError={(e) => console.error('[SecondaryDisplay] error:', (e.target as HTMLVideoElement).error?.message)} />
            )}
          </>
        ) : null}

        {hasBgVideo && (
          <div className="absolute inset-0 z-10 pointer-events-none" />
        )}

        {hasBgVideo && (
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
        )}
      </div>

    </div>
  )
}

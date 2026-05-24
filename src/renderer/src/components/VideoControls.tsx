import { useEffect, useState, useRef } from 'react'
import { Play, Pause, Square, Film } from 'lucide-react'
import { useLang } from '../i18n'

interface VideoState {
  currentTime: number
  duration: number
  paused: boolean
  title: string
}

export default function VideoControls() {
  const { t } = useLang()
  const [video, setVideo] = useState<VideoState | null>(null)
  const [optimisticPaused, setOptimisticPaused] = useState<boolean | null>(null)
  const [hoverTime, setHoverTime] = useState<number | null>(null)
  const [hoverX, setHoverX] = useState(0)
  const barRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const unsub = window.api.on('video:progress', (arg: unknown) => {
      const data = arg as VideoState
      setVideo(prev => {
        if (!prev) return data
        return {
          ...data,
          duration: data.duration > 0 ? data.duration : prev.duration
        }
      })
      setOptimisticPaused(null)
    })
    return () => { unsub?.() }
  }, [])

  if (!video || !video.title) return null

  const isPaused = optimisticPaused ?? video.paused

  const handlePlayPause = () => {
    if (isPaused) {
      setOptimisticPaused(false)
      window.api.video.resume()
    } else {
      setOptimisticPaused(true)
      window.api.video.pause()
    }
  }

  const clampedTime = video.duration > 0 ? Math.min(video.currentTime, video.duration) : video.currentTime
  const progress = video.duration > 0 ? (clampedTime / video.duration) * 100 : 0
  const fmt = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const handleBarHover = (e: React.MouseEvent) => {
    const rect = barRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = e.clientX - rect.left
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100))
    setHoverX(x)
    setHoverTime((pct / 100) * video.duration)
  }

  const handleBarClick = (e: React.MouseEvent) => {
    const rect = barRef.current?.getBoundingClientRect()
    if (!rect || video.duration <= 0) return
    const pos = (e.clientX - rect.left) / rect.width
    window.api.video.setTime(pos * video.duration)
  }

  return (
    <div className="bg-theme-card rounded-lg border border-[#a855f7]/20 overflow-hidden">
      {/* YouTube-style thin red line at top */}
      <div className="h-0.5 bg-theme w-full">
        <div className="h-full bg-red-500 transition-all duration-150" style={{ width: `${progress}%` }} />
      </div>

      <div className="flex items-center gap-2 px-2 py-1.5">
        <Film size={11} className="text-[#a855f7] shrink-0" />
        <span className="text-[9px] text-theme truncate flex-1">{video.title}</span>
        <span className="text-[7px] text-theme-dim shrink-0">{fmt(clampedTime)} / {video.duration > 0 ? fmt(video.duration) : '...'}</span>
      </div>

      {/* YouTube-style slider bar */}
      <div
        ref={barRef}
        className="relative h-3 mx-2 mb-2 group cursor-pointer"
        onMouseMove={handleBarHover}
        onMouseLeave={() => setHoverTime(null)}
        onClick={handleBarClick}
      >
        {/* Track background */}
        <div className="absolute inset-y-1 left-0 right-0 rounded-full bg-theme overflow-hidden">
          {/* Progress fill */}
          <div className="h-full bg-gradient-to-r from-[#6c5ce7] to-[#a855f7] rounded-full transition-all duration-150" style={{ width: `${progress}%` }} />
        </div>

        {/* Thumb (shows on hover) */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-[#a855f7] rounded-full shadow-lg border-2 border-white opacity-0 group-hover:opacity-100 transition-opacity duration-100"
          style={{ left: `${progress}%` }}
        />

        {/* Time tooltip on hover */}
        {hoverTime !== null && (
          <div
            className="absolute -top-5 -translate-x-1/2 bg-[#a855f7] text-white text-[9px] font-bold px-1.5 py-0.5 rounded pointer-events-none whitespace-nowrap"
            style={{ left: `${video.duration > 0 ? (hoverTime / video.duration) * 100 : 0}%` }}
          >
            {fmt(hoverTime)}
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-2 pb-2">
        <button onClick={handlePlayPause}
          className={`p-1.5 rounded transition-colors ${isPaused ? 'bg-green-500/20 text-green-400 hover:bg-green-500/40' : 'bg-[#6c5ce7]/20 text-[#6c5ce7] hover:bg-[#6c5ce7]/40'}`}
          title={isPaused ? t('video.play') : t('video.pause')}>
          {isPaused ? <Play size={10} /> : <Pause size={10} />}
        </button>
        <button onClick={() => window.api.video.stop()}
          className="p-1.5 bg-red-500/20 rounded text-red-400 hover:bg-red-500/40 transition-colors" title={t('video.stop')}>
          <Square size={10} />
        </button>
      </div>
    </div>
  )
}

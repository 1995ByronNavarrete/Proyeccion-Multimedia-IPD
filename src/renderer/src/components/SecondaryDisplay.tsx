import { useRef, useEffect, useState } from 'react'
import { Monitor } from 'lucide-react'
import { useLang } from '../i18n'

interface SecondaryDisplayProps {
  bgVideo: { url: string | null; title: string; paused: boolean }
  onPause: () => void
  onResume: () => void
  onStop: () => void
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
    if (!bgVideo.url) {
      lastUrlRef.current = null
      if (videoRef.current) { videoRef.current.pause(); videoRef.current.src = '' }
      return
    }
    if (isYoutube) {
      if (bgVideo.url !== lastUrlRef.current) {
        lastUrlRef.current = bgVideo.url
        setYtKey((k) => k + 1)
        if (videoRef.current) { videoRef.current.pause(); videoRef.current.src = '' }
      }
      return
    }
    const v = videoRef.current
    if (!v) return
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

  if (!bgVideo.url) {
    return (
      <div className="h-full w-full rounded-xl overflow-hidden flex items-center justify-center bg-[rgba(8,12,30,0.95)]">
        <div className="text-center">
          <Monitor size={24} className="text-gray-600 mx-auto mb-1" />
          <p className="text-[9px] text-gray-500">{t('black.empty')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full w-full rounded-xl overflow-hidden bg-black relative">
      {isYoutube ? (
        <iframe ref={iframeRef} key={ytKey} src={bgVideo.url} className="w-full h-full pointer-events-none" data-volume="bg" allow="autoplay; fullscreen" allowFullScreen loading="lazy" />
      ) : (
        <video ref={videoRef} className="w-full h-full object-contain pointer-events-none will-change-transform" data-volume="bg" autoPlay playsInline preload="metadata"
          onError={(e) => console.error('[SecondaryDisplay] error:', (e.target as HTMLVideoElement).error?.message)} />
      )}
      <div className="absolute inset-0 z-10" />
    </div>
  )
}

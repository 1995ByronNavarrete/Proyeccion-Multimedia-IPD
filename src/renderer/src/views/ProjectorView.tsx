import { useEffect, useState, useRef } from 'react'
import { Monitor } from 'lucide-react'

const YT_CMD = (fn: string) => JSON.stringify({ event: 'command', func: fn, args: '' })

export default function ProjectorView() {
  const [isBlack, setIsBlack] = useState(false)
  const [verseText, setVerseText] = useState('')
  const [verseRef, setVerseRef] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [videoTitle, setVideoTitle] = useState('')
  const [isYoutube, setIsYoutube] = useState(false)
  const [ytPaused, setYtPaused] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const progressTimer = useRef<ReturnType<typeof setInterval>>()
  const ytTimer = useRef<ReturnType<typeof setInterval>>()
  const ytStartTime = useRef(0)
  const ytElapsedRef = useRef(0)
  const ytDurationRef = useRef(0)
  const titleRef = useRef('')

  const stopYtTimer = () => {
    if (ytTimer.current) { clearInterval(ytTimer.current); ytTimer.current = undefined }
  }

  const stopLocalTimer = () => {
    if (progressTimer.current) { clearInterval(progressTimer.current); progressTimer.current = undefined }
  }

  const startYtTimer = () => {
    stopYtTimer()
    ytStartTime.current = Date.now()
    ytTimer.current = setInterval(() => {
      const dur = ytDurationRef.current
      if (dur > 0 && ytElapsedRef.current >= dur) {
        stopYtTimer()
        window.api.video.reportProgress({
          currentTime: dur,
          duration: dur,
          paused: true,
          title: titleRef.current
        })
        return
      }
      ytElapsedRef.current = (Date.now() - ytStartTime.current) / 1000
      const ct = dur > 0 ? Math.min(ytElapsedRef.current, dur) : ytElapsedRef.current
      window.api.video.reportProgress({
        currentTime: ct,
        duration: dur,
        paused: false,
        title: titleRef.current
      })
    }, 500)
  }

  const startLocalTimer = () => {
    stopLocalTimer()
    progressTimer.current = setInterval(() => {
      const v = videoRef.current
      if (v && v.src) {
        window.api.video.reportProgress({
          currentTime: v.currentTime,
          duration: v.duration || 0,
          paused: v.paused,
          title: titleRef.current
        })
      }
    }, 500)
  }

  // Escuchar eventos del iframe de YouTube (state changes, ended)
  useEffect(() => {
    const handleYtMessage = (e: MessageEvent) => {
      try {
        const data = e.data
        if (!data || data.event !== 'onStateChange') return
        if (data.info === 0) {
          const dur = ytDurationRef.current
          window.api.video.reportProgress({ currentTime: dur, duration: dur, paused: true, title: titleRef.current })
          setYtPaused(true)
          stopYtTimer()
        } else if (data.info === 1) {
          setYtPaused(false)
        } else if (data.info === 2) {
          setYtPaused(true)
        }
      } catch {}
    }
    window.addEventListener('message', handleYtMessage)
    return () => window.removeEventListener('message', handleYtMessage)
  }, [])

  useEffect(() => {
    const unsub1 = window.api.on('projector:content', (arg: unknown) => {
      const data = arg as { type?: string; text?: string; reference?: string } | undefined
      if (data?.type === 'verse') {
        setVerseText(data.text || '')
        setVerseRef(data.reference || '')
        setIsBlack(false); setVideoUrl('')
        stopLocalTimer(); stopYtTimer()
      }
    })

    const unsub2 = window.api.on('projector:showBlack', () => {
      setIsBlack(true); setVerseText(''); setVerseRef(''); setVideoUrl('')
      stopLocalTimer(); stopYtTimer()
    })

    const unsub3 = window.api.on('projector:playVideo', (arg: unknown) => {
      const data = arg as { url?: string; title?: string; duration?: number } | undefined
      const url = data?.url
      if (url) {
        const isYT = url.includes('youtube.com/embed') || url.includes('youtube.com/watch') || url.includes('youtu.be')
        setIsYoutube(isYT)
        setVideoUrl(url)
        setVideoTitle(data?.title || '')
        titleRef.current = data?.title || ''
        ytElapsedRef.current = 0
        ytDurationRef.current = data?.duration || 0
        setIsBlack(false); setVerseText(''); setVerseRef('')
      }
    })

    const unsub4 = window.api.on('projector:stopVideo', () => {
      stopLocalTimer(); stopYtTimer()
      setVideoUrl('')
    })

    const unsub5 = window.api.on('projector:pauseVideo', () => {
      const v = document.querySelector('video')
      if (v) { v.pause(); return }
      const iframe = iframeRef.current || document.querySelector('iframe[src*="youtube.com/embed"]')
      if (iframe?.contentWindow) {
        iframe.contentWindow.postMessage(YT_CMD('pauseVideo'), '*')
      }
      setYtPaused(true)
      ytElapsedRef.current = (Date.now() - ytStartTime.current) / 1000
      stopYtTimer()
    })

    const unsub6 = window.api.on('projector:resumeVideo', () => {
      const v = document.querySelector('video')
      if (v) { v.play().catch(() => {}); return }
      const iframe = iframeRef.current || document.querySelector('iframe[src*="youtube.com/embed"]')
      if (iframe?.contentWindow) {
        iframe.contentWindow.postMessage(YT_CMD('playVideo'), '*')
      }
      setYtPaused(false)
      ytStartTime.current = Date.now() - ytElapsedRef.current * 1000
      startYtTimer()
    })

    const unsub7 = window.api.on('projector:seekVideo', () => {})

    const unsub8 = window.api.on('projector:volumeVideo', () => {})

    return () => { unsub1?.(); unsub2?.(); unsub3?.(); unsub4?.(); unsub5?.(); unsub6?.(); unsub7?.(); unsub8?.(); stopLocalTimer(); stopYtTimer() }
  }, [])

  useEffect(() => {
    if (!videoUrl) return
    if (!isYoutube && videoRef.current) {
      videoRef.current.src = videoUrl
      videoRef.current.play().catch(() => {})
      startLocalTimer()
    }
  }, [videoUrl, isYoutube])

  useEffect(() => {
    if (!videoUrl || !isYoutube) return
    ytElapsedRef.current = 0
    const delay = setTimeout(() => startYtTimer(), 1000)
    return () => clearTimeout(delay)
  }, [videoUrl, isYoutube])

  if (isBlack) {
    return (
      <div className="h-screen w-screen bg-black flex items-center justify-center relative">
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-black/40 px-6 py-2 rounded-full">
          <p className="text-xs text-white/30 tracking-widest uppercase">Pantalla en negro</p>
        </div>
      </div>
    )
  }

  if (videoUrl && isYoutube) {
    return (
      <div className="h-screen w-screen bg-black flex items-center justify-center relative">
        <iframe ref={iframeRef}
          src={videoUrl}
          className="w-full h-full"
          allow="autoplay; fullscreen"
          allowFullScreen
        />
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/60 px-4 py-1.5 rounded-full pointer-events-none">
          <p className="text-xs text-white/80">{videoTitle}</p>
        </div>
      </div>
    )
  }

  if (videoUrl) {
    return (
      <div className="h-screen w-screen bg-black flex items-center justify-center relative">
        <video ref={videoRef} className="max-h-full max-w-full object-contain" controls={false} autoPlay />
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/60 px-4 py-1.5 rounded-full pointer-events-none">
          <p className="text-xs text-white/80">{videoTitle}</p>
        </div>
      </div>
    )
  }

  if (verseText) {
    return (
      <div className="h-screen w-screen bg-gradient-to-b from-[#0a0a1a] to-black flex items-center justify-center p-16">
        <div className="text-center max-w-4xl">
          <p className="text-4xl font-light leading-relaxed text-white/90 drop-shadow-lg">{verseText}</p>
          <p className="text-sm text-white/40 mt-8">— {verseRef}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen w-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <Monitor size={48} className="text-gray-800 mx-auto mb-3" />
        <p className="text-sm text-gray-700">Sin contenido</p>
        <p className="text-[10px] text-gray-800 mt-2">Esperando contenido para proyectar...</p>
      </div>
    </div>
  )
}

import { useEffect, useState, useRef, useCallback } from 'react'
import { Monitor, FileText } from 'lucide-react'
import AnuncioOverlay from '../components/AnuncioOverlay'
import { fileUrl } from '../utils'

const YT_CMD = (fn: string) => JSON.stringify({ event: 'command', func: fn, args: [] })

export default function ProjectorView() {
  const [isBlack, setIsBlack] = useState(false)
  const [verseText, setVerseText] = useState('')
  const [verseRef, setVerseRef] = useState('')
  const [verseBackground, setVerseBackground] = useState('')
  const [verseAnimation, setVerseAnimation] = useState('anim-fade')
  const [sermonTitle, setSermonTitle] = useState('')
  const [sermonPreacher, setSermonPreacher] = useState('')
  const [effect, setEffect] = useState<{ type: string; speed: number } | null>(null)
  const [overlay, setOverlay] = useState<{ type: string; speed: number; color?: string } | null>(null)
  const [videoUrl, setVideoUrl] = useState('')
  const [videoTitle, setVideoTitle] = useState('')
  const [isYoutube, setIsYoutube] = useState(false)
  const [isImage, setIsImage] = useState(false)
  const [docUrl, setDocUrl] = useState('')
  const [docHtmlContent, setDocHtmlContent] = useState('')
  const [docCss, setDocCss] = useState('')
  const [docConverting, setDocConverting] = useState(false)
  const docRef = useRef<HTMLDivElement>(null)
  const [ytPaused, setYtPaused] = useState(false)
  const [logoSrc, setLogoSrc] = useState<string | null>(null)
  const [headerTitle, setHeaderTitle] = useState('')
  const [headerSub, setHeaderSub] = useState('')
  const [anuncioText, setAnuncioText] = useState('')
  const [anuncioAnimIn, setAnuncioAnimIn] = useState('anuncio-slide-up')
  const [anuncioAnimOut, setAnuncioAnimOut] = useState('anim-fade')
  const [anuncioDuration, setAnuncioDuration] = useState(8)
  const [anuncioBg, setAnuncioBg] = useState('anuncio-bg-dark')
  const [anuncioBgAnimIn, setAnuncioBgAnimIn] = useState('anuncio-bg-fade-in')
  const [anuncioBgAnimOut, setAnuncioBgAnimOut] = useState('anuncio-bg-fade-out')
  const [anuncioSize, setAnuncioSize] = useState('anuncio-lg')
  const [anuncioFont, setAnuncioFont] = useState('anuncio-font-bold')
  const [anuncioColor, setAnuncioColor] = useState('anuncio-color-white')
  const [anuncioExiting, setAnuncioExiting] = useState(false)
  const anuncioTimerRef = useRef<ReturnType<typeof setTimeout>>()
  const videoRef = useRef<HTMLVideoElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const progressTimer = useRef<ReturnType<typeof setInterval>>()
  const ytTimer = useRef<ReturnType<typeof setInterval>>()
  const ytStartTime = useRef(0)
  const ytElapsedRef = useRef(0)
  const ytDurationRef = useRef(0)
  const titleRef = useRef('')
  const verseContainerRef = useRef<HTMLDivElement>(null)
  const [currentTime, setCurrentTime] = useState('')
  const [timerDisplay, setTimerDisplay] = useState('')
  const [timerRunning, setTimerRunning] = useState(false)

  useEffect(() => {
    const update = () => {
      const d = new Date()
      const h = d.getHours().toString().padStart(2, '0')
      const m = d.getMinutes().toString().padStart(2, '0')
      setCurrentTime(`${h}:${m}`)
    }
    update()
    const id = setInterval(update, 30000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const unsub = window.api.on('projector:timer', (arg: unknown) => {
      const data = arg as { time: number; running: boolean }
      setTimerRunning(data.running)
      const totalSec = Math.max(0, Math.floor(data.time / 1000))
      const m = Math.floor(totalSec / 60)
      const s = totalSec % 60
      setTimerDisplay(`${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`)
    })
    return () => unsub?.()
  }, [])

  const stopYtTimer = useCallback(() => {
    if (ytTimer.current) { clearInterval(ytTimer.current); ytTimer.current = undefined }
  }, [])

  const stopLocalTimer = useCallback(() => {
    if (progressTimer.current) { clearInterval(progressTimer.current); progressTimer.current = undefined }
  }, [])

  const startYtTimer = useCallback(() => {
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
  }, [stopYtTimer])

  const startLocalTimer = useCallback(() => {
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
  }, [stopLocalTimer])

  useEffect(() => {
    if (!docUrl) { setDocHtmlContent(''); setDocCss(''); return }
    setDocConverting(true)
    window.api.app.convertDocumentToHtml(docUrl).then(res => {
      if (res.success && res.data?.html) {
        setDocHtmlContent(res.data.html)
        setDocCss(res.data.css || '')
      } else {
        setDocHtmlContent(''); setDocCss('')
      }
    }).catch(() => { setDocHtmlContent(''); setDocCss('') })
      .finally(() => setDocConverting(false))
  }, [docUrl])

  useEffect(() => {
    if (docHtmlContent) {
      const el = document.querySelector('.doc-scroll-container') as HTMLElement
      if (el) el.focus()
    }
  }, [docHtmlContent])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        window.api.projector.prevVerse()
      } else if (e.key === 'ArrowRight') {
        window.api.projector.nextVerse()
      } else if (e.key === 'ArrowUp') {
        const el = document.querySelector('.doc-scroll-container') as HTMLElement
        if (el) { e.preventDefault(); el.scrollTop -= 250 }
      } else if (e.key === 'ArrowDown') {
        const el = document.querySelector('.doc-scroll-container') as HTMLElement
        if (el) { e.preventDefault(); el.scrollTop += 250 }
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])


  useEffect(() => {
    // Capturar errores de carga del iframe
    const handleLoadError = (e: ErrorEvent) => {
      console.error('[Window error]', e.message, e.error)
    }
    Promise.all([
      window.api.app.getVideoLogo(),
      window.api.app.getConfig()
    ]).then(([logoRes, cfgRes]) => {
      if (logoRes?.success && logoRes.data) setLogoSrc(fileUrl(logoRes.data.filePath))
      if (cfgRes?.success && cfgRes.data) {
        const cfg = cfgRes.data as Record<string, string>
        if (cfg.headerTitle) setHeaderTitle(cfg.headerTitle)
        if (cfg.headerSub) setHeaderSub(cfg.headerSub)
      }
    })

    window.addEventListener('error', handleLoadError)
    const handleRejection = (e: PromiseRejectionEvent) => {
      console.error('[Unhandled rejection]', e.reason)
    }
    window.addEventListener('unhandledrejection', handleRejection)

    const unsub1 = window.api.on('projector:content', (arg: unknown) => {
      const data = arg as { type?: string; text?: string; reference?: string; mediaUrl?: string; backgroundUrl?: string; animation?: string; effect?: string; speed?: number; sermonTitle?: string; sermonPreacher?: string } | undefined
      if (data?.type === 'verse') {
        setEffect(null); setDocUrl(''); setDocHtmlContent(''); setDocCss('')
        setVerseText(data.text || '')
        setVerseRef(data.reference || '')
        setVerseBackground(data.backgroundUrl || '')
        setVerseAnimation(data.animation || 'anim-fade')
        setSermonTitle(data.sermonTitle || '')
        setSermonPreacher(data.sermonPreacher || '')
        setIsBlack(false); setVideoUrl('')
        stopLocalTimer(); stopYtTimer()
      } else if (data?.type === 'effect') {
        setEffect({ type: data.effect || 'waves', speed: data.speed || 1 })
        setVerseText(''); setVerseRef(''); setVerseBackground(''); setVideoUrl(''); setIsImage(false); setIsBlack(false); setDocUrl('')
        stopLocalTimer(); stopYtTimer()
      } else if (data?.type === 'media' && (data.mediaUrl?.startsWith('data:image') || data.mediaUrl?.startsWith('file://') || data.mediaUrl?.match(/\.(png|jpg|jpeg|gif|webp|bmp)/i))) {
        setEffect(null); setDocUrl('')
        setVerseText('')
        setVerseRef('')
        setVerseBackground('')
        setIsBlack(false)
        setIsImage(true)
        setIsYoutube(false)
        setVideoUrl(data.mediaUrl)
        setVideoTitle(data.text || 'Imagen')
        stopLocalTimer(); stopYtTimer()
      } else if (data?.type === 'document' && data.mediaUrl) {
        setEffect(null); setVerseText(''); setVerseRef(''); setVerseBackground(''); setVideoUrl(''); setIsImage(false); setIsBlack(false)
        setDocUrl(data.mediaUrl)
        setVideoTitle(data.text || 'Documento')
        stopLocalTimer(); stopYtTimer()
      }
    })

    const unsub2 = window.api.on('projector:showBlack', () => {
      setIsBlack(true); setEffect(null); setVerseText(''); setVerseRef(''); setVerseBackground(''); setVideoUrl(''); setIsImage(false)
      stopLocalTimer(); stopYtTimer()
    })

    const unsub3 = window.api.on('projector:playVideo', (arg: unknown) => {
      const data = arg as { url?: string; title?: string; duration?: number } | undefined
      const url = data?.url
      if (url) {
        const isYT = url.includes('youtube.com/embed') || url.includes('youtube.com/watch') || url.includes('youtu.be')
        setIsYoutube(isYT)
        setIsImage(false)
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

    const unsub7 = window.api.on('projector:seekVideo', (arg: unknown) => {
      const time = arg as number
      const v = document.querySelector('video')
      if (v) { v.currentTime = time; return }
      stopYtTimer()
      ytElapsedRef.current = time
      ytStartTime.current = Date.now() - time * 1000
      const iframe = iframeRef.current || document.querySelector('iframe[src*="youtube.com/embed"]')
      if (iframe?.contentWindow) {
        iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'seekTo', args: [time, true] }), '*')
      }
    })

    const unsub8 = window.api.on('projector:volumeVideo', (arg: unknown) => {
      const vol = arg as number
      const v = document.querySelector('video')
      if (v) { v.volume = Math.max(0, Math.min(1, vol / 100)); return }
      const iframe = iframeRef.current || document.querySelector('iframe[src*="youtube.com/embed"]')
      if (iframe?.contentWindow) {
        iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'setVolume', args: [vol] }), '*')
      }
    })

    const clearAnuncioTimer = () => {
      if (anuncioTimerRef.current) { clearTimeout(anuncioTimerRef.current); anuncioTimerRef.current = undefined }
    }

    const hideAfterExit = () => {
      setAnuncioExiting(true)
      setTimeout(() => { setAnuncioText(''); setAnuncioExiting(false) }, 600)
    }

    const unsub9 = window.api.on('projector:showAnnouncement', (arg: unknown) => {
      const data = arg as { text?: string; animIn?: string; animOut?: string; duration?: number; bg?: string; bgAnimIn?: string; bgAnimOut?: string; size?: string; font?: string; color?: string }
      if (data?.text) {
        clearAnuncioTimer()
        setAnuncioExiting(false)
        setAnuncioText(data.text)
        setAnuncioAnimIn(data.animIn || 'anuncio-slide-up')
        setAnuncioAnimOut(data.animOut || 'anim-fade')
        setAnuncioDuration(data.duration ?? 8)
        setAnuncioBg(data.bg || 'anuncio-bg-dark')
        setAnuncioBgAnimIn(data.bgAnimIn || 'anuncio-bg-fade-in')
        setAnuncioBgAnimOut(data.bgAnimOut || 'anuncio-bg-fade-out')
        setAnuncioSize(data.size || 'anuncio-lg')
        setAnuncioFont(data.font || 'anuncio-font-bold')
        setAnuncioColor(data.color || 'anuncio-color-white')
        if (data.duration && data.duration > 0) {
          anuncioTimerRef.current = setTimeout(hideAfterExit, data.duration * 1000)
        }
      }
    })

    const unsub10 = window.api.on('projector:hideAnnouncement', () => {
      clearAnuncioTimer()
      hideAfterExit()
    })

    const unsub11 = window.api.on('projector:updateAnnouncement', (arg: unknown) => {
      const data = arg as { animIn?: string; animOut?: string; duration?: number; bg?: string; bgAnimIn?: string; bgAnimOut?: string; size?: string; font?: string; color?: string }
      if (data.animIn) setAnuncioAnimIn(data.animIn)
      if (data.animOut) setAnuncioAnimOut(data.animOut)
      if (data.duration != null) setAnuncioDuration(data.duration)
      if (data.bg) setAnuncioBg(data.bg)
      if (data.bgAnimIn) setAnuncioBgAnimIn(data.bgAnimIn)
      if (data.bgAnimOut) setAnuncioBgAnimOut(data.bgAnimOut)
      if (data.size) setAnuncioSize(data.size)
      if (data.font) setAnuncioFont(data.font)
      if (data.color) setAnuncioColor(data.color)
      if (data.duration != null && data.duration > 0 && anuncioText) {
        clearAnuncioTimer()
        anuncioTimerRef.current = setTimeout(hideAfterExit, data.duration * 1000)
      }
    })

    const unsub12 = window.api.on('projector:overlay', (arg: unknown) => {
      const data = arg as { type?: string; speed?: number; color?: string }
      if (data?.type === 'none') setOverlay(null)
      else setOverlay(prev => {
        if (prev && prev.type === data.type) return { ...prev, speed: data.speed || prev.speed, color: data.color || prev.color }
        return { type: data.type || 'particles', speed: data.speed || 1, color: data.color || '#6c5ce7' }
      })
    })

    return () => {
      window.removeEventListener('error', handleLoadError)
      window.removeEventListener('unhandledrejection', handleRejection)
      unsub1?.(); unsub2?.(); unsub3?.(); unsub4?.(); unsub5?.(); unsub6?.(); unsub7?.(); unsub8?.(); unsub9?.(); unsub10?.(); unsub11?.(); unsub12?.(); stopLocalTimer(); stopYtTimer()
    }
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

  const OverlayFX = () => overlay ? <OverlayEffect type={overlay.type} speed={overlay.speed} color={overlay.color} /> : null

  const GlobalOverlays = () => (
    <>
      <AnuncioOverlay text={anuncioText} animIn={anuncioAnimIn} animOut={anuncioAnimOut} bg={anuncioBg} bgAnimIn={anuncioBgAnimIn} bgAnimOut={anuncioBgAnimOut} size={anuncioSize} font={anuncioFont} color={anuncioColor} exiting={anuncioExiting} />
      <OverlayFX />
      {timerDisplay && (
        <div className="fixed bottom-6 right-6 z-50 bg-black/60 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/10 shadow-2xl">
          <div className="flex items-center gap-2">
            {timerRunning && <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />}
            <span className="text-xl font-bold font-mono text-white tabular-nums tracking-wider">{timerDisplay}</span>
          </div>
        </div>
      )}
    </>
  )

  let content: JSX.Element | null = null

  if (isBlack) {
    content = (
      <div className="h-screen w-screen bg-black flex items-center justify-center relative">
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-black/40 px-6 py-2 rounded-full">
          <p className="text-xs text-white/30 tracking-widest uppercase">Pantalla en negro</p>
        </div>
      </div>
    )
  } else if (docUrl) {
    content = (
      <div className="h-screen w-screen bg-white relative">
        {docHtmlContent ? (
          <div ref={docRef} tabIndex={-1} className="doc-scroll-container absolute inset-0 overflow-auto outline-none">
            <style>{docCss}</style>
            <div className="doc-content" dangerouslySetInnerHTML={{ __html: docHtmlContent }} />
          </div>
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <div className="text-center p-8">
              <FileText size={64} className="text-gray-400 mx-auto mb-4" />
              <p className="text-xl text-gray-600 font-medium mb-2">{videoTitle}</p>
              {docConverting ? (
                <p className="text-sm text-gray-400">Convirtiendo documento...</p>
              ) : (
                <>
                  <p className="text-sm text-gray-400 mb-4">Vista previa no disponible. Abrir con aplicación externa.</p>
                  <button onClick={() => window.api.app.openDocument(docUrl)} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer text-sm font-medium">Abrir documento</button>
                </>
              )}
            </div>
          </div>
        )}
        <div className="absolute top-6 left-6 z-20 flex items-center gap-4 pointer-events-none">
          {logoSrc && <img src={logoSrc} alt="Logo" className="h-24 w-auto object-contain pointer-events-none" />}
          {(headerTitle || headerSub) && (
            <div><p className="text-3xl font-bold text-white drop-shadow-lg">{headerTitle || 'SOFTWARE PREMIUM'}</p><p className="text-sm text-white/70 drop-shadow-lg">{headerSub || 'PARA IGLESIAS'}</p></div>
          )}
        </div>
      </div>
    )
  } else if (isImage && videoUrl) {
    content = (
      <div className="h-screen w-screen bg-black relative flex items-center justify-center">
        <img src={videoUrl} alt={videoTitle} className="max-h-full max-w-full object-contain" />
        <div className="absolute top-6 left-6 z-20 flex items-center gap-4 pointer-events-none">
          {logoSrc && <img src={logoSrc} alt="Logo" className="h-24 w-auto object-contain pointer-events-none" />}
          {(headerTitle || headerSub) && (
            <div><p className="text-3xl font-bold text-white drop-shadow-lg">{headerTitle || 'SOFTWARE PREMIUM'}</p><p className="text-sm text-white/70 drop-shadow-lg">{headerSub || 'PARA IGLESIAS'}</p></div>
          )}
        </div>
      </div>
    )
  } else if (videoUrl && isYoutube) {
    content = (
      <div className="h-screen w-screen bg-black relative">
        <iframe ref={iframeRef} src={videoUrl} className="absolute inset-0 w-full h-full" allow="autoplay; fullscreen" allowFullScreen
          onError={(e) => console.error('[YT Iframe error]', e)} />
        <div className="absolute top-6 left-6 z-20 flex items-center gap-4 pointer-events-none">
          {logoSrc && <img src={logoSrc} alt="Logo" className="h-48 w-auto object-contain" onError={() => console.error('[Logo error]')} />}
          {(headerTitle || headerSub) && (
            <div><p className="text-4xl font-bold text-white drop-shadow-lg">{headerTitle || 'SOFTWARE PREMIUM'}</p><p className="text-xl text-white/70 drop-shadow-lg">{headerSub || 'PARA IGLESIAS'}</p></div>
          )}
        </div>
      </div>
    )
  } else if (videoUrl) {
    content = (
      <div className="h-screen w-screen bg-black relative">
        <video ref={videoRef} className="absolute inset-0 h-full w-full object-contain" controls={false} autoPlay
          onError={(e) => { const v = e.currentTarget; console.error('[Video error] code:', v.error?.code, 'message:', v.error?.message) }} />
        <div className="absolute top-6 left-6 z-20 flex items-center gap-4 pointer-events-none">
          {logoSrc && <img src={logoSrc} alt="Logo" className="h-48 w-auto object-contain" onError={() => console.error('[Logo error]')} />}
          {(headerTitle || headerSub) && (
            <div><p className="text-4xl font-bold text-white drop-shadow-lg">{headerTitle || 'SOFTWARE PREMIUM'}</p><p className="text-xl text-white/70 drop-shadow-lg">{headerSub || 'PARA IGLESIAS'}</p></div>
          )}
        </div>
      </div>
    )
  } else if (effect) {
    content = <EffectRenderer effect={effect.type} speed={effect.speed} logoSrc={logoSrc} headerTitle={headerTitle} headerSub={headerSub} anuncioText={anuncioText}
      anuncioAnimIn={anuncioAnimIn} anuncioAnimOut={anuncioAnimOut} anuncioBg={anuncioBg} anuncioBgAnimIn={anuncioBgAnimIn} anuncioBgAnimOut={anuncioBgAnimOut}
      anuncioSize={anuncioSize} anuncioFont={anuncioFont} anuncioColor={anuncioColor} anuncioExiting={anuncioExiting} />
  } else if (verseText) {
    content = (
      <div key={verseRef} ref={verseContainerRef} className="h-screen w-screen relative flex items-center justify-center p-16 overflow-hidden">
        {verseBackground ? (
          <>
            <img src={verseBackground} alt="" className="absolute inset-0 w-full h-full object-cover pointer-events-none" />
            <div className="absolute inset-0 bg-black/50 pointer-events-none" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a1a] to-black" />
        )}
        <div className="absolute top-6 left-6 z-20 flex items-center gap-4 pointer-events-none">
          {logoSrc && <img src={logoSrc} alt="Logo" className="h-48 w-auto object-contain" />}
          {(headerTitle || headerSub) && (
            <div><p className="text-4xl font-bold text-white drop-shadow-lg">{headerTitle || 'SOFTWARE PREMIUM'}</p><p className="text-xl text-white/70 drop-shadow-lg">{headerSub || 'PARA IGLESIAS'}</p></div>
          )}
        </div>
        {sermonTitle && (
          <div className="absolute top-16 right-8 z-20 text-right pointer-events-none">
            <p className="text-5xl font-bold text-amber-400 drop-shadow-[0_3px_12px_rgba(0,0,0,0.95)]">{sermonTitle}</p>
            {sermonPreacher && <p className="text-2xl text-amber-400/70 mt-1 drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)]">{sermonPreacher}</p>}
          </div>
        )}
        <div className="relative text-center w-[95%] px-8">
          {verseAnimation.startsWith('anim-letter-') ? (
            <p className={`text-7xl font-bold leading-[1.3] text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)] ${verseAnimation}`}>
              {verseText.split('').map((char, i) => (<span key={i} style={{ animationDelay: `${i * 0.045}s` }} className="inline-block">{char === ' ' ? '\u00A0' : char}</span>))}
            </p>
          ) : (
            <p className={`text-7xl font-bold leading-[1.3] text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)] ${verseAnimation} anim-delay-text`}>{verseText}</p>
          )}
          <p className={`text-4xl text-white/80 mt-8 tracking-wide drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)] ${verseAnimation} anim-delay-ref`}>— {verseRef}</p>
        </div>
      </div>
    )
  } else {
    content = (
      <div className="h-screen w-screen bg-black flex items-center justify-center relative">
        <div className="text-center">
          <Monitor size={48} className="text-gray-800 mx-auto mb-3" />
          <p className="text-sm text-gray-700">Sin contenido</p>
          <p className="text-[10px] text-gray-800 mt-2">Esperando contenido para proyectar...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen w-screen relative">
      {content}
      <div className="fixed inset-0 z-50 pointer-events-none">
        <GlobalOverlays />
      </div>
    </div>
  )
}

function EffectRenderer({ effect, speed, logoSrc, headerTitle, headerSub, ...anuncio }: any) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const timeRef = useRef(0)
  const animRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
    resize(); window.addEventListener('resize', resize)

    const draw = () => {
      timeRef.current += 0.01 * (speed || 1)
      const t = timeRef.current
      const w = canvas.width; const h = canvas.height
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, w, h)

      if (effect === 'waves') {
        for (let i = 0; i < 3; i++) {
          ctx.beginPath()
          for (let x = 0; x <= w; x += 4) {
            const y = h / 2 + Math.sin(x * 0.005 + t * 2 + i) * (30 + i * 20) + Math.sin(x * 0.01 + t * 1.5 + i) * (15 + i * 10)
            x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
          }
          ctx.strokeStyle = `rgba(108, 92, 231, ${0.3 + i * 0.15})`
          ctx.lineWidth = 3; ctx.shadowColor = '#6c5ce7'; ctx.shadowBlur = 20; ctx.stroke()
        }
        ctx.shadowBlur = 0
      } else if (effect === 'particles') {
        for (let i = 0; i < 40; i++) {
          const px = (Math.sin(i * 2.1 + t * 0.4) + 1) * 0.5 * w
          const py = (Math.cos(i * 1.7 + t * 0.25) + 1) * 0.5 * h
          const sz = Math.sin(i + t) * 1 + 0.5
          ctx.beginPath(); ctx.arc(px, py, sz, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(0, 212, 255, ${0.1 + Math.sin(i + t * 0.5) * 0.05})`; ctx.fill()
        }
      } else if (effect === 'pulse') {
        const cx = w / 2, cy = h / 2
        const r = h * 0.08 + Math.sin(t * 1.8) * h * 0.04
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 3)
        grad.addColorStop(0, `rgba(108, 92, 231, ${0.15 + Math.sin(t * 1.8) * 0.06})`)
        grad.addColorStop(1, 'rgba(108, 92, 231, 0)')
        ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h)
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(108, 92, 231, ${0.2 + Math.sin(t * 1.8) * 0.08})`; ctx.lineWidth = 2; ctx.stroke()
      } else if (effect === 'stars') {
        for (let i = 0; i < 60; i++) {
          const px = (i * 23.7 + t * 8 * (speed || 1)) % w
          const py = (i * 17.3 + t * 5 * (speed || 1) + Math.sin(i + t * 0.3) * 15) % h
          const sz = Math.sin(i * 3 + t * 1.5) * 0.4 + 0.6
          ctx.beginPath(); ctx.arc(px, py, sz, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(250, 204, 21, ${0.08 + Math.sin(i + t) * 0.04})`; ctx.fill()
        }
      } else if (effect === 'ripple') {
        for (let i = 1; i <= 4; i++) {
          const radius = ((t * 25) % (w * 0.6)) + i * 30
          ctx.beginPath(); ctx.arc(w / 2, h / 2, radius, 0, Math.PI * 2)
          ctx.strokeStyle = `rgba(34, 197, 94, ${0.06 + Math.sin(t + i) * 0.025})`; ctx.lineWidth = 1; ctx.stroke()
        }
      } else if (effect === 'combi') {
        for (let i = 0; i < 2; i++) {
          ctx.beginPath()
          for (let x = 0; x <= w; x += 4) {
            const y = h / 2 + Math.sin(x * 0.004 + t * 1.5 + i * 2) * (20 + i * 15) + Math.sin(x * 0.008 + t * 2 + i) * 10
            x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
          }
          ctx.strokeStyle = `rgba(168, 85, 247, ${0.15 + i * 0.1})`; ctx.lineWidth = 2; ctx.stroke()
        }
        for (let i = 0; i < 25; i++) {
          const px = (Math.sin(i * 1.3 + t * 0.3) + 1) * 0.5 * w
          const py = (Math.cos(i * 1.9 + t * 0.2) + 1) * 0.5 * h
          ctx.beginPath(); ctx.arc(px, py, 1.5, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(168, 85, 247, ${0.1 + Math.sin(i + t) * 0.05})`; ctx.fill()
        }
      }
      animRef.current = requestAnimationFrame(draw)
    }
    animRef.current = requestAnimationFrame(draw)
    return () => { cancelAnimationFrame(animRef.current); window.removeEventListener('resize', resize) }
  }, [effect, speed])

  return (
    <div className="h-screen w-screen relative overflow-hidden bg-black">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      <div className="absolute top-6 left-6 z-20 flex items-center gap-4 pointer-events-none">
        {logoSrc && <img src={logoSrc} alt="Logo" className="h-48 w-auto object-contain" />}
        {(headerTitle || headerSub) && (
          <div>
            <p className="text-4xl font-bold text-white drop-shadow-lg">{headerTitle || 'SOFTWARE PREMIUM'}</p>
            <p className="text-xl text-white/70 drop-shadow-lg">{headerSub || 'PARA IGLESIAS'}</p>
          </div>
        )}
      </div>
      <AnuncioOverlay text={anuncio.anuncioText} animIn={anuncio.anuncioAnimIn} animOut={anuncio.anuncioAnimOut}
        bg={anuncio.anuncioBg} bgAnimIn={anuncio.anuncioBgAnimIn} bgAnimOut={anuncio.anuncioBgAnimOut}
        size={anuncio.anuncioSize} font={anuncio.anuncioFont} color={anuncio.anuncioColor} exiting={anuncio.anuncioExiting} />
    </div>
  )
}

function OverlayEffect({ type, speed = 1, color = '#6c5ce7' }: { type: string; speed?: number; color?: string }) {
  const parts = color?.split(':') || []
  const speedRef = useRef(speed)
  const sizeRef = useRef(parts[4] === 'size' ? parseInt(parts[5], 10) / 100 : 1)
  const countRef = useRef(parts[2] === 'count' ? parseInt(parts[3], 10) : Math.round(60 * (parts[0] === 'intensity' ? parseInt(parts[1], 10) / 100 : 0.5)))
  speedRef.current = speed
  sizeRef.current = parts[4] === 'size' ? parseInt(parts[5], 10) / 100 : sizeRef.current
  const intensity = parts[0] === 'intensity' ? parseInt(parts[1], 10) / 100 : 0.5

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const timeRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
    resize(); window.addEventListener('resize', resize)
    timeRef.current = 0

    const particles: any[] = []

    const draw = () => {
      timeRef.current += 0.02 * speedRef.current
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const customSize = sizeRef.current
      const rSize = () => { const s = Math.random(); const base = s < 0.3 ? Math.random() * 0.8 + 0.3 : s < 0.6 ? Math.random() * 2 + 1 : Math.random() * 4 + 2; return base * customSize }
      const c = countRef.current
      const maxP = c; const maxPSnow = Math.round(c * 1.5); const maxPFire = Math.round(c * 0.5); const maxPConf = Math.round(c * 0.7)
      const maxPBub = Math.round(c * 0.3); const maxPRain = Math.round(c * 1.2); const maxPHeart = Math.round(c * 0.4)
      const maxPSmoke = Math.round(c * 0.3); const maxPGlitter = Math.round(c * 0.8); const maxPMatrix = Math.round(c * 0.7)

      const respawn = (p: any) => { p.x = Math.random() * canvas.width; p.y = type === 'snow' || type === 'confetti' || type === 'rain' ? -10 : type === 'bubbles' || type === 'hearts' || type === 'smoke' ? canvas.height + 10 : Math.random() * canvas.height; p.life = 0; p.size = rSize(); if (type === 'confetti') { p.vx = (Math.random() - 0.5) * 1.2; p.vy = 1 + Math.random() * 1.5; p.size = Math.random() * 2 + 1; p.color = ['#6c5ce7', '#a855f7', '#00d4ff', '#ef4444', '#22c55e', '#f59e0b', '#ec4899'][Math.floor(Math.random() * 7)]; p.rot = Math.random() * 360; p.rotSpeed = (Math.random() - 0.5) * 8 } if (type === 'rain') { p.vy = 3 + Math.random() * 2 } if (type === 'snow') { p.vy = 0.3 + Math.random() * 0.4; p.vx = (Math.random() - 0.5) * 0.2; p.size = Math.random() * 2 + 0.5 } if (type === 'bubbles') { p.vy = -(0.2 + Math.random() * 0.3); p.size = Math.random() * 8 + 2 } if (type === 'hearts') { p.vy = -(0.3 + Math.random() * 0.5); p.size = 4 + Math.random() * 4 } if (type === 'fireworks') { p.x = Math.random() * canvas.width; p.y = Math.random() * canvas.height * 0.5; p.vx = 0; p.vy = 0; p.size = Math.random() * 1.5 + 0.5 } }

      if (type === 'particles') {
        while (particles.length < maxP) particles.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, vx: (Math.random() - 0.5) * 0.5, vy: (Math.random() - 0.5) * 0.5, size: rSize(), life: 0, maxLife: 5000 })
        for (let i = particles.length - 1; i >= 0; i--) { const p = particles[i]; p.x += p.vx; p.y += p.vy; p.life++; if (p.life >= p.maxLife) { respawn(p) }; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fillStyle = `rgba(255,255,255,${0.3 + Math.sin(p.life * 0.05) * 0.2})`; ctx.fill() }
      } else if (type === 'snow') {
        while (particles.length < maxPSnow) particles.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height * -1, vx: (Math.random() - 0.5) * 0.15, vy: 0.2 + Math.random() * 0.6, size: Math.random() * 2.5 + 0.5, life: 0, maxLife: 99999 })
        for (let i = particles.length - 1; i >= 0; i--) { const p = particles[i]; p.x += Math.sin(p.life * 0.01 + i) * 0.2; p.y += p.vy; p.life++; if (p.y > canvas.height + 5) { p.y = -5; p.x = Math.random() * canvas.width; p.vy = 0.2 + Math.random() * 0.6 } ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fillStyle = `rgba(255,255,255,${0.5 + Math.sin(p.life * 0.03 + i) * 0.2})`; ctx.fill() }
      } else if (type === 'fireflies') {
        if (particles.length < maxPFire) particles.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, vx: 0, vy: 0, size: rSize() * 2, life: 0, maxLife: 100 })
        for (let i = particles.length - 1; i >= 0; i--) { const p = particles[i]; p.x += Math.sin(timeRef.current + i) * 0.3; p.y += Math.cos(timeRef.current * 0.7 + i) * 0.3; p.life++; if (p.life >= p.maxLife) { respawn(p) }; const a = (0.5 + Math.sin(timeRef.current * 2 + i) * 0.3) * 0.8; const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3); g.addColorStop(0, `rgba(255,255,200,${a})`); g.addColorStop(1, 'rgba(255,255,200,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2); ctx.fill() }
      } else if (type === 'confetti') {
        const colors = ['#6c5ce7', '#a855f7', '#00d4ff', '#ef4444', '#22c55e', '#f59e0b', '#ec4899']
        while (particles.length < maxPConf) particles.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height * -1, vx: (Math.random() - 0.5) * 1.2, vy: 0.5 + Math.random() * 1.5, size: Math.random() * 2 + 1, life: 0, maxLife: 99999, color: colors[Math.floor(Math.random() * colors.length)], rot: Math.random() * 360, rotSpeed: (Math.random() - 0.5) * 8 })
        for (let i = particles.length - 1; i >= 0; i--) { const p = particles[i]; p.x += p.vx; p.y += p.vy; p.vy += 0.02; p.rot += p.rotSpeed; p.life++; if (p.y > canvas.height + 5) { p.y = -5; p.x = Math.random() * canvas.width; p.vy = 0.5 + Math.random() * 1.5; p.color = colors[Math.floor(Math.random() * colors.length)] }; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate((p.rot * Math.PI) / 180); ctx.fillStyle = p.color; ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2); ctx.restore() }
      } else if (type === 'rain') {
        while (particles.length < maxPRain) particles.push({ x: Math.random() * canvas.width, y: -10, vx: -0.5, vy: 5 + Math.random() * 4, size: 1, life: 0, maxLife: 99999 })
        for (let i = particles.length - 1; i >= 0; i--) { const p = particles[i]; p.x += p.vx; p.y += p.vy; p.life++; if (p.y > canvas.height + 5) { p.y = -5; p.x = Math.random() * canvas.width; p.vy = 5 + Math.random() * 4 }; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - 3, p.y + 8); ctx.strokeStyle = `rgba(100,180,255,${0.3 + Math.sin(p.life * 0.05) * 0.1})`; ctx.lineWidth = 1; ctx.stroke() }
      } else if (type === 'hearts') {
        while (particles.length < maxPHeart) particles.push({ x: Math.random() * canvas.width, y: canvas.height + 10, vx: (Math.random() - 0.5) * 0.6, vy: -(0.5 + Math.random() * 0.8), size: 3 + Math.random() * 6, life: 0, maxLife: 99999 })
        for (let i = particles.length - 1; i >= 0; i--) { const p = particles[i]; p.x += Math.sin(p.life * 0.02 + i) * 0.3; p.y += p.vy; p.vy += 0.003; p.life++; if (p.y < -20) { p.y = canvas.height + 10; p.x = Math.random() * canvas.width; p.vy = -(0.5 + Math.random() * 0.8); p.size = 3 + Math.random() * 6 }; const a = 0.5 + Math.sin(p.life * 0.05) * 0.3; ctx.font = `${p.size}px serif`; ctx.textAlign = 'center'; ctx.fillStyle = `rgba(239,68,68,${a})`; ctx.fillText('♥', p.x, p.y) }
      } else if (type === 'smoke') {
        while (particles.length < maxPSmoke) particles.push({ x: canvas.width * (0.3 + Math.random() * 0.4), y: canvas.height + 5, vx: (Math.random() - 0.5) * 0.3, vy: -(0.2 + Math.random() * 0.4), size: 8 + Math.random() * 15, life: 0, maxLife: 99999 })
        for (let i = particles.length - 1; i >= 0; i--) { const p = particles[i]; p.x += Math.sin(p.life * 0.01 + i) * 0.2; p.y += p.vy; p.size += 0.15; p.life++; const fade = Math.max(0, 1 - p.life / 300); if (fade <= 0 || p.y < -50) { p.y = canvas.height + 5; p.x = canvas.width * (0.3 + Math.random() * 0.4); p.size = 8 + Math.random() * 15; p.vy = -(0.2 + Math.random() * 0.4); p.life = 0 }; const a = fade * 0.12; const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size); g.addColorStop(0, `rgba(200,200,200,${a})`); g.addColorStop(1, 'rgba(200,200,200,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill() }
      } else if (type === 'bubbles') {
        while (particles.length < maxPBub) particles.push({ x: Math.random() * canvas.width, y: canvas.height + 5, vx: (Math.random() - 0.5) * 0.3, vy: -(0.2 + Math.random() * 0.4), size: 3 + Math.random() * 8, life: 0, maxLife: 99999 })
        for (let i = particles.length - 1; i >= 0; i--) { const p = particles[i]; p.x += Math.sin(p.life * 0.02 + i) * 0.2; p.y += p.vy; p.life++; if (p.y < -20) { p.y = canvas.height + 5; p.x = Math.random() * canvas.width; p.vy = -(0.2 + Math.random() * 0.4); p.size = 3 + Math.random() * 8 }; const alpha = 0.15 + Math.sin(p.life * 0.03) * 0.08; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.strokeStyle = `rgba(108,92,231,${alpha})`; ctx.lineWidth = 1; ctx.stroke(); ctx.fillStyle = `rgba(255,255,255,${alpha * 0.15})`; ctx.fill() }
      } else if (type === 'fireworks') {
        if (particles.length === 0) { const cx2 = Math.random() * canvas.width; const cy2 = Math.random() * canvas.height * 0.4; const cnt = Math.round((20 + Math.random() * 15) * intensity); const cl = ['#6c5ce7','#a855f7','#00d4ff','#ef4444','#22c55e','#f59e0b','#ec4899','#ffffff'][Math.floor(Math.random() * 8)]; for (let i = 0; i < cnt; i++) { const a2 = (Math.PI * 2 * i) / cnt; const v = 1.5 + Math.random() * 2; particles.push({ x: cx2, y: cy2, vx: Math.cos(a2) * v, vy: Math.sin(a2) * v, size: Math.random() * 1.5 + 0.5, life: 0, maxLife: 60 + Math.random() * 30, color: cl }) } }
        for (let i = particles.length - 1; i >= 0; i--) { const p = particles[i]; p.x += p.vx; p.y += p.vy; p.vy += 0.05; p.life++; const a2 = Math.max(0, 1 - p.life / p.maxLife); ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fillStyle = p.color ? `${p.color}${Math.round(a2 * 255).toString(16).padStart(2, '0')}` : `rgba(255,255,255,${a2})`; ctx.fill(); if (p.life >= p.maxLife) particles.splice(i, 1) }; if (particles.length === 0 && Math.random() < 0.02 * intensity) { const cx3 = Math.random() * canvas.width; const cy3 = Math.random() * canvas.height * 0.4; const cnt2 = Math.round((20 + Math.random() * 15) * intensity); const cl2 = ['#6c5ce7','#a855f7','#00d4ff','#ef4444','#22c55e','#f59e0b','#ec4899','#ffffff'][Math.floor(Math.random() * 8)]; for (let i = 0; i < cnt2; i++) { const a3 = (Math.PI * 2 * i) / cnt2; particles.push({ x: cx3, y: cy3, vx: Math.cos(a3) * (1.5 + Math.random() * 2), vy: Math.sin(a3) * (1.5 + Math.random() * 2), size: Math.random() * 1.5 + 0.5, life: 0, maxLife: 60 + Math.random() * 30, color: cl2 }) } }
      } else if (type === 'glitter') {
        if (particles.length < maxPGlitter) { const colors = ['#6c5ce7', '#a855f7', '#00d4ff', '#ef4444', '#22c55e', '#f59e0b', '#ec4899']; particles.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, vx: 0, vy: 0, size: Math.random() * 2 + 0.5, life: 0, maxLife: 80, color: colors[Math.floor(Math.random() * colors.length)], phase: Math.random() * Math.PI * 2 }) }
        for (let i = particles.length - 1; i >= 0; i--) { const p = particles[i]; p.life++; if (p.life >= p.maxLife) { respawn(p) }; const a = (0.5 + Math.sin(timeRef.current * 3 + p.phase) * 0.5); ctx.beginPath(); const s = p.size * (1 + Math.sin(timeRef.current * 2 + p.phase) * 0.5); ctx.arc(p.x, p.y, s, 0, Math.PI * 2); ctx.fillStyle = p.color || '#ffffff'; ctx.globalAlpha = a; ctx.fill(); ctx.globalAlpha = 1 }
      } else if (type === 'matrix') {
        if (particles.length < maxPMatrix) particles.push({ x: Math.random() * canvas.width, y: -20, vx: 0, vy: 3 + Math.random() * 5, size: 10 + Math.random() * 6, life: 0, maxLife: 100, char: String.fromCharCode(0x30A0 + Math.random() * 96) })
        for (let i = particles.length - 1; i >= 0; i--) { const p = particles[i]; p.y += p.vy; p.life++; if (p.y > canvas.height + 20 || p.life >= p.maxLife) { respawn(p); p.char = String.fromCharCode(0x30A0 + Math.random() * 96) }; ctx.font = `${p.size}px monospace`; ctx.fillStyle = `rgba(34,197,94,${0.4 + Math.sin(p.life * 0.1) * 0.2})`; ctx.fillText(p.char, p.x, p.y); if (Math.random() < 0.05) p.char = String.fromCharCode(0x30A0 + Math.random() * 96) }
      } else if (type === 'neon') {
        for (let i = 0; i < Math.round(5 * intensity); i++) { const x = canvas.width * 0.5 + Math.sin(timeRef.current * 0.5 + i * 1.3) * canvas.width * 0.3; const y = canvas.height * 0.5 + Math.cos(timeRef.current * 0.4 + i * 1.7) * canvas.height * 0.2; const r = 20 + Math.sin(timeRef.current * 0.8 + i) * 10; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.strokeStyle = `rgba(0,212,255,${(0.1 + Math.sin(timeRef.current + i) * 0.05) * intensity})`; ctx.shadowColor = '#00d4ff'; ctx.shadowBlur = 30 * intensity; ctx.lineWidth = 2; ctx.stroke(); ctx.shadowBlur = 0 }
      } else if (type === 'rings') {
        for (let i = 0; i < Math.round(6 * intensity); i++) { const r = 30 + (timeRef.current * 30) % (canvas.width * 0.4) + i * 20; const alpha = Math.max(0, 0.3 - r / (canvas.width * 0.6) * 0.3) * intensity; ctx.beginPath(); ctx.arc(canvas.width / 2, canvas.height / 2, r, 0, Math.PI * 2); ctx.strokeStyle = `rgba(168,85,247,${alpha})`; ctx.lineWidth = 1.5; ctx.stroke() }
      }
      animRef.current = requestAnimationFrame(draw)
    }
    animRef.current = requestAnimationFrame(draw)
    return () => { cancelAnimationFrame(animRef.current); window.removeEventListener('resize', resize) }
  }, [type])

  return <canvas ref={canvasRef} className="fixed inset-0 w-full h-full pointer-events-none z-30" />
}

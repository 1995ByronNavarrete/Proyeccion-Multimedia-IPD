import { useState, useEffect, useRef } from 'react'
import { MonitorOff, ImageIcon, ChevronLeft, ChevronRight, Download, Sparkles, ZoomIn, Play, Pause, Square } from 'lucide-react'
import type { ProjectedContent } from '../views/DashboardView'
import AnimSelectorModal from './shared/AnimSelectorModal'
import { ANIM_GROUPS } from '../constants'
import { useLang } from '../i18n'

interface ProjectionViewProps {
  onBlack: () => void
  backgroundUrl?: string | null
  projected?: ProjectedContent
  animation?: string
  onAnimationChange?: (anim: string) => void
  chapterVerses?: { text: string; reference: string }[]
  verseIdx?: number
  onPrevVerse?: () => void
  onNextVerse?: () => void
  overlayOpacity?: number
  fontSize?: number
  bgVideo?: { url: string | null; title: string; paused: boolean }
  onPause?: () => void
  onResume?: () => void
  onStop?: () => void
}

const allAnimations = ANIM_GROUPS.flatMap((g) => g.items)

const YT_CMD = (fn: string) => JSON.stringify({ event: 'command', func: fn, args: [] })

export default function ProjectionView({ onBlack, backgroundUrl, projected, animation, onAnimationChange, chapterVerses, verseIdx, onPrevVerse, onNextVerse, overlayOpacity: propOverlayOpacity = 80, fontSize: propFontSize = 48, bgVideo, onPause, onResume, onStop }: ProjectionViewProps) {
  const { t } = useLang()
  const [openAnim, setOpenAnim] = useState(false)
  const [overlay, setOverlay] = useState<{ type: string; speed?: number; color?: string } | null>(null)
  const overlayRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const [overlayOpacity, setOverlayOpacity] = useState(propOverlayOpacity)
  const [fontSize, setFontSize] = useState(propFontSize)
  const videoRef = useRef<HTMLVideoElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [ytKey, setYtKey] = useState(0)
  const lastUrlRef = useRef<string | null>(null)
  const [debug, setDebug] = useState(false)
  const [testResult, setTestResult] = useState<string[]>([])
  const testCount = useRef(0)

  const runSelfTest = () => {
    const results: string[] = []
    const id = ++testCount.current
    const ok = (msg: string) => results.push(`✓ ${msg}`)
    const fail = (msg: string) => results.push(`✗ ${msg}`)

    ok(`Test #${id} iniciado`)

    if (bgVideo?.url) {
      ok(`bgVideo.url: ${bgVideo.url.slice(0, 60)}...`)
      ok(`bgVideo.paused: ${bgVideo.paused}`)
      ok(`isYoutube: ${isYoutube}`)
      if (isYoutube) {
        ok(`iframeRef existe: ${!!iframeRef.current}`)
      } else {
        const v = videoRef.current
        ok(`videoRef existe: ${!!v}`)
        if (v) {
          ok(`video.src: ${v.src ? v.src.slice(0, 50) + '...' : '(vacio)'}`)
          ok(`video.paused: ${v.paused}`)
          ok(`video.readyState: ${v.readyState}`)
          ok(`lastUrlRef: ${lastUrlRef.current ? lastUrlRef.current.slice(0, 50) + '...' : '(null)'}`)
          ok(`urls coinciden: ${lastUrlRef.current === bgVideo.url}`)
        }
      }
      ok(`onPause existe: ${!!onPause}`)
      ok(`onResume existe: ${!!onResume}`)
      ok(`onStop existe: ${!!onStop}`)
    } else {
      ok(`Sin video activo (bgVideo.url es null)`)
    }

    ok(`Test #${id} completado (${results.length} checks)`)
    setTestResult(results)
    console.log(`[ProjectionView:test #${id}]`, results.join('\n'))
  }

  useEffect(() => {
    if (!debug) return
    console.log('[ProjectionView:debug] bgVideo.url:', bgVideo?.url)
    console.log('[ProjectionView:debug] bgVideo.paused:', bgVideo?.paused)
    console.log('[ProjectionView:debug] isYoutube:', isYoutube)
    console.log('[ProjectionView:debug] lastUrlRef:', lastUrlRef.current)
    console.log('[ProjectionView:debug] videoRef:', videoRef.current?.src)
    console.log('[ProjectionView:debug] iframeRef:', !!iframeRef.current)
  }, [bgVideo?.url, bgVideo?.paused, debug])

  useEffect(() => { setOverlayOpacity(propOverlayOpacity) }, [propOverlayOpacity])
  useEffect(() => { setFontSize(propFontSize) }, [propFontSize])

  useEffect(() => {
    const unsub = window.api.on('projector:overlay', (arg: unknown) => {
      const data = arg as { type?: string; speed?: number; color?: string }
      if (data?.type === 'none') setOverlay(null)
      else setOverlay({ type: data.type || 'particles', speed: data.speed || 1, color: data.color })
    })
    return () => unsub?.()
  }, [])

  // Mini overlay canvas preview
  useEffect(() => {
    const canvas = overlayRef.current
    if (!canvas || !overlay) return
    const ctx = canvas.getContext('2d')!
    canvas.width = canvas.parentElement?.clientWidth || 240
    canvas.height = canvas.parentElement?.clientHeight || 120
    let particles: any[] = []
    const count = Math.min(20, overlay.type === 'snow' ? 30 : overlay.type === 'fireflies' ? 10 : 15)
    let anim = 0

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const w = canvas.width; const h = canvas.height
      if (overlay.type === 'snow' || overlay.type === 'rain' || overlay.type === 'confetti') {
        while (particles.length < count) particles.push({ x: Math.random() * w, y: -5, vx: (Math.random() - 0.5) * 0.3, vy: overlay.type === 'rain' ? 3 + Math.random() * 2 : 0.3 + Math.random() * 0.5, size: overlay.type === 'rain' ? 1 : Math.random() * 1.5 + 0.5, life: 0 })
        for (let i = particles.length - 1; i >= 0; i--) { const p = particles[i]; p.x += p.vx; p.y += p.vy; if (p.y > h + 5) particles.splice(i, 1); else { ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fillStyle = overlay.type === 'rain' ? 'rgba(100,180,255,0.3)' : 'rgba(255,255,255,0.5)'; ctx.fill() } }
      } else if (overlay.type === 'fireflies') {
        while (particles.length < count) particles.push({ x: Math.random() * w, y: Math.random() * h, size: Math.random() * 2 + 1, life: 0 })
        for (let i = particles.length - 1; i >= 0; i--) { const p = particles[i]; p.x += Math.sin(anim * 0.02 + i) * 0.3; p.y += Math.cos(anim * 0.03 + i) * 0.3; const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3); g.addColorStop(0, `rgba(255,255,200,${0.3})`); g.addColorStop(1, 'rgba(255,255,200,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2); ctx.fill() }
      } else {
        while (particles.length < count) particles.push({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3, size: Math.random() * 1 + 0.3, life: 0 })
        for (let i = particles.length - 1; i >= 0; i--) { const p = particles[i]; p.x += p.vx; p.y += p.vy; if (p.x < 0 || p.x > w || p.y < 0 || p.y > h) particles.splice(i, 1); else { ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fill() } }
      }
      anim++
      animRef.current = requestAnimationFrame(draw)
    }
    animRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(animRef.current)
  }, [overlay])

  useEffect(() => {
    const unsub = window.api.on('projector:config', (arg: unknown) => {
      const cfg = arg as { overlayOpacity?: number; fontSize?: number }
      if (cfg.overlayOpacity != null) setOverlayOpacity(cfg.overlayOpacity)
      if (cfg.fontSize != null) setFontSize(cfg.fontSize)
    })
    return () => unsub?.()
  }, [])

  const isYoutube = bgVideo?.url != null && bgVideo.url.includes('youtube.com/embed')

  useEffect(() => {
    if (isYoutube) {
      if (!bgVideo?.url) return
      setYtKey((k) => k + 1)
      return
    }
    const v = videoRef.current
    if (!v) return
    if (!bgVideo?.url) { v.pause(); v.src = ''; lastUrlRef.current = null; return }
    if (bgVideo.url !== lastUrlRef.current) {
      lastUrlRef.current = bgVideo.url
      v.src = bgVideo.url
      v.play().catch(() => {})
    } else if (bgVideo.paused) {
      v.pause()
    } else {
      v.play().catch(() => {})
    }
  }, [bgVideo?.url, bgVideo?.paused, isYoutube])

  useEffect(() => {
    if (!isYoutube || !bgVideo?.url || !iframeRef.current?.contentWindow) return
    iframeRef.current.contentWindow.postMessage(YT_CMD(bgVideo.paused ? 'pauseVideo' : 'playVideo'), '*')
  }, [bgVideo?.paused, isYoutube])

  const isVerse = projected?.type === 'verse' && projected.text
  const activeAnim = animation || 'anim-fade'
  const hasNav = chapterVerses && chapterVerses.length > 1
  const currentLabel = allAnimations.find((a) => a.id === activeAnim)?.label || activeAnim
  const previewBg = backgroundUrl || projected?.backgroundUrl
  const previewText = projected?.text || 'Texto de muestra'
  const previewRef = projected?.reference || 'Referencia'

  const previewContainerRef = useRef<HTMLDivElement>(null)
  const previewTextRef = useRef<HTMLParagraphElement>(null)
  const previewRefRef = useRef<HTMLParagraphElement>(null)
  const [imgZoom, setImgZoom] = useState(1)
  const [imgPan, setImgPan] = useState({ x: 0, y: 0 })
  const dragging = useRef(false)
  const dragStart = useRef({ x: 0, y: 0 })
  const panStart = useRef({ x: 0, y: 0 })
  const imgPrevRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (projected?.type !== 'media' || !imgPrevRef.current) return
    const el = imgPrevRef.current
    const onWheel = (e: WheelEvent) => { e.preventDefault(); setImgZoom(z => Math.max(0.5, Math.min(10, z - e.deltaY * 0.003))) }
    el.addEventListener('wheel', onWheel, { passive: false })
    setImgZoom(1); setImgPan({ x: 0, y: 0 })
    window.api.projector.imageZoom({ zoom: 1, panX: 0, panY: 0 })
    return () => el.removeEventListener('wheel', onWheel)
  }, [projected?.mediaUrl])

  useEffect(() => {
    if (projected?.type !== 'media') return
    window.api.projector.imageZoom({ zoom: 1, panX: 0, panY: 0 })
  }, [projected?.mediaUrl])

  useEffect(() => {
    if (!isVerse) return
    const container = previewContainerRef.current
    const textEl = previewTextRef.current
    const refEl = previewRefRef.current
    if (!container || !textEl) return
    const fit = () => {
      const cw = container.clientWidth
      const ch = container.clientHeight
      if (!cw || !ch) return
      const maxW = cw * 0.95
      const maxH = ch * 0.92
      let size = Math.max(16, Math.min(ch * 0.28, cw * 0.09))
      textEl.style.fontSize = `${size}px`
      textEl.style.maxWidth = `${maxW}px`
      if (refEl) refEl.style.fontSize = `${Math.round(size * 0.35)}px`
      requestAnimationFrame(() => {
        if (textEl.scrollHeight <= maxH && textEl.scrollWidth <= maxW) return
        const scale = Math.min(maxH / textEl.scrollHeight, maxW / textEl.scrollWidth) * 0.9
        if (scale >= 1) return
        size = Math.max(8, size * scale)
        textEl.style.fontSize = `${size}px`
        if (refEl) refEl.style.fontSize = `${size * 0.35}px`
      })
    }
    const raf = requestAnimationFrame(fit)
    const ro = new ResizeObserver(fit)
    if (container.parentElement) ro.observe(container.parentElement)
    return () => { cancelAnimationFrame(raf); ro.disconnect() }
  }, [projected?.text, isVerse])

  const openModal = () => setOpenAnim(true)
  const closeModal = () => setOpenAnim(false)

  const downloadVerse = async () => {
    if (!projected?.text) return
    const res = await window.api.capture.projector()
    if (!res.success || !res.data) {
      console.error('Error al capturar proyector:', res.error)
      return
    }
    const link = document.createElement('a')
    link.href = `data:image/png;base64,${res.data.base64}`
    link.download = `verso-${(projected.reference || 'imagen').replace(/[:\s]/g, '-')}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="h-full bg-theme-panel border border-theme rounded-xl flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-theme">
        <h3 className="text-[10px] font-semibold text-theme-muted uppercase tracking-wider">{t('view.projection')}</h3>
        <div className="flex items-center gap-1.5 shrink-0">
          {hasNav && (
            <span className="text-[8px] text-theme-dim">
              {verseIdx! + 1}/{chapterVerses!.length}
            </span>
          )}
          {isVerse && (
            <button onClick={downloadVerse} className="p-1 hover:bg-white/5 rounded transition-colors" title="Descargar imagen">
              <Download size={12} className="text-theme-muted" />
            </button>
          )}
          <button onClick={() => {
            const c = document.createElement('canvas'); c.width = 400; c.height = 300
            const ctx = c.getContext('2d')!
            ctx.fillStyle = '#1a1a3e'; ctx.fillRect(0, 0, 400, 300)
            ctx.fillStyle = '#6c5ce7'; ctx.font = 'bold 28px sans-serif'; ctx.textAlign = 'center'
            ctx.fillText('Prueba Zoom', 200, 80)
            ctx.fillStyle = '#00d4ff'; ctx.font = '16px sans-serif'
            ctx.fillText('Usa la rueda o los botones + −', 200, 140)
            for (let i = 0; i < 20; i++) {
              ctx.fillStyle = ['#6c5ce7','#a855f7','#00d4ff','#22c55e','#f59e0b'][i % 5]
              ctx.fillRect(30 + i * 17, 180, 12, 60 + Math.sin(i) * 20)
            }
            window.api.projector.sendContent({ type: 'media', mediaUrl: c.toDataURL(), text: 'Test Zoom' })
            window.api.projector.projectToAll()
          }} className="p-1 hover:bg-white/5 rounded transition-colors" title="Probar zoom">
            <ZoomIn size={12} className="text-theme-muted" />
          </button>
          <button onClick={onBlack} className="p-1 hover:bg-white/5 rounded transition-colors" title={t('black.title')}>
            <MonitorOff size={12} className="text-theme-muted" />
          </button>
          <button onClick={() => { if (!debug) { setDebug(true); runSelfTest() } else setDebug(false) }}
            className={`p-1 rounded transition-colors ${debug ? 'bg-yellow-500/20 text-yellow-400' : 'hover:bg-white/5 text-theme-muted'}`} title="Diagnóstico video">
            <span className="text-[9px] font-mono">{debug ? 'DBG' : '⚡'}</span>
          </button>
        </div>
      </div>

      <div className="flex-1 m-2 rounded-lg overflow-hidden relative flex items-center justify-center">
        {overlay && <canvas ref={overlayRef} className="absolute inset-0 w-full h-full pointer-events-none z-10" />}
        {bgVideo?.url ? (
          <div className="w-full h-full bg-black rounded-lg overflow-hidden relative flex flex-col">
            <div className="flex-1 relative overflow-hidden">
              {isYoutube ? (
                <iframe ref={iframeRef} key={ytKey} src={bgVideo.url} className="w-full h-full pointer-events-none" data-volume="bg" allow="autoplay; fullscreen" allowFullScreen loading="lazy" />
              ) : (
                <video ref={videoRef} className="w-full h-full object-contain pointer-events-none will-change-transform" data-volume="bg" autoPlay playsInline preload="metadata"
                  onError={(e) => console.error('[ProjectionView] error:', (e.target as HTMLVideoElement).error?.message)} />
              )}
            </div>
            <div className="absolute bottom-0 left-0 right-0 z-20 flex items-center justify-center gap-3 py-2 bg-gradient-to-t from-black/60 to-transparent pointer-events-auto">
              <button onClick={bgVideo.paused ? onResume : onPause}
                className="p-2 bg-[#6c5ce7]/30 rounded-full text-[#6c5ce7] hover:bg-[#6c5ce7]/50 transition-colors" title={bgVideo.paused ? 'Reanudar' : 'Pausar'}>
                {bgVideo.paused ? <Play size={14} /> : <Pause size={14} />}
              </button>
              <button onClick={onStop}
                className="p-2 bg-red-600/30 rounded-full text-red-500 hover:bg-red-600/50 transition-colors" title="Detener">
                <Square size={14} />
              </button>
            </div>
          </div>
        ) : projected?.type === 'black' ? (
          <div className="text-center">
            <MonitorOff size={28} className="text-theme-dim mx-auto mb-2" />
            <p className="text-[10px] text-theme-dim">{t('black.title')}</p>
          </div>
        ) : projected?.type === 'media' && projected.mediaUrl?.startsWith('data:image') ? (
          <div ref={imgPrevRef} className="w-full h-full bg-black rounded-lg overflow-hidden relative"
            onMouseDown={e => { dragging.current = true; dragStart.current = { x: e.clientX, y: e.clientY }; panStart.current = { ...imgPan } }}
            onMouseMove={e => { if (!dragging.current) return; const dx = e.clientX - dragStart.current.x; const dy = e.clientY - dragStart.current.y; setImgPan({ x: panStart.current.x + dx, y: panStart.current.y + dy }) }}
            onMouseUp={() => { dragging.current = false }}
            onMouseLeave={() => { dragging.current = false }}>
            <img src={projected.mediaUrl} alt="" draggable={false}
              style={{ transform: `translate(${imgPan.x}px, ${imgPan.y}px) scale(${imgZoom})`, cursor: dragging.current ? 'grabbing' : 'grab' }}
              className="absolute inset-0 w-full h-full object-contain transition-transform duration-75" />
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 bg-black/70 backdrop-blur-sm px-2.5 py-1 rounded-full border border-white/10">
              <button onClick={() => setImgZoom(z => Math.max(0.5, z - 0.2))} className="w-5 h-5 flex items-center justify-center bg-white/10 rounded text-white/80 hover:bg-white/20 text-xs font-bold">−</button>
              <span className="text-[10px] text-white/80 min-w-[36px] text-center tabular-nums">{Math.round(imgZoom * 100)}%</span>
              <button onClick={() => setImgZoom(z => Math.min(10, z + 0.2))} className="w-5 h-5 flex items-center justify-center bg-white/10 rounded text-white/80 hover:bg-white/20 text-xs font-bold">+</button>
              <div className="w-px h-3 bg-white/20 mx-0.5" />
              <button onClick={() => { setImgZoom(1); setImgPan({ x: 0, y: 0 }) }} className="text-[9px] text-white/60 hover:text-white/90 px-1">Reset</button>
            </div>
          </div>
        ) : (backgroundUrl || projected?.backgroundUrl) || isVerse ? (
          <>
            {backgroundUrl && <img src={backgroundUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />}
            {projected?.backgroundUrl && <img src={projected.backgroundUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />}
            <div className="absolute inset-0" style={{ backgroundColor: `rgba(0,0,0,${(100 - overlayOpacity) / 100})` }} />
            {projected?.sermonTitle && (
              <div className="absolute top-1 right-2 z-10 text-right pointer-events-none">
                <p className="text-[10px] font-bold text-amber-400 drop-shadow-lg">{projected.sermonTitle}</p>
                {projected?.sermonPreacher && <p className="text-[7px] text-amber-400/70 drop-shadow-lg">{projected.sermonPreacher}</p>}
              </div>
            )}
            <div ref={previewContainerRef} className="relative text-center px-6 w-full max-h-full overflow-hidden">
              {isVerse ? (
                <div key={`${projected!.text}-${projected!.backgroundUrl}`} className="flex flex-col items-center justify-center w-full h-full">
                  {activeAnim.startsWith('anim-letter-') ? (
                    <p ref={previewTextRef} className={`font-bold text-white leading-tight drop-shadow-[0_3px_10px_rgba(0,0,0,0.95)] ${activeAnim}`}>
                      {projected?.text?.split('').map((char, i) => (
                        <span key={i} style={{ animationDelay: `${i * 0.045}s` }} className="inline-block">{char === ' ' ? '\u00A0' : char}</span>
                      ))}
                    </p>
                  ) : (
                    <p ref={previewTextRef} className={`font-bold text-white leading-tight drop-shadow-[0_3px_10px_rgba(0,0,0,0.95)] ${activeAnim} anim-delay-text`}>{projected!.text}</p>
                  )}
                  <p ref={previewRefRef} className={`text-white/70 mt-1 drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)] ${activeAnim} anim-delay-ref`}>— {projected?.reference}</p>
                </div>
              ) : (backgroundUrl || projected?.backgroundUrl) ? (
                <div>
                  <p className={`font-bold text-white leading-relaxed drop-shadow-[0_3px_10px_rgba(0,0,0,0.95)] ${activeAnim} anim-delay-text`}>Verso proyectado aquí</p>
                  <p className={`text-white/70 mt-2 drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)] ${activeAnim} anim-delay-ref`}>Selecciona un verso en la Biblia</p>
                </div>
              ) : null}
            </div>
          </>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#0a0e1e] via-[#0c1022] to-[#0a0e1e] flex items-center justify-center">
            <div className="text-center">
              <ImageIcon size={28} className="text-gray-700 mx-auto mb-2" />
              <p className="text-[10px] text-gray-600">{t('black.empty')}</p>
            </div>
          </div>
        )}

        {debug && testResult.length > 0 && (
          <div className="absolute inset-0 z-30 bg-black/80 overflow-auto pointer-events-none">
            <div className="p-2 font-mono text-[8px] leading-tight pointer-events-auto">
              <div className="flex items-center justify-between mb-1">
                <span className="text-yellow-400 font-bold text-[9px]">DIAGNÓSTICO VIDEO</span>
                <button onClick={runSelfTest} className="text-[8px] text-cyan-400 hover:text-cyan-300 px-1">Re-ejecutar</button>
              </div>
              <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-gray-300 mb-2">
                <span className="text-gray-500">bgVideo.url:</span><span className="text-cyan-300 break-all">{bgVideo?.url || '(null)'}</span>
                <span className="text-gray-500">bgVideo.paused:</span><span className={bgVideo?.paused ? 'text-yellow-300' : 'text-green-400'}>{String(bgVideo?.paused)}</span>
                <span className="text-gray-500">isYoutube:</span><span>{String(isYoutube)}</span>
                <span className="text-gray-500">videoRef:</span><span className="break-all">{videoRef.current ? `src: ${videoRef.current.src.slice(0, 40)}... paused:${videoRef.current.paused}` : '(sin ref)'}</span>
                <span className="text-gray-500">iframeRef:</span><span>{iframeRef.current ? 'presente' : 'ausente'}</span>
                <span className="text-gray-500">lastUrlRef:</span><span className="break-all">{lastUrlRef.current || '(null)'}</span>
                <span className="text-gray-500">onPause/Resume/Stop:</span><span>{[!!onPause, !!onResume, !!onStop].map(Boolean).join('/')}</span>
              </div>
              {testResult.map((r, i) => (
                <div key={i} className={`${r.startsWith('✓') ? 'text-green-400' : r.startsWith('✗') ? 'text-red-400' : 'text-gray-500'}`}>{r}</div>
              ))}
            </div>
          </div>
        )}
      </div>

      {hasNav && (
        <div className="flex items-center gap-2 px-2 pb-2">
          <button onClick={onPrevVerse} disabled={verseIdx === 0}
            className="flex items-center justify-center gap-1 px-3 py-1 bg-theme-card rounded text-[9px] text-theme hover:bg-[#6c5ce7]/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
            <ChevronLeft size={10} /> Previous
          </button>
          <div className="flex-1 text-center">
            <span className="text-[8px] text-theme-dim">← flechas del teclado →</span>
          </div>
          <button onClick={onNextVerse} disabled={verseIdx === (chapterVerses?.length ?? 0) - 1}
            className="flex items-center justify-center gap-1 px-3 py-1 bg-theme-card rounded text-[9px] text-theme hover:bg-[#6c5ce7]/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
            Next <ChevronRight size={10} />
          </button>
        </div>
      )}

      <div className="flex items-center gap-2 px-3 py-2 border-t border-theme">
        <span className="text-[9px] text-theme-dim shrink-0">Animation:</span>
        <button onClick={openModal}
          className="flex-1 flex items-center justify-between gap-1 text-[9px] bg-theme-card text-theme-dim px-2 py-1 rounded border border-theme outline-none hover:border-[#6c5ce7]/50 transition-colors">
          <span className="truncate">{currentLabel}</span>
          <Sparkles size={10} className="shrink-0 text-[#6c5ce7]" />
        </button>
      </div>

      <AnimSelectorModal
        open={openAnim}
        onClose={closeModal}
        onSave={(animId) => onAnimationChange?.(animId)}
        currentAnim={activeAnim}
        title="Animation Effects"
        previewText={previewText}
        previewRef={previewRef}
        previewBg={previewBg || undefined}
      />
    </div>
  )
}



import { useState, useEffect, useRef } from 'react'
import { MonitorOff, ImageIcon, ChevronLeft, ChevronRight, Download, Sparkles } from 'lucide-react'
import type { ProjectedContent } from '../views/DashboardView'
import AnimSelectorModal from './shared/AnimSelectorModal'
import { ANIM_GROUPS } from '../constants'

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
  logoSrc?: string | null
  headerTitle?: string
  headerSub?: string
}

const allAnimations = ANIM_GROUPS.flatMap((g) => g.items)

export default function ProjectionView({ onBlack, backgroundUrl, projected, animation, onAnimationChange, chapterVerses, verseIdx, onPrevVerse, onNextVerse, logoSrc, headerTitle, headerSub }: ProjectionViewProps) {
  const [openAnim, setOpenAnim] = useState(false)
  const [overlay, setOverlay] = useState<{ type: string; speed?: number; color?: string } | null>(null)
  const overlayRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)

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
  const isVerse = projected?.type === 'verse' && projected.text
  const activeAnim = animation || 'anim-fade'
  const hasNav = chapterVerses && chapterVerses.length > 1
  const currentLabel = allAnimations.find((a) => a.id === activeAnim)?.label || activeAnim
  const previewBg = backgroundUrl || projected?.backgroundUrl
  const previewText = projected?.text || 'Texto de muestra'
  const previewRef = projected?.reference || 'Referencia'

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
        <h3 className="text-[10px] font-semibold text-theme-muted uppercase tracking-wider">Vista Proyección</h3>
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
          <button onClick={onBlack} className="p-1 hover:bg-white/5 rounded transition-colors" title="Pantalla negra">
            <MonitorOff size={12} className="text-theme-muted" />
          </button>
        </div>
      </div>

      <div className="flex-1 m-2 rounded-lg overflow-hidden relative flex items-center justify-center">
        {overlay && <canvas ref={overlayRef} className="absolute inset-0 w-full h-full pointer-events-none z-10" />}
        {projected?.type === 'black' ? (
          <div className="text-center">
            <MonitorOff size={28} className="text-theme-dim mx-auto mb-2" />
            <p className="text-[10px] text-theme-dim">Pantalla negra</p>
          </div>
        ) : (backgroundUrl || projected?.backgroundUrl) || isVerse ? (
          <>
            {backgroundUrl && <img src={backgroundUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />}
            {projected?.backgroundUrl && <img src={projected.backgroundUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />}
            <div className="absolute inset-0 bg-black/50" />
            <div className="absolute top-1 left-2 z-10 flex items-center gap-1.5 pointer-events-none">
              {logoSrc && <img src={logoSrc} alt="" className="h-6 w-auto object-contain" />}
              {(headerTitle || headerSub) && (
                <div>
                  <p className="text-[8px] font-bold text-white drop-shadow-lg">{headerTitle || 'SOFTWARE PREMIUM'}</p>
                  {headerSub && <p className="text-[6px] text-white/60 drop-shadow-lg -mt-0.5">{headerSub}</p>}
                </div>
              )}
            </div>
            {projected?.sermonTitle && (
              <div className="absolute top-1 right-2 z-10 text-right pointer-events-none">
                <p className="text-[10px] font-bold text-amber-400 drop-shadow-lg">{projected.sermonTitle}</p>
                {projected?.sermonPreacher && <p className="text-[7px] text-amber-400/70 drop-shadow-lg">{projected.sermonPreacher}</p>}
              </div>
            )}
            <div className="relative text-center px-6">
              {isVerse ? (
                <div key={`${projected!.text}-${projected!.backgroundUrl}`} className="px-2">
                  {activeAnim.startsWith('anim-letter-') ? (
                    <p className={`text-[10px] font-bold text-white leading-relaxed drop-shadow-[0_3px_10px_rgba(0,0,0,0.95)] ${activeAnim}`}>
                      {projected?.text?.split('').map((char, i) => (
                        <span key={i} style={{ animationDelay: `${i * 0.045}s` }} className="inline-block">{char === ' ' ? '\u00A0' : char}</span>
                      ))}
                    </p>
                  ) : (
                    <p className={`text-[10px] font-bold text-white leading-relaxed drop-shadow-[0_3px_10px_rgba(0,0,0,0.95)] ${activeAnim} anim-delay-text`}>{projected!.text}</p>
                  )}
                  <p className={`text-[9px] text-white/70 mt-2 drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)] ${activeAnim} anim-delay-ref`}>— {projected?.reference}</p>
                </div>
              ) : (backgroundUrl || projected?.backgroundUrl) ? (
                <div>
                  <p className={`text-sm font-bold text-white leading-relaxed drop-shadow-[0_3px_10px_rgba(0,0,0,0.95)] ${activeAnim} anim-delay-text`}>Verso proyectado aquí</p>
                  <p className={`text-[11px] text-white/70 mt-4 drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)] ${activeAnim} anim-delay-ref`}>Selecciona un verso en la Biblia</p>
                </div>
              ) : null}
            </div>
          </>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#0a0e1e] via-[#0c1022] to-[#0a0e1e] flex items-center justify-center">
            <div className="text-center">
              <ImageIcon size={28} className="text-gray-700 mx-auto mb-2" />
              <p className="text-[10px] text-gray-600">Sin contenido proyectado</p>
            </div>
          </div>
        )}
      </div>

      {hasNav && (
        <div className="flex items-center gap-2 px-2 pb-2">
          <button onClick={onPrevVerse} disabled={verseIdx === 0}
            className="flex items-center justify-center gap-1 px-3 py-1 bg-theme-card rounded text-[9px] text-theme hover:bg-[#6c5ce7]/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
            <ChevronLeft size={10} /> Anterior
          </button>
          <div className="flex-1 text-center">
            <span className="text-[8px] text-theme-dim">← flechas del teclado →</span>
          </div>
          <button onClick={onNextVerse} disabled={verseIdx === (chapterVerses?.length ?? 0) - 1}
            className="flex items-center justify-center gap-1 px-3 py-1 bg-theme-card rounded text-[9px] text-theme hover:bg-[#6c5ce7]/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
            Siguiente <ChevronRight size={10} />
          </button>
        </div>
      )}

      <div className="flex items-center gap-2 px-3 py-2 border-t border-theme">
        <span className="text-[9px] text-theme-dim shrink-0">Animación:</span>
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
        title="Efectos de Animación"
        previewText={previewText}
        previewRef={previewRef}
        previewBg={previewBg || undefined}
      />
    </div>
  )
}



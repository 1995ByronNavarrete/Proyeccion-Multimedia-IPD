import { useRef, useEffect } from 'react'
import type { ProjectedContent } from '../../views/DashboardView'

interface VerseDisplayProps {
  projected?: ProjectedContent
  backgroundUrl?: string | null
  animation?: string
  overlayOpacity?: number
}

export default function VerseDisplay({ projected, backgroundUrl, animation, overlayOpacity = 80 }: VerseDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLParagraphElement>(null)
  const refRef = useRef<HTMLParagraphElement>(null)

  const isVerse = projected?.type === 'verse' && projected.text
  const activeAnim = animation || 'anim-fade'
  const showBg = projected?.backgroundUrl || backgroundUrl

  useEffect(() => {
    if (!isVerse || !containerRef.current || !textRef.current) return
    const container = containerRef.current
    const textEl = textRef.current
    const refEl = refRef.current
    let cancelled = false

    const fit = () => {
      if (cancelled) return
      const cw = container.clientWidth
      const ch = container.clientHeight
      if (!cw || !ch) return
      const padPct = 0.88
      const maxW = cw * 0.92
      const maxH = ch * padPct

      // Start big and scale down if needed
      let size = Math.max(24, Math.round(ch * 0.22))
      textEl.style.fontSize = `${size}px`
      textEl.style.maxWidth = `${maxW}px`
      if (refEl) refEl.style.fontSize = `${Math.round(size * 0.45)}px`

      requestAnimationFrame(() => {
        if (cancelled) return
        const oh = textEl.scrollHeight
        const ow = textEl.scrollWidth
        if (oh <= maxH && ow <= maxW) return
        const scale = Math.min(maxH / oh, maxW / ow) * 0.92
        size = Math.max(12, Math.round(size * scale))
        textEl.style.fontSize = `${size}px`
        if (refEl) refEl.style.fontSize = `${Math.round(size * 0.45)}px`
      })
    }

    const raf = requestAnimationFrame(fit)
    const ro = new ResizeObserver(fit)
    if (container.parentElement) ro.observe(container.parentElement)
    return () => { cancelled = true; cancelAnimationFrame(raf); ro.disconnect() }
  }, [projected?.text, isVerse])

  return (
    <div className="w-full h-full relative overflow-hidden">
      {(showBg || isVerse) && (
        <>
          {showBg && <img src={showBg} alt="" className="absolute inset-0 w-full h-full object-cover" />}
          <div className="absolute inset-0" style={{ backgroundColor: `rgba(0,0,0,${(100 - overlayOpacity) / 100})` }} />
          {projected?.sermonTitle && (
            <div className="absolute top-2 right-3 z-10 text-right pointer-events-none overflow-hidden left-3">
              <p className="font-bold text-amber-400 drop-shadow-lg truncate" style={{ fontSize: 'clamp(10px, 2vw, 18px)' }}>{projected.sermonTitle}</p>
              {projected?.sermonPreacher && <p className="text-amber-400/70 truncate" style={{ fontSize: 'clamp(8px, 1.5vw, 14px)' }}>{projected.sermonPreacher}</p>}
            </div>
          )}
          <div ref={containerRef} className="absolute inset-0 flex items-center justify-center px-[5%] py-[3%] overflow-hidden">
            {isVerse ? (
              <div key={`${projected!.text}-${projected!.backgroundUrl}`} className="flex flex-col items-center justify-center w-full h-full text-center">
                {activeAnim.startsWith('anim-letter-') ? (
                  <p ref={textRef} className={`font-bold text-white leading-tight drop-shadow-[0_4px_20px_rgba(0,0,0,0.95)] ${activeAnim}`}>
                    {projected?.text?.split('').map((char, i) => (
                      <span key={i} style={{ animationDelay: `${i * 0.045}s` }} className="inline-block">{char === ' ' ? '\u00A0' : char}</span>
                    ))}
                  </p>
                ) : (
                  <p ref={textRef} className={`font-bold text-white leading-tight drop-shadow-[0_4px_20px_rgba(0,0,0,0.95)] ${activeAnim} anim-delay-text`}>{projected!.text}</p>
                )}
                <p ref={refRef} className={`text-white/70 drop-shadow-[0_2px_10px_rgba(0,0,0,0.95)] ${activeAnim} anim-delay-ref`} style={{ marginTop: '0.3em' }}>— {projected?.reference}</p>
              </div>
            ) : showBg ? (
              <div className="text-center">
                <p className={`font-bold text-white leading-relaxed drop-shadow-[0_3px_10px_rgba(0,0,0,0.95)] ${activeAnim} anim-delay-text`}>Verso proyectado aquí</p>
                <p className={`text-white/70 mt-2 drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)] ${activeAnim} anim-delay-ref`}>Selecciona un verso en la Biblia</p>
              </div>
            ) : null}
          </div>
        </>
      )}
    </div>
  )
}

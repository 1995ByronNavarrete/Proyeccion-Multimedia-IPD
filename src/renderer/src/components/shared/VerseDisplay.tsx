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
  const fittingRef = useRef(false)

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
      if (cancelled || fittingRef.current) return
      fittingRef.current = true

      const cw = container.clientWidth
      const ch = container.clientHeight
      if (!cw || !ch) { fittingRef.current = false; return }
      const maxW = cw * 0.92
      const maxH = ch * 0.88

      // Measure reference height at a small size first
      if (refEl) refEl.style.fontSize = '12px'
      const refH = refEl ? refEl.scrollHeight + 4 : 0
      const availH = maxH - refH

      // Binary search for best font size
      let lo = 10, hi = 500, best = 10

      while (lo <= hi) {
        const mid = Math.round((lo + hi) / 2)
        textEl.style.fontSize = `${mid}px`
        textEl.style.maxWidth = `${maxW}px`
        if (refEl) refEl.style.fontSize = `${Math.round(mid * 0.45)}px`
        // Force layout read
        const oh = textEl.scrollHeight
        const ow = textEl.scrollWidth
        if (oh <= availH && ow <= maxW) {
          best = mid
          lo = mid + 1
        } else {
          hi = mid - 1
        }
      }

      // Apply best size
      textEl.style.fontSize = `${best}px`
      textEl.style.maxWidth = `${maxW}px`
      if (refEl) refEl.style.fontSize = `${Math.round(best * 0.45)}px`
      fittingRef.current = false
    }

    // Use requestIdleCallback if available, else rAF
    const raf = requestAnimationFrame(fit)
    const ro = new ResizeObserver(() => { if (!fittingRef.current) requestAnimationFrame(fit) })
    if (container.parentElement) ro.observe(container.parentElement)
    return () => { cancelled = true; if (raf) cancelAnimationFrame(raf); ro.disconnect(); fittingRef.current = false }
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
          <div ref={containerRef} className="absolute inset-0 flex items-center justify-center px-[4%] py-[2%] overflow-hidden">
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

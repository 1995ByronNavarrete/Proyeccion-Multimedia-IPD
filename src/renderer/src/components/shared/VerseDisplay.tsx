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
    if (!isVerse || !textRef.current) return
    const textEl = textRef.current
    const refEl = refRef.current
    let cancelled = false

    const fit = () => {
      if (cancelled) return

      const vw = window.innerWidth
      const vh = window.innerHeight
      if (!vw || !vh) return
      const maxW = vw * 0.94
      const maxH = vh * 0.88

      let lo = 10, hi = 600, best = 10

      while (lo <= hi) {
        const mid = Math.round((lo + hi) / 2)
        textEl.style.fontSize = `${mid}px`
        textEl.style.maxWidth = `${maxW}px`
        if (refEl) refEl.style.fontSize = `${Math.round(mid * 0.45)}px`
        const textH = textEl.scrollHeight
        const refH = refEl ? refEl.scrollHeight : 0
        const ow = textEl.scrollWidth
        if ((textH + refH * 1.2) <= maxH && ow <= maxW) {
          best = mid
          lo = mid + 1
        } else {
          hi = mid - 1
        }
      }

      textEl.style.fontSize = `${best}px`
      textEl.style.maxWidth = `${maxW}px`
      if (refEl) refEl.style.fontSize = `${Math.round(best * 0.45)}px`
    }

    fit()
    window.addEventListener('resize', fit)
    return () => { cancelled = true; window.removeEventListener('resize', fit) }
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
          <div ref={containerRef} className="absolute inset-0 flex items-center justify-center px-[3%] py-[1.5%] overflow-hidden">
            {isVerse ? (
              <div key={projected!.text} className="flex flex-col items-center justify-center w-full h-full text-center">
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

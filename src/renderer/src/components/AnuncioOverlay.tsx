interface AnuncioOverlayProps {
  text: string
  animIn: string
  animOut: string
  bg: string
  bgAnimIn: string
  bgAnimOut: string
  size: string
  font: string
  color: string
  exiting: boolean
}

export default function AnuncioOverlay({ text, animIn, animOut, bg, bgAnimIn, bgAnimOut, size, font, color, exiting }: AnuncioOverlayProps) {
  if (!text) return null
  const animClass = exiting ? animOut : animIn
  const bgAnimClass = exiting ? bgAnimOut : bgAnimIn

  return (
    <div className={`absolute bottom-0 left-0 right-0 z-30 overflow-hidden ${bgAnimClass}`}>
      <div className={`relative ${bg} ${bg === 'anuncio-bg-neon' ? 'rounded-t-2xl mx-2' : ''}`}>
        <div className="relative px-8 py-6">
          <div className="text-center">
            {animClass.startsWith('letra-') ? (
              <p className={`${size} ${font} ${color} drop-shadow-[0_4px_20px_rgba(0,0,0,0.8)] leading-tight ${animClass}`}>
                {text.split('').map((char, i) => (
                  <span key={i} style={{ animationDelay: `${i * (exiting ? 0.025 : 0.035)}s` }} className="inline-block">{char === ' ' ? '\u00A0' : char}</span>
                ))}
              </p>
            ) : (
              <p className={`${size} ${font} ${color} drop-shadow-[0_4px_20px_rgba(0,0,0,0.8)] leading-tight ${animClass}`}>{text}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

import { useState, useRef, useEffect } from 'react'
import { Sparkles, Snowflake, Bug, PartyPopper, CircleDot, Droplets, Heart, Cloud, Zap, Star, Square, Diamond, Globe, Settings, X, Ban, Waves, Radio, Sun, Rows } from 'lucide-react'
import { useLang } from '../i18n'

const FX_LIST = [
  { id: 'particles', label: 'Partículas', icon: Sparkles, color: '#ffffff' },
  { id: 'snow', label: 'Nieve', icon: Snowflake, color: '#00d4ff' },
  { id: 'fireflies', label: 'Luciérnagas', icon: Bug, color: '#fbbf24' },
  { id: 'confetti', label: 'Confeti', icon: PartyPopper, color: '#a855f7' },
  { id: 'bubbles', label: 'Burbujas', icon: CircleDot, color: '#6c5ce7' },
  { id: 'rain', label: 'Lluvia', icon: Droplets, color: '#3b82f6' },
  { id: 'hearts', label: 'Corazones', icon: Heart, color: '#ef4444' },
  { id: 'smoke', label: 'Humo', icon: Cloud, color: '#9ca3af' },
  { id: 'fireworks', label: 'Fuegos artificiales', icon: Zap, color: '#f59e0b' },
  { id: 'glitter', label: 'Brillantina', icon: Star, color: '#ec4899' },
  { id: 'matrix', label: 'Matrix', icon: Square, color: '#22c55e' },
  { id: 'neon', label: 'Neón', icon: Diamond, color: '#00d4ff' },
  { id: 'rings', label: 'Anillos', icon: Globe, color: '#a855f7' },
  { id: 'waves', label: 'Olas', icon: Waves, color: '#3b82f6' },
  { id: 'pulse', label: 'Pulso', icon: Radio, color: '#6c5ce7' },
  { id: 'stars', label: 'Estrellas', icon: Sun, color: '#fbbf24' },
  { id: 'ripple', label: 'Ondas', icon: Rows, color: '#22c55e' },
  { id: 'combi', label: 'Combinado', icon: CircleDot, color: '#a855f7' },
]

export default function EffectsPanel() {
  const { t } = useLang()
  const [active, setActive] = useState<string | null>(null)
  const [showConfig, setShowConfig] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [intensity, setIntensity] = useState(50)
  const [count, setCount] = useState(50)
  const updateTimer = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    return () => { if (updateTimer.current) clearTimeout(updateTimer.current) }
  }, [])

  const sendOverlay = (id: string, sp: number, col: string) => {
    if (updateTimer.current) clearTimeout(updateTimer.current)
    updateTimer.current = setTimeout(() => {
      window.api.projector.overlay({ type: id, speed: sp, color: col })
    }, 50)
  }

  const applyEffect = (id: string) => {
    const next = active === id ? null : id
    setActive(next)
    if (next) sendOverlay(next, speed, `intensity:${intensity}:count:${count}`)
    else window.api.projector.overlay({ type: 'none' })
  }

  return (
    <div className="h-full bg-theme-panel border border-theme rounded-xl flex flex-col overflow-hidden">
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 border-b border-theme shrink-0">
        <Sparkles size={10} className="text-[#6c5ce7]" />
        <h3 className="text-[9px] font-semibold text-theme flex-1 tracking-wide">{t('effects.title')}</h3>
        {active && (
          <div className="flex items-center gap-1">
            <span className="text-[7px] text-green-400 font-medium">{t('effects.' + active)}</span>
            <span className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
          </div>
        )}
        <div className="relative">
          <button onClick={() => setShowConfig(!showConfig)}
            className="p-1 hover:bg-white/10 rounded-lg transition-colors" title={t('effects.config')}>
            <Settings size={9} className="text-theme-dim hover:text-theme" />
          </button>
          {showConfig && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowConfig(false)} />
              <div className="absolute top-full right-0 mt-1 z-40 w-52 bg-[rgba(10,14,30,0.98)] border border-[rgba(120,80,255,0.25)] rounded-xl shadow-2xl shadow-black/50 p-2.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[8px] text-theme-dim font-semibold">{t('effects.configTitle')}</span>
                  <button onClick={() => setShowConfig(false)}><X size={8} className="text-theme-dim" /></button>
                </div>
                <div>
                  <span className="text-[7px] text-theme-dim">{t('effects.speed')}: {speed}x</span>
                  <input type="range" min={0.3} max={3} step={0.1} value={speed}
                    onChange={e => { const v = Number(e.target.value); setSpeed(v); if (active) sendOverlay(active, v, `intensity:${intensity}:count:${count}`) }}
                    className="w-full h-0.5 rounded-full appearance-none bg-white/10 accent-[#6c5ce7] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#6c5ce7]" />
                </div>
                <div>
                  <span className="text-[7px] text-theme-dim">{t('effects.intensity')}: {intensity}%</span>
                  <input type="range" min={10} max={100} value={intensity}
                    onChange={e => { const v = Number(e.target.value); setIntensity(v); if (active) sendOverlay(active, speed, `intensity:${v}:count:${count}`) }}
                    className="w-full h-0.5 rounded-full appearance-none bg-white/10 accent-[#6c5ce7] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#6c5ce7]" />
                </div>
                <div>
                  <span className="text-[7px] text-theme-dim">{t('effects.quantity')}: {count}</span>
                  <input type="range" min={10} max={150} value={count}
                    onChange={e => { const v = Number(e.target.value); setCount(v); if (active) sendOverlay(active, speed, `intensity:${intensity}:count:${v}`) }}
                    className="w-full h-0.5 rounded-full appearance-none bg-white/10 accent-[#6c5ce7] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#6c5ce7]" />
                </div>
              </div>
            </>
          )}
        </div>
        {active && (
          <button onClick={() => { setActive(null); window.api.projector.overlay({ type: 'none' }) }}
            className="p-1 hover:bg-red-500/20 rounded-lg transition-colors" title={t('effects.remove')}>
            <Ban size={8} className="text-red-400" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-1.5">
        <div className="flex flex-wrap gap-1">
          {FX_LIST.map(fx => {
            const isActive = active === fx.id
            return (
              <button key={fx.id} onClick={() => applyEffect(fx.id)}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-lg transition-all text-[9px] font-medium ${
                  isActive
                    ? 'bg-[#6c5ce7]/20 text-[#6c5ce7] ring-1 ring-[#6c5ce7]/50 shadow-sm shadow-[#6c5ce7]/10'
                    : 'bg-white/[0.04] text-theme-dim hover:bg-white/[0.08] hover:text-theme'
                }`}>
                <fx.icon size={9} style={{ color: fx.color }} />
                <span>{t('effects.' + fx.id)}</span>
                {isActive && <span className="w-1 h-1 rounded-full bg-green-500 animate-pulse ml-0.5" />}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

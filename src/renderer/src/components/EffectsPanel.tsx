import { useState, useRef } from 'react'
import { Sparkles, Snowflake, Bug, PartyPopper, CircleDot, Droplets, Heart, Cloud, Zap, Star, Square, Diamond, Globe, Settings, X, Ban, Waves, Radio, Sun, Rows } from 'lucide-react'

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
  const [active, setActive] = useState<string | null>(null)
  const [showConfig, setShowConfig] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [intensity, setIntensity] = useState(50)
  const [count, setCount] = useState(50)
  const updateTimer = useRef<ReturnType<typeof setTimeout>>()
  const configRef = useRef<HTMLDivElement>(null)

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

  const clearEffect = () => {
    setActive(null)
    window.api.projector.overlay({ type: 'none' })
  }

  return (
    <div className="h-full bg-gradient-to-b from-theme-panel to-[rgba(8,12,30,0.9)] border border-theme rounded-xl flex flex-col overflow-hidden shadow-lg shadow-black/20">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-theme shrink-0 bg-gradient-to-r from-[#6c5ce7]/10 via-[#6c5ce7]/5 to-transparent">
        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#6c5ce7] to-[#a855f7] flex items-center justify-center shadow-lg shadow-[#6c5ce7]/20">
          <Sparkles size={11} className="text-white" />
        </div>
        <h3 className="text-[10px] font-bold text-theme flex-1 tracking-wide">Efectos</h3>
        <div className="relative" ref={configRef}>
          <button onClick={() => setShowConfig(!showConfig)}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors" title="Configurar efectos">
            <Settings size={11} className="text-theme-dim hover:text-theme" />
          </button>
          {showConfig && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowConfig(false)} />
              <div className="absolute top-full right-0 mt-1 z-40 w-56 bg-[rgba(10,14,30,0.98)] border border-[rgba(120,80,255,0.25)] rounded-xl shadow-2xl shadow-black/50 p-3 space-y-2.5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] text-theme-dim font-semibold">Configuración global</span>
                  <button onClick={() => setShowConfig(false)}><X size={10} className="text-theme-dim" /></button>
                </div>
                <div>
                  <span className="text-[8px] text-theme-dim">Velocidad: {speed}x</span>
                  <input type="range" min={0.3} max={3} step={0.1} value={speed}
                    onChange={e => { const v = Number(e.target.value); setSpeed(v); if (active) sendOverlay(active, v, `intensity:${intensity}:count:${count}`) }}
                    className="w-full h-1 rounded-full appearance-none bg-white/10 accent-[#6c5ce7] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#6c5ce7]" />
                </div>
                <div>
                  <span className="text-[8px] text-theme-dim">Intensidad: {intensity}%</span>
                  <input type="range" min={10} max={100} value={intensity}
                    onChange={e => { const v = Number(e.target.value); setIntensity(v); if (active) sendOverlay(active, speed, `intensity:${v}:count:${count}`) }}
                    className="w-full h-1 rounded-full appearance-none bg-white/10 accent-[#6c5ce7] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#6c5ce7]" />
                </div>
                <div>
                  <span className="text-[8px] text-theme-dim">Cantidad: {count}</span>
                  <input type="range" min={10} max={150} value={count}
                    onChange={e => { const v = Number(e.target.value); setCount(v); if (active) sendOverlay(active, speed, `intensity:${intensity}:count:${v}`) }}
                    className="w-full h-1 rounded-full appearance-none bg-white/10 accent-[#6c5ce7] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#6c5ce7]" />
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-1.5">
        <div className="grid grid-cols-3 gap-1.5">
          {FX_LIST.map(fx => (
            <button key={fx.id} onClick={() => applyEffect(fx.id)}
              className={`flex flex-col items-center gap-1 px-1 py-2 rounded-xl transition-all duration-200 ${
                active === fx.id
                  ? 'bg-gradient-to-b from-[#6c5ce7]/25 to-[#a855f7]/10 ring-1 ring-[#6c5ce7]/50 text-white shadow-lg shadow-[#6c5ce7]/10 scale-[1.02]'
                  : 'bg-white/5 text-theme-dim hover:bg-white/10 hover:text-theme'
              }`}>
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${active === fx.id ? 'bg-[#6c5ce7]/30' : 'bg-white/5'}`}>
                <fx.icon size={11} style={{ color: fx.color }} />
              </div>
              <span className="text-[7px] font-medium text-center leading-tight">{fx.label}</span>
              {active === fx.id && <span className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />}
            </button>
          ))}
        </div>
      </div>

      {active && (
        <div className="px-2 pb-1.5 shrink-0">
          <button onClick={clearEffect}
            className="w-full flex items-center justify-center gap-1 py-1 text-[7px] bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-all">
            <Ban size={8} /> Quitar efecto
          </button>
        </div>
      )}
    </div>
  )
}

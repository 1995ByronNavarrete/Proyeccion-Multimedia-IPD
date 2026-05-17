import { useState, useEffect, useRef } from 'react'
import { Sparkles, Snowflake, Bug, PartyPopper, CircleDot, Waves, Wind, Ban, Droplets, Heart, Cloud, Zap, Star, Diamond, Square, Globe } from 'lucide-react'

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
]

export default function EffectsPanel() {
  const [active, setActive] = useState<string | null>('particles')

  useEffect(() => {
    const t = setTimeout(() => {
      window.api.projector.overlay({ type: 'particles', speed, color: `intensity:${intensity}:count:${count}` })
    }, 1500)
    return () => clearTimeout(t)
  }, [])
  const [speed, setSpeed] = useState(1)
  const [intensity, setIntensity] = useState(50)
  const [count, setCount] = useState(50)
  const [size, setSize] = useState(50)
  const updateTimer = useRef<ReturnType<typeof setTimeout>>()

  const sendOverlay = (id: string, sp: number, col: string) => {
    if (updateTimer.current) clearTimeout(updateTimer.current)
    updateTimer.current = setTimeout(() => {
      window.api.projector.overlay({ type: id, speed: sp, color: col })
    }, 50)
  }

  const applyEffect = (id: string) => {
    setActive(id)
    sendOverlay(id, speed, `intensity:${intensity}:count:${count}:size:${size}`)
  }

  const clearEffect = () => {
    setActive(null)
    window.api.projector.overlay({ type: 'none' })
  }

  return (
    <div className="h-full bg-gradient-to-b from-theme-panel to-[rgba(8,12,30,0.9)] border border-theme rounded-xl flex flex-col overflow-hidden shadow-lg shadow-black/20">
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-theme shrink-0 bg-gradient-to-r from-[#6c5ce7]/10 via-[#6c5ce7]/5 to-transparent">
        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#6c5ce7] to-[#a855f7] flex items-center justify-center shadow-lg shadow-[#6c5ce7]/20">
          <Sparkles size={11} className="text-white" />
        </div>
        <h3 className="text-[10px] font-bold text-theme flex-1 tracking-wide">Efectos</h3>
        {active != null && (
          <button onClick={clearEffect} className="text-[8px] px-2 py-1 bg-red-500/15 text-red-400 rounded-lg hover:bg-red-500/25 transition-all flex items-center gap-1">
            <Ban size={9} /> Quitar
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {FX_LIST.map(fx => (
          <button key={fx.id} onClick={() => applyEffect(fx.id)}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all duration-200 text-[10px] ${
              active === fx.id
                ? 'bg-gradient-to-r from-[#6c5ce7]/20 to-[#a855f7]/10 ring-1 ring-[#6c5ce7]/50 text-white shadow-lg shadow-[#6c5ce7]/10'
                : 'bg-white/5 text-theme-dim hover:bg-white/10 hover:text-theme hover:shadow-sm'
            }`}>
            <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${active === fx.id ? 'bg-[#6c5ce7]/30' : 'bg-white/5'}`}>
              <fx.icon size={11} style={{ color: fx.color }} />
            </div>
            <span className="font-medium tracking-wide">{fx.label}</span>
            {active === fx.id && (
              <span className="ml-auto flex items-center gap-1 text-[8px] text-green-400 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> ACTIVO
              </span>
            )}
          </button>
        ))}
      </div>

      {active != null && (
        <div className="px-3 pb-3 space-y-2 border-t border-theme pt-2 bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <span className="text-[8px] text-theme-dim font-medium w-12">Velocidad</span>
            <input type="range" min={0.3} max={3} step={0.1} value={speed}
              onChange={e => { const v = Number(e.target.value); setSpeed(v); applyEffect(active) }}
              className="flex-1 h-1 rounded-full appearance-none bg-white/10 accent-[#6c5ce7] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#6c5ce7] [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-[#6c5ce7]/50" />
            <span className="text-[8px] text-theme-dim font-mono w-6 text-right">{speed}x</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[8px] text-theme-dim font-medium w-12">Intensidad</span>
            <input type="range" min={10} max={100} value={intensity}
              onChange={e => { const v = Number(e.target.value); setIntensity(v); applyEffect(active) }}
              className="flex-1 h-1 rounded-full appearance-none bg-white/10 accent-[#6c5ce7] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#6c5ce7] [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-[#6c5ce7]/50" />
            <span className="text-[8px] text-theme-dim font-mono w-6 text-right">{intensity}%</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[8px] text-theme-dim font-medium w-12">Cantidad</span>
            <input type="range" min={10} max={150} value={count}
              onChange={e => { const v = Number(e.target.value); setCount(v); applyEffect(active) }}
              className="flex-1 h-1 rounded-full appearance-none bg-white/10 accent-[#6c5ce7] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#6c5ce7] [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-[#6c5ce7]/50" />
            <span className="text-[8px] text-theme-dim font-mono w-6 text-right">{count}</span>
          </div>
        </div>
      )}
    </div>
  )
}
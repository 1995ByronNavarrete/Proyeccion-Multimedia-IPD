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
    <div className="h-full bg-theme-panel border border-theme rounded-xl flex flex-col overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-theme shrink-0 bg-gradient-to-r from-[#6c5ce7]/5 to-transparent">
        <Wind size={10} className="text-[#6c5ce7]" />
        <h3 className="text-[9px] font-bold text-theme-muted uppercase tracking-wider flex-1">Efectos Visuales</h3>
        {active != null && (
          <button onClick={clearEffect} className="text-[7px] px-1.5 py-0.5 bg-red-500/10 text-red-400 rounded hover:bg-red-500/20 transition-colors">
            <Ban size={8} /> Quitar
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {FX_LIST.map(fx => (
          <button key={fx.id} onClick={() => applyEffect(fx.id)}
            className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg transition-all text-[9px] ${active === fx.id ? 'bg-[#6c5ce7]/15 ring-1 ring-[#6c5ce7] text-[#6c5ce7]' : 'bg-theme-card text-theme-dim hover:text-theme hover:bg-theme-card/80'}`}>
            <fx.icon size={12} style={{ color: fx.color }} />
            <span className="font-medium">{fx.label}</span>
            {active === fx.id && <span className="ml-auto text-[7px] text-green-400">ACTIVO</span>}
          </button>
        ))}
      </div>

      {active != null && (
        <div className="px-2 pb-2 space-y-1.5 border-t border-theme pt-1.5">
          <div className="flex items-center gap-2 px-1">
            <span className="text-[7px] text-theme-dim">Velocidad</span>
            <input type="range" min={0.3} max={3} step={0.1} value={speed}
              onChange={e => { const v = Number(e.target.value); setSpeed(v); applyEffect(active) }}
              className="flex-1 h-1 accent-[#6c5ce7]" />
            <span className="text-[7px] text-theme-dim w-6 text-right tabular-nums">{speed}x</span>
          </div>
          <div className="flex items-center gap-2 px-1">
            <span className="text-[7px] text-theme-dim">Intensidad</span>
            <input type="range" min={10} max={100} value={intensity}
              onChange={e => { const v = Number(e.target.value); setIntensity(v); applyEffect(active) }}
              className="flex-1 h-1 accent-[#6c5ce7]" />
            <span className="text-[7px] text-theme-dim w-6 text-right tabular-nums">{intensity}%</span>
          </div>
          <div className="flex items-center gap-2 px-1">
            <span className="text-[7px] text-theme-dim">Cantidad</span>
            <input type="range" min={10} max={150} value={count}
              onChange={e => { const v = Number(e.target.value); setCount(v); applyEffect(active) }}
              className="flex-1 h-1 accent-[#6c5ce7]" />
            <span className="text-[7px] text-theme-dim w-6 text-right tabular-nums">{count}</span>
          </div>
          <div className="flex items-center gap-2 px-1">
            <span className="text-[7px] text-theme-dim">Tamaño</span>
            <input type="range" min={10} max={200} value={size}
              onChange={e => { const v = Number(e.target.value); setSize(v); applyEffect(active) }}
              className="flex-1 h-1 accent-[#6c5ce7]" />
            <span className="text-[7px] text-theme-dim w-6 text-right tabular-nums">{size}%</span>
          </div>
        </div>
      )}
    </div>
  )
}
import { useState } from 'react'
import { Volume2, Mic, Music, Guitar, Drum, Disc, Radio } from 'lucide-react'

const CHANNELS = [
  { name: 'Mic 1', icon: Mic, color: '#ef4444' },
  { name: 'Mic 2', icon: Mic, color: '#f97316' },
  { name: 'Guitarra', icon: Guitar, color: '#eab308' },
  { name: 'Batería', icon: Drum, color: '#22c55e' },
  { name: 'Pista', icon: Disc, color: '#3b82f6' },
  { name: 'Aux', icon: Radio, color: '#a855f7' }
]

export default function MixerAudio() {
  const [levels, setLevels] = useState<Record<string, number>>(
    Object.fromEntries(CHANNELS.map((c) => [c.name, 0]))
  )
  const [muted, setMuted] = useState<Record<string, boolean>>(
    Object.fromEntries(CHANNELS.map((c) => [c.name, false]))
  )

  return (
    <div className="h-full bg-[#0c1022] bg-theme-panel border border-[#1a1f3a] border-theme rounded-2xl flex flex-col overflow-hidden shadow-xl">
      <div className="px-4 py-3 border-b border-[#1a1f3a] border-theme flex items-center justify-between shrink-0">
        <h3 className="text-[11px] font-bold text-white/80 text-theme tracking-widest flex items-center gap-2.5">
          <span className="w-6 h-6 rounded-xl bg-gradient-to-br from-[#6c5ce7] to-[#00d4ff] flex items-center justify-center shadow-lg shadow-[#6c5ce7]/20">
            <Volume2 size={12} className="text-white text-theme" />
          </span>
          MIXER
        </h3>
        <span className="text-[8px] text-gray-600 text-theme-dim font-mono tracking-wider">6 CH</span>
      </div>

      <div className="flex-1 flex items-stretch gap-1.5 p-3 overflow-hidden">
        {CHANNELS.map(({ name, icon: Icon, color }) => {
          const mute = muted[name]
          const val = mute ? 0 : levels[name]
          const pct = val / 100

          return (
            <div key={name} className={`flex-1 flex flex-col items-center gap-2 rounded-xl border py-3 px-1 transition-all duration-200 ${mute ? 'bg-[#060914] bg-theme-card border-red-500/10' : 'bg-[#0a0e1e] bg-theme-card border-[#1a1f3a] hover:border-[#2a2f5a]'}`}>
              <button onClick={() => setMuted((prev) => ({ ...prev, [name]: !prev[name] }))}
                className={`w-5 h-4 text-[7px] font-black rounded-md transition-all ${mute ? 'bg-red-500/20 text-red-400' : 'bg-[#060914] bg-theme-card text-gray-600 text-theme-dim hover:text-gray-400 text-theme-muted'}`}>
                M
              </button>

              <Icon size={14} className={`transition-colors ${mute ? 'text-gray-700 text-theme-dim' : ''}`} style={{ color: mute ? undefined : color }} />

              <span className={`text-[7px] font-semibold tracking-wider ${mute ? 'text-gray-700 text-theme-dim' : 'text-gray-500 text-theme-muted'}`}>
                {name}
              </span>

              <div className="flex-1 w-full flex items-center justify-center py-1">
                <div className="relative w-full h-full bg-[#060914] bg-theme-card rounded-lg overflow-hidden cursor-pointer max-w-[12px]"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect()
                    const pct = 1 - (e.clientY - rect.top) / rect.height
                    setLevels((prev) => ({ ...prev, [name]: Math.round(Math.max(0, Math.min(1, pct)) * 100) }))
                  }}>
                  <div className="absolute bottom-0 w-full rounded-lg transition-all duration-100" style={{
                    height: `${val}%`,
                    background: mute
                      ? '#2a2a3a'
                      : pct > 0.8
                        ? 'linear-gradient(to top, #ef4444, #dc2626)'
                        : pct > 0.55
                          ? 'linear-gradient(to top, #eab308, #f59e0b)'
                          : `linear-gradient(to top, ${color}, ${color}88)`
                  }} />
                  <div className="absolute w-full h-[3px] bg-white/90 rounded-full shadow-md transition-all duration-100"
                    style={{ bottom: `${val}%` }} />
                </div>
              </div>

              <span className={`text-[10px] font-mono font-bold tabular-nums transition-colors ${mute ? 'text-gray-700 text-theme-dim' : pct > 0.8 ? 'text-red-400' : pct > 0.55 ? 'text-yellow-400' : 'text-gray-400 text-theme-muted'}`}>
                {String(val).padStart(2, '0')}
              </span>
            </div>
          )
        })}
      </div>

      <div className="px-3 pb-3 flex gap-2">
        <button onClick={() => {
          const allMuted = Object.values(muted).every(Boolean)
          setMuted(Object.fromEntries(CHANNELS.map((c) => [c.name, !allMuted])))
        }}
          className="flex-1 text-[8px] py-2 bg-[#0a0e1e] bg-theme-card text-gray-500 text-theme-muted rounded-xl font-semibold hover:text-gray-300 hover:bg-[#0d1230] transition-all border border-[#1a1f3a] border-theme">\n          MUTE ALL
        </button>
        <button onClick={() => {
          setLevels(Object.fromEntries(CHANNELS.map((c) => [c.name, 0])))
          setMuted(Object.fromEntries(CHANNELS.map((c) => [c.name, false])))
        }}
          className="text-[8px] px-4 py-2 bg-[#0a0e1e] bg-theme-card text-gray-500 text-theme-muted rounded-xl font-semibold hover:text-gray-300 hover:bg-[#0d1230] transition-all border border-[#1a1f3a] border-theme">\n          RESET
        </button>
      </div>
    </div>
  )
}

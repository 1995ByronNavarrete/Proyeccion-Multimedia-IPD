import { useState } from 'react'
import { CalendarClock, Play } from 'lucide-react'
import DirectoryBrowser from './DirectoryBrowser'

const STAGES = ['Inicio', 'Alabanza', 'Predicación', 'Oración', 'Despedida']

export default function ProgramacionPanel() {
  const [events, setEvents] = useState([
    { id: '1', name: 'Video bienvenida', stage: 'Inicio', time: '00:00' },
    { id: '2', name: 'Alabanza 1', stage: 'Alabanza', time: '00:05' },
    { id: '3', name: 'Predicación', stage: 'Predicación', time: '00:20' },
  ])
  const [name, setName] = useState('')
  const [stage, setStage] = useState(STAGES[0])

  return (
    <div className="h-full bg-[rgba(8,12,30,0.95)] bg-theme-panel border border-[rgba(120,80,255,0.15)] border-theme rounded-xl flex flex-col overflow-hidden">
      <div className="px-3 py-2 border-b border-[rgba(120,80,255,0.15)] border-theme">
        <h3 className="text-[10px] font-semibold text-gray-400 text-theme-muted uppercase tracking-wider flex items-center gap-1.5">
          <CalendarClock size={11} /> Programación
        </h3>
      </div>

      <div className="flex-1 grid grid-cols-2 gap-px overflow-hidden bg-[rgba(120,80,255,0.15)]">
        {/* Left: Programming */}
        <div className="flex flex-col overflow-hidden bg-[rgba(8,12,30,0.95)] bg-theme-panel">
          <div className="flex gap-1 px-2 pt-2">
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Evento..."
              className="flex-1 px-1.5 py-1 bg-[#091225] bg-theme-card rounded text-[9px] text-gray-200 text-theme placeholder-gray-600 text-theme-dim border border-[rgba(120,80,255,0.15)] border-theme outline-none" />
            <select value={stage} onChange={(e) => setStage(e.target.value)}
              className="text-[9px] bg-[#091225] bg-theme-card text-gray-400 text-theme-muted px-1.5 py-1 rounded border border-[rgba(120,80,255,0.15)] border-theme outline-none">
              {STAGES.map((s) => <option key={s}>{s}</option>)}
            </select>
            <button onClick={() => { if (name.trim()) { setEvents([...events, { id: Date.now().toString(), name, stage, time: '00:00' }]); setName('') } }}
              className="px-2 py-1 bg-[#6c5ce7] rounded text-[9px] hover:bg-[#5a4bd1]">+</button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
            {events.map((ev) => (
              <div key={ev.id} className="flex items-center gap-1.5 px-1.5 py-1 bg-[#091225] bg-theme-card rounded text-[9px]">
                <Play size={7} className="text-green-500 shrink-0" />
                <span className="text-[8px] text-gray-500 text-theme-muted w-7 shrink-0">{ev.time || '--:--'}</span>
                <span className="flex-1 truncate text-gray-200 text-theme">{ev.name}</span>
                <span className="text-[7px] text-[#6c5ce7] shrink-0">{ev.stage}</span>
              </div>
            ))}
          </div>

          <div className="px-2 pb-2">
            <div className="bg-[#6c5ce7]/10 border border-[#6c5ce7]/20 rounded-lg px-2 py-1.5">
              <p className="text-[8px] text-gray-500 text-theme-muted">PRÓXIMO</p>
              <p className="text-[10px] text-[#6c5ce7] font-medium">Alabanza 1</p>
            </div>
          </div>
        </div>

        {/* Right: Directory Browser */}
        <div className="overflow-hidden bg-[rgba(8,12,30,0.95)] bg-theme-panel">
          <DirectoryBrowser />
        </div>
      </div>
    </div>
  )
}

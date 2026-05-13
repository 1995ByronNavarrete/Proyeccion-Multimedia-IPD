import { useState } from 'react'
import { Clapperboard, Save, Trash2, Play } from 'lucide-react'
import type { ProjectedContent } from '../views/DashboardView'

interface EscenasPanelProps {
  onRestore: (content: ProjectedContent) => void
}

export default function EscenasPanel({ onRestore }: EscenasPanelProps) {
  const [scenes, setScenes] = useState<{ id: string; name: string; content: ProjectedContent }[]>([])
  const [name, setName] = useState('')

  return (
    <div className="h-full bg-[rgba(8,12,30,0.95)] bg-theme-panel border border-[rgba(120,80,255,0.15)] border-theme rounded-xl flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-[rgba(120,80,255,0.15)] border-theme">
        <h3 className="text-[10px] font-semibold text-gray-400 text-theme-muted uppercase tracking-wider flex items-center gap-1.5">
          <Clapperboard size={11} /> Escenas
        </h3>
        <span className="text-[9px] text-gray-500 text-theme-muted">{scenes.length}</span>
      </div>
      <div className="flex gap-1 px-2 pt-2">
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nueva escena..."
          className="flex-1 px-2 py-1 bg-[#091225] bg-theme-card rounded text-[10px] text-gray-200 text-theme placeholder-gray-600 text-theme-dim border border-[rgba(120,80,255,0.15)] border-theme outline-none" />
        <button onClick={() => { if (name.trim()) { setScenes([...scenes, { id: Date.now().toString(), name, content: { type: 'verse', text: '', reference: '' } }]); setName('') } }}
          className="p-1.5 bg-[#6c5ce7] rounded hover:bg-[#5a4bd1] transition-colors"><Save size={11} /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {scenes.map((s) => (
          <div key={s.id} onClick={() => onRestore(s.content)}
            className="flex items-center gap-2 p-2 bg-[#091225] bg-theme-card rounded-lg cursor-pointer hover:bg-[#091225] bg-theme-card group transition-colors">
            <div className="w-6 h-6 bg-[#050816] rounded flex items-center justify-center">
              <Play size={8} className="text-[#6c5ce7]" />
            </div>
            <span className="text-[10px] text-gray-200 text-theme flex-1 truncate">{s.name}</span>
            <button onClick={(e) => { e.stopPropagation(); setScenes(scenes.filter((x) => x.id !== s.id)) }}
              className="p-0.5 text-gray-500 text-theme-muted hover:text-red-400 opacity-0 group-hover:opacity-100"><Trash2 size={9} /></button>
          </div>
        ))}
        {scenes.length === 0 && <p className="text-[9px] text-gray-500 text-theme-muted text-center py-4">Guarda una escena</p>}
      </div>
      <div className="px-2 pb-2">
        <select className="w-full text-[9px] bg-[#091225] bg-theme-card text-gray-400 text-theme-muted px-2 py-1 rounded border border-[rgba(120,80,255,0.15)] border-theme outline-none">
          <option>Transición: Fundido</option>
          <option>Transición: Deslizar</option>
          <option>Transición: Instantáneo</option>
        </select>
      </div>
    </div>
  )
}

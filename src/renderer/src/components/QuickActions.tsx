import { useState, useEffect } from 'react'
import { Monitor, MonitorOff, Clock, Eye, EyeOff, Sun, Moon, Tv } from 'lucide-react'

export default function QuickActions() {
  const [projected, setProjected] = useState('')

  useEffect(() => {
    const unsub = window.api.on('projector:content', () => setProjected('verse'))
    return () => unsub?.()
  }, [])

  const actions = [
    { id: 'black', label: 'Black', icon: MonitorOff, color: '#ef4444', action: () => window.api.projector.showBlack() },
    { id: 'clear', label: 'Clear', icon: Sun, color: '#22c55e', action: () => { window.api.projector.sendContent({ type: 'verse', text: ' ', reference: '' }); window.api.projector.projectToAll() } },
    { id: 'white', label: 'White', icon: Tv, color: '#f59e0b', action: () => window.api.projector.sendContent({ type: 'verse', text: ' ', reference: '', backgroundUrl: 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%221920%22 height=%221080%22%3E%3Crect width=%221920%22 height=%221080%22 fill=%22%23ffffff%22/%3E%3C/svg%3E' }) },
  ]

  return (
    <div className="h-full bg-theme-panel border border-theme rounded-xl flex flex-col overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-theme shrink-0">
        <Monitor size={10} className="text-[#6c5ce7]" />
        <h3 className="text-[9px] font-semibold text-theme-muted uppercase tracking-wider flex-1">Acciones</h3>
        {projected === 'black' && <span className="text-[7px] bg-red-500/20 text-red-400 px-1.5 rounded font-bold">BLACK</span>}
      </div>
      <div className="flex-1 grid grid-cols-3 gap-2 p-2 content-start">
        {actions.map(a => (
          <button key={a.id} onClick={a.action}
            className="flex flex-col items-center justify-center gap-1.5 px-1 py-3 rounded-xl transition-all hover:scale-105 active:scale-95"
            style={{ backgroundColor: a.color + '20', borderColor: a.color + '40' }}>
            <a.icon size={18} style={{ color: a.color }} />
            <span className="text-[8px] font-medium" style={{ color: a.color }}>{a.label}</span>
          </button>
        ))}
      </div>
      <div className="px-2 pb-2">
        <p className="text-[6px] text-theme-dim text-center">Toque rápido para acciones de proyección</p>
      </div>
    </div>
  )
}
import { useState, useRef, useEffect } from 'react'
import { LayoutGrid, Check } from 'lucide-react'
import { ALL_MODULES, MAX_ACTIVE_MODULES, useModules, getModuleIcon } from '../modules'

export default function ModuleMenu() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { isEnabled, toggle, toast } = useModules()

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)}
        className="flex items-center gap-1 px-2 py-1 hover:bg-white/5 rounded transition-colors text-[10px] text-gray-500 text-theme-muted hover:text-theme">
        <LayoutGrid size={12} /> Vistas
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 w-64 bg-[rgba(10,14,30,0.98)] bg-theme-panel border border-[rgba(120,80,255,0.25)] rounded-xl shadow-2xl shadow-black/50 py-2 overflow-hidden">
          <div className="px-3 pb-1.5 border-b border-theme mb-1 flex items-center justify-between">
            <p className="text-[9px] text-theme-dim font-semibold uppercase tracking-wider">Módulos activos</p>
            <span className="text-[8px] text-theme-dim/60">{ALL_MODULES.filter(m => isEnabled(m.id)).length}/{MAX_ACTIVE_MODULES}</span>
          </div>
          {ALL_MODULES.map((mod) => {
            const active = isEnabled(mod.id)
            const Icon = getModuleIcon(mod.icon)
            return (
              <div key={mod.id}
                onClick={() => toggle(mod.id)}
                className={`flex items-center gap-2.5 px-3 py-2 cursor-pointer transition-colors mx-1 rounded-lg ${
                  active ? 'bg-[#6c5ce7]/10' : 'opacity-50 hover:opacity-80 hover:bg-white/5'
                }`}>
                <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                  active ? 'bg-[#6c5ce7] border-[#6c5ce7]' : 'border-theme-dim/40'
                }`}>
                  {active && <Check size={10} className="text-white" />}
                </div>
                <Icon size={12} className={active ? 'text-[#6c5ce7]' : 'text-theme-dim'} />
                <span className={`text-[10px] ${active ? 'text-theme font-medium' : 'text-theme-dim'}`}>{mod.label}</span>
              </div>
            )
          })}
          {toast && (
            <div className="px-3 pt-1.5 mt-1 border-t border-red-500/20">
              <p className="text-[8px] text-red-400 leading-tight">{toast}</p>
            </div>
          )}
          <div className="px-3 pt-1.5 mt-1 border-t border-theme">
            <p className="text-[7px] text-theme-dim/50">Máximo {MAX_ACTIVE_MODULES} módulos</p>
          </div>
        </div>
      )}
    </div>
  )
}

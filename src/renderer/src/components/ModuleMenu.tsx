import { useState } from 'react'
import { Grid3X3, X, Check } from 'lucide-react'
import { ALL_MODULES, useModules, getModuleIcon } from '../modules'

export default function ModuleMenu() {
  const [open, setOpen] = useState(false)
  const { isEnabled, toggle } = useModules()

  return (
    <>
      <button onClick={() => setOpen(!open)}
        className="p-1.5 hover:bg-white/5 rounded transition-colors" title="Módulos">
        <Grid3X3 size={12} className="text-gray-500" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[520px] max-w-[90vw] max-h-[80vh] bg-theme-panel border border-[rgba(120,80,255,0.25)] rounded-xl shadow-2xl shadow-black/60 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-theme shrink-0">
              <h3 className="text-xs font-bold text-theme flex items-center gap-2">
                <Grid3X3 size={14} className="text-[#6c5ce7]" /> Módulos de la interfaz
              </h3>
              <button onClick={() => setOpen(false)} className="p-1 hover:bg-white/5 rounded"><X size={14} className="text-theme-dim" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              <div className="space-y-1">
                {ALL_MODULES.map((mod) => {
                  const active = isEnabled(mod.id)
                  const Icon = getModuleIcon(mod.icon)
                  return (
                    <div key={mod.id}
                      onClick={() => toggle(mod.id)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                        active ? 'bg-[#6c5ce7]/10 border border-[#6c5ce7]/30' : 'bg-theme-card border border-transparent opacity-50 hover:opacity-80'
                      }`}>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${active ? 'bg-[#6c5ce7]/20' : 'bg-white/5'}`}>
                        <Icon size={14} className={active ? 'text-[#6c5ce7]' : 'text-theme-dim'} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-medium ${active ? 'text-theme' : 'text-theme-dim'}`}>{mod.label}</p>
                        <p className="text-[9px] text-theme-dim/60 capitalize">Zona {mod.zone.replace('-', ' ')}</p>
                      </div>
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        active ? 'bg-[#6c5ce7] border-[#6c5ce7]' : 'border-theme-dim/30'
                      }`}>
                        {active && <Check size={12} className="text-white" />}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="px-3 py-2 border-t border-theme shrink-0">
              <p className="text-[9px] text-theme-dim/60 text-center">Desmarca un módulo para ocultarlo de la interfaz</p>
            </div>
          </div>
        </>
      )}
    </>
  )
}

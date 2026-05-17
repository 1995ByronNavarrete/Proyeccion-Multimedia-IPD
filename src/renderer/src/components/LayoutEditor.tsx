import { useState, useRef } from 'react'
import { Layout, X, Check, Save, Trash2, Plus, GripVertical, ArrowLeft, ArrowRight, ArrowUp, ArrowDown } from 'lucide-react'
import { ALL_MODULES, getModuleIcon } from '../modules'
import { useLayout, type ModuleId, type ZoneId } from '../layout'

const ZONE_LABELS: Record<ZoneId, string> = { left: 'Izquierda', center: 'Centro', right: 'Derecha' }

export default function LayoutEditor() {
  const {
    profiles, activeProfile, setActiveProfile, saveProfile, deleteProfile,
    getModules, moveModule, editing, setEditing
  } = useLayout()
  const [showSave, setShowSave] = useState(false)
  const [newName, setNewName] = useState('')

  const zones: ZoneId[] = ['left', 'center', 'right']

  const handleDrop = (moduleId: ModuleId, toZone: ZoneId) => {
    for (const z of zones) {
      if (getModules(z).includes(moduleId)) {
        moveModule(moduleId, z, toZone)
        return
      }
    }
  }

  const handleSave = () => {
    if (newName.trim()) {
      saveProfile(newName.trim())
      setNewName('')
      setShowSave(false)
    }
  }

  return (
    <>
      <button onClick={() => setEditing(!editing)}
        className={`flex items-center gap-1 px-2 py-1 rounded transition-colors text-[10px] ${editing ? 'bg-[#6c5ce7]/20 text-[#6c5ce7]' : 'text-gray-500 hover:text-theme hover:bg-white/5'}`}>
        <Layout size={12} /> {editing ? 'Cerrar editor' : 'Editor'}
      </button>

      {editing && (
        <>
          <div className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm" onClick={() => setEditing(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-40 bg-[rgba(8,12,30,0.98)] border-t border-[rgba(120,80,255,0.25)] shadow-2xl shadow-black/50 max-h-[50vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-4 py-2 border-b border-theme shrink-0">
              <h3 className="text-xs font-bold text-theme flex items-center gap-2"><Layout size={14} className="text-[#6c5ce7]" /> Editor de diseño</h3>
              <div className="flex items-center gap-2">
                <select value={activeProfile} onChange={e => setActiveProfile(e.target.value)}
                  className="bg-theme-card text-xs text-theme px-2 py-1 rounded border border-theme outline-none">
                  {profiles.map(p => <option key={p.name}>{p.name}</option>)}
                </select>
                <button onClick={() => setShowSave(true)} className="p-1.5 bg-[#6c5ce7]/20 rounded text-[#6c5ce7] hover:bg-[#6c5ce7]/30" title="Guardar como...">
                  <Save size={12} />
                </button>
                <button onClick={() => setEditing(false)} className="p-1.5 hover:bg-white/5 rounded"><X size={14} className="text-theme-dim" /></button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3">
              <div className="grid grid-cols-3 gap-4">
                {zones.map(zone => (
                  <div key={zone} className="bg-theme-card/50 rounded-lg border border-theme p-2 min-h-[120px]"
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => {
                      const id = e.dataTransfer.getData('moduleId')
                      if (id) handleDrop(id, zone)
                    }}>
                    <p className="text-[9px] text-theme-dim font-semibold uppercase tracking-wider mb-2">{ZONE_LABELS[zone]}</p>
                    <div className="space-y-1">
                      {getModules(zone).map(modId => {
                        const mod = ALL_MODULES.find(m => m.id === modId)
                        if (!mod) return null
                        const Icon = getModuleIcon(mod.icon)
                        return (
                          <div key={mod.id} draggable
                            onDragStart={e => e.dataTransfer.setData('moduleId', mod.id)}
                            className="flex items-center gap-2 px-2 py-1.5 bg-theme rounded border border-theme cursor-grab active:cursor-grabbing hover:border-[#6c5ce7]/50 transition-colors group">
                            <GripVertical size={10} className="text-theme-dim shrink-0" />
                            <Icon size={12} className="text-[#6c5ce7] shrink-0" />
                            <span className="text-[10px] text-theme flex-1">{mod.label}</span>
                            <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              {zones.filter(z => z !== zone).map(z => (
                                <button key={z} onClick={() => handleDrop(mod.id, z)}
                                  className="p-0.5 hover:bg-white/10 rounded" title={`Mover a ${ZONE_LABELS[z]}`}>
                                  {z === 'left' ? <ArrowLeft size={8} /> : z === 'right' ? <ArrowRight size={8} /> : <ArrowUp size={8} />}
                                </button>
                              ))}
                            </div>
                          </div>
                        )
                      })}
                      {getModules(zone).length === 0 && (
                        <p className="text-[8px] text-theme-dim/50 text-center py-4">Suelta módulos aquí</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 px-4 py-2 border-t border-theme shrink-0">
              {profiles.filter(p => p.name !== 'Completo').map(p => (
                <button key={p.name} onClick={() => deleteProfile(p.name)}
                  className="flex items-center gap-1 px-2 py-1 bg-red-500/10 text-red-400 rounded text-[9px] hover:bg-red-500/20">
                  <Trash2 size={8} /> {p.name}
                </button>
              ))}
              <div className="flex-1" />
              <p className="text-[8px] text-theme-dim/60">Arrastra los módulos entre zonas para personalizar</p>
            </div>
          </div>
        </>
      )}

      {showSave && (
        <>
          <div className="fixed inset-0 z-50 bg-black/60" onClick={() => setShowSave(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-80 bg-theme-panel border border-theme rounded-xl shadow-2xl p-4">
            <p className="text-xs font-bold text-theme mb-3">Guardar diseño como...</p>
            <input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="Nombre del diseño"
              className="w-full px-3 py-2 bg-theme-card rounded text-xs text-theme border border-theme outline-none mb-3"
              onKeyDown={e => e.key === 'Enter' && handleSave()} />
            <div className="flex gap-2">
              <button onClick={() => setShowSave(false)} className="flex-1 text-xs py-2 bg-theme-card text-theme-dim rounded hover:text-theme border border-theme">Cancelar</button>
              <button onClick={handleSave} className="flex-1 text-xs py-2 bg-[#6c5ce7] text-white rounded hover:bg-[#5a4bd1]"><Save size={12} className="inline mr-1" />Guardar</button>
            </div>
          </div>
        </>
      )}
    </>
  )
}

import { Monitor } from 'lucide-react'

export default function SecondaryDisplay() {
  return (
    <div className="h-full bg-[rgba(8,12,30,0.95)] bg-theme-panel border border-[rgba(120,80,255,0.15)] border-theme rounded-xl flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-[rgba(120,80,255,0.15)] border-theme">
        <h3 className="text-[10px] font-semibold text-gray-400 text-theme-muted uppercase tracking-wider">Pantalla Secundaria</h3>
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[8px] text-green-500">LIVE</span>
        </span>
      </div>
      <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-[#050816] to-black/60 m-2 rounded-lg">
        <div className="text-center">
          <Monitor size={24} className="text-gray-500 text-theme-muted mx-auto mb-1" />
          <p className="text-[9px] text-gray-500 text-theme-muted">Vista secundaria</p>
          <p className="text-[7px] text-gray-500 text-theme-muted mt-1">Contenido visible en panel Pantallas</p>
        </div>
      </div>
    </div>
  )
}

import { Monitor, MonitorOff } from 'lucide-react'

interface ProjectionViewProps {
  onBlack: () => void
}

export default function ProjectionView({ onBlack }: ProjectionViewProps) {
  return (
    <div className="h-full bg-[rgba(8,12,30,0.95)] bg-theme-panel border border-[rgba(120,80,255,0.15)] border-theme rounded-xl flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-[rgba(120,80,255,0.15)] border-theme">
        <h3 className="text-[10px] font-semibold text-gray-400 text-theme-muted uppercase tracking-wider">Vista Proyección</h3>
        <div className="flex gap-1">
          <button onClick={onBlack} className="p-1.5 hover:bg-white/5 rounded transition-colors" title="Pantalla negra">
            <MonitorOff size={12} className="text-gray-500 text-theme-muted" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-[#050816] to-black/60 m-2 rounded-lg">
        <div className="text-center">
          <Monitor size={36} className="text-gray-500 text-theme-muted mx-auto mb-2" />
          <p className="text-xs text-gray-500 text-theme-muted">Vista previa del proyector</p>
          <p className="text-[10px] text-gray-500 text-theme-muted mt-1">El contenido se muestra en el panel Pantallas</p>
        </div>
      </div>

      <div className="flex items-center gap-2 px-3 py-2 border-t border-[rgba(120,80,255,0.15)] border-theme">
        <span className="text-[9px] text-gray-500 text-theme-muted">Transición:</span>
        <select className="text-[9px] bg-[#091225] bg-theme-card text-gray-400 text-theme-muted px-2 py-1 rounded border border-[rgba(120,80,255,0.15)] border-theme outline-none">
          <option>Fundido</option>
          <option>Deslizar</option>
          <option>Instantáneo</option>
        </select>
      </div>
    </div>
  )
}

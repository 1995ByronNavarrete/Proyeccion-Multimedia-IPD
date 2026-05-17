import { useState, useEffect } from 'react'
import { Save, Play, Trash2, X, Clapperboard } from 'lucide-react'

interface Scene {
  id: string
  name: string
  timestamp: number
  verse?: { text: string; reference: string }
  backgroundUrl?: string | null
  animBiblia?: string
  bgVideo?: { url: string | null; title: string; paused: boolean }
  projected?: { type: string; text?: string; reference?: string; mediaUrl?: string; backgroundUrl?: string; animation?: string }
}

const STORAGE_KEY = 'ipd-scenes'

export default function ScenesPanel() {
  const [scenes, setScenes] = useState<Scene[]>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') } catch { return [] }
  })
  const [showSave, setShowSave] = useState(false)
  const [sceneName, setSceneName] = useState('')

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(scenes)) }, [scenes])

  const captureState = (): Partial<Scene> => {
    let verse: { text: string; reference: string } | undefined
    let backgroundUrl: string | null | undefined
    let animBiblia: string | undefined
    let projected: any = undefined
    try {
      const saved = localStorage.getItem('ipd-last-verse')
      if (saved) verse = JSON.parse(saved)
    } catch {}
    try {
      const bg = localStorage.getItem('ipd-bg-url')
      if (bg) backgroundUrl = bg
    } catch {}
    try {
      const anim = localStorage.getItem('ipd-anim-biblia')
      if (anim) animBiblia = anim
    } catch {}
    return { verse, backgroundUrl, animBiblia, projected }
  }

  const saveScene = () => {
    if (!sceneName.trim()) return
    const state = captureState()
    const scene: Scene = { id: Date.now().toString(), name: sceneName.trim(), timestamp: Date.now(), ...state }
    setScenes(prev => [scene, ...prev])
    setSceneName('')
    setShowSave(false)
  }

  const loadScene = (scene: Scene) => {
    if (scene.verse) {
      localStorage.setItem('ipd-last-verse', JSON.stringify(scene.verse))
    }
    if (scene.backgroundUrl !== undefined) {
      localStorage.setItem('ipd-bg-url', scene.backgroundUrl || '')
    }
    if (scene.animBiblia) {
      localStorage.setItem('ipd-anim-biblia', scene.animBiblia)
    }
    window.dispatchEvent(new CustomEvent('scene:load', { detail: scene }))
  }

  const deleteScene = (id: string) => {
    setScenes(prev => prev.filter(s => s.id !== id))
  }

  return (
    <div className="bg-theme-panel border border-theme rounded-xl flex flex-col overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-theme shrink-0 bg-gradient-to-r from-[#6c5ce7]/10 via-[#6c5ce7]/5 to-transparent">
        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
          <Clapperboard size={11} className="text-white" />
        </div>
        <h3 className="text-[10px] font-bold text-theme flex-1 tracking-wide">Escenas</h3>
        <button onClick={() => setShowSave(true)}
          className="p-1 bg-[#6c5ce7]/20 rounded text-[#6c5ce7] hover:bg-[#6c5ce7]/30 transition-colors" title="Guardar escena actual">
          <Save size={9} />
        </button>
      </div>

      {showSave && (
        <div className="flex items-center gap-1 px-2 py-1.5 border-b border-theme">
          <input type="text" value={sceneName} onChange={e => setSceneName(e.target.value)}
            placeholder="Nombre de la escena..."
            className="flex-1 min-w-0 bg-theme-card px-2 py-1 rounded text-[9px] text-theme placeholder:text-theme-dim/40 outline-none border border-theme"
            onKeyDown={e => e.key === 'Enter' && saveScene()} autoFocus />
          <button onClick={saveScene} disabled={!sceneName.trim()}
            className="px-2 py-1 bg-green-600/80 rounded text-white text-[8px] hover:bg-green-600 disabled:opacity-30">Guardar</button>
          <button onClick={() => setShowSave(false)} className="p-1 text-theme-dim hover:text-theme"><X size={9} /></button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-1.5 space-y-1">
        {scenes.map(s => (
          <div key={s.id}
            className="flex items-center gap-2 px-2 py-1.5 bg-theme-card rounded-lg hover:bg-theme-card/80 transition-colors group">
            <div className="flex-1 min-w-0">
              <p className="text-[9px] text-theme font-medium truncate">{s.name}</p>
              <p className="text-[7px] text-theme-dim">
                {new Date(s.timestamp).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                {s.verse && ` · ${s.verse.reference}`}
              </p>
            </div>
            <button onClick={() => loadScene(s)}
              className="p-1 bg-[#6c5ce7]/20 rounded text-[#6c5ce7] hover:bg-[#6c5ce7]/30 opacity-0 group-hover:opacity-100 transition-all" title="Cargar escena">
              <Play size={8} />
            </button>
            <button onClick={() => deleteScene(s.id)}
              className="p-1 text-theme-dim hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all" title="Eliminar">
              <Trash2 size={7} />
            </button>
          </div>
        ))}
        {scenes.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <Clapperboard size={20} className="text-theme-dim/30 mb-2" />
            <p className="text-[9px] text-theme-dim">Guarda el estado actual</p>
            <p className="text-[7px] text-theme-dim/50 mt-0.5">Botón + arriba</p>
          </div>
        )}
      </div>
    </div>
  )
}

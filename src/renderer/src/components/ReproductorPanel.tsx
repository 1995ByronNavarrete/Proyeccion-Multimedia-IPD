import { useState, useEffect } from 'react'
import { Play, Pause, SkipBack, SkipForward, Volume2, Film } from 'lucide-react'

interface MediaItem {
  id: number
  nombre: string
  ruta_archivo: string
  tipo: 'audio' | 'video'
}

export default function ReproductorPanel() {
  const [playing, setPlaying] = useState(false)
  const [volume, setVolume] = useState(70)
  const [currentTrack, setCurrentTrack] = useState<string | null>(null)
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
  const [filter, setFilter] = useState<'todos' | 'audio' | 'video'>('todos')

  const loadMedia = () => {
    window.api.medialocal.getAll().then((res) => {
      if (res.success && res.data) setMediaItems(res.data)
    })
  }

  useEffect(() => {
    loadMedia()
    const unsubscribe = window.api.on('medialocal:changed', loadMedia)
    return () => { unsubscribe?.() }
  }, [])

  const handlePlay = async (item: MediaItem) => {
    setCurrentTrack(item.nombre)
    if (item.tipo === 'video') {
      setPlaying(true)
      const fileUrl = item.ruta_archivo.startsWith('file://') ? item.ruta_archivo : `file:///${item.ruta_archivo.replace(/\\/g, '/')}`
      await window.api.video.play(fileUrl, item.nombre)
    }
  }

  const filtered = filter === 'todos' ? mediaItems : mediaItems.filter((m) => m.tipo === filter)

  return (
    <div className="h-full bg-[rgba(8,12,30,0.95)] bg-theme-panel border border-[rgba(120,80,255,0.15)] border-theme rounded-xl flex flex-col overflow-hidden">
      <div className="px-3 py-1.5 border-b border-[rgba(120,80,255,0.15)] border-theme">
        <p className="text-[11px] font-medium text-gray-200 text-theme truncate">{currentTrack || 'Ningún medio'}</p>
        <div className="h-1 bg-[#091225] bg-theme-card rounded-full mt-1 overflow-hidden">
          <div className="h-full w-1/3 bg-gradient-to-r from-[#6c5ce7] to-[#00d4ff] rounded-full" />
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 py-2">
        <button className="p-1 text-gray-500 text-theme-muted hover:text-white"><SkipBack size={12} /></button>
        <button onClick={() => setPlaying(!playing)}
          className="p-2 bg-[#6c5ce7] rounded-full hover:bg-[#5a4bd1] transition-colors">
          {playing ? <Pause size={12} /> : <Play size={12} />}
        </button>
        <button className="p-1 text-gray-500 text-theme-muted hover:text-white"><SkipForward size={12} /></button>
      </div>

      <div className="flex items-center gap-1.5 px-3 pb-1.5">
        <Volume2 size={10} className="text-gray-500 text-theme-muted" />
        <input type="range" min={0} max={100} value={volume} onChange={(e) => setVolume(Number(e.target.value))}
          className="flex-1 h-1 accent-[#6c5ce7]" />
        <span className="text-[8px] text-gray-500 text-theme-muted w-5 text-right">{volume}</span>
      </div>

      <div className="flex gap-1 px-3 pb-2">
        {(['todos', 'audio', 'video'] as const).map((t) => (
          <button key={t} onClick={() => setFilter(t)}
            className={`text-[8px] px-2 py-0.5 rounded-full transition-colors ${filter === t ? 'bg-[#6c5ce7] text-white' : 'bg-[#091225] bg-theme-card text-gray-500 text-theme-muted hover:text-white'}`}>
            {t === 'todos' ? 'Todos' : t === 'audio' ? 'Audio' : 'Video'}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-0.5">
        {filtered.map((item) => (
          <div key={item.id} onClick={() => handlePlay(item)}
            className="flex items-center gap-1.5 px-1.5 py-1 bg-[#091225] bg-theme-card rounded cursor-pointer hover:bg-[#091225] bg-theme-card text-[9px] text-gray-400 transition-colors">
            {item.tipo === 'video' ? (
              <Film size={8} className="text-[#a855f7] shrink-0" />
            ) : (
              <Play size={8} className="text-[#6c5ce7] shrink-0" />
            )}
            <span className="truncate">{item.nombre}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

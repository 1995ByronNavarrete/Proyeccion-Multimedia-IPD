import { useState, useEffect } from 'react'
import { FolderOpen, Music, FileVideo, Folder, Play } from 'lucide-react'

interface MediaFile {
  nombre: string
  ruta: string
  tamano: number
}

export default function DirectoryBrowser() {
  const [folderPath, setFolderPath] = useState('')
  const [musica, setMusica] = useState<MediaFile[]>([])
  const [videos, setVideos] = useState<MediaFile[]>([])
  const [tab, setTab] = useState<'musica' | 'videos'>('musica')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadBiblioteca()
    const unsubscribe = window.api.on('medialocal:changed', loadBiblioteca)
    return () => { unsubscribe?.() }
  }, [])

  const loadBiblioteca = async () => {
    setLoading(true)
    try {
      const res = await window.api.medialocal.getBiblioteca()
      if (res.success && res.data) {
        setFolderPath(res.data.ruta)
        setMusica(res.data.musica)
        setVideos(res.data.videos)
      }
    } finally {
      setLoading(false)
    }
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
  }

  const handlePlayVideo = async (file: MediaFile) => {
    const fileUrl = file.ruta.startsWith('file://') ? file.ruta : `file:///${file.ruta.replace(/\\/g, '/')}`
    await window.api.video.play(fileUrl, file.nombre)
  }

  const files = tab === 'musica' ? musica : videos
  const total = musica.length + videos.length

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="px-3 py-2 border-b border-[rgba(120,80,255,0.15)] border-theme">
        <h3 className="text-[10px] font-semibold text-gray-400 text-theme-muted uppercase tracking-wider flex items-center gap-1.5">
          <FolderOpen size={11} /> Biblioteca
        </h3>
      </div>

      <div className="flex gap-1 px-2 pt-2">
        <button onClick={() => setTab('musica')}
          className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[8px] font-semibold transition-colors ${tab === 'musica' ? 'bg-[#6c5ce7] text-white' : 'bg-[#091225] bg-theme-card text-gray-500'}`}>
          <Music size={10} /> Música ({musica.length})
        </button>
        <button onClick={() => setTab('videos')}
          className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[8px] font-semibold transition-colors ${tab === 'videos' ? 'bg-[#6c5ce7] text-white' : 'bg-[#091225] bg-theme-card text-gray-500'}`}>
          <FileVideo size={10} /> Videos ({videos.length})
        </button>
      </div>

      {folderPath && (
        <div className="px-2 pt-1 pb-0.5">
          <p className="text-[6px] text-gray-500 text-theme-dim truncate" title={folderPath}>
            <Folder size={8} className="inline mr-0.5" />{folderPath}
          </p>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-[9px] text-gray-500">Cargando...</p>
          </div>
        ) : files.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <FolderOpen size={20} className="text-gray-500/30 mb-2" />
            <p className="text-[9px] text-gray-500">Sin archivos</p>
            <p className="text-[7px] text-gray-500/60 mt-1">Agrega archivos a la carpeta</p>
            <p className="text-[6px] text-gray-500/40 mt-0.5 truncate w-full">{folderPath}\\{tab === 'musica' ? 'Música' : 'Videos'}</p>
          </div>
        ) : (
          files.map((f, i) => (
            <div key={i} onClick={() => tab === 'videos' && handlePlayVideo(f)}
              className={`flex items-center gap-1.5 px-1.5 py-1 bg-[#091225] bg-theme-card rounded cursor-pointer hover:bg-[#091225]/80 transition-colors text-[9px] ${tab === 'videos' ? 'hover:ring-1 hover:ring-[#a855f7]/40' : ''}`}>
              {tab === 'musica' ? (
                <Music size={9} className="text-[#00d4ff] shrink-0" />
              ) : (
                <FileVideo size={9} className="text-[#a855f7] shrink-0" />
              )}
              <span className="flex-1 truncate text-gray-200 text-theme">{f.nombre}</span>
              {tab === 'videos' && (
                <Play size={8} className="text-[#a855f7]/60 shrink-0 opacity-0 group-hover:opacity-100" />
              )}
              <span className="text-[7px] text-gray-500 text-theme-dim shrink-0">{formatSize(f.tamano)}</span>
            </div>
          ))
        )}
      </div>

      <div className="px-2 pb-2">
        <button onClick={loadBiblioteca}
          className="w-full text-[8px] py-1.5 bg-[#091225] bg-theme-card text-gray-500 rounded-lg hover:text-gray-300 transition-colors border border-[rgba(120,80,255,0.15)] border-theme">
          Actualizar
        </button>
      </div>
    </div>
  )
}

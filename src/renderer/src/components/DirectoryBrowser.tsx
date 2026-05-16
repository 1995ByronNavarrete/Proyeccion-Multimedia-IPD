import { useState, useEffect } from 'react'
import { FolderOpen, Music, FileVideo, FileText, Folder, Play, RefreshCw, Plus, Trash2, Monitor } from 'lucide-react'

interface MediaFile {
  nombre: string
  ruta: string
  tamano: number
}

interface BibliotecaData {
  ruta: string
  musica: MediaFile[]
  videos: MediaFile[]
  documentos: MediaFile[]
}

interface DirectoryBrowserProps {
  onPlayBg?: (url: string, title: string) => void
}

type Tab = 'musica' | 'videos' | 'documentos'

const FILE_ICONS: Record<Tab, { icon: typeof Music; color: string }> = {
  musica: { icon: Music, color: 'text-[#00d4ff]' },
  videos: { icon: FileVideo, color: 'text-[#a855f7]' },
  documentos: { icon: FileText, color: 'text-[#f59e0b]' }
}

export default function DirectoryBrowser({ onPlayBg }: DirectoryBrowserProps) {
  const [folderPath, setFolderPath] = useState('')
  const [musica, setMusica] = useState<MediaFile[]>([])
  const [videos, setVideos] = useState<MediaFile[]>([])
  const [documentos, setDocumentos] = useState<MediaFile[]>([])
  const [tab, setTab] = useState<Tab>('musica')
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
        const data = res.data as BibliotecaData
        setFolderPath(data.ruta)
        setMusica(data.musica)
        setVideos(data.videos)
        setDocumentos(data.documentos || [])
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
    window.dispatchEvent(new CustomEvent('play-media', { detail: { ruta: file.ruta, nombre: file.nombre, tipo: 'video' } }))
    await window.api.video.play(fileUrl, file.nombre)
  }

  const handlePlayMusic = (file: MediaFile) => {
    window.dispatchEvent(new CustomEvent('play-media', { detail: { ruta: file.ruta, nombre: file.nombre, tipo: 'audio' } }))
  }

  const handleProjectDocument = async (file: MediaFile) => {
    const fileUrl = 'file:///' + encodeURI(file.ruta.replace(/\\/g, '/'))
    await window.api.projector.projectToAll()
    setTimeout(async () => {
      await window.api.projector.sendContent({ type: 'document', mediaUrl: fileUrl, text: file.nombre })
    }, 1500)
  }

  const files = tab === 'musica' ? musica : tab === 'videos' ? videos : documentos
  const total = musica.length + videos.length + documentos.length
  const { icon: Icon, color } = FILE_ICONS[tab]

  const folderNames: Record<Tab, string> = { musica: 'Música', videos: 'Videos', documentos: 'Documentos' }

  return (
    <div className="h-full bg-theme-panel border border-theme rounded-xl flex flex-col overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-theme shrink-0">
        <FolderOpen size={10} className="text-[#00d4ff]" />
        <h3 className="text-[9px] font-semibold text-theme-muted uppercase tracking-wider flex-1">Multimedia</h3>
        <button onClick={async () => { const r = await window.api.medialocal.importFiles(); if (r?.success && r.data != null && (r.data as { imported: number }).imported > 0) loadBiblioteca() }}
          className="p-1 hover:bg-[#6c5ce7]/20 rounded transition-colors" title="Agregar archivos">
          <Plus size={9} className="text-[#6c5ce7]" />
        </button>
        <button onClick={loadBiblioteca} className="p-1 hover:bg-white/5 rounded transition-colors" title="Actualizar">
          <RefreshCw size={9} className="text-theme-dim" />
        </button>
      </div>

      <div className="flex gap-1 px-2 pt-2 shrink-0">
        <button onClick={() => setTab('musica')}
          className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[8px] font-semibold transition-colors ${tab === 'musica' ? 'bg-[#6c5ce7] text-white' : 'bg-theme-card text-theme-dim hover:text-theme'}`}>
          <Music size={10} /> Música ({musica.length})
        </button>
        <button onClick={() => setTab('videos')}
          className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[8px] font-semibold transition-colors ${tab === 'videos' ? 'bg-[#6c5ce7] text-white' : 'bg-theme-card text-theme-dim hover:text-theme'}`}>
          <FileVideo size={10} /> Videos ({videos.length})
        </button>
        <button onClick={() => setTab('documentos')}
          className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[8px] font-semibold transition-colors ${tab === 'documentos' ? 'bg-[#6c5ce7] text-white' : 'bg-theme-card text-theme-dim hover:text-theme'}`}>
          <FileText size={10} /> Docs ({documentos.length})
        </button>
      </div>

      <div className="px-2 pt-1.5 pb-0.5 flex items-center justify-between shrink-0">
        <span className="text-[7px] text-theme-dim uppercase tracking-wider">Archivos locales</span>
        {folderPath && (
          <p className="text-[6px] text-theme-dim truncate max-w-[120px]" title={folderPath}>
            <Folder size={8} className="inline mr-0.5" />{folderPath}
          </p>
        )}
      </div>

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
            <p className="text-[6px] text-gray-500/40 mt-0.5 truncate w-full">{folderPath}\\{folderNames[tab]}</p>
          </div>
        ) : (
          files.map((f) => (
            <div key={f.ruta}
              className={`flex items-center gap-1.5 px-1.5 py-1 rounded cursor-pointer transition-colors text-[9px] group ${tab === 'videos' ? 'hover:ring-1 hover:ring-[#a855f7]/40' : tab === 'documentos' ? 'hover:ring-1 hover:ring-[#f59e0b]/40' : 'hover:bg-theme-card'}`}>
              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                <Icon size={9} className={`${color} shrink-0`} />
                <span className="truncate text-theme">{f.nombre}</span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {tab === 'videos' ? (
                  <button onClick={() => handlePlayVideo(f)}
                    className="p-1 bg-[#6c5ce7]/20 rounded text-[#6c5ce7] hover:bg-[#6c5ce7]/40 transition-colors" title="Proyectar">
                    <Play size={8} />
                  </button>
                ) : tab === 'documentos' ? (
                  <button onClick={() => handleProjectDocument(f)}
                    className="p-1 bg-[#f59e0b]/20 rounded text-[#f59e0b] hover:bg-[#f59e0b]/40 transition-colors" title="Proyectar">
                    <Monitor size={8} />
                  </button>
                ) : (
                  <button onClick={() => handlePlayMusic(f)}
                    className="p-1 bg-[#6c5ce7]/20 rounded text-[#6c5ce7] hover:bg-[#6c5ce7]/40 transition-colors" title="Reproducir">
                    <Play size={8} />
                  </button>
                )}
                {tab === 'videos' && (
                  <button onClick={() => { const fileUrl = f.ruta.startsWith('file://') ? f.ruta : `file:///${f.ruta.replace(/\\/g, '/')}`; onPlayBg?.(fileUrl, f.nombre) }}
                    className="p-1 bg-emerald-600/20 rounded text-emerald-500 hover:bg-emerald-600/40 transition-colors" title="Fondo">
                    <Play size={8} className="opacity-70" />
                  </button>
                )}
                <span className="text-[7px] text-theme-dim">{formatSize(f.tamano)}</span>
                <button onClick={async () => { if (confirm(`¿Eliminar "${f.nombre}"?`)) { await window.api.medialocal.deleteFile(f.ruta); loadBiblioteca() } }}
                  className="p-1 text-theme-dim hover:text-red-400 transition-colors" title="Eliminar">
                  <Trash2 size={7} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

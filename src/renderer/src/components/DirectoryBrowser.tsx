import { useState, useEffect, useMemo } from 'react'
import { FolderOpen, Music, FileVideo, FileText, Folder, Play, RefreshCw, Plus, Trash2, Monitor, Search, SortAsc, SortDesc, X } from 'lucide-react'
import { useLang } from '../i18n'

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

const FILE_ICONS: Record<Tab, { icon: typeof Music; color: string; bg: string }> = {
  musica: { icon: Music, color: 'text-[#00d4ff]', bg: 'bg-[#00d4ff]/10' },
  videos: { icon: FileVideo, color: 'text-[#a855f7]', bg: 'bg-[#a855f7]/10' },
  documentos: { icon: FileText, color: 'text-[#f59e0b]', bg: 'bg-[#f59e0b]/10' }
}

type SortKey = 'nombre' | 'tamano'
type SortDir = 'asc' | 'desc'

const getExt = (name: string) => {
  const i = name.lastIndexOf('.')
  return i > 0 ? name.slice(i + 1).toUpperCase() : ''
}

export default function DirectoryBrowser({ onPlayBg }: DirectoryBrowserProps) {
  const { t } = useLang()
  const [folderPath, setFolderPath] = useState('')
  const [musica, setMusica] = useState<MediaFile[]>([])
  const [videos, setVideos] = useState<MediaFile[]>([])
  const [documentos, setDocumentos] = useState<MediaFile[]>([])
  const [tab, setTab] = useState<Tab>('musica')
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('nombre')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

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
    const fileUrl = 'file:///' + encodeURI(file.ruta.replace(/\\/g, '/'))
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

  const rawFiles = tab === 'musica' ? musica : tab === 'videos' ? videos : documentos
  const total = musica.length + videos.length + documentos.length
  const { icon: Icon, color, bg } = FILE_ICONS[tab]
  const folderNames: Record<Tab, string> = { musica: 'Música', videos: 'Videos', documentos: 'Documentos' }

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const files = useMemo(() => {
    let f = search ? rawFiles.filter(x => x.nombre.toLowerCase().includes(search.toLowerCase())) : rawFiles
    f = [...f].sort((a, b) => {
      const cmp = sortKey === 'nombre' ? a.nombre.localeCompare(b.nombre) : a.tamano - b.tamano
      return sortDir === 'asc' ? cmp : -cmp
    })
    return f
  }, [rawFiles, search, sortKey, sortDir])

  return (
    <div className="h-full bg-theme-panel border border-theme rounded-xl flex flex-col overflow-hidden">
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 border-b border-theme shrink-0">
        <FolderOpen size={10} className="text-[#00d4ff]" />
        <h3 className="text-[12px] font-semibold text-theme-muted uppercase tracking-wider flex-1">{t('media.title')}</h3>
        <button onClick={async () => { const r = await window.api.medialocal.importFiles(); if (r?.success && r.data != null && (r.data as { imported: number }).imported > 0) loadBiblioteca() }}
          className="p-1 hover:bg-[#6c5ce7]/20 rounded transition-colors" title={t('media.add')}>
          <Plus size={10} className="text-[#6c5ce7]" />
        </button>
        <button onClick={loadBiblioteca} className="p-1 hover:bg-white/5 rounded transition-colors" title={t('media.refresh')}>
          <RefreshCw size={10} className="text-theme-dim" />
        </button>
      </div>

      <div className="flex gap-1 px-2 pt-1.5 shrink-0">
        <button onClick={() => setTab('musica')}
          className={`flex-1 flex items-center justify-center gap-1 py-1 rounded-lg text-[12px] font-semibold transition-colors ${tab === 'musica' ? 'bg-[#6c5ce7] text-white' : 'bg-theme-card text-theme-dim hover:text-theme'}`}>
          <Music size={10} /> {musica.length}
        </button>
        <button onClick={() => setTab('videos')}
          className={`flex-1 flex items-center justify-center gap-1 py-1 rounded-lg text-[12px] font-semibold transition-colors ${tab === 'videos' ? 'bg-[#6c5ce7] text-white' : 'bg-theme-card text-theme-dim hover:text-theme'}`}>
          <FileVideo size={10} /> {videos.length}
        </button>
        <button onClick={() => setTab('documentos')}
          className={`flex-1 flex items-center justify-center gap-1 py-1 rounded-lg text-[12px] font-semibold transition-colors ${tab === 'documentos' ? 'bg-[#6c5ce7] text-white' : 'bg-theme-card text-theme-dim hover:text-theme'}`}>
          <FileText size={10} /> {documentos.length}
        </button>
      </div>

      <div className="flex items-center gap-1 px-2 pt-1 shrink-0">
        <div className="relative flex-1">
          <Search size={9} className="absolute left-1.5 top-1/2 -translate-y-1/2 text-theme-dim" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder={t('media.search')}
            className="w-full pl-4 pr-5 py-0.5 bg-theme-card rounded text-[12px] text-theme placeholder:text-theme-dim border border-theme outline-none focus:border-[#6c5ce7]/50 transition-colors" />
          {search && (
            <button onClick={() => setSearch('')}
              className="absolute right-1 top-1/2 -translate-y-1/2 p-0.5 text-theme-dim hover:text-theme transition-colors">
              <X size={8} />
            </button>
          )}
        </div>
        <button onClick={() => toggleSort('nombre')}
          className={`p-0.5 rounded transition-colors ${sortKey === 'nombre' ? 'text-[#6c5ce7]' : 'text-theme-dim hover:text-theme'}`} title="Ordenar por nombre">
          {sortKey === 'nombre' && sortDir === 'asc' ? <SortAsc size={9} /> : <SortDesc size={9} />}
        </button>
        <button onClick={() => toggleSort('tamano')}
          className={`p-0.5 rounded transition-colors ${sortKey === 'tamano' ? 'text-[#6c5ce7]' : 'text-theme-dim hover:text-theme'}`} title="Ordenar por tamaño">
          {sortKey === 'tamano' && sortDir === 'asc' ? <SortAsc size={9} /> : <SortDesc size={9} />}
        </button>
      </div>
      {search && (
        <div className="px-2 pt-0.5 shrink-0">
          <p className="text-[12px] text-theme-dim">{files.length} de {rawFiles.length} resultados</p>
        </div>
      )}

      {folderPath && (
        <div className="px-2 py-0.5 shrink-0">
          <p className="text-[12px] text-theme-dim truncate" title={folderPath}>
            <Folder size={9} className="inline mr-0.5" />{folderPath}
          </p>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-1 space-y-0.5">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-[12px] text-gray-500">Cargando...</p>
          </div>
        ) : files.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <FolderOpen size={18} className="text-gray-500/30 mb-1.5" />
            <p className="text-[12px] text-gray-500">{search ? t('media.noResults') : t('media.empty')}</p>
            {!search && <p className="text-[12px] text-gray-500/60 mt-0.5">Agrega archivos con +</p>}
          </div>
        ) : (
          files.map((f) => {
            const ext = getExt(f.nombre)
            return (
              <div key={f.ruta}
                className={`flex items-center gap-1.5 px-1.5 py-1 rounded cursor-pointer transition-all text-[12px] group hover:bg-white/[0.03] ${tab === 'videos' ? 'hover:ring-1 hover:ring-[#a855f7]/20' : tab === 'documentos' ? 'hover:ring-1 hover:ring-[#f59e0b]/20' : ''}`}>
                <div className={`w-6 h-6 rounded flex items-center justify-center shrink-0 ${bg}`}>
                  <Icon size={12} className={color} />
                </div>
                <div className="flex-1 min-w-0 flex items-center gap-1">
                  <span className="truncate text-theme">{f.nombre}</span>
                  <span className="text-[12px] text-theme-dim/50 uppercase shrink-0">{ext}</span>
                </div>
                <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  {tab === 'videos' ? (
                    <>
                      <button onClick={() => handlePlayVideo(f)}
                        className="p-1 bg-[#6c5ce7]/20 rounded text-[#6c5ce7] hover:bg-[#6c5ce7]/40 transition-colors" title="Proyectar">
                        <Play size={10} />
                      </button>
                      <button onClick={() => { const fileUrl = 'file:///' + encodeURI(f.ruta.replace(/\\/g, '/')); onPlayBg?.(fileUrl, f.nombre) }}
                        className="p-1 bg-emerald-600/20 rounded text-emerald-500 hover:bg-emerald-600/40 transition-colors" title="Fondo">
                        <Play size={10} className="opacity-70" />
                      </button>
                    </>
                  ) : tab === 'documentos' ? (
                    <button onClick={() => handleProjectDocument(f)}
                      className="p-1 bg-[#f59e0b]/20 rounded text-[#f59e0b] hover:bg-[#f59e0b]/40 transition-colors" title="Proyectar">
                      <Monitor size={10} />
                    </button>
                  ) : (
                    <button onClick={() => handlePlayMusic(f)}
                      className="p-1 bg-[#6c5ce7]/20 rounded text-[#6c5ce7] hover:bg-[#6c5ce7]/40 transition-colors" title="Reproducir">
                      <Play size={10} />
                    </button>
                  )}
                  <button onClick={async () => { if (confirm(`¿Eliminar "${f.nombre}"?`)) { await window.api.medialocal.deleteFile(f.ruta); loadBiblioteca() } }}
                    className="p-1 text-theme-dim hover:text-red-400 transition-colors" title="Eliminar">
                    <Trash2 size={9} />
                  </button>
                </div>
                <span className="text-[12px] text-theme-dim">{formatSize(f.tamano)}</span>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

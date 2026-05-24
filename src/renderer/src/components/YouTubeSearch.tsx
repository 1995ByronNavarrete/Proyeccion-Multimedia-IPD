import { useState, useEffect, useRef } from 'react'
import { Youtube, Search, Play, Pause, Loader2, Check } from 'lucide-react'

interface YTResult {
  id: string
  title: string
  channel: string
  thumbnail: string
  description: string
}

interface YouTubeSearchProps {
  onPlayBg?: (url: string, title: string) => void
}

export default function YouTubeSearch({ onPlayBg }: YouTubeSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<YTResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [playing, setPlaying] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [playingIds, setPlayingIds] = useState<Set<string>>(new Set())
  const [bgLoading, setBgLoading] = useState(false)
  const [projectingTitle, setProjectingTitle] = useState<string | null>(null)
  const [projectingBg, setProjectingBg] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout>>()

  const [pausedId, setPausedId] = useState<string | null>(null)
  const playingIdsRef = useRef(playingIds)
  playingIdsRef.current = playingIds

  useEffect(() => {
    const unsub = window.api.on('video:progress', (arg: unknown) => {
      const data = arg as { title: string; paused: boolean; duration?: number }
      if (!data.title && data.duration === 0) { setPlayingIds(new Set()); setPausedId(null); return }
      if (data.title && data.duration !== undefined) {
        const currentId = playingIdsRef.current.values().next().value
        if (currentId) {
          setPausedId(data.paused ? currentId : null)
        }
      }
    })
    return () => { unsub?.() }
  }, [])

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (!query.trim()) { setResults([]); setError(''); return }
    timerRef.current = setTimeout(() => doSearch(), 400)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [query])

  const doSearch = async () => {
    if (!query.trim()) return
    setLoading(true)
    setError('')
    const res = await window.api.ytdl.search(query.trim())
    if (res.success) {
      setResults(res.data)
      if (!res.data.length) setError('Sin resultados')
    } else {
      setError(res.error || 'Error al buscar')
    }
    setLoading(false)
  }

  const handlePlay = async (item: YTResult) => {
    if (playingIds.has(item.id)) {
      if (pausedId === item.id) {
        await window.api.video.resume()
        setPausedId(null)
      } else {
        await window.api.video.pause()
        setPausedId(item.id)
      }
      return
    }
    setError('')
    setPlaying(true)
    setActiveId(item.id)
    setProjectingTitle(item.title)
    setProjectingBg(false)
    // Stop current video if switching to a different one
    if (playingIds.size > 0) {
      await window.api.video.stop()
    }
    setPlayingIds(new Set([item.id]))
    try {
      const streamRes = await window.api.ytdl.getStreamUrl(item.id)
      if (streamRes.success && streamRes.data?.url) {
        await window.api.video.play(streamRes.data.url, streamRes.data.title || item.title, streamRes.data.duration)
      } else {
        // Fallback a embed si no se pudo obtener stream
        const embedUrl = `https://www.youtube.com/embed/${item.id}?autoplay=1&enablejsapi=1&controls=0&rel=0&showinfo=0`
        await window.api.video.play(embedUrl, item.title)
      }
    } catch {
      const embedUrl = `https://www.youtube.com/embed/${item.id}?autoplay=1&enablejsapi=1&controls=0&rel=0&showinfo=0`
      await window.api.video.play(embedUrl, item.title)
      setActiveId(item.id)
    }
    setPlaying(false)
    setProjectingTitle(null)
  }

  const handlePlayBg = async (item: YTResult) => {
    setBgLoading(true)
    setProjectingTitle(item.title)
    setProjectingBg(true)
    try {
      const streamRes = await window.api.ytdl.getStreamUrl(item.id)
      if (streamRes.success && streamRes.data?.url) {
        onPlayBg?.(streamRes.data.url, item.title)
      } else {
        const embedUrl = `https://www.youtube.com/embed/${item.id}?autoplay=1&enablejsapi=1&controls=0&rel=0&showinfo=0`
        onPlayBg?.(embedUrl, item.title)
      }
    } catch {
      const embedUrl = `https://www.youtube.com/embed/${item.id}?autoplay=1&enablejsapi=1&controls=0&rel=0&showinfo=0`
      onPlayBg?.(embedUrl, item.title)
    }
    setBgLoading(false)
    setProjectingTitle(null)
  }

  return (
    <div className="h-full bg-theme-panel border border-theme rounded-xl flex flex-col overflow-hidden relative">
      {projectingTitle && (
        <div className="absolute inset-0 z-10 bg-[rgba(5,8,22,0.95)] flex flex-col items-center justify-center gap-2">
          <Loader2 size={24} className="animate-spin text-[#6c5ce7]" />
          <p className="text-[10px] text-theme-dim text-center px-4">{projectingBg ? 'Preparando video de fondo...' : 'Preparando proyección...'}</p>
          <p className="text-[9px] text-[#6c5ce7] text-center px-4 truncate max-w-full">{projectingTitle}</p>
        </div>
      )}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-theme">
        <Youtube size={12} className="text-red-500 shrink-0" />
        <h3 className="text-[10px] font-semibold text-theme-muted uppercase tracking-wider">YouTube</h3>
      </div>

      <div className="p-2">
        <div className="flex gap-1">
          <input type="text" value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar en YouTube..."
            className="flex-1 px-2 py-1.5 bg-theme-card rounded text-[10px] text-theme placeholder:text-theme-dim border border-theme outline-none focus:border-[#6c5ce7]" />
          <button onClick={doSearch}
            className="px-2.5 py-1.5 bg-red-600/80 rounded text-[10px] hover:bg-red-600 transition-colors text-white">
            <Search size={11} />
          </button>
        </div>
      </div>

      {error && !loading && (
        <div className="px-2 pb-1">
          <p className="text-[9px] text-red-400">{error}</p>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-1">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-[10px] text-theme-dim">Buscando...</p>
          </div>
        ) : results.length === 0 ? (
          <div className="flex items-center justify-center h-full px-4 text-center">
            <p className="text-[9px] text-theme-dim">Busca videos para proyectar</p>
          </div>
        ) : (
          results.map((r) => (
            <div key={r.id} className="flex gap-2 p-1.5 bg-theme-card rounded-lg hover:bg-theme-card/80 transition-colors group">
              {r.thumbnail ? (
                <img src={r.thumbnail} alt="" className="w-10 h-7 rounded object-cover shrink-0" />
              ) : (
                <div className="w-10 h-7 bg-theme rounded shrink-0 flex items-center justify-center">
                  <Youtube size={10} className="text-red-500/50" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-[9px] text-theme truncate font-medium">{r.title}</p>
                <p className="text-[8px] text-theme-dim truncate">{r.channel}</p>
              </div>
              <button onClick={() => handlePlay(r)} disabled={playing}
                className={`p-1.5 rounded transition-all duration-200 shrink-0 self-center disabled:opacity-40 scale-100 active:scale-90 ${playingIds.has(r.id) ? (pausedId === r.id ? 'bg-amber-500/30 text-amber-400' : 'bg-green-600/30 text-green-400 cursor-default') : 'bg-[#6c5ce7]/20 text-[#6c5ce7] hover:bg-[#6c5ce7]/40'}`} title={playingIds.has(r.id) ? (pausedId === r.id ? 'Reanudar' : 'En ejecución') : 'Proyectar'}>
                {playing && activeId === r.id ? <Loader2 size={10} className="animate-spin" /> : playingIds.has(r.id) ? (pausedId === r.id ? <Play size={10} /> : <Check size={10} />) : <Play size={10} />}
              </button>
              <button onClick={() => handlePlayBg(r)} disabled={bgLoading}
                className="p-1.5 bg-emerald-600/20 rounded text-emerald-500 hover:bg-emerald-600/40 transition-colors shrink-0 self-center disabled:opacity-40 text-[7px] font-bold" title="Fondo para pantalla secundaria">
                {bgLoading ? <Loader2 size={8} className="animate-spin" /> : 'FONDO'}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

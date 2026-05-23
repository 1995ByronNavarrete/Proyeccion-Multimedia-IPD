import { useState, useEffect, useRef, useCallback } from 'react'
import { Play, Pause, Music, Film, List } from 'lucide-react'
import { useLang } from '../i18n'

interface MediaItem {
  id: number
  nombre: string
  ruta_archivo: string
  tipo: 'audio' | 'video'
}

interface ReproductorPanelProps {
  onPlayBg?: (url: string, title: string) => void
}

export default function ReproductorPanel({ onPlayBg }: ReproductorPanelProps) {
  const { t } = useLang()
  const [playing, setPlaying] = useState(false)
  const [activePath, setActivePath] = useState<string | null>(null)
  const [currentTrack, setCurrentTrack] = useState<string | null>(null)
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
  const [currentTime, setCurrentTime] = useState(0)

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ''
        if (audioRef.current.parentNode) audioRef.current.parentNode.removeChild(audioRef.current)
        audioRef.current = null
      }
      if (audioCtxRef.current) { audioCtxRef.current.close(); audioCtxRef.current = null }
    }
  }, [])
  const [duration, setDuration] = useState(0)
  const [showList, setShowList] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)

  const loadMedia = useCallback(() => {
    window.api.medialocal.getAll().then((res) => {
      if (res.success && res.data) setMediaItems(res.data)
    })
  }, [])

  useEffect(() => {
    loadMedia()
    const unsub = window.api.on('medialocal:changed', loadMedia)
    return () => { unsub?.() }
  }, [loadMedia])

  // Web Audio API for EQ/FX
  const audioCtxRef = useRef<AudioContext | null>(null)
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null)
  const filtersRef = useRef<BiquadFilterNode[]>([])
  const gainNodeRef = useRef<GainNode | null>(null)
  const pannerRef = useRef<StereoPannerNode | null>(null)

  const initAudioGraph = useCallback(() => {
    if (!audioRef.current || audioCtxRef.current) return
    const ctx = new AudioContext()
    audioCtxRef.current = ctx
    const source = ctx.createMediaElementSource(audioRef.current)
    sourceRef.current = source
    const panner = ctx.createStereoPanner()
    pannerRef.current = panner
    const gain = ctx.createGain()
    gainNodeRef.current = gain
    const freqs = [32, 64, 125, 250, 500, 1000, 4000, 16000]
    const filters = freqs.map(f => {
      const filter = ctx.createBiquadFilter()
      filter.type = f < 100 ? 'lowshelf' : f > 3000 ? 'highshelf' : 'peaking'
      filter.frequency.value = f
      filter.gain.value = 0
      filter.Q.value = 1
      return filter
    })
    filtersRef.current = filters
    source.connect(filters[0])
    for (let i = 0; i < filters.length - 1; i++) filters[i].connect(filters[i + 1])
    filters[filters.length - 1].connect(panner)
    panner.connect(gain)
    gain.connect(ctx.destination)
  }, [])

  useEffect(() => {
    const eqHandler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { bands: number[]; labels: string[] }
      initAudioGraph()
      detail.bands.forEach((band, i) => {
        if (filtersRef.current[i]) filtersRef.current[i].gain.value = band
      })
    }
    const fxHandler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { id: string; value: number }[]
      const bass = detail.find(f => f.id === 'bass')?.value || 0
      const treble = detail.find(f => f.id === 'treble')?.value || 0
      const reverb = detail.find(f => f.id === 'reverb')?.value || 0
      initAudioGraph()
      if (gainNodeRef.current) {
        const vol = Math.min(1.5, 0.8 + (bass - 50) * 0.005 + (treble - 50) * 0.003 + (reverb - 50) * 0.002)
        gainNodeRef.current.gain.value = vol
      }
    }
    window.addEventListener('audio:eq', eqHandler)
    window.addEventListener('audio:fx', fxHandler)
    const balanceHandler = (e: Event) => {
      const val = (e as CustomEvent).detail as number
      initAudioGraph()
      if (pannerRef.current) pannerRef.current.pan.value = val / 100
    }
    window.addEventListener('audio:balance', balanceHandler)
    return () => { window.removeEventListener('audio:eq', eqHandler); window.removeEventListener('audio:fx', fxHandler); window.removeEventListener('audio:balance', balanceHandler) }
  }, [initAudioGraph])

  // Equalizer canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !playing) return
    const ctx = canvas.getContext('2d')!
    let time = 0

    const draw = () => {
      time += 0.03
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const bars = 5
      const w = canvas.width / bars - 2

      for (let i = 0; i < bars; i++) {
        const h = Math.abs(Math.sin(time * (1.5 + i * 0.3)) * Math.cos(time * 0.5 + i * 0.5)) * canvas.height * 0.7 + 2
        const x = i * (w + 2)
        const grad = ctx.createLinearGradient(0, canvas.height, 0, canvas.height - h)
        grad.addColorStop(0, '#6c5ce7')
        grad.addColorStop(1, i % 2 === 0 ? '#a855f7' : '#00d4ff')
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.roundRect(x, canvas.height - h, w, h, [1, 1, 0, 0])
        ctx.fill()
      }
      animRef.current = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(animRef.current)
  }, [playing])

  const updateTime = useCallback(() => {
    if (!audioRef.current) return
    setCurrentTime(audioRef.current.currentTime)
    setDuration(audioRef.current.duration || 0)
  }, [])

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(updateTime, 250)
  }, [updateTime])

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
  }, [])

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { id: string; volume: number }
      if (detail.id === 'player' && audioRef.current) audioRef.current.volume = detail.volume / 100
    }
    window.addEventListener('audio:volume-change', handler)
    return () => window.removeEventListener('audio:volume-change', handler)
  }, [])

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { ruta: string; nombre: string; tipo: string }
      if (detail.tipo === 'video') {
        window.api.video.play(detail.ruta.startsWith('file://') ? detail.ruta : `file:///${detail.ruta.replace(/\\/g, '/')}`, detail.nombre)
      } else {
        setPlaying(true)
        tryPlayAudio(detail.ruta, detail.nombre, () => { setCurrentTrack(detail.nombre); setActivePath(detail.ruta); startTimer() })
      }
    }
    window.addEventListener('play-media', handler)
    return () => window.removeEventListener('play-media', handler)
  }, [mediaItems, startTimer, stopTimer, updateTime])

  const tryPlayAudio = (ruta: string, nombre: string, cb: () => void) => {
    if (!audioRef.current) { audioRef.current = new Audio(); audioRef.current.dataset.volume = 'player'; audioRef.current.style.display = 'none'; document.body.appendChild(audioRef.current) }
    const fileUrl = ruta.startsWith('file://') ? ruta : `file:///${ruta.replace(/\\/g, '/')}`
    audioRef.current.src = fileUrl
    audioRef.current.volume = 0.8
    const onEnded = () => { setPlaying(false); stopTimer() }
    const onMeta = () => updateTime()
    const onError = () => {
      audioRef.current!.removeEventListener('ended', onEnded)
      audioRef.current!.removeEventListener('loadedmetadata', onMeta)
      audioRef.current!.src = ''
      alert(`"${nombre}" ${t('player.errorNotPlayable')}`)
      setPlaying(false)
    }
    audioRef.current.addEventListener('ended', onEnded, { once: true })
    audioRef.current.addEventListener('loadedmetadata', onMeta, { once: true })
    audioRef.current.addEventListener('error', onError, { once: true })
    const p = audioRef.current.play()
    if (p !== undefined) p.then(cb).catch(() => {
      audioRef.current!.removeEventListener('ended', onEnded)
      audioRef.current!.removeEventListener('loadedmetadata', onMeta)
      alert(`${t('player.couldNotPlay')} "${nombre}".`)
    })
  }

  const playAudio = (item: MediaItem) => { setPlaying(true); tryPlayAudio(item.ruta_archivo, item.nombre, () => { setCurrentTrack(item.nombre); setActivePath(item.ruta_archivo); startTimer() }) }
  const playVideo = async (item: MediaItem) => { setCurrentTrack(item.nombre); setActivePath(item.ruta_archivo); setPlaying(true); await window.api.video.play(item.ruta_archivo.startsWith('file://') ? item.ruta_archivo : `file:///${item.ruta_archivo.replace(/\\/g, '/')}`, item.nombre) }
  const handlePlayMedia = (item: MediaItem) => { if (item.tipo === 'video') playVideo(item); else playAudio(item) }
  const togglePlayPause = () => { if (!audioRef.current || !activePath) return; if (playing) { audioRef.current.pause(); setPlaying(false); stopTimer() } else { audioRef.current.play().catch(() => {}); setPlaying(true); startTimer() } }
  const stopAudio = () => { if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = '' }; setPlaying(false); setCurrentTrack(null); setActivePath(null); setCurrentTime(0); setDuration(0); stopTimer() }
  const seek = (e: React.MouseEvent<HTMLDivElement>) => { if (!audioRef.current || !duration) return; const r = e.currentTarget.getBoundingClientRect(); const p = (e.clientX - r.left) / r.width; audioRef.current.currentTime = p * duration; setCurrentTime(p * duration) }
  const formatTime = (s: number) => { const m = Math.floor(s / 60); return `${m}:${Math.floor(s % 60).toString().padStart(2, '0')}` }
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className="bg-theme-panel border border-theme rounded-xl flex flex-col overflow-hidden">
      {/* Header with visual identity */}
      <div className="relative px-3 py-3 border-b border-theme shrink-0 bg-gradient-to-r from-[#6c5ce7]/10 to-transparent">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${currentTrack ? 'bg-[#6c5ce7]' : 'bg-theme-card'} transition-colors shadow-sm`}>
            {playing ? (
              <canvas ref={canvasRef} width={24} height={20} className="w-6 h-5" />
            ) : (
              <Music size={16} className={currentTrack ? 'text-white' : 'text-theme-dim'} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-bold truncate ${currentTrack ? 'text-white' : 'text-theme-dim'}`}>
              {currentTrack || t('player.title')}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            {currentTrack && (
              <span className={`w-2 h-2 rounded-full ${playing ? 'bg-green-500 animate-pulse' : 'bg-theme-dim'}`} />
            )}
            {mediaItems.length > 0 && (
              <button onClick={() => setShowList(!showList)}
                className={`p-1 rounded transition-colors ${showList ? 'bg-[#6c5ce7]/20 text-[#6c5ce7]' : 'text-theme-dim hover:text-theme'}`}>
                <List size={11} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Now playing area - always visible */}
      <div className="shrink-0 px-3 py-2">
        <div className="flex items-center gap-2">
          <button onClick={currentTrack ? togglePlayPause : undefined}
            className="w-7 h-7 bg-[#6c5ce7] rounded-full flex items-center justify-center hover:bg-[#5a4bd1] transition-colors shrink-0 shadow-sm shadow-[#6c5ce7]/30 disabled:opacity-40 disabled:cursor-not-allowed"
            disabled={!currentTrack}>
            {currentTrack && playing ? <Pause size={11} className="text-white" /> : <Play size={11} className="text-white ml-0.5" />}
          </button>
          <div className="flex-1 relative h-2.5 bg-theme-card rounded-full cursor-pointer overflow-hidden group" onClick={currentTrack ? seek : undefined}>
            <div className="h-full bg-gradient-to-r from-[#6c5ce7] to-[#a855f7] rounded-full transition-all duration-200" style={{ width: `${progress}%` }} />
          </div>
          <span className="text-[9px] text-theme-dim font-mono tabular-nums w-14 text-right shrink-0">{formatTime(currentTime)}/{duration > 0 ? formatTime(duration) : '--:--'}</span>
        </div>
      </div>



      {/* Playlist as collapsible */}
      {showList && mediaItems.length > 0 && (
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1 border-t border-theme bg-black/10">
          <div className="flex items-center gap-1.5 px-1 py-1">
            <Music size={9} className="text-theme-dim" />
            <span className="text-[8px] text-theme-dim font-semibold uppercase tracking-wider">{t('player.playlist')}</span>
            <span className="text-[8px] text-theme-dim ml-auto">{mediaItems.length}</span>
          </div>
          {mediaItems.map((item) => (
            <div key={item.id} onClick={() => handlePlayMedia(item)}
              className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer text-[10px] transition-all group ${activePath === item.ruta_archivo ? 'bg-green-500/15 text-green-400 ring-1 ring-green-500/30' : 'text-theme-dim hover:bg-theme-card hover:text-theme'}`}>
              <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${activePath === item.ruta_archivo ? 'bg-green-500/20' : 'bg-theme-card'}`}>
                {item.tipo === 'video' ? <Film size={7} className="text-[#a855f7]" /> : <Music size={7} className={activePath === item.ruta_archivo ? 'text-green-400' : 'text-[#6c5ce7]'} />}
              </div>
              <span className="truncate flex-1">{item.nombre}</span>
              {item.tipo === 'video' && (
                <button onClick={(e) => { e.stopPropagation(); const fileUrl = item.ruta_archivo.startsWith('file://') ? item.ruta_archivo : `file:///${item.ruta_archivo.replace(/\\/g, '/')}`; onPlayBg?.(fileUrl, item.nombre) }}
                  className="text-[7px] px-1.5 py-0.5 bg-emerald-600/15 text-emerald-500/70 rounded hover:bg-emerald-600/30 hover:text-emerald-400 opacity-0 group-hover:opacity-100 transition-all">
                  {t('player.fondo')}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

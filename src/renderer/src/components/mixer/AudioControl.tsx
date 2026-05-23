import { useState, useEffect, useRef } from 'react'
import {
  Volume2, VolumeX,
  Monitor, Disc, Headphones, Mic,
  AudioLines, RotateCcw, Undo2
} from 'lucide-react'
import { useLang } from '../../i18n'

interface Channel {
  id: string
  labelKey: string
  icon: typeof Volume2
  volume: number
  muted: boolean
  solo: boolean
  color: string
  source: string
}

const defaultChannels: Channel[] = [
  { id: 'proj', labelKey: 'audio.channelProj', icon: Monitor, volume: 80, muted: false, solo: false, color: '#6c5ce7', source: 'YouTube / Videos' },
  { id: 'bg', labelKey: 'audio.channelBg', icon: Disc, volume: 55, muted: false, solo: false, color: '#00d4ff', source: 'Video Fondo' },
  { id: 'player', labelKey: 'audio.channelPlayer', icon: Headphones, volume: 75, muted: false, solo: false, color: '#a855f7', source: 'Audio Local' },
  { id: 'mic', labelKey: 'audio.channelMic', icon: Mic, volume: 65, muted: false, solo: false, color: '#ef4444', source: 'Entrada Micro' },
]

export default function AudioControl() {
  const { t } = useLang()
  const [channels, setChannels] = useState<Channel[]>(defaultChannels)
  const [masterFader, setMasterFader] = useState(80)
  const [balance, setBalance] = useState(0)
  const [tab, setTab] = useState<'mixer' | 'effects' | 'eq'>('mixer')
  const [fadeActive, setFadeActive] = useState(false)
  const fadeTimerRef = useRef<ReturnType<typeof setInterval>>()
  const [eqBands, setEqBands] = useState([0, 0, 0, 0, 0, 0, 0, 0])
  const eqLabels = ['32', '64', '125', '250', '500', '1k', '4k', '16k']
  const [fxValues, setFxValues] = useState([
    { id: 'reverb', label: 'Reverb', value: 30, icon: '↗' },
    { id: 'echo', label: 'Echo', value: 20, icon: '↔' },
    { id: 'bass', label: 'Bass Boost', value: 40, icon: '🔊' },
    { id: 'treble', label: 'Treble', value: 50, icon: '🎵' },
    { id: 'comp', label: 'Compresor', value: 35, icon: '⬆' },
    { id: 'gate', label: 'Noise Gate', value: 15, icon: '🚫' },
  ])
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)

  const applyVolume = (id: string, vol: number) => {
    try {
      if (id === 'proj') window.api.video.setVolume(vol)
      if (id === 'bg') {
        document.querySelectorAll<HTMLVideoElement>('video[data-volume="bg"]').forEach(el => { el.volume = vol / 100 })
        document.querySelectorAll<HTMLIFrameElement>('iframe[data-volume="bg"]').forEach(el => {
          el.contentWindow?.postMessage(JSON.stringify({ event: 'command', func: 'setVolume', args: [vol] }), '*')
        })
      }
      if (id === 'player') {
        document.querySelectorAll<HTMLAudioElement>('audio[data-volume="player"]').forEach(el => { el.volume = vol / 100 })
      }
    } catch {}
  }

  const setChannelVol = (id: string, vol: number) => {
    setChannels(prev => prev.map(ch => ch.id === id ? { ...ch, volume: vol } : ch))
    applyVolume(id, vol)
    window.dispatchEvent(new CustomEvent('audio:volume-change', { detail: { id, volume: vol } }))
  }

  const toggleMute = (id: string) => {
    setChannels(prev => prev.map(ch => {
      if (ch.id !== id) return ch
      const newMuted = !ch.muted
      applyVolume(id, newMuted ? 0 : ch.volume)
      window.dispatchEvent(new CustomEvent('audio:volume-change', { detail: { id, volume: newMuted ? 0 : ch.volume } }))
      return { ...ch, muted: newMuted }
    }))
  }

  const toggleSolo = (id: string) => {
    setChannels(prev => prev.map(ch => ch.id === id ? { ...ch, solo: !ch.solo } : ch))
  }

  const soloActive = channels.some(c => c.solo)
  const allMuted = channels.every(c => c.muted)

  // Visualizer
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    let time = 0

    const draw = () => {
      time += 0.02
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const spacing = canvas.width / (channels.length + 1)

      channels.forEach((ch, i) => {
        const cx = spacing * (i + 1)
        const amp = ch.muted ? 0.05 : (ch.volume / 100) * (masterFader / 100)
        const h = Math.abs(Math.sin(time * 2 + i * 0.7) * Math.cos(time * 0.8 + i * 0.3)) * 28 * amp + 2
        const grad = ctx.createLinearGradient(0, canvas.height, 0, canvas.height - h)
        grad.addColorStop(0, ch.color)
        grad.addColorStop(1, i % 2 === 0 ? '#a855f7' : '#6c5ce7')
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.roundRect(cx - 3, canvas.height - h, 6, h, [1, 1, 0, 0])
        ctx.fill()
        ctx.beginPath()
        ctx.arc(cx, canvas.height - h - 2, 1.5, 0, Math.PI * 2)
        ctx.fillStyle = ch.solo ? '#fbbf24' : ch.muted ? '#ef4444' : ch.color
        ctx.fill()
      })
      animRef.current = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(animRef.current)
  }, [channels, masterFader])

  const setMaster = (val: number) => {
    setMasterFader(val)
    channels.forEach(ch => {
      const scaled = Math.round(ch.volume * val / 100)
      applyVolume(ch.id, scaled)
    })
  }

  const clearFade = () => { if (fadeTimerRef.current) { clearInterval(fadeTimerRef.current); fadeTimerRef.current = undefined } }

  const fadeOut = () => {
    if (fadeActive) return
    setFadeActive(true)
    let v = masterFader
    fadeTimerRef.current = setInterval(() => { v -= 3; if (v <= 0) { clearFade(); setMasterFader(0); channels.forEach(ch => applyVolume(ch.id, 0)); setFadeActive(false) } else setMaster(v) }, 50)
  }

  const fadeIn = () => {
    if (fadeActive) return
    setFadeActive(true)
    const target = masterFader
    let v = 0
    fadeTimerRef.current = setInterval(() => { v += 3; if (v >= target) { clearFade(); setMasterFader(target); channels.forEach(ch => applyVolume(ch.id, Math.round(ch.volume * target / 100))); setFadeActive(false) } else setMaster(v) }, 50)
  }

  useEffect(() => { return () => clearFade() }, [])

  return (
    <div className="h-full bg-theme-panel border border-theme rounded-xl flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-theme shrink-0 bg-gradient-to-r from-[#6c5ce7]/5 to-transparent">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-lg bg-gradient-to-br from-[#6c5ce7] to-[#a855f7] flex items-center justify-center">
            <AudioLines size={10} className="text-white" />
          </div>
          <h3 className="text-[9px] font-bold text-theme tracking-wider uppercase">{t('audio.console')}</h3>
          {allMuted && <span className="text-[7px] bg-red-500/20 text-red-400 px-1.5 rounded font-bold">{t('audio.mutedLabel')}</span>}
          {soloActive && <span className="text-[7px] bg-amber-500/20 text-amber-400 px-1.5 rounded font-bold">{t('audio.soloLabel')}</span>}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-theme shrink-0">
        {(['mixer', 'effects', 'eq'] as const).map(tk => (
          <button key={tk} onClick={() => setTab(tk)}
            className={`flex-1 text-[7px] py-1.5 font-semibold uppercase tracking-wider transition-colors ${tab === tk ? 'text-[#6c5ce7] border-b-2 border-[#6c5ce7] bg-[#6c5ce7]/5' : 'text-theme-dim hover:text-theme'}`}>
            {tk === 'mixer' ? `🎚 ${t('audio.mixer')}` : tk === 'effects' ? `✨ ${t('audio.fx')}` : `📊 ${t('audio.eq')}`}
          </button>
        ))}
      </div>

      {/* VU Meter */}
      <div className="px-2 pt-1.5">
        <canvas ref={canvasRef} width={240} height={32} className="w-full h-8 bg-black/40 rounded border border-theme" />
      </div>

      {tab === 'mixer' && (
        <div className="flex-1 flex flex-col p-1.5 gap-1 overflow-hidden">
          {/* Master */}
          <div className="flex items-center gap-2 px-1 py-1.5 bg-theme-card/50 rounded-lg border border-theme">
            <button onClick={() => { const all = !allMuted; channels.forEach(c => { applyVolume(c.id, all ? c.volume : 0); setChannels(prev => prev.map(p => p.id === c.id ? { ...p, muted: !all } : p)) }) }}
              className="p-1 hover:bg-white/5 rounded shrink-0">
              {allMuted ? <VolumeX size={14} className="text-red-400" /> : <Volume2 size={14} className="text-[#6c5ce7]" />}
            </button>
            <span className="text-[7px] text-theme-dim font-bold w-8 shrink-0">{t('audio.master')}</span>
            <input type="range" min={0} max={100} value={allMuted ? 0 : masterFader}
              onChange={e => setMaster(Number(e.target.value))}
              className="flex-1 h-1 accent-[#6c5ce7]" />
            <span className="text-[8px] text-theme-dim w-8 text-right tabular-nums font-mono">{masterFader}%</span>
            <div className="flex gap-0.5">
              <button onClick={fadeOut} disabled={fadeActive}
                className="px-1.5 py-0.5 bg-red-500/10 text-red-400 rounded text-[7px] hover:bg-red-500/20 disabled:opacity-30 font-bold">{t('audio.fadeOut')}</button>
              <button onClick={fadeIn} disabled={fadeActive}
                className="px-1.5 py-0.5 bg-green-500/10 text-green-400 rounded text-[7px] hover:bg-green-500/20 disabled:opacity-30 font-bold">{t('audio.fadeIn')}</button>
            </div>
          </div>

          {/* Channel strips */}
          <div className="flex-1 flex gap-1 overflow-x-auto min-h-0 pb-0.5">
            {channels.map(ch => (
              <div key={ch.id} className={`flex-1 min-w-[60px] bg-theme-card/30 rounded-lg border flex flex-col ${ch.muted ? 'border-red-500/20' : ch.solo ? 'border-amber-500/50' : 'border-theme'}`}>
                <div className={`px-1 py-1 text-center border-b ${ch.muted ? 'border-red-500/20 bg-red-500/5' : ch.solo ? 'border-amber-500/30 bg-amber-500/10' : 'border-theme'}`}>
                  <ch.icon size={10} style={{ color: ch.color }} className="mx-auto" />
                  <p className="text-[6px] font-bold truncate text-theme">{t(ch.labelKey)}</p>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center px-1 py-1 gap-0.5">
                  <input type="range" min={0} max={100} value={ch.muted ? 0 : ch.volume}
                    onChange={e => setChannelVol(ch.id, Number(e.target.value))}
                    className="w-full h-12 accent-[#6c5ce7]"
                    style={{ writingMode: 'vertical-lr' as any, direction: 'rtl', accentColor: ch.color }} />
                  <span className="text-[8px] font-mono tabular-nums" style={{ color: ch.color }}>{ch.volume}%</span>
                </div>
                <div className="flex border-t border-theme">
                  <button onClick={() => toggleMute(ch.id)}
                    className={`flex-1 text-[6px] py-1 font-bold transition-colors ${ch.muted ? 'bg-red-500/20 text-red-400' : 'text-theme-dim hover:text-theme'}`}>{t('audio.mute')}</button>
                  <button onClick={() => toggleSolo(ch.id)}
                    className={`flex-1 text-[6px] py-1 font-bold transition-colors ${ch.solo ? 'bg-amber-500/20 text-amber-400' : 'text-theme-dim hover:text-theme'}`}>{t('audio.solo')}</button>
                </div>
              </div>
            ))}
          </div>

          {/* Balance */}
          <div className="flex items-center gap-2 px-1 py-1 bg-theme-card/30 rounded-lg border border-theme">
            <span className="text-[7px] text-theme-dim font-bold w-8">{t('audio.balance')}</span>
            <span className="text-[7px] text-theme-dim w-6 text-right">{t('audio.left')}</span>
            <input type="range" min={-100} max={100} value={balance} onChange={e => { const v = Number(e.target.value); setBalance(v); window.dispatchEvent(new CustomEvent('audio:balance', { detail: v })) }} className="flex-1 h-1 accent-[#6c5ce7]" />
            <span className="text-[7px] text-theme-dim w-6">{t('audio.right')}</span>
            <span className="text-[7px] text-theme-dim w-8 text-right tabular-nums">{balance > 0 ? `${balance}R` : balance < 0 ? `${Math.abs(balance)}L` : t('audio.center')}</span>
            <button onClick={() => { setBalance(0); window.dispatchEvent(new CustomEvent('audio:balance', { detail: 0 })) }} className="p-0.5 hover:bg-white/5 rounded"><RotateCcw size={8} className="text-theme-dim" /></button>
          </div>
        </div>
      )}

      {tab === 'effects' && (
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {fxValues.map((fx, i) => (
              <div key={fx.id} className="flex items-center gap-2 px-2 py-1.5 bg-theme-card/30 rounded-lg border border-theme">
                <span className="text-[10px]">{fx.icon}</span>
                <span className="text-[8px] text-theme w-14 shrink-0">{t('audio.fx.' + fx.id)}</span>
                <input type="range" min={0} max={100} value={fxValues[i].value}
                  onChange={e => { const v = Number(e.target.value); const next = [...fxValues]; next[i] = { ...next[i], value: v }; setFxValues(next); window.dispatchEvent(new CustomEvent('audio:fx', { detail: next })) }}
                  className="flex-1 h-1 accent-[#6c5ce7]" />
                <span className="text-[7px] text-theme-dim w-6 text-right tabular-nums">{fxValues[i].value}%</span>
              </div>
            ))}
          </div>
          <button onClick={() => { const def = [{ id: 'reverb', label: 'Reverb', value: 30, icon: '↗' }, { id: 'echo', label: 'Echo', value: 20, icon: '↔' }, { id: 'bass', label: 'Bass Boost', value: 40, icon: '🔊' }, { id: 'treble', label: 'Treble', value: 50, icon: '🎵' }, { id: 'comp', label: 'Compresor', value: 35, icon: '⬆' }, { id: 'gate', label: 'Noise Gate', value: 15, icon: '🚫' }]; setFxValues(def); window.dispatchEvent(new CustomEvent('audio:fx', { detail: def })) }}
            className="flex items-center justify-center gap-1 mx-2 mb-2 py-1 bg-theme-card rounded text-theme-dim hover:text-theme transition-colors text-[7px]">
            <Undo2 size={7} /> {t('audio.resetFX')}
          </button>
        </div>
      )}

      {tab === 'eq' && (
        <div className="flex-1 flex flex-col">
          <div className="flex-1 flex items-end gap-1 px-2 pb-1 pt-2" style={{ minHeight: 80 }}>
            {eqLabels.map((label, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-0.5 h-full justify-end">
                <span className={`text-[6px] ${eqBands[i] > 0 ? 'text-green-400' : eqBands[i] < 0 ? 'text-red-400' : 'text-theme-dim'}`}>{eqBands[i] > 0 ? `+${eqBands[i]}` : eqBands[i]}</span>
                <input type="range" min={-20} max={20} value={eqBands[i]}
                  onChange={e => { const next = [...eqBands]; next[i] = Number(e.target.value); setEqBands(next); window.dispatchEvent(new CustomEvent('audio:eq', { detail: { bands: next, labels: eqLabels } })) }}
                  className="w-4 flex-1 accent-[#6c5ce7]" style={{ writingMode: 'vertical-lr' as any, direction: 'rtl' }} />
                <span className="text-[6px] text-theme-dim">{label}</span>
              </div>
            ))}
          </div>
          <select className="w-full text-[7px] px-1 py-1 mt-1 bg-theme-card text-theme-dim rounded border border-theme outline-none"
            onChange={e => {
              const presets: Record<string, number[]> = { Plano: [0,0,0,0,0,0,0,0], Rock: [4,3,2,0,-1,0,2,3], Pop: [-1,1,2,3,2,0,1,2], 'Clásica': [0,0,0,0,0,0,-1,-2], Voz: [-1,-1,0,1,2,3,2,1] }
              const preset = presets[e.target.value] || [0,0,0,0,0,0,0,0]
              setEqBands(preset)
              window.dispatchEvent(new CustomEvent('audio:eq', { detail: { bands: preset, labels: eqLabels } }))
            }}>
            <option>{t('audio.preset.flat')}</option>
            <option>{t('audio.preset.rock')}</option>
            <option>{t('audio.preset.pop')}</option>
            <option>{t('audio.preset.classical')}</option>
            <option>{t('audio.preset.vocal')}</option>
          </select>
          <button onClick={() => { const flat = [0,0,0,0,0,0,0,0]; setEqBands(flat); window.dispatchEvent(new CustomEvent('audio:eq', { detail: { bands: flat, labels: eqLabels } })) }}
            className="flex items-center justify-center gap-1 mx-2 mb-2 py-1 bg-theme-card rounded text-theme-dim hover:text-theme transition-colors text-[7px]">
            <Undo2 size={7} /> {t('audio.resetEQ')}
          </button>
        </div>
      )}

      {/* Status */}
      <div className="px-2 py-1 border-t border-theme shrink-0 bg-theme-card/30">
          <div className="flex items-center gap-2">
            <span className={`w-1.5 h-1.5 rounded-full ${allMuted ? 'bg-red-500' : 'bg-green-500 animate-pulse'}`} />
            <span className="text-[6px] text-theme-dim">{allMuted ? t('audio.mutedLabel') : `${channels.filter(c => !c.muted).length}/${channels.length} ${t('audio.active')}`}</span>
          </div>
      </div>
    </div>
  )
}

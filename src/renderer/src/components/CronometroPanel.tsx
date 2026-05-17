import { useState, useRef, useCallback, useEffect } from 'react'
import { Clock, Play, Pause, RotateCcw, Timer, AlarmCheck } from 'lucide-react'

type Mode = 'crono' | 'countdown'

export default function CronometroPanel() {
  const [mode, setMode] = useState<Mode>('crono')
  const [time, setTime] = useState(0)
  const [running, setRunning] = useState(false)
  const [initial, setInitial] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval>>()
  const startRef = useRef(0)
  const elapsedRef = useRef(0)

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [])

  const tick = useCallback(() => {
    const now = Date.now()
    const elapsed = elapsedRef.current + (now - startRef.current)
    if (mode === 'countdown') {
      const remaining = Math.max(0, initial * 1000 - elapsed)
      setTime(remaining)
      if (remaining <= 0) {
        setRunning(false)
        if (intervalRef.current) clearInterval(intervalRef.current)
        setTime(0)
      }
    } else {
      setTime(elapsed)
    }
  }, [mode, initial])

  const start = () => {
    if (mode === 'countdown' && time <= 0 && initial <= 0) return
    startRef.current = Date.now()
    setRunning(true)
    intervalRef.current = setInterval(tick, 50)
  }

  const pause = () => {
    elapsedRef.current += Date.now() - startRef.current
    setRunning(false)
    if (intervalRef.current) clearInterval(intervalRef.current)
  }

  const reset = () => {
    pause()
    elapsedRef.current = 0
    setTime(mode === 'countdown' ? initial * 1000 : 0)
  }

  const toggleMode = () => {
    reset()
    setMode(m => m === 'crono' ? 'countdown' : 'crono')
  }

  const format = (ms: number) => {
    const totalSec = Math.floor(ms / 1000)
    const h = Math.floor(totalSec / 3600)
    const m = Math.floor((totalSec % 3600) / 60)
    const s = totalSec % 60
    const cs = Math.floor((ms % 1000) / 10)
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`
  }

  const displayTime = mode === 'countdown' && time <= 0 && !running && initial > 0 ? 0 : time
  const isFinished = mode === 'countdown' && time <= 0 && !running && initial > 0 && elapsedRef.current > 0

  return (
    <div className="bg-theme-panel border border-theme rounded-xl flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-theme">
        <h3 className="text-[10px] font-semibold text-theme-muted uppercase tracking-wider flex items-center gap-1.5">
          <Clock size={11} /> {mode === 'crono' ? 'Cronómetro' : 'Cuenta atrás'}
        </h3>
        <button onClick={toggleMode} className="text-[8px] text-theme-dim hover:text-theme px-1.5 py-0.5 bg-theme-card rounded" title="Cambiar modo">
          <Timer size={10} />
        </button>
      </div>

      <div className="flex flex-col items-center justify-center py-4 px-3 gap-2">
        {isFinished && (
          <div className="flex items-center gap-1 text-[10px] text-green-400 font-bold animate-pulse">
            <AlarmCheck size={14} /> ¡TIEMPO!
          </div>
        )}
        <div className={`text-4xl font-bold font-mono tracking-wider tabular-nums ${isFinished ? 'text-green-400' : 'text-theme'}`}
          style={{ textShadow: '0 0 30px rgba(108,92,231,0.2)' }}>
          {format(displayTime)}
        </div>

        {mode === 'countdown' && !running && time <= 0 && elapsedRef.current === 0 && (
          <div className="flex items-center gap-1">
            {[1, 2, 3, 5, 10, 15, 30].map(m => (
              <button key={m} onClick={() => { setInitial(m * 60); setTime(m * 60 * 1000) }}
                className={`text-[9px] px-2 py-0.5 rounded-full transition-colors ${initial === m * 60 ? 'bg-[#6c5ce7] text-white' : 'bg-theme-card text-theme-dim hover:text-theme'}`}>
                {m >= 60 ? `${m / 60}h` : `${m}m`}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 mt-1">
          {!running ? (
            <button onClick={start}
              className="flex items-center gap-1 px-4 py-1.5 bg-green-600/80 rounded-lg text-[10px] text-white hover:bg-green-600 transition-colors disabled:opacity-40"
              disabled={mode === 'countdown' && initial === 0}>
              <Play size={12} /> Iniciar
            </button>
          ) : (
            <button onClick={pause}
              className="flex items-center gap-1 px-4 py-1.5 bg-amber-600/80 rounded-lg text-[10px] text-white hover:bg-amber-600 transition-colors">
              <Pause size={12} /> Pausar
            </button>
          )}
          <button onClick={reset}
            className="flex items-center gap-1 px-3 py-1.5 bg-theme-card rounded-lg text-[10px] text-theme-dim hover:text-theme border border-theme transition-colors">
            <RotateCcw size={11} /> Reiniciar
          </button>
        </div>
      </div>
    </div>
  )
}

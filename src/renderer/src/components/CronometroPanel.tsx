import { useState, useRef, useEffect } from 'react'
import { Clock, Play, Pause, RotateCcw, Timer, AlarmCheck } from 'lucide-react'

type Mode = 'crono' | 'countdown'

export default function CronometroPanel() {
  const [mode, setMode] = useState<Mode>('crono')
  const [display, setDisplay] = useState(0)
  const [running, setRunning] = useState(false)
  const [initial, setInitial] = useState(0)

  const modeRef = useRef(mode)
  const initialRef = useRef(initial)
  const runningRef = useRef(false)
  const startTimeRef = useRef(0)
  const elapsedRef = useRef(0)
  const rafRef = useRef(0)

  useEffect(() => { modeRef.current = mode }, [mode])
  useEffect(() => { initialRef.current = initial }, [initial])
  useEffect(() => { runningRef.current = running }, [running])

  useEffect(() => {
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [])

  const broadcast = (time: number, run: boolean) => {
    try { window.api.timer.update({ time, running: run }) } catch {}
  }

  const tick = () => {
    if (!runningRef.current) return
    const now = performance.now()
    const total = elapsedRef.current + (now - startTimeRef.current)
    if (modeRef.current === 'countdown') {
      const remaining = Math.max(0, initialRef.current * 1000 - total)
      setDisplay(remaining)
      broadcast(remaining, true)
      if (remaining <= 0) {
        setRunning(false)
        runningRef.current = false
        setDisplay(0)
        broadcast(0, false)
        return
      }
    } else {
      setDisplay(total)
      broadcast(total, true)
    }
    rafRef.current = requestAnimationFrame(tick)
  }

  const start = () => {
    if (runningRef.current) return
    if (mode === 'countdown' && initial <= 0 && display <= 0) return
    startTimeRef.current = performance.now()
    setRunning(true)
    runningRef.current = true
    rafRef.current = requestAnimationFrame(tick)
  }

  const pause = () => {
    if (!runningRef.current) return
    elapsedRef.current += performance.now() - startTimeRef.current
    setRunning(false)
    runningRef.current = false
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = 0 }
    broadcast(elapsedRef.current, false)
  }

  const reset = () => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = 0 }
    elapsedRef.current = 0
    setRunning(false)
    runningRef.current = false
    startTimeRef.current = 0
    const val = mode === 'countdown' ? initial * 1000 : 0
    setDisplay(val)
    broadcast(0, false)
  }

  const toggleMode = () => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = 0 }
    elapsedRef.current = 0
    setRunning(false)
    runningRef.current = false
    startTimeRef.current = 0
    const next = mode === 'crono' ? 'countdown' : 'crono'
    setMode(next)
    setDisplay(next === 'countdown' ? initial * 1000 : 0)
  }

  const setPreset = (min: number) => {
    setInitial(min * 60)
    setDisplay(min * 60 * 1000)
  }

  const format = (ms: number) => {
    const totalSec = Math.max(0, Math.floor(ms / 1000))
    const h = Math.floor(totalSec / 3600)
    const m = Math.floor((totalSec % 3600) / 60)
    const s = totalSec % 60
    const cs = Math.max(0, Math.floor((ms % 1000) / 10))
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`
  }

  const isFinished = mode === 'countdown' && !running && elapsedRef.current > 0 && initial > 0 && display <= 0

  return (
    <div className="bg-theme-panel border border-theme rounded-xl flex flex-col overflow-hidden">
      <div className="flex items-center gap-1.5 px-3 py-1 border-b border-theme shrink-0">
        <Clock size={10} className="text-theme-dim" />
        <span className="text-[9px] text-theme-dim font-medium">{mode === 'crono' ? 'Cronómetro' : 'Cuenta atrás'}</span>
      </div>

      <div className="flex items-center gap-2 py-3 px-3 min-h-0 overflow-hidden">
        <div className="flex items-center gap-1 shrink-0">
          {!running ? (
            <button onClick={start}
              className="flex items-center justify-center w-7 h-7 bg-green-600/80 rounded-lg text-white hover:bg-green-600 transition-colors disabled:opacity-40"
              disabled={mode === 'countdown' && initial === 0}>
              <Play size={10} />
            </button>
          ) : (
            <button onClick={pause}
              className="flex items-center justify-center w-7 h-7 bg-amber-600/80 rounded-lg text-white hover:bg-amber-600 transition-colors">
              <Pause size={10} />
            </button>
          )}
          <button onClick={reset}
            className="flex items-center justify-center w-7 h-7 bg-theme-card rounded-lg text-theme-dim hover:text-theme border border-theme transition-colors">
            <RotateCcw size={9} />
          </button>
          <button onClick={toggleMode}
            className="flex items-center justify-center w-7 h-7 bg-theme-card rounded-lg text-theme-dim hover:text-theme border border-theme transition-colors" title="Cambiar modo">
            <Timer size={9} />
          </button>
        </div>

        <div className="flex flex-col items-center flex-1 min-w-0">
          {isFinished && (
            <div className="flex items-center gap-1 text-[8px] text-green-400 font-bold animate-pulse">
              <AlarmCheck size={10} /> ¡TIEMPO!
            </div>
          )}
          <div className={`text-lg font-bold font-mono tracking-wider tabular-nums ${isFinished ? 'text-green-400' : 'text-theme'}`}
            style={{ textShadow: '0 0 20px rgba(108,92,231,0.15)' }}>
            {format(display)}
          </div>
          {mode === 'countdown' && !running && display <= 0 && elapsedRef.current === 0 && (
            <div className="flex items-center gap-1 flex-wrap justify-center shrink-0 mt-1">
              {[1, 2, 3, 5, 10, 15, 30].map(m => (
                <button key={m} onClick={() => setPreset(m)}
                  className={`text-[7px] px-1.5 py-0.5 rounded-full transition-colors ${initial === m * 60 ? 'bg-[#6c5ce7] text-white' : 'bg-theme-card text-theme-dim hover:text-theme'}`}>
                  {m >= 60 ? `${m / 60}h` : `${m}m`}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

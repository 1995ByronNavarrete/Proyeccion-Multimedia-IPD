import { createContext, useContext, useState, useCallback, useRef, useEffect, ReactNode } from 'react'
import { X, Check, AlertCircle, Info } from 'lucide-react'

interface Toast {
  id: number
  message: string
  type: 'success' | 'error' | 'info'
}

interface ToastCtx {
  toast: (message: string, type?: 'success' | 'error' | 'info') => void
}

const Ctx = createContext<ToastCtx>({ toast: () => {} })
let nextId = 0
const MAX_TOASTS = 5

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const timersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map())

  useEffect(() => {
    return () => {
      timersRef.current.forEach(t => clearTimeout(t))
      timersRef.current.clear()
    }
  }, [])

  const addToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = nextId++
    setToasts(prev => {
      const next = [...prev, { id, message, type }]
      return next.length > MAX_TOASTS ? next.slice(next.length - MAX_TOASTS) : next
    })
    const t = setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
      timersRef.current.delete(id)
    }, 3000)
    timersRef.current.set(id, t)
  }, [])

  const remove = (id: number) => setToasts(prev => prev.filter(t => t.id !== id))

  const ICONS = { success: Check, error: AlertCircle, info: Info }
  const COLORS = {
    success: 'border-green-500/30 bg-green-500/10 text-green-400',
    error: 'border-red-500/30 bg-red-500/10 text-red-400',
    info: 'border-[#6c5ce7]/30 bg-[#6c5ce7]/10 text-[#6c5ce7]',
  }

  return (
    <Ctx.Provider value={{ toast: addToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => {
          const Icon = ICONS[t.type]
          return (
            <div key={t.id}
              className={`pointer-events-auto flex items-center gap-2 px-3 py-2 rounded-lg border shadow-lg shadow-black/30 backdrop-blur-md animate-slide-up ${COLORS[t.type]}`}>
              <Icon size={12} />
              <span className="text-[11px] font-medium">{t.message}</span>
              <button onClick={() => remove(t.id)} className="ml-1 p-0.5 opacity-60 hover:opacity-100 transition-opacity">
                <X size={10} />
              </button>
            </div>
          )
        })}
      </div>
    </Ctx.Provider>
  )
}

export function useToast() {
  return useContext(Ctx)
}
